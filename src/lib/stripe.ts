import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export const PLAN_META: Record<string, { price: number; label: string; priceId: string }> = {
  starter: { price: 9,  label: "Starter", priceId: process.env.STRIPE_PRICE_STARTER! },
  creator: { price: 19, label: "Creator", priceId: process.env.STRIPE_PRICE_CREATOR! },
  pro:     { price: 49, label: "Pro",     priceId: process.env.STRIPE_PRICE_PRO!     },
  agency:  { price: 99, label: "Agency",  priceId: process.env.STRIPE_PRICE_AGENCY!  },
};
