"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { XCircle, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { translations } from "@/lib/i18n";
import type { T } from "@/lib/i18n";
import type { Zone } from "@/lib/commander-constants";
import { useOrderStatus, resolveLocale, retryPayment, fmtPrice, TYPE_LABEL_KEY } from "../_lib";

function CancelInner() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  // No polling here — this page is only reached when the client backed out of
  // Stripe checkout before any payment attempt, so there's nothing async to wait for.
  const state = useOrderStatus(orderId, false);

  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState("");

  const zone: Zone | null = state.status === "ready" ? (state.order.marche as Zone) : null;
  const locale = resolveLocale(zone);
  function t(key: keyof T): string {
    return String(translations[locale][key] ?? translations.fr[key] ?? key);
  }

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
        {state.status === "loading" && (
          <Loader2 className="w-10 h-10 animate-spin text-violet-400 mx-auto" />
        )}

        {state.status === "not_found" && (
          <>
            <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-gray-500" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">{t("cok_not_found_title")}</h1>
            <p className="text-gray-400 text-sm mb-8">{t("cok_not_found_desc")}</p>
            <Link href="/"><Button variant="outline" className="w-full">{t("cmd_back_home")}</Button></Link>
          </>
        )}

        {state.status === "ready" && (() => {
          const order   = state.order;
          const montant = order.montantAcompte ?? Math.round(order.prixEstime * 0.30);
          const typeKey = TYPE_LABEL_KEY[order.typePrecis] ?? "cmd_vitrine_label";

          return (
            <>
              <div className="w-20 h-20 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-10 h-10 text-amber-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-3">{t("cko_title")}</h1>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">{t("cko_desc")}</p>

              <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-5 text-left mb-6">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-3">
                  {t("cmd_success_recap")}
                </p>
                <p className="text-sm text-white font-medium">{t(typeKey)}</p>
                <p className="mt-2 font-bold text-white">{fmtPrice(montant, order.devise)}</p>
              </div>

              {retryError && <p className="text-red-400 text-xs mb-4">{retryError}</p>}
              <Button variant="gradient" className="w-full mb-3" onClick={handleRetry} disabled={retrying}>
                {retrying ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {t("cok_retry_btn")}
              </Button>
              <Link href="/"><Button variant="outline" className="w-full">{t("cmd_back_home")}</Button></Link>
            </>
          );
        })()}
      </div>
    </div>
  );
}

export default function CommanderCancelPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950" />}>
      <CancelInner />
    </Suspense>
  );
}
