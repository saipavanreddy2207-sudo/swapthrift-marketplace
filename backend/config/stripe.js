import Stripe from "stripe";

let client = null;

/**
 * Lazily creates the Stripe client so the app can start without a Stripe key.
 */
export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      "STRIPE_SECRET_KEY fehlt. Bitte in .env setzen, bevor Stripe-Funktionen genutzt werden.",
    );
  }
  if (!client) {
    client = new Stripe(secretKey);
  }
  return client;
}

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export default getStripe;
