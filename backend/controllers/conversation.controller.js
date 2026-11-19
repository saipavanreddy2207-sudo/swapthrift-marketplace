import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import { httpError } from "../utils/httpError.js";
import { sameId } from "../utils/access.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { emitToUsers } from "../services/realtime.service.js";
import { notifyMany } from "../services/notification.service.js";

const PARTICIPANT_FIELDS = "_id firstName lastName email avatar";
const PRODUCT_FIELDS = "_id title images price";
const MESSAGE_FIELDS = "_id conversation sender text image readBy createdAt";

function participantView(user) {
  if (!user) return null;
  const firstName =
    user.firstName || String(user.email || "").split("@")[0] || "Unbekannter Nutzer";
  const lastName = user.lastName || "";
  return {
    _id: user._id,
    firstName,
    lastName,
    avatar: user.avatar || null,
    name: `${firstName} ${lastName}`.trim(),
  };
}

function messageView(message) {
  if (!message) return null;
  return {
    _id: message._id,
    conversation: message.conversation,
    sender: message.sender,
    text: message.text,
    image: message.image,
    readBy: message.readBy,
    createdAt: message.createdAt,
  };
}

async function unreadCounts(conversationIds, userId) {
  if (!conversationIds.length) return new Map();
  const rows = await Message.aggregate([
    {
      $match: {
        conversation: { $in: conversationIds },
        sender: { $ne: userId },
        readBy: { $ne: userId },
      },
    },
    { $group: { _id: "$conversation", count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((row) => [row._id.toString(), row.count]));
}

function conversationView(conversation, userId, counts = new Map()) {
  return {
    ...conversation,
    participants: conversation.participants.map(participantView),
    product: conversation.product || null,
    lastMessage: messageView(conversation.lastMessage),
    unreadCount: counts.get(conversation._id.toString()) || 0,
  };
}

function populateConversation(query) {
  return query
    .populate({ path: "participants", select: PARTICIPANT_FIELDS })
    .populate({ path: "product", select: PRODUCT_FIELDS })
    .populate({ path: "lastMessage", select: MESSAGE_FIELDS });
}

async function loadConversation(id, userId) {
  const conversation = await populateConversation(
    Conversation.findOne({ _id: id, participants: userId }),
  ).lean();
  if (!conversation) return null;
  const counts = await unreadCounts([conversation._id], userId);
  return conversationView(conversation, userId, counts);
}

export const listConversations = asyncHandler(async (req, res) => {
  const conversations = await populateConversation(
    Conversation.find({ participants: req.user._id }).sort({ updatedAt: -1 }),
  ).lean();

  const counts = await unreadCounts(
    conversations.map((conversation) => conversation._id),
    req.user._id,
  );
  const data = conversations.map((conversation) =>
    conversationView(conversation, req.user._id, counts),
  );

  return sendSuccess(res, { conversations: data });
});

export const createConversation = asyncHandler(async (req, res) => {
  const { productId, receiverId } = req.body;
  if (sameId(req.user._id, receiverId)) {
    throw httpError(400, "Du kannst keine Unterhaltung mit dir selbst starten.");
  }

  const [product, receiver] = await Promise.all([
    Product.exists({ _id: productId }),
    User.exists({ _id: receiverId }),
  ]);
  if (!product) throw httpError(404, "Angebot nicht gefunden.");
  if (!receiver) throw httpError(404, "Benutzer nicht gefunden.");

  const participants = [req.user._id.toString(), receiverId.toString()].sort();
  const filter = { product: productId, participants: { $all: participants, $size: 2 } };

  let conversation = await Conversation.findOne(filter).lean();
  if (!conversation) {
    try {
      conversation = await Conversation.create({
        participants,
        product: productId,
        unreadFor: [],
      });
    } catch (error) {
      // A concurrent request may have created the same conversation first.
      if (error?.code !== 11000) throw error;
      conversation = await Conversation.findOne(filter).lean();
    }
  }
  if (!conversation) {
    throw httpError(500, "Die Unterhaltung konnte nicht erstellt werden.");
  }

  const data = await loadConversation(conversation._id, req.user._id);
  return sendSuccess(res, { conversation: data }, "Unterhaltung bereit.", 201);
});

export const listMessages = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const conversation = await Conversation.findOne({
    _id: req.params.id,
    participants: req.user._id,
  })
    .select("_id")
    .lean();
  if (!conversation) {
    throw httpError(404, "Unterhaltung nicht gefunden.");
  }

  const filter = { conversation: conversation._id };
  const [docs, total] = await Promise.all([
    Message.find(filter)
      .populate({ path: "sender", select: PARTICIPANT_FIELDS })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Message.countDocuments(filter),
  ]);

  const messages = docs
    .reverse()
    .map((message) => ({ ...messageView(message), sender: participantView(message.sender) }));

  return sendSuccess(res, {
    messages,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const sendMessage = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findOne({
    _id: req.params.id,
    participants: req.user._id,
  });
  if (!conversation) {
    throw httpError(404, "Unterhaltung nicht gefunden.");
  }

  const message = await Message.create({
    conversation: conversation._id,
    sender: req.user._id,
    text: req.body.text,
  });
  await Message.updateOne({ _id: message._id }, { $addToSet: { readBy: req.user._id } });

  const participantIds = conversation.participants.map((id) => id.toString());
  const receiverIds = participantIds.filter((id) => id !== req.user._id.toString());
  await Conversation.updateOne(
    { _id: conversation._id },
    {
      $set: { lastMessage: message._id, updatedAt: new Date() },
      $addToSet: { unreadFor: { $each: receiverIds } },
    },
  );

  const stored = await Message.findById(message._id)
    .populate({ path: "sender", select: PARTICIPANT_FIELDS })
    .lean();
  const messageData = { ...messageView(stored), sender: participantView(stored.sender) };
  const conversationData = await loadConversation(conversation._id, req.user._id);

  emitToUsers(participantIds, "message:new", {
    message: messageData,
    conversationId: conversation._id,
  });
  emitToUsers(participantIds, "conversation:updated", { conversation: conversationData });
  await notifyMany(receiverIds, {
    type: "message",
    title: "Neue Nachricht",
    message: req.body.text.slice(0, 200),
    data: { conversationId: conversation._id, messageId: message._id },
    link: `/messages/${conversation._id}`,
  });

  return sendSuccess(res, { message: messageData }, "Nachricht gesendet.", 201);
});

export const markConversationRead = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findOne({
    _id: req.params.id,
    participants: req.user._id,
  }).select("_id");
  if (!conversation) {
    throw httpError(404, "Unterhaltung nicht gefunden.");
  }

  await Message.updateMany(
    { conversation: conversation._id, readBy: { $ne: req.user._id } },
    { $addToSet: { readBy: req.user._id } },
  );
  await Conversation.updateOne(
    { _id: conversation._id },
    { $pull: { unreadFor: req.user._id } },
  );

  const data = await loadConversation(conversation._id, req.user._id);
  emitToUsers(
    data.participants.map((participant) => participant._id),
    "conversation:updated",
    { conversation: data },
  );

  return sendSuccess(res, { conversation: data }, "Nachrichten als gelesen markiert.");
});

export default {
  listConversations,
  createConversation,
  listMessages,
  sendMessage,
  markConversationRead,
};
