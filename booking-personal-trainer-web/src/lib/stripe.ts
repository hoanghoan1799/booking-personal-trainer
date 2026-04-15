import { loadStripe, type Stripe } from "@stripe/stripe-js";

/**
 * Stripe publishable key (Dashboard → Developers → API keys → Publishable key).
 * Add to `.env.local`: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
 */
let stripePromise: Promise<Stripe | null> | null = null;

export const getStripe = (): Promise<Stripe | null> => {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey) {
    return Promise.resolve(null);
  }
  if (!stripePromise) {
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
};
