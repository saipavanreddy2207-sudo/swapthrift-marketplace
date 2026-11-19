import Category from "../models/Category.js";
import { slugify } from "../utils/slug.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export const listCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true })
    .populate("parent", "name slug")
    .sort({ sortOrder: 1, name: 1 })
    .lean();
  return sendSuccess(res, { categories });
});

export const getCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id)
    .populate("parent", "name slug")
    .lean();
  if (!category) {
    throw httpError(404, "Kategorie nicht gefunden.");
  }
  return sendSuccess(res, { category });
});

/** Admin-only: creates a category, deriving a German-friendly slug when omitted. */
export const createCategory = asyncHandler(async (req, res) => {
  const data = req.body;
  const slug = data.slug || slugify(data.name);
  if (!slug) {
    throw httpError(400, "Bitte einen gültigen Kategorienamen angeben.");
  }
  if (data.parent && !(await Category.exists({ _id: data.parent }))) {
    throw httpError(404, "Übergeordnete Kategorie nicht gefunden.");
  }

  const category = await Category.create({ ...data, slug });
  return sendSuccess(res, { category }, "Kategorie erfolgreich erstellt.", 201);
});

export default { listCategories, getCategory, createCategory };
