import Stripe from "stripe";

let _stripe: Stripe | null = null;
export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY not configured");
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-05-27.dahlia" });
  }
  return _stripe;
}
// Keep backward compat — lazy proxy
export const stripe = new Proxy({} as Stripe, {
  get(_t, prop) {
    return (getStripe() as any)[prop];
  },
});

export const PRICES = {
  first_small: process.env.STRIPE_PRICE_FIRST_SMALL!,
  first_large: process.env.STRIPE_PRICE_FIRST_LARGE!,
  add_small: process.env.STRIPE_PRICE_ADD_SMALL!,
  add_large: process.env.STRIPE_PRICE_ADD_LARGE!,
} as const;

export function getPriceId(type: "first" | "add", size: "small" | "large") {
  return PRICES[`${type}_${size}`];
}
