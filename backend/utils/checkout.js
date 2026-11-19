/** Pure helpers for checkout totals. No database or environment access. */

export function roundMoney(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round((number + Number.EPSILON) * 100) / 100 : 0;
}

/** Euro amount in cents, used for Stripe PaymentIntents. */
export function toCents(value) {
  return Math.round((roundMoney(value) + Number.EPSILON) * 100);
}

const SHIPPING_HINT = /versand|paket|dhl|hermes|dpd|ups|gls|post|kurier/i;

export function shippingCostFromOptions(options, shippingMethod = "versand") {
  if (shippingMethod === "abholung") return 0;

  const available = (Array.isArray(options) ? options : [])
    .map((option) => ({ type: String(option?.type || ""), cost: Number(option?.cost) }))
    .filter((option) => Number.isFinite(option.cost) && option.cost >= 0);

  if (!available.length) return 0;
  const preferred = available.find((option) => SHIPPING_HINT.test(option.type)) || available[0];
  return roundMoney(preferred.cost);
}

export function calculateShippingCost(product, shippingMethod = "versand") {
  return shippingCostFromOptions(product?.shippingOptions, shippingMethod);
}

export function calculateOrderTotals(items = [], shippingMethod = "versand") {
  const subtotal = roundMoney(
    items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0),
  );
  const shippingCost = roundMoney(
    items.reduce(
      (sum, item) => sum + shippingCostFromOptions(item.shippingOptions, shippingMethod),
      0,
    ),
  );

  return { subtotal, shippingCost, total: roundMoney(subtotal + shippingCost) };
}
