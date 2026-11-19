import Review from "../models/Review.js";
import Order from "../models/Order.js";
import { httpError } from "../utils/httpError.js";
import { canRespondToReview, sameId } from "../utils/access.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createNotification } from "../services/notification.service.js";

const REVIEW_POPULATE = [
  { path: "reviewer", select: "_id firstName lastName avatar" },
  { path: "product", select: "_id title images" },
];

function formatAverage(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round((number + Number.EPSILON) * 100) / 100 : 0;
}

async function loadReview(id) {
  return Review.findById(id).populate(REVIEW_POPULATE).lean();
}

export const createReview = asyncHandler(async (req, res) => {
  const { orderId, rating, text } = req.body;
  const order = await Order.findById(orderId);
  if (!order) {
    throw httpError(404, "Bestellung nicht gefunden.");
  }
  if (!sameId(order.buyer, req.user._id)) {
    throw httpError(403, "Nur der Käufer kann diese Bestellung bewerten.");
  }
  if (order.status !== "delivered") {
    throw httpError(400, "Eine Bewertung ist erst nach der Lieferung möglich.");
  }
  if (await Review.exists({ order: order._id })) {
    throw httpError(409, "Für diese Bestellung wurde bereits eine Bewertung abgegeben.");
  }

  const review = await Review.create({
    reviewer: req.user._id,
    seller: order.seller,
    product: order.product,
    order: order._id,
    rating,
    text: text || "",
    isVerifiedPurchase: true,
  });

  await createNotification({
    userId: order.seller,
    type: "review",
    title: "Neue Bewertung",
    message: `Dein Angebot wurde mit ${rating} von 5 Sternen bewertet.`,
    data: { reviewId: review._id, productId: order.product },
    link: `/reviews/${review._id}`,
  });

  return sendSuccess(
    res,
    { review: await loadReview(review._id) },
    "Vielen Dank für deine Bewertung.",
    201,
  );
});

export const listReviews = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.seller) filter.seller = req.query.seller;
  if (req.query.product) filter.product = req.query.product;

  const [reviews, summaryRows] = await Promise.all([
    Review.find(filter).populate(REVIEW_POPULATE).sort({ createdAt: -1 }).lean(),
    Review.aggregate([
      { $match: filter },
      { $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]),
  ]);

  const summary = {
    average: formatAverage(summaryRows[0]?.average || 0),
    count: summaryRows[0]?.count || 0,
  };
  return sendSuccess(res, { reviews, summary });
});

export const respondToReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    throw httpError(404, "Bewertung nicht gefunden.");
  }
  if (!canRespondToReview(review, req.user)) {
    throw httpError(403, "Du darfst auf diese Bewertung nicht antworten.");
  }

  review.sellerResponse = { text: req.body.text, at: new Date() };
  await review.save();

  await createNotification({
    userId: review.reviewer,
    type: "review",
    title: "Antwort auf deine Bewertung",
    message: req.body.text.slice(0, 200),
    data: { reviewId: review._id },
    link: `/reviews/${review._id}`,
  });

  return sendSuccess(
    res,
    { review: await loadReview(review._id) },
    "Antwort erfolgreich gespeichert.",
  );
});

export default { createReview, listReviews, respondToReview };
