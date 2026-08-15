"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, Zap, CreditCard, Loader2 } from "lucide-react";

interface TrialBannerProps {
  daysLeft: number;
  isStripe?: boolean;
}

export function TrialBanner({ daysLeft, isStripe }: TrialBannerProps) {
  const [loading, setLoading] = useState(false);
  const urgent = daysLeft <= 3;
  const warning = daysLeft <= 7;

  const colorCls = urgent
    ? "bg-red-500/10 border-red-500/25 text-red-300"
    : warning
    ? "bg-amber-500/10 border-amber-500/25 text-amber-300"
    : "bg-blue-500/10 border-blue-500/30 text-blue-300";

  const iconCls = urgent ? "text-red-400" : warning ? "text-amber-400" : "text-blue-400";

  const label =
    daysLeft === 0
      ? "Dernier jour d'essai"
      : daysLeft === 1
      ? "Il vous reste 1 jour d'essai"
      : `Il vous reste ${daysLeft} jours d'essai gratuit`;

  async function handleAddCard() {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
    } catch {
      // fall through
    }
    setLoading(false);
  }

  // Trial ending soon + Stripe user with no card yet → direct portal redirect.
  // Everyone else keeps the original link to /pending-payment.
  const showDirectCta = urgent && isStripe;

  return (
    <div className={`flex items-center justify-between gap-3 px-4 py-2 border-b text-xs ${colorCls}`}>
      <div className="flex items-center gap-2">
        <Clock className={`w-3.5 h-3.5 shrink-0 ${iconCls}`} />
        <span>{label}</span>
      </div>
      {showDirectCta ? (
        <button
          onClick={handleAddCard}
          disabled={loading}
          className={`flex items-center gap-1 font-semibold hover:underline shrink-0 disabled:opacity-60 ${iconCls}`}
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CreditCard className="w-3 h-3" />}
          Ajouter ma carte bancaire
        </button>
      ) : (
        <Link
          href="/pending-payment"
          className={`flex items-center gap-1 font-semibold hover:underline shrink-0 ${iconCls}`}
        >
          <Zap className="w-3 h-3" />
          Activer mon compte
        </Link>
      )}
    </div>
  );
}
