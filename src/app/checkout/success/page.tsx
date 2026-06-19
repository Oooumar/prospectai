"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Zap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CheckoutSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => router.push("/dashboard"), 4000);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-lg font-bold text-white">ProspectAI</span>
        </div>

        <h1 className="text-3xl font-bold text-white mb-3">
          Bienvenue sur ProspectAI !
        </h1>
        <p className="text-gray-400 mb-2">
          Votre essai gratuit de <strong className="text-white">14 jours</strong> démarre maintenant.
        </p>
        <p className="text-gray-500 text-sm mb-8">
          Aucun prélèvement avant la fin de l'essai. Annulable à tout moment.
        </p>

        <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 mb-8 text-sm text-gray-300">
          Redirection vers le tableau de bord dans quelques secondes…
        </div>

        <Link href="/dashboard">
          <Button variant="gradient" className="w-full">
            Accéder au tableau de bord
          </Button>
        </Link>
      </div>
    </div>
  );
}
