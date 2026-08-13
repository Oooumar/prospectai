"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Check, Loader2, XCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { translations } from "@/lib/i18n";
import type { T } from "@/lib/i18n";
import type { Zone } from "@/lib/commander-constants";
import { useOrderStatus, resolveLocale, retryPayment, fmtPrice, TYPE_LABEL_KEY } from "../_lib";

type View = "loading" | "not_found" | "pending" | "paid" | "failed";

function SuccessInner() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const state = useOrderStatus(orderId, true);

  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState("");

  const zone: Zone | null = state.status === "ready" ? (state.order.marche as Zone) : null;
  const locale = resolveLocale(zone);
  function t(key: keyof T): string {
    return String(translations[locale][key] ?? translations.fr[key] ?? key);
  }

  const view: View =
    state.status === "loading" ? "loading" :
    state.status !== "ready" ? "not_found" :
    state.order.paymentStatus === "PENDING" ? "pending" :
    state.order.paymentStatus === "PAID" ? "paid" :
    "failed"; // FAILED or REFUNDED

  function handleRetry() {
    if (state.status !== "ready") return;
    setRetrying(true);
    setRetryError("");
    retryPayment(state.order.id, state.order.marche, (msg) => {
      setRetryError(msg);
      setRetrying(false);
    });
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-6 py-16">
      <div className="max-w-md w-full text-center">
        {view === "loading" && (
          <Loader2 className="w-10 h-10 animate-spin text-violet-400 mx-auto" />
        )}

        {view === "not_found" && (
          <>
            <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-gray-500" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">{t("cok_not_found_title")}</h1>
            <p className="text-gray-400 text-sm mb-8">{t("cok_not_found_desc")}</p>
            <Link href="/"><Button variant="outline" className="w-full">{t("cmd_back_home")}</Button></Link>
          </>
        )}

        {view === "pending" && (
          <>
            <Loader2 className="w-16 h-16 animate-spin text-violet-400 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-white mb-3">{t("cok_checking_title")}</h1>
            <p className="text-gray-400 text-sm">{t("cok_checking_desc")}</p>
          </>
        )}

        {view === "paid" && state.status === "ready" && (() => {
          const order   = state.order;
          const isFull  = order.marche === "europe" || order.marche === "amerique";
          const montant = order.montantAcompte ?? order.prixEstime;
          const balance = order.prixEstime - montant;
          const typeKey = TYPE_LABEL_KEY[order.typePrecis] ?? "cmd_vitrine_label";

          return (
            <>
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-violet-500/30">
                <Check className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-3">
                {isFull ? t("cok_paid_full_title") : t("cok_paid_deposit_title")}
              </h1>
              <p className="text-gray-400 text-sm leading-relaxed">
                {isFull ? t("cok_paid_full_desc") : t("cok_paid_deposit_desc")}
              </p>

              <div className="rounded-2xl border border-violet-500/20 bg-violet-500/8 p-5 text-left my-6">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-3">
                  {t("cmd_success_recap")}
                </p>
                <p className="text-sm text-white font-medium">{t(typeKey)}</p>
                <p className="mt-2 font-bold text-white">{fmtPrice(montant, order.devise)}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {isFull
                    ? t("cok_paid_full_balance")
                    : t("cok_paid_deposit_balance").replace("{price}", fmtPrice(balance, order.devise))}
                </p>
              </div>

              <p className="text-gray-400 text-sm leading-relaxed mb-8">{t("cok_paid_next")}</p>

              <Link href="/"><Button variant="outline" className="w-full">{t("cmd_back_home")}</Button></Link>
            </>
          );
        })()}

        {view === "failed" && (
          <>
            <div className="w-20 h-20 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">{t("cok_failed_title")}</h1>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">{t("cok_failed_desc")}</p>
            {retryError && <p className="text-red-400 text-xs mb-4">{retryError}</p>}
            <Button variant="gradient" className="w-full mb-3" onClick={handleRetry} disabled={retrying}>
              {retrying ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {t("cok_retry_btn")}
            </Button>
            <Link href="/"><Button variant="outline" className="w-full">{t("cmd_back_home")}</Button></Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function CommanderSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950" />}>
      <SuccessInner />
    </Suspense>
  );
}
