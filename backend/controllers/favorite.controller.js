import Favorite from "../models/Favorite.js";
import Product from "../models/Product.js";
import { httpError } from "../utils/httpError.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const PRODUCT_FIELDS = "_id title price images condition city availability seller";

export const listFavorites = asyncHandler(async (req, res) => {
  const favorites = await Favorite.find({ user: req.user._id })
    .populate({ path: "product", select: PRODUCT_FIELDS })
    .sort({ createdAt: -1 })
    .lean();

  const products = favorites.map((favorite) => favorite.product).filter(Boolean);
  const ids = products.map((product) => product._id.toString());

  return sendSuccess(res, { products, ids });
});

export const addFavorite = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId).select("_id");
  if (!product) {
    throw httpError(404, "Angebot nicht gefunden.");
  }

  const result = await Favorite.updateOne(
    { user: req.user._id, product: product._id },
    { $setOnInsert: { user: req.user._id, product: product._id } },
    { upsert: true },
  );
  if (result.upsertedCount) {
    await Product.updateOne({ _id: product._id }, { $inc: { favoritesCount: 1 } });
  }

  const favorite = await Favorite.findOne({ user: req.user._id, product: product._id }).lean();
  return sendSuccess(
    res,
    { favorite, productId: product._id },
    "Zu den Favoriten hinzugefügt.",
    201,
  );
});

export const removeFavorite = asyncHandler(async (req, res) => {
  const result = await Favorite.deleteOne({ user: req.user._id, product: req.params.productId });
  if (result.deletedCount) {
    await Product.updateOne(
      { _id: req.params.productId, favoritesCount: { $gt: 0 } },
      { $inc: { favoritesCount: -1 } },
    );
  }
  return sendSuccess(res, undefined, "Aus den Favoriten entfernt.");
});

export default { listFavorites, addFavorite, removeFavorite };
