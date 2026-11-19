import Product from "../models/Product.js";
import Report from "../models/Report.js";
import { deleteImage, imageFromFile } from "../config/cloudinary.js";
import { computeFraudAssessment } from "../utils/fraud.js";
import { escapeRegex } from "../utils/sanitize.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const MAX_IMAGES = 5;

const SORT_OPTIONS = {
  newest: { createdAt: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  popular: { favoritesCount: -1, views: -1 },
};

function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function canManage(product, user) {
  if (!user) return false;
  if (Array.isArray(user.roles) && user.roles.includes("admin")) return true;
  return product.seller?.toString() === user._id?.toString();
}

function imageFromUpload(uploaded, isMain = false) {
  return { url: uploaded.url, publicId: uploaded.publicId, isMain };
}

/** Uploads all files and cleans up already uploaded images if one fails. */
async function storeImages(files = []) {
  const uploaded = [];
  try {
    for (const file of files) {
      uploaded.push(await imageFromFile(file, "swapthrift/products"));
    }
    return uploaded;
  } catch (error) {
    await Promise.all(uploaded.map((item) => deleteImage(item.publicId)));
    if (error.statusCode) throw error;
    throw httpError(500, `Bilder konnten nicht hochgeladen werden: ${error.message}`);
  }
}

function buildFilter(query) {
  const filter = { status: "active" };

  if (query.search) {
    const pattern = { $regex: escapeRegex(query.search), $options: "i" };
    filter.$or = [{ title: pattern }, { description: pattern }, { brand: pattern }];
  }
  if (query.category) filter.category = query.category;
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    filter.price = {};
    if (query.minPrice !== undefined) filter.price.$gte = query.minPrice;
    if (query.maxPrice !== undefined) filter.price.$lte = query.maxPrice;
  }
  if (query.condition) filter.condition = query.condition;
  if (query.city) filter.city = { $regex: escapeRegex(query.city), $options: "i" };
  if (query.postalCode) filter.postalCode = query.postalCode;
  if (query.shipping) {
    if (query.shipping.toLowerCase() === "kostenlos" || query.shipping.toLowerCase() === "free") {
      filter["shippingOptions.cost"] = 0;
    } else {
      filter["shippingOptions.type"] = {
        $regex: escapeRegex(query.shipping),
        $options: "i",
      };
    }
  }
  return filter;
}

const POPULATE_SELLER = ["firstName", "lastName", "avatar", "city", "isEmailVerified", "createdAt"];

export const listProducts = asyncHandler(async (req, res) => {
  const { page, limit, sort, ...filters } = req.query;
  const filter = buildFilter(filters);
  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate("category", "name slug")
      .populate("seller", POPULATE_SELLER)
      .sort(SORT_OPTIONS[sort] || SORT_OPTIONS.newest)
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    products,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { $inc: { views: 1 } },
    { new: true },
  )
    .populate("category", "name slug")
    .populate("seller", POPULATE_SELLER)
    .lean();

  if (!product) {
    throw httpError(404, "Angebot nicht gefunden.");
  }
  return sendSuccess(res, { product });
});

export const createProduct = asyncHandler(async (req, res) => {
  const data = req.body;
  const duplicateCount = await Product.countDocuments({
    seller: req.user._id,
    title: { $regex: new RegExp(`^${escapeRegex(data.title)}$`, "i") },
  });
  const assessment = computeFraudAssessment({
    price: data.price,
    title: data.title,
    description: data.description,
    seller: req.user,
    duplicateCount,
  });

  const uploaded = await storeImages(req.files || []);
  let product;
  try {
    product = await Product.create({
      title: data.title,
      description: data.description,
      price: data.price,
      category: data.category,
      subcategory: data.subcategory || null,
      brand: data.brand || "",
      condition: data.condition,
      city: data.city,
      postalCode: data.postalCode,
      availability: data.availability || "available",
      shippingOptions: data.shippingOptions || [],
      seller: req.user._id,
      images: uploaded.map((item, index) => imageFromUpload(item, index === 0)),
      status: data.status || "active",
      fraudScore: assessment.score,
      flags: assessment.reasons,
    });
  } catch (error) {
    await Promise.all(uploaded.map((item) => deleteImage(item.publicId)));
    throw error;
  }

  return sendSuccess(res, { product }, "Angebot erfolgreich erstellt.", 201);
});

export const updateProduct = asyncHandler(async (req, res) => {
  let product = await Product.findById(req.params.id);
  if (!product) {
    throw httpError(404, "Angebot nicht gefunden.");
  }
  if (!canManage(product, req.user)) {
    throw httpError(403, "Du darfst dieses Angebot nicht bearbeiten.");
  }

  const data = req.body;
  const removeIds = Array.isArray(data.removeImages) ? data.removeImages : [];
  let images = product.images
    .map((image) => ({ url: image.url, publicId: image.publicId, isMain: image.isMain }))
    .filter((image) => !removeIds.includes(image.publicId));

  if (req.files?.length) {
    if (images.length + req.files.length > MAX_IMAGES) {
      throw httpError(400, `Es sind höchstens ${MAX_IMAGES} Bilder pro Angebot erlaubt.`);
    }
    const uploaded = await storeImages(req.files);
    images = images.concat(
      uploaded.map((item, index) => imageFromUpload(item, images.length === 0 && index === 0)),
    );
  }
  if (images.length && !images.some((image) => image.isMain)) {
    images[0].isMain = true;
  }

  const { removeImages, ...updates } = data;
  Object.assign(product, updates);
  product.images = images;

  if (updates.status === "sold") {
    product.availability = "sold";
  } else if (updates.status === "active" && product.availability === "sold") {
    product.availability = "available";
  }

  if (
    updates.price !== undefined ||
    updates.title !== undefined ||
    updates.description !== undefined
  ) {
    const assessment = computeFraudAssessment({
      price: product.price,
      title: product.title,
      description: product.description,
      seller: req.user,
      duplicateCount: await Product.countDocuments({
        _id: { $ne: product._id },
        seller: req.user._id,
        title: { $regex: new RegExp(`^${escapeRegex(product.title)}$`, "i") },
      }),
    });
    product.fraudScore = assessment.score;
    product.flags = assessment.reasons;
  }

  await product.save();
  await Promise.all(removeIds.map((publicId) => deleteImage(publicId)));

  product = await Product.findById(product._id)
    .populate("category", "name slug")
    .populate("seller", POPULATE_SELLER)
    .lean();

  return sendSuccess(res, { product }, "Angebot erfolgreich aktualisiert.");
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    throw httpError(404, "Angebot nicht gefunden.");
  }
  if (!canManage(product, req.user)) {
    throw httpError(403, "Du darfst dieses Angebot nicht löschen.");
  }

  const publicIds = product.images.map((image) => image.publicId).filter(Boolean);
  await product.deleteOne();
  await Promise.all(publicIds.map((publicId) => deleteImage(publicId)));

  return sendSuccess(res, undefined, "Angebot erfolgreich gelöscht.");
});

export const updateStatus = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    throw httpError(404, "Angebot nicht gefunden.");
  }
  if (!canManage(product, req.user)) {
    throw httpError(403, "Du darfst den Status dieses Angebots nicht ändern.");
  }

  const { status } = req.body;
  product.status = status;
  if (status === "sold") {
    product.availability = "sold";
  } else if (status === "active" && product.availability === "sold") {
    product.availability = "available";
  }
  await product.save();

  return sendSuccess(res, { product }, "Status erfolgreich aktualisiert.");
});

export const reportProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).select("_id");
  if (!product) {
    throw httpError(404, "Angebot nicht gefunden.");
  }

  const report = await Report.create({
    reporter: req.user._id,
    type: "product",
    targetId: product._id,
    reason: req.body.reason,
    details: req.body.details || "",
    status: "open",
  });

  return sendSuccess(
    res,
    { report: { id: report._id, status: report.status } },
    "Danke. Deine Meldung wird von unserem Team geprüft.",
    201,
  );
});

export default {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStatus,
};
