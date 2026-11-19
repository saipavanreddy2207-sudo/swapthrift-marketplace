import test from "node:test";
import assert from "node:assert/strict";
import {
  registerSchema,
  loginSchema,
  productSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  productQuerySchema,
} from "../utils/validators.js";
import { computeFraudScore, computeFraudAssessment } from "../utils/fraud.js";

const validUser = {
  firstName: "Lena",
  lastName: "Müller",
  email: "Lena@Example.de",
  password: "sicheresPasswort123",
  phone: "+49 30 123456",
  city: "Berlin",
  postalCode: "10115",
  terms: true,
  privacy: true,
};

test("registerSchema akzeptiert gültige Registrierungsdaten und normalisiert die E-Mail", () => {
  const result = registerSchema.safeParse(validUser);
  assert.equal(result.success, true);
  assert.equal(result.data.email, "lena@example.de");
});

test("registerSchema lehnt fehlende Zustimmung und ungültige PLZ ab", () => {
  assert.equal(registerSchema.safeParse({ ...validUser, terms: false }).success, false);
  assert.equal(registerSchema.safeParse({ ...validUser, postalCode: "1234" }).success, false);
  assert.equal(registerSchema.safeParse({ ...validUser, password: "kurz" }).success, false);
});

test("loginSchema, forgotPasswordSchema und resetPasswordSchema validieren korrekt", () => {
  assert.equal(loginSchema.safeParse({ email: "a@b.de", password: "x" }).success, true);
  assert.equal(loginSchema.safeParse({ email: "keine-email", password: "x" }).success, false);
  assert.equal(forgotPasswordSchema.safeParse({ email: "a@b.de" }).success, true);
  assert.equal(resetPasswordSchema.safeParse({ token: "abc", password: "kurz" }).success, false);
  assert.equal(
    resetPasswordSchema.safeParse({ token: "langerresettoken", password: "sicher1234" }).success,
    true,
  );
});

const validProduct = {
  title: "Vintage Fahrrad",
  description: "Ein schönes Fahrrad in gutem Zustand, kaum benutzt.",
  price: "120.50",
  category: "507f1f77bcf86cd799439011",
  condition: "Gut",
  city: "Berlin",
  postalCode: "10115",
  shippingOptions: [{ type: "DHL", cost: "5.90" }],
};

test("productSchema erzwingt Zahlen aus Multipart-Strings", () => {
  const result = productSchema.safeParse(validProduct);
  assert.equal(result.success, true);
  assert.equal(result.data.price, 120.5);
  assert.equal(result.data.shippingOptions[0].cost, 5.9);
  assert.equal(result.data.availability, "available");
});

test("productSchema lehnt ungültige Bedingung und PLZ ab", () => {
  assert.equal(productSchema.safeParse({ ...validProduct, condition: "Kaputt" }).success, false);
  assert.equal(productSchema.safeParse({ ...validProduct, postalCode: "abcde" }).success, false);
});

test("productQuerySchema setzt sinnvolle Standardwerte für Pagination und Sortierung", () => {
  const result = productQuerySchema.safeParse({});
  assert.equal(result.success, true);
  assert.equal(result.data.page, 1);
  assert.equal(result.data.limit, 12);
  assert.equal(result.data.sort, "newest");
  assert.equal(productQuerySchema.safeParse({ sort: "unbekannt" }).success, false);
});

test("computeFraudScore liefert einen Wert zwischen 0 und 100", () => {
  const normal = computeFraudScore({
    price: 45,
    title: "Stadtrad",
    description: "Ein gepflegtes Stadtrad mit neuen Reifen und Licht.",
    seller: {
      isEmailVerified: true,
      isSuspended: false,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
    duplicateCount: 0,
  });
  assert.equal(normal, 0);

  const suspicious = computeFraudScore({
    price: 0.99,
    title: "IPHONE GRATIS",
    description: "whatsapp original garantie",
    seller: { isEmailVerified: false, isSuspended: false, createdAt: new Date() },
    duplicateCount: 5,
  });
  assert.ok(suspicious > 50, `erwarteter hoher Score, erhalten: ${suspicious}`);
  assert.ok(suspicious <= 100);
});

test("computeFraudAssessment liefert nachvollziehbare Gründe", () => {
  const result = computeFraudAssessment({
    price: 1,
    title: "Gratis",
    description: "kurz",
    duplicateCount: 3,
  });
  assert.ok(result.reasons.length >= 3);
  assert.equal(result.score, computeFraudScore({
    price: 1,
    title: "Gratis",
    description: "kurz",
    duplicateCount: 3,
  }));
});
