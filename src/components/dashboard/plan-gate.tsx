"use client";

import Link from "next/link";
import { Lock, ArrowRight, Zap } from "lucide-react";
import { PLAN_DISPLAY, PLAN_PRICE, type Plan } from "@/lib/plan-limits";

interface PlanGateProps {
  currentPlan: string;
  requiredPlan: Plan;
  feature: string;
}

export function PlanGate({ currentPlan, requiredPlan, feature }: PlanGateProps) {
  const requiredLabel = PLAN_DISPLAY[requiredPlan] ?? requiredPlan.toUpperCase();
  const requiredPrice = PLAN_PRICE[requiredPlan] ?? "";
  const currentLabel = PLAN_DISPLAY[currentPlan] ?? currentPlan.toUpperCase();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="w-full max-w-md space-y-6 text-center">

        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-800/80 border border-gray-700 mb-2">
          <Lock className="w-7 h-7 text-gray-400" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">{feature}</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Cette fonctionnalité est disponible à partir du plan{" "}
            <span className="text-violet-300 font-semibold">{requiredLabel}</span>.
            Votre plan actuel est{" "}
            <span className="text-gray-300 font-medium">{currentLabel}</span>.
          </p>
        </div>

        <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5 text-left space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-violet-400 shrink-0" />
            <span className="text-sm font-semibold text-violet-300">
              Plan {requiredLabel} — {requiredPrice}
            </span>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            Passez au plan {requiredLabel} pour débloquer cette fonctionnalité et bien plus encore.
          </p>
        </div>

        <Link
          href="/pending-payment"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 transition-colors text-white text-sm font-semibold"
        >
          <Zap className="w-4 h-4" />
          Passer au plan supérieur
          <ArrowRight className="w-4 h-4" />
        </Link>

      </div>
    </div>
  );
}
