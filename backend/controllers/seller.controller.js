import Product from "../models/Product.js";
import Review from "../models/Review.js";
import User from "../models/User.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/** Public seller highlights based on real active listings and real reviews. */
export const listSellers = asyncHandler(async (req, res) => {
  const limit = req.query.limit || 4;

  const topSellers = await Product.aggregate([
    { $match: { status: "active" } },
    { $group: { _id: "$seller", productCount: { $sum: 1 } } },
    { $sort: { productCount: -1, _id: 1 } },
    { $limit: limit },
  ]);

  const sellerIds = topSellers.map((row) => row._id);
  if (!sellerIds.length) {
    return sendSuccess(res, { sellers: [] });
  }

  const [users, ratings] = await Promise.all([
    User.find({ _id: { $in: sellerIds }, isActive: true })
      .select("_id firstName lastName avatar city createdAt")
      .lean(),
    Review.aggregate([
      { $match: { seller: { $in: sellerIds } } },
      {
        $group: {
          _id: "$seller",
          rating: { $avg: "$rating" },
          reviewCount: { $sum: 1 },
        },
      },
    ]),
  ]);

  const userMap = new Map(users.map((user) => [user._id.toString(), user]));
  const ratingMap = new Map(ratings.map((row) => [row._id.toString(), row]));
  const countMap = new Map(topSellers.map((row) => [row._id.toString(), row.productCount]));

  const sellers = users
    .map((user) => {
      const id = user._id.toString();
      const rating = ratingMap.get(id);
      const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();
      return {
        id,
        _id: user._id,
        name: name || user.email?.split("@")[0] || "Verkäufer:in",
        city: user.city || "Deutschland",
        avatar: user.avatar || null,
        rating: rating ? Math.round(rating.rating * 10) / 10 : 0,
        reviewCount: rating?.reviewCount || 0,
        productCount: countMap.get(id) || 0,
        memberSince: user.createdAt,
      };
    })
    .filter((seller) => seller.productCount > 0);

  return sendSuccess(res, { sellers });
});

export default { listSellers };
