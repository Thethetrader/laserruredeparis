import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-05-27.dahlia",
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
