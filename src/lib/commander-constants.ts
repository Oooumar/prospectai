// Shared constants for the /commander order + deposit-payment flow.
// Centralized here so pricing/zone logic can't drift between
// /api/commander (order creation) and /api/commander/pay (deposit payment).
// Safe to import from both server routes and client components — no server-only APIs here.

import type { Locale } from "@/lib/i18n";

export const VALID_ZONES = ["africa-fr", "africa-en", "europe", "amerique"] as const;
export type Zone = typeof VALID_ZONES[number];

// Devise shown to the user — mirrors ZONES config in src/app/commander/page.tsx
export const ZONE_DEVISE: Record<Zone, string> = {
  "africa-fr": "FCFA",
  "africa-en": "USD",
  "europe":    "EUR",
  "amerique":  "USD",
};

// Natural/default language per zone — mirrors ZONES config in src/app/commander/page.tsx.
// Used as a fallback on /commander/success + /commander/cancel, where the visitor's
// explicit ?lang= choice (if any) isn't guaranteed to survive a Stripe/CinetPay
// redirect — those pages prefer navigator.language first and fall back to this.
export const ZONE_LOCALE: Record<Zone, Locale> = {
  "africa-fr": "fr",
  "africa-en": "en",
  "europe":    "fr",
  "amerique":  "en",
};

// Africa (CinetPay/Mobile Money) → 30% deposit online, remaining 70% stays manual on delivery.
// Europe/Amérique (Stripe) → 100% paid online, nothing left to collect manually.
export const DEPOSIT_RATE = 0.30;

/** Fraction of prixEstime charged automatically at order time, for the given zone. */
export function getPaymentRate(zone: Zone): number {
  return zone === "europe" || zone === "amerique" ? 1.0 : DEPOSIT_RATE;
}

// XOF is hard-pegged to EUR (655.957 XOF = 1 EUR — official CFA franc peg, not a market rate).
export const EUR_XOF_RATE = 655.957;

// USD/XOF floats with the market (no peg). CinetPay Mobile Money only settles in
// XOF/XAF/CDF/GNF — never USD — so africa-en amounts must be converted at payment time.
// Approximate anchor, update periodically; not precision-critical since it only affects
// the 30% deposit and the remaining 70% is negotiated manually at delivery anyway.
export const USD_XOF_RATE = 600;

/** Converts an amount from its display devise into XOF, for CinetPay. */
export function toXOF(amount: number, devise: string): number {
  if (devise === "FCFA") return Math.round(amount);
  if (devise === "USD")  return Math.round(amount * USD_XOF_RATE);
  if (devise === "EUR")  return Math.round(amount * EUR_XOF_RATE);
  return Math.round(amount);
}
