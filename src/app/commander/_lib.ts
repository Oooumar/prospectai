"use client";

// Shared logic for /commander/success and /commander/cancel — NOT a route
// (the `_` prefix opts this file out of Next.js's app-router file conventions).

import { useEffect, useState } from "react";
import { type Locale, LOCALES } from "@/lib/i18n";
import type { T } from "@/lib/i18n";
import { ZONE_LOCALE, type Zone } from "@/lib/commander-constants";

export interface OrderStatus {
  id: string;
  nom: string;
  typePrecis: string;
  marche: string;
  devise: string;
  prixEstime: number;
  montantAcompte: number | null;
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  paymentProvider: string | null;
}

export const TYPE_LABEL_KEY: Record<string, keyof T> = {
  vitrine:     "cmd_vitrine_label",
  pro_seo:     "cmd_pro_seo_label",
  boutique:    "cmd_boutique_label",
  webapp:      "cmd_webapp_label",
  native:      "cmd_native_label",
  menu_qr:     "cmd_menu_qr_label",
  menu_tablet: "cmd_menu_tablet_label",
  menu_staff:  "cmd_menu_staff_label",
};

export function fmtPrice(amount: number, devise: string): string {
  if (devise === "FCFA") return `${Math.round(amount).toLocaleString("fr-FR")} FCFA`;
  if (devise === "USD")  return `$${amount.toLocaleString("en-US")}`;
  return `${amount.toLocaleString("fr-FR")} €`;
}

// Prefers the visitor's browser language (still valid — same browser/tab that
// filled the form); falls back to the zone's natural language, then French.
// Not threading ?lang= through the Stripe/CinetPay redirect on purpose: Stripe
// preserves extra query params on success_url, but CinetPay's return_url
// behaviour isn't documented reliably enough to depend on it.
export function resolveLocale(zone: Zone | null): Locale {
  const browserLang = typeof navigator !== "undefined"
    ? (navigator.language.slice(0, 2).toLowerCase() as Locale)
    : "fr";
  if ((LOCALES as string[]).includes(browserLang)) return browserLang;
  if (zone) return ZONE_LOCALE[zone];
  return "fr";
}

type FetchState =
  | { status: "loading" }
  | { status: "not_found" }
  | { status: "ready"; order: OrderStatus };

/**
 * Fetches order status once. When `poll` is true and the order is still
 * PENDING, re-fetches every 3s (up to `maxAttempts`) so the success page can
 * reflect the webhook flipping PENDING → PAID/FAILED without a manual refresh.
 */
export function useOrderStatus(orderId: string | null, poll: boolean, maxAttempts = 20) {
  const [state, setState] = useState<FetchState>({ status: "loading" });

  useEffect(() => {
    if (!orderId) { setState({ status: "not_found" }); return; }

    let cancelled = false;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function load() {
      try {
        const res = await fetch(`/api/commander/pay?orderId=${orderId}`);
        if (cancelled) return;
        if (!res.ok) { setState({ status: "not_found" }); return; }

        const data = await res.json();
        const order: OrderStatus = data.order;
        setState({ status: "ready", order });

        attempts++;
        if (poll && order.paymentStatus === "PENDING" && attempts < maxAttempts) {
          timer = setTimeout(load, 3000);
        }
      } catch {
        if (!cancelled) setState({ status: "not_found" });
      }
    }

    load();
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [orderId, poll, maxAttempts]);

  return state;
}

/** Re-initiates a payment session for an order and redirects the browser to it. */
export async function retryPayment(orderId: string, zone: string, onError: (msg: string) => void) {
  try {
    const res = await fetch("/api/commander/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, zone }),
    });
    const data = await res.json();
    if (!res.ok || !data.url) { onError(data.error || "Erreur"); return; }
    window.location.href = data.url;
  } catch {
    onError("Impossible de contacter le serveur.");
  }
}
