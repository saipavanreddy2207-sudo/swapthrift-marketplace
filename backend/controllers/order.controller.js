import mongoose from "mongoose";
import Order from "../models/Order.js";
import Payment from "../models/Payment.js";
import Product from "../models/Product.js";
import { getStripe, isStripeConfigured } from "../config/stripe.js";
import { httpError } from "../utils/httpError.js";
import { calculateOrderTotals, toCents } from "../utils/checkout.js";
import {
  canCancelOrder,
  canSetOrderStatus,
  canViewOrder,
  isAdmin,
  sameId,
  shippingStatusForOrderStatus,
} from "../utils/access.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { notifyMany } from "../services/notification.service.js";

const POPULATE = [
  { path: "product", select: "_id title images price condition" },
  { path: "buyer", select: "_id firstName lastName avatar" },
  { path: "seller", select: "_id firstName lastName avatar" },
];

function orderView(order, userId) {
  if (!order) return null;
  const data = typeof order.toObject === "function" ? order.toObject() : { ...order };
  const buyerId = data.buyer?._id || data.buyer;
  return {
    ...data,
    canReview: Boolean(userId && sameId(buyerId, userId) && data.status === "delivered"),
  };
}

async function loadOrder(id) {
  return Order.findById(id).populate(POPULATE).lean();
}

export const checkout = asyncHandler(async (req, res) => {
  const { items, address, shippingMethod, mode } = req.body;
  const productIds = [...new Set(items.map((item) => item.productId.toString()))];
  const products = await Product.find({ _id: { $in: productIds } }).select(
    "title price seller status availability shippingOptions",
  );
  if (products.length !== productIds.length) {
    throw httpError(404, "Ein oder mehrere Angebote wurden nicht gefunden.");
  }

  const productsById = new Map(products.map((product) => [product._id.toString(), product]));
  for (const item of items) {
    const product = productsById.get(item.productId.toString());
    if (sameId(product.seller, req.user._id)) {
      throw httpError(400, "Du kannst dein eigenes Angebot nicht bestellen.");
    }
    if (product.status !== "active") {
      throw httpError(400, `Das Angebot „${product.title}“ ist derzeit nicht verfügbar.`);
    }
    if (product.availability !== "available") {
      throw httpError(400, `Das Angebot „${product.title}“ ist bereits reserviert oder verkauft.`);
    }
    if (item.quantity !== 1) {
      throw httpError(400, "Pro Angebot kann nur 1 Stück bestellt werden.");
    }
  }

  const sellerIds = new Set(products.map((product) => product.seller.toString()));
  if (sellerIds.size > 1) {
    throw httpError(400, "Bitte bestelle Artikel nur eines Verkäufers.");
  }
  const sellerId = products[0].seller;

  const { subtotal, shippingCost, total } = calculateOrderTotals(
    items.map((item) => ({
      price: productsById.get(item.productId.toString()).price,
      quantity: item.quantity,
      shippingOptions: productsById.get(item.productId.toString()).shippingOptions,
    })),
    shippingMethod,
  );

  const orderId = new mongoose.Types.ObjectId();
  let intent = null;
  if (mode === "stripe") {
    if (!isStripeConfigured()) {
      throw httpError(
        503,
        "Stripe ist nicht konfiguriert. Bitte wähle den Demo-Modus oder kontaktiere den Support.",
      );
    }
    if (String(process.env.STRIPE_SECRET_KEY).startsWith("sk_live_")) {
      throw httpError(503, "Nur der Stripe-Testmodus ist verfügbar. Bitte wähle den Demo-Modus.");
    }
    try {
      intent = await getStripe().paymentIntents.create({
        amount: toCents(total),
        currency: "eur",
        metadata: {
          orderId: orderId.toString(),
          buyerId: req.user._id.toString(),
          sellerId: sellerId.toString(),
          testMode: "stripe-sandbox",
        },
        automatic_payment_methods: { enabled: true },
      });
    } catch (error) {
      throw httpError(502, `Die Zahlungsanfrage konnte nicht erstellt werden: ${error.message}`);
    }
  }

  let order;
  let paymentId = null;
  try {
    order = await Order.create({
      _id: orderId,
      buyer: req.user._id,
      seller: sellerId,
      product: products[0]._id,
      quantity: 1,
      price: subtotal,
      shippingCost,
      total,
      currency: "EUR",
      address,
      shipping: { carrier: "", trackingNumber: "", status: "not_shipped" },
      status: "pending",
      payment: null,
      timeline: [
        {
          status: "order_created",
          note:
            mode === "demo"
              ? "Testbestellung ohne Zahlung erstellt."
              : "Stripe-Testzahlung vorbereitet, noch nicht bezahlt.",
        },
      ],
    });

    const payment = await Payment.create({
      order: order._id,
      buyer: req.user._id,
      seller: sellerId,
      amount: total,
      currency: "eur",
      status: "requires_payment_method",
      method: mode,
      stripePaymentIntentId: intent?.id || null,
      metadata: { testMode: true, shippingMethod },
    });
    paymentId = payment._id;
    await Order.updateOne({ _id: order._id }, { $set: { payment: paymentId } });
  } catch (error) {
    if (intent) {
      await getStripe().paymentIntents.cancel(intent.id).catch(() => {});
    }
    if (order) {
      await Order.deleteOne({ _id: order._id });
    }
    throw httpError(500, "Die Bestellung konnte nicht angelegt werden.");
  }

  await notifyMany([req.user._id, sellerId], {
    type: "order",
    title: mode === "demo" ? "Neue Testbestellung" : "Bestellung vorbereitet",
    message:
      mode === "demo"
        ? "Testbestellung angelegt. Es wurde keine Zahlung ausgelöst."
        : "Eine Zahlungsanfrage im Stripe-Testmodus wurde erstellt. Es wurde noch keine Zahlung ausgelöst.",
    data: { orderId: order._id, mode, testMode: true },
    link: `/orders/${order._id}`,
  });

  const checkoutData =
    mode === "stripe"
      ? {
          mode: "stripe",
          clientSecret: intent.client_secret,
          ...(process.env.STRIPE_PUBLISHABLE_KEY
            ? { publishableKey: process.env.STRIPE_PUBLISHABLE_KEY }
            : {}),
        }
      : {
          mode: "demo",
          message: "Testbestellung angelegt. Es wurde keine Zahlung ausgelöst.",
        };

  const populated = await loadOrder(order._id);
  return sendSuccess(
    res,
    {
      order: orderView(populated, req.user._id),
      payment: await Payment.findById(paymentId).lean(),
      checkout: checkoutData,
    },
    mode === "demo"
      ? "Testbestellung angelegt. Es wurde keine Zahlung ausgelöst."
      : "Bestellung vorbereitet. Es wurde noch keine Zahlung ausgelöst.",
    201,
  );
});

export const listOrders = asyncHandler(async (req, res) => {
  const { role } = req.query;
  const filter = {};
  if (role === "buyer") {
    filter.buyer = req.user._id;
  } else if (role === "seller") {
    filter.seller = req.user._id;
  } else if (!isAdmin(req.user)) {
    filter.$or = [{ buyer: req.user._id }, { seller: req.user._id }];
  }

  const orders = await Order.find(filter).populate(POPULATE).sort({ createdAt: -1 }).lean();
  return sendSuccess(res, { orders: orders.map((order) => orderView(order, req.user._id)) });
});

export const getOrder = asyncHandler(async (req, res) => {
  const order = await loadOrder(req.params.id);
  if (!order || !canViewOrder(order, req.user)) {
    throw httpError(404, "Bestellung nicht gefunden.");
  }
  return sendSuccess(res, { order: orderView(order, req.user._id) });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, carrier, trackingNumber } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) {
    throw httpError(404, "Bestellung nicht gefunden.");
  }
  if (!canSetOrderStatus(order, req.user, status)) {
    throw httpError(403, "Dieser Statuswechsel ist nicht erlaubt.");
  }

  const previous = order.status;
  order.status = status;
  if (carrier !== undefined) order.shipping.carrier = carrier;
  if (trackingNumber !== undefined) order.shipping.trackingNumber = trackingNumber;
  order.shipping.status = shippingStatusForOrderStatus(status);
  order.timeline.push({
    status,
    note: `Status von ${previous} zu ${status} geändert.`,
  });
  await order.save();

  const populated = await loadOrder(order._id);
  if (status === "delivered") {
    const buyerId = populated.buyer?._id || populated.buyer;
    await notifyMany([buyerId], {
      type: "order",
      title: "Bestellung geliefert",
      message: `Deine Bestellung ${order._id} wurde geliefert. Du kannst jetzt eine Bewertung abgeben.`,
      data: { orderId: order._id, canReview: true },
      link: `/orders/${order._id}`,
    });
  }

  return sendSuccess(res, { order: orderView(populated, req.user._id) }, "Status aktualisiert.");
});

export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    throw httpError(404, "Bestellung nicht gefunden.");
  }
  if (!canCancelOrder(order, req.user)) {
    throw httpError(
      403,
      "Die Bestellung kann nicht mehr storniert werden oder du bist nicht berechtigt.",
    );
  }

  order.status = "cancelled";
  order.timeline.push({ status: "cancelled", note: "Bestellung wurde storniert." });
  await order.save();

  await notifyMany([order.buyer, order.seller], {
    type: "order",
    title: "Bestellung storniert",
    message: `Die Bestellung ${order._id} wurde storniert.`,
    data: { orderId: order._id },
    link: `/orders/${order._id}`,
  });

  const populated = await loadOrder(order._id);
  return sendSuccess(
    res,
    { order: orderView(populated, req.user._id) },
    "Bestellung erfolgreich storniert.",
  );
});

export default { checkout, listOrders, getOrder, updateOrderStatus, cancelOrder };
