import Notification from "../models/Notification.js";
import { httpError } from "../utils/httpError.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listNotifications = asyncHandler(async (req, res) => {
  const filter = { user: req.user._id };
  if (req.query.unreadOnly) filter.isRead = false;

  const [notifications, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).lean(),
    Notification.countDocuments({ user: req.user._id, isRead: false }),
  ]);

  return sendSuccess(res, { notifications, unreadCount });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isRead: true },
    { new: true },
  ).lean();
  if (!notification) {
    throw httpError(404, "Benachrichtigung nicht gefunden.");
  }
  return sendSuccess(res, { notification }, "Benachrichtigung als gelesen markiert.");
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany(
    { user: req.user._id, isRead: false },
    { isRead: true },
  );
  return sendSuccess(
    res,
    { updatedCount: result.modifiedCount },
    "Alle Benachrichtigungen als gelesen markiert.",
  );
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!notification) {
    throw httpError(404, "Benachrichtigung nicht gefunden.");
  }
  return sendSuccess(res, undefined, "Benachrichtigung gelöscht.");
});

export default {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
};
