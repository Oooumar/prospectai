"use client";

import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Zap, Clock, Phone, MessageCircle, LogOut, RefreshCw, CreditCard, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Mobile Money / CinetPay is temporarily disabled everywhere in the
// subscription flow (not /commander — that's a separate, still-active flow).
// Stripe is the only option shown while FedaPay/CinetPay's Africa status is
// being sorted out. Code kept intact below — flip this back to true to
// restore Mobile Money as a subscription payment option.
const MOBILE_MONEY_ENABLED = false;

// ── Mobile Money payment coordinates ────────────────────────────────────────
// Update these values if numbers change (also update commander/page.tsx)
const PAIEMENT = {
  nomCompte:   "Yameogo Sophie Léa",
  orangeMoney: "+22677456549",
  wave:        "+22677456549",
  moovMoney:   "+22670245211",
  whatsapp:    "https://wa.me/4915566701184",
} as const;

const METHODS = [
  { label: "Orange Money", number: PAIEMENT.orangeMoney, colorCls: "text-orange-400", bgCls: "bg-orange-500/10 border-orange-500/25" },
  { label: "Wave",         number: PAIEMENT.wave,        colorCls: "text-blue-400",   bgCls: "bg-blue-500/10 border-blue-500/25"   },
  { label: "Moov Money",  number: PAIEMENT.moovMoney,   colorCls: "text-teal-400",   bgCls: "bg-teal-500/10 border-teal-500/25"   },
] as const;

export default function PendingPaymentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subStatus, setSubStatus] = useState<string>("pending");
  const [plan, setPlan] = useState<string>("starter");
  const [portalLoading, setPortalLoading] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeError, setStripeError] = useState("");

  async function handleAddCard() {
    setPortalLoading(true);
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
    setPortalLoading(false);
  }

  // Universal Stripe path for the "trial expired" / "pending" states — unlike
  // the Customer Portal above, this works even when no Stripe customer exists
  // yet on the account (e.g. it was never started, or PayPal was chosen at
  // signup), since it creates a fresh Checkout session rather than opening a
  // portal for an existing one.
  async function handleStripeCheckout() {
    setStripeLoading(true);
    setStripeError("");
    try {
      const res = await fetch("/api/checkout/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      setStripeError(data.error || "Erreur lors de la création du paiement.");
    } catch {
      setStripeError("Erreur lors de la création du paiement.");
    }
    setStripeLoading(false);
  }

  // If the session disappears, redirect to sign-in
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/auth/signin");
  }, [status, router]);

  // Fetch current subscription status + plan to tailor the message and know
  // which plan to check out if the user pays via Stripe below.
  useEffect(() => {
    fetch("/api/user/me")
      .then(r => r.json())
      .then(d => {
        setSubStatus(d.subscriptionStatus ?? "pending");
        setPlan(d.plan ?? "starter");
      })
      .catch(() => {});
  }, []);

  // Poll every 30 s — redirect as soon as account becomes active
  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch("/api/user/me");
      const data = await res.json();
      if (data.subscriptionStatus === "active") {
        router.replace("/dashboard");
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, [router]);

  if (status === "loading") return null;

  // Trial ended with no payment method on file (Stripe subscription "paused").
  // Single, dedicated screen — no other exit than adding a card. Account and
  // data (prospects, history) are untouched; only feature access is blocked.
  if (subStatus === "paused") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/25 mb-2">
            <Lock className="w-7 h-7 text-red-400" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">Votre essai gratuit est terminé</h1>
            <p className="text-gray-400 text-sm leading-relaxed">
              Ajoutez votre carte bancaire pour continuer à utiliser ProspectAI.
            </p>
          </div>
          <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5 text-left space-y-2">
            <p className="text-xs text-gray-400 leading-relaxed">
              Votre compte, vos prospects et votre historique sont conservés — l'accès aux fonctionnalités
              (scraping, génération email/WhatsApp, campagnes) reprend dès qu'une carte est enregistrée.
            </p>
          </div>
          <Button variant="gradient" className="w-full" onClick={handleAddCard} disabled={portalLoading}>
            {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
            Ajouter ma carte bancaire
          </Button>
          <button
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            className="flex items-center justify-center gap-1.5 w-full text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  const trialExpired = subStatus === "trialing";
  const title  = trialExpired ? "Votre essai gratuit a expiré" : "Compte en attente d'activation";
  const subtitle = trialExpired
    ? "Vos 14 jours d'essai sont terminés. Activez votre compte pour continuer à prospecter."
    : "Votre compte est créé. Il sera activé dès que votre paiement est confirmé.";

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">

        {/* Header */}
        <div className="text-center space-y-3">
          <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl border mb-2 ${
            trialExpired
              ? "bg-red-500/10 border-red-500/25"
              : "bg-orange-500/10 border-orange-500/25"
          }`}>
            <Clock className={`w-7 h-7 ${trialExpired ? "text-red-400" : "text-orange-400"}`} />
          </div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            Bonjour <span className="text-white font-medium">{session?.user?.name ?? session?.user?.email}</span>,{" "}
            {subtitle}
          </p>
        </div>

        {/* Payment block — Stripe only for now (see MOBILE_MONEY_ENABLED) */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900/60 overflow-hidden">
          <div className="h-px bg-gradient-to-r from-violet-500 via-indigo-400 to-violet-500" />
          <div className="p-5 space-y-4">
            <p className="text-sm font-semibold text-gray-200">
              Active ton abonnement par carte bancaire
            </p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Paiement sécurisé via Stripe. Ton compte est activé automatiquement dès la confirmation du paiement.
            </p>
            <Button variant="gradient" className="w-full" onClick={handleStripeCheckout} disabled={stripeLoading}>
              {stripeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
              S'abonner avec Stripe
            </Button>
            {stripeError && <p className="text-xs text-red-400 text-center">{stripeError}</p>}
          </div>
        </div>

        {/* Mobile Money — temporarily disabled, see MOBILE_MONEY_ENABLED above */}
        {MOBILE_MONEY_ENABLED && (
          <div className="rounded-2xl border border-gray-800 bg-gray-900/60 overflow-hidden">
            <div className="h-px bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-500" />
            <div className="p-5 space-y-4">
              <p className="text-sm font-semibold text-gray-200">
                Règle ton abonnement via Mobile Money
              </p>
              <p className="text-xs text-gray-500">
                Au nom de : <span className="text-gray-300 font-medium">{PAIEMENT.nomCompte}</span>
              </p>

              <div className="grid gap-2">
                {METHODS.map(({ label, number, colorCls, bgCls }) => (
                  <div key={label} className={`flex items-center justify-between rounded-xl border px-4 py-3 ${bgCls}`}>
                    <div className="flex items-center gap-2">
                      <Phone className={`w-4 h-4 ${colorCls}`} />
                      <span className={`text-sm font-semibold ${colorCls}`}>{label}</span>
                    </div>
                    <span className="text-sm font-mono text-white">{number}</span>
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-500 leading-relaxed">
                Après avoir payé, envoie ton <span className="text-gray-300">reçu de paiement</span> par WhatsApp
                pour que ton compte soit activé rapidement.
              </p>

              <a
                href={`${PAIEMENT.whatsapp}?text=${encodeURIComponent("Bonjour, j'ai payé mon abonnement ProspectAI. Voici mon reçu : [joindre screenshot]")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 transition-colors text-white text-sm font-semibold"
              >
                <MessageCircle className="w-4 h-4" />
                Envoyer mon reçu WhatsApp
              </a>
            </div>
          </div>
        )}

        {/* What you get */}
        <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-semibold text-violet-300">Ce qui t'attend</span>
          </div>
          <ul className="space-y-1.5 text-sm text-gray-400">
            {[
              "Scraping Google Maps pour trouver tes prospects",
              "Génération de messages email & WhatsApp par IA",
              "Détection mobile/fixe + filtre sans site",
              "Campagnes WhatsApp automatisées",
              "Tableau de bord complet avec stats",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="text-violet-400 mt-0.5 shrink-0">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between text-sm">
          <button
            onClick={() => router.refresh()}
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Vérifier l'activation
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Se déconnecter
          </button>
        </div>

      </div>
    </div>
  );
}
