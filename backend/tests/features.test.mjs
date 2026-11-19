import test from "node:test";
import assert from "node:assert/strict";
import {
  addressSchema,
  addressUpdateSchema,
  adminUserStatusSchema,
  categorySchema,
  checkoutSchema,
  conversationSchema,
  messageQuerySchema,
  messageSchema,
  notificationQuerySchema,
  orderStatusSchema,
  reviewSchema,
} from "../utils/validators.js";
import {
  calculateOrderTotals,
  calculateShippingCost,
  shippingCostFromOptions,
  toCents,
} from "../utils/checkout.js";
import {
  canCancelOrder,
  canManageAddress,
  canSetOrderStatus,
  canViewOrder,
  shippingStatusForOrderStatus,
} from "../utils/access.js";
import { slugify } from "../utils/slug.js";
import {
  isSafeLocalFilename,
  localFilenameFromPublicId,
  localPublicId,
  uploadFileUrl,
} from "../config/uploads.js";

const ID = "507f1f77bcf86cd799439011";
const ID2 = "507f191e810c19729de860ea";
const address = {
  firstName: "Lena",
  lastName: "Müller",
  street: "Hauptstraße",
  houseNumber: "12a",
  postalCode: "10115",
  city: "Berlin",
};

test("addressSchema setzt Standardwerte und prüft die deutsche PLZ", () => {
  const parsed = addressSchema.parse(address);
  assert.equal(parsed.country, "Deutschland");
  assert.equal(parsed.label, "Zuhause");
  assert.equal(parsed.isDefault, false);
  assert.equal(addressSchema.safeParse({ ...address, postalCode: "123" }).success, false);
  assert.equal(addressSchema.safeParse({ ...address, houseNumber: "" }).success, false);
  assert.deepEqual(addressUpdateSchema.parse({ city: "Hamburg" }), { city: "Hamburg" });
});

test("checkoutSchema akzeptiert Demo-Modus und erzwingt Einzelstücke", () => {
  const payload = {
    items: [{ productId: ID, quantity: "1" }],
    address,
    shippingMethod: "versand",
  };
  const parsed = checkoutSchema.parse(payload);
  assert.equal(parsed.mode, "demo");
  assert.equal(parsed.items[0].quantity, 1);
  assert.equal(parsed.address.country, "Deutschland");
  assert.equal(
    checkoutSchema.safeParse({
      ...payload,
      items: [{ productId: ID, quantity: 2 }],
    }).success,
    false,
  );
  assert.equal(checkoutSchema.safeParse({ ...payload, shippingMethod: "express" }).success, false);
  assert.equal(checkoutSchema.safeParse({ ...payload, items: [] }).success, false);
});

test("Nachrichten-, Bewertungs- und Admin-Schemas begrenzen Eingaben", () => {
  assert.equal(conversationSchema.safeParse({ productId: ID, receiverId: ID2 }).success, true);
  assert.equal(conversationSchema.safeParse({ productId: "abc", receiverId: ID2 }).success, false);
  assert.equal(messageSchema.safeParse({ text: "Hallo!" }).success, true);
  assert.equal(messageSchema.safeParse({ text: " " }).success, false);
  assert.equal(messageSchema.safeParse({ text: "x".repeat(4001) }).success, false);
  assert.equal(messageQuerySchema.parse({}).limit, 50);
  assert.equal(reviewSchema.safeParse({ orderId: ID, rating: 5 }).success, true);
  assert.equal(reviewSchema.safeParse({ orderId: ID, rating: 6 }).success, false);
  assert.equal(orderStatusSchema.safeParse({ status: "shipped" }).success, true);
  assert.equal(orderStatusSchema.safeParse({ status: "bezahlt" }).success, false);
  assert.equal(adminUserStatusSchema.safeParse({ roles: ["admin"] }).success, true);
  assert.equal(adminUserStatusSchema.safeParse({}).success, false);
  assert.equal(categorySchema.parse({ name: "Möbel & Wohnen" }).sortOrder, 0);
});

test("notificationQuerySchema verarbeitet Query-Strings korrekt", () => {
  assert.equal(notificationQuerySchema.parse({}).unreadOnly, false);
  assert.equal(notificationQuerySchema.parse({ unreadOnly: "true" }).unreadOnly, true);
  assert.equal(notificationQuerySchema.parse({ unreadOnly: "false" }).unreadOnly, false);
});

test("Versandkosten und Bestellsumme werden aus echten Optionen berechnet", () => {
  const options = [
    { type: "DHL", cost: 5.9 },
    { type: "Abholung", cost: 0 },
  ];
  assert.equal(shippingCostFromOptions(options, "versand"), 5.9);
  assert.equal(calculateShippingCost({ shippingOptions: options }, "abholung"), 0);
  assert.equal(calculateShippingCost({}, "versand"), 0);

  const totals = calculateOrderTotals(
    [
      { price: 120.5, quantity: 1, shippingOptions: options },
      { price: 10, quantity: 1, shippingOptions: [{ type: "Versand", cost: 2.95 }] },
    ],
    "versand",
  );
  assert.deepEqual(totals, { subtotal: 130.5, shippingCost: 8.85, total: 139.35 });
  assert.equal(toCents(totals.total), 13935);
});

test("Bestellberechtigungen erlauben nur zulässige Statuswechsel", () => {
  const buyer = { _id: "buyer", roles: ["user"] };
  const seller = { _id: "seller", roles: ["seller"] };
  const admin = { _id: "admin", roles: ["admin"] };
  const stranger = { _id: "stranger", roles: ["user"] };
  const order = { buyer: "buyer", seller: "seller", status: "pending" };

  assert.equal(canViewOrder(order, buyer), true);
  assert.equal(canViewOrder(order, seller), true);
  assert.equal(canViewOrder(order, admin), true);
  assert.equal(canViewOrder(order, stranger), false);

  assert.equal(canSetOrderStatus(order, buyer, "cancelled"), true);
  assert.equal(canSetOrderStatus({ ...order, status: "processing" }, buyer, "cancelled"), false);
  assert.equal(canCancelOrder({ ...order, status: "processing" }, buyer), true);
  assert.equal(canCancelOrder({ ...order, status: "shipped" }, buyer), false);
  assert.equal(canCancelOrder(order, seller), false);
  assert.equal(canCancelOrder(order, admin), true);

  assert.equal(canSetOrderStatus(order, seller, "processing"), true);
  assert.equal(canSetOrderStatus({ ...order, status: "processing" }, seller, "shipped"), true);
  assert.equal(canSetOrderStatus({ ...order, status: "shipped" }, seller, "delivered"), true);
  assert.equal(canSetOrderStatus({ ...order, status: "delivered" }, seller, "shipped"), false);
  assert.equal(shippingStatusForOrderStatus("shipped"), "in_transit");
  assert.equal(canManageAddress({ user: "buyer" }, buyer), true);
  assert.equal(canManageAddress({ user: "seller" }, buyer), false);
});

test("lokale Upload-PublicIds sind pfadsicher", () => {
  assert.equal(isSafeLocalFilename("foto-1.jpg"), true);
  assert.equal(isSafeLocalFilename("../geheim.jpg"), false);
  assert.equal(localPublicId("foto.jpg"), "local:foto.jpg");
  assert.equal(localFilenameFromPublicId("local:foto.jpg"), "foto.jpg");
  assert.equal(localFilenameFromPublicId("local:../../etc/passwd"), null);
  assert.equal(localFilenameFromPublicId("cloudinary-id"), null);
});

test("API_PUBLIC_URL erzeugt absolute Upload-URLs", () => {
  const previous = process.env.API_PUBLIC_URL;
  process.env.API_PUBLIC_URL = "https://api.example.test/";
  try {
    assert.equal(uploadFileUrl("foto.png"), "https://api.example.test/uploads/foto.png");
  } finally {
    if (previous === undefined) delete process.env.API_PUBLIC_URL;
    else process.env.API_PUBLIC_URL = previous;
  }
});

test("slugify erzeugt deutsche Slugs", () => {
  assert.equal(slugify("Möbel & Wohnen"), "moebel-wohnen");
  assert.equal(slugify("Straße / Übung"), "strasse-uebung");
});
