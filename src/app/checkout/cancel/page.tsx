"use client";

import Link from "next/link";
import { XCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <XCircle className="w-10 h-10 text-red-400" />
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-lg font-bold text-white">ProspectAI</span>
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">Paiement annulé</h1>
        <p className="text-gray-400 mb-8">
          Votre compte a été créé. Vous pouvez configurer votre mode de paiement à tout moment depuis le tableau de bord.
        </p>

        <div className="flex flex-col gap-3">
          <Link href="/dashboard">
            <Button variant="gradient" className="w-full">Accéder au tableau de bord</Button>
          </Link>
          <Link href="/auth/signin">
            <Button variant="outline" className="w-full">Se connecter</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
