"use client";

import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Zap, Clock, Phone, MessageCircle, LogOut, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  // If the session disappears, redirect to sign-in
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/auth/signin");
  }, [status, router]);

  // Fetch current subscription status to tailor the message
  useEffect(() => {
    fetch("/api/user/me")
      .then(r => r.json())
      .then(d => setSubStatus(d.subscriptionStatus ?? "pending"))
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

        {/* Payment block */}
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
