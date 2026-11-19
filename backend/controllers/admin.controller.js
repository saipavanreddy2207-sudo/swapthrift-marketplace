import User from "../models/User.js";
import Product from "../models/Product.js";
import Report from "../models/Report.js";
import Order from "../models/Order.js";
import Review from "../models/Review.js";
import Message from "../models/Message.js";
import AuditLog from "../models/AuditLog.js";
import { httpError } from "../utils/httpError.js";
import { escapeRegex } from "../utils/sanitize.js";
import { sameId } from "../utils/access.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createNotification } from "../services/notification.service.js";

const SAFE_USER_FIELDS =
  "-password -emailVerificationToken -emailVerificationExpires -passwordResetToken -passwordResetExpires";

const REPORT_STATUS_LABELS = {
  open: "offen",
  reviewing: "in Prüfung",
  resolved: "gelöst",
  dismissed: "abgewiesen",
};

function auditMeta(req) {
  return {
    ip: req.ip || "",
    userAgent: req.headers?.["user-agent"] || "",
  };
}

export const overview = asyncHandler(async (req, res) => {
  const [users, products, activeProducts, orders, openReports, reviews] = await Promise.all([
    User.countDocuments(),
    Product.countDocuments(),
    Product.countDocuments({ status: "active" }),
    Order.countDocuments(),
    Report.countDocuments({ status: "open" }),
    Review.countDocuments(),
  ]);

  return sendSuccess(res, {
    stats: { users, products, activeProducts, orders, openReports, reviews },
  });
});

async function withTargets(reports) {
  const ids = { product: new Set(), user: new Set(), message: new Set(), review: new Set() };
  for (const report of reports) {
    if (ids[report.type]) ids[report.type].add(report.targetId.toString());
  }

  const [products, users, messages, reviews] = await Promise.all([
    Product.find({ _id: { $in: [...ids.product] } })
      .select("_id title images price")
      .lean(),
    User.find({ _id: { $in: [...ids.user] } })
      .select("_id firstName lastName email avatar")
      .lean(),
    Message.find({ _id: { $in: [...ids.message] } })
      .select("_id text sender createdAt")
      .lean(),
    Review.find({ _id: { $in: [...ids.review] } })
      .select("_id rating text reviewer")
      .lean(),
  ]);

  const maps = {
    product: new Map(products.map((item) => [item._id.toString(), item])),
    user: new Map(users.map((item) => [item._id.toString(), item])),
    message: new Map(messages.map((item) => [item._id.toString(), item])),
    review: new Map(reviews.map((item) => [item._id.toString(), item])),
  };

  return reports.map((report) => ({
    ...report,
    target: maps[report.type]?.get(report.targetId.toString()) || null,
  }));
}

export const listReports = asyncHandler(async (req, res) => {
  const filter = req.query.status ? { status: req.query.status } : {};
  const reports = await Report.find(filter)
    .populate({ path: "reporter", select: "_id firstName lastName email" })
    .populate({ path: "reviewedBy", select: "_id firstName lastName" })
    .sort({ createdAt: -1 })
    .lean();

  return sendSuccess(res, { reports: await withTargets(reports) });
});

export const updateReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id);
  if (!report) {
    throw httpError(404, "Meldung nicht gefunden.");
  }

  report.status = req.body.status;
  report.resolution = req.body.resolution || "";
  report.reviewedBy = req.user._id;
  await report.save();

  await createNotification({
    userId: report.reporter,
    type: "report",
    title: "Deine Meldung wurde bearbeitet",
    message: `Der Status deiner Meldung ist jetzt: ${REPORT_STATUS_LABELS[report.status]}.`,
    data: { reportId: report._id, status: report.status },
    link: "/reports",
  });

  return sendSuccess(
    res,
    { report: await Report.findById(report._id).populate("reporter", "_id firstName lastName").lean() },
    "Meldung erfolgreich aktualisiert.",
  );
});

export const listProducts = asyncHandler(async (req, res) => {
  const filter = req.query.status ? { status: req.query.status } : {};
  const products = await Product.find(filter)
    .populate("seller", "_id firstName lastName email")
    .populate("category", "_id name slug")
    .sort({ createdAt: -1 })
    .lean();
  return sendSuccess(res, { products });
});

export const updateProductStatus = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    throw httpError(404, "Angebot nicht gefunden.");
  }

  const { status } = req.body;
  product.status = status;
  if (status === "sold") {
    product.availability = "sold";
  } else if (status === "active" && product.availability === "sold") {
    product.availability = "available";
  }
  await product.save();

  await AuditLog.create({
    actor: req.user._id,
    action: "admin.product.status",
    target: { productId: product._id, status },
    meta: auditMeta(req),
  });

  return sendSuccess(res, { product }, "Angebotsstatus aktualisiert.");
});

export const listUsers = asyncHandler(async (req, res) => {
  const { search, page, limit } = req.query;
  const filter = {};
  if (search) {
    const pattern = { $regex: escapeRegex(search), $options: "i" };
    filter.$or = [{ firstName: pattern }, { lastName: pattern }, { email: pattern }];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select(SAFE_USER_FIELDS)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    users,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const updateUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw httpError(404, "Benutzer nicht gefunden.");
  }
  if (
    sameId(user._id, req.user._id) &&
    (req.body.isSuspended === true || req.body.isActive === false)
  ) {
    throw httpError(400, "Du kannst dein eigenes Konto nicht sperren oder deaktivieren.");
  }

  if (req.body.isActive !== undefined) user.isActive = req.body.isActive;
  if (req.body.isSuspended !== undefined) user.isSuspended = req.body.isSuspended;
  if (req.body.roles !== undefined) user.roles = req.body.roles;
  await user.save();

  await AuditLog.create({
    actor: req.user._id,
    action: "admin.user.status",
    target: { userId: user._id, ...req.body },
    meta: auditMeta(req),
  });

  const safeUser = await User.findById(user._id).select(SAFE_USER_FIELDS).lean();
  return sendSuccess(res, { user: safeUser }, "Benutzerstatus aktualisiert.");
});

export default {
  overview,
  listReports,
  updateReport,
  listProducts,
  updateProductStatus,
  listUsers,
  updateUserStatus,
};
