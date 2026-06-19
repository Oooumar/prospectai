"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import {
  Zap, Mail, Lock, User, Loader2,
  Briefcase, Camera, Building2,
  CreditCard, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(2, "Minimum 2 caractères"),
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Minimum 6 caractères"),
  confirmPassword: z.string(),
  profileType: z.enum(["b2b", "creator", "agency"]),
  plan: z.enum(["starter", "creator", "pro", "agency"]),
  paymentMethod: z.enum(["stripe", "paypal"]),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

const profiles = [
  { value: "b2b" as const,     label: "Professionnel B2B",    desc: "Plombier, restaurant…", icon: Briefcase },
  { value: "creator" as const, label: "Créateur de contenu",  desc: "Marque beauté, mode…",  icon: Camera    },
  { value: "agency" as const,  label: "Agence",               desc: "Multi-clients, white-label", icon: Building2 },
];

const planOptions = [
  { value: "starter" as const, name: "Starter",  price: "9€",  popular: false },
  { value: "creator" as const, name: "Creator",  price: "19€", popular: true  },
  { value: "pro" as const,     name: "Pro",      price: "49€", popular: false },
  { value: "agency" as const,  name: "Agency",   price: "99€", popular: false },
];

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultPlan = (searchParams.get("plan") as FormData["plan"]) ?? "creator";

  const [error, setError] = useState("");
  const [step, setStep] = useState<"loading" | "idle">("idle");

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { profileType: "b2b", plan: defaultPlan, paymentMethod: "stripe" },
  });

  const selectedProfile     = watch("profileType");
  const selectedPlan        = watch("plan");
  const selectedPayment     = watch("paymentMethod");

  async function onSubmit(data: FormData) {
    setError("");
    setStep("loading");

    // 1. Create account
    const registerRes = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        password: data.password,
        profileType: data.profileType,
        plan: data.plan,
        paymentMethod: data.paymentMethod,
      }),
    });

    const registerJson = await registerRes.json();
    if (!registerRes.ok) {
      setError(registerJson.error || "Une erreur s'est produite.");
      setStep("idle");
      return;
    }

    const { userId } = registerJson;

    // 2. Sign in silently
    await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    // 3. Redirect to checkout
    if (data.paymentMethod === "stripe") {
      const stripeRes = await fetch("/api/checkout/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, plan: data.plan, email: data.email }),
      });
      const stripeJson = await stripeRes.json();
      if (stripeJson.url) {
        window.location.href = stripeJson.url;
        return;
      }
      // Stripe not configured yet → go to dashboard
      router.push("/dashboard");
    } else {
      const paypalRes = await fetch("/api/checkout/paypal/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, plan: data.plan }),
      });
      const paypalJson = await paypalRes.json();
      if (paypalJson.approvalUrl) {
        window.location.href = paypalJson.approvalUrl;
        return;
      }
      // PayPal not configured yet → go to dashboard
      router.push("/dashboard");
    }
  }

  const loading = isSubmitting || step === "loading";

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-10 grid-bg">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">ProspectAI</span>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-gray-900/80 backdrop-blur-sm p-8 shadow-2xl">
          <h1 className="text-2xl font-bold text-white mb-1">Créer un compte</h1>
          <p className="text-gray-400 text-sm mb-7">
            🎁 Essai gratuit <strong className="text-white">14 jours</strong> — aucun prélèvement avant le jour 15
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {/* Profile type */}
            <div className="space-y-2">
              <Label>Votre profil</Label>
              <div className="grid grid-cols-3 gap-2">
                {profiles.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setValue("profileType", p.value)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all",
                      selectedProfile === p.value
                        ? "border-violet-500 bg-violet-500/10 text-violet-300"
                        : "border-gray-700 bg-gray-800/40 text-gray-400 hover:border-gray-600"
                    )}
                  >
                    <p.icon className="w-4 h-4" />
                    <span className="text-xs font-medium leading-tight">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Account info */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="name">Nom complet</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input id="name" placeholder="Jean Dupont" className="pl-9" {...register("name")} />
                </div>
                {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input id="email" type="email" placeholder="vous@exemple.com" className="pl-9" {...register("email")} />
                </div>
                {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="password">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input id="password" type="password" placeholder="6 caractères min." className="pl-9" {...register("password")} />
                  </div>
                  {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">Confirmer</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input id="confirmPassword" type="password" placeholder="••••••••" className="pl-9" {...register("confirmPassword")} />
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-red-400">{errors.confirmPassword.message}</p>}
                </div>
              </div>
            </div>

            {/* Plan */}
            <div className="space-y-2">
              <Label>Votre plan</Label>
              <div className="grid grid-cols-2 gap-2">
                {planOptions.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setValue("plan", p.value)}
                    className={cn(
                      "relative flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm transition-all",
                      selectedPlan === p.value
                        ? "border-violet-500 bg-violet-500/10 text-white"
                        : "border-gray-700 bg-gray-800/40 text-gray-400 hover:border-gray-600"
                    )}
                  >
                    <span className="font-medium">{p.name}</span>
                    <div className="flex items-center gap-1.5">
                      {p.popular && (
                        <span className="text-xs bg-violet-600/80 text-white px-1.5 py-0.5 rounded-full">★</span>
                      )}
                      <span className="text-xs text-gray-400">{p.price}/mois</span>
                      {selectedPlan === p.value && (
                        <Check className="w-3.5 h-3.5 text-violet-400" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-emerald-400">
                Essai gratuit 14 jours · puis {planOptions.find(p => p.value === selectedPlan)?.price}/mois · annulable à tout moment
              </p>
            </div>

            {/* Payment method */}
            <div className="space-y-2">
              <Label>Mode de paiement</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setValue("paymentMethod", "stripe")}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                    selectedPayment === "stripe"
                      ? "border-violet-500 bg-violet-500/10"
                      : "border-gray-700 bg-gray-800/40 hover:border-gray-600"
                  )}
                >
                  <CreditCard className={cn("w-5 h-5", selectedPayment === "stripe" ? "text-violet-400" : "text-gray-500")} />
                  <div>
                    <p className={cn("text-sm font-medium", selectedPayment === "stripe" ? "text-white" : "text-gray-400")}>
                      Carte bancaire
                    </p>
                    <p className="text-xs text-gray-500">via Stripe · sécurisé</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setValue("paymentMethod", "paypal")}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                    selectedPayment === "paypal"
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-gray-700 bg-gray-800/40 hover:border-gray-600"
                  )}
                >
                  {/* PayPal "P" logo */}
                  <div className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold",
                    selectedPayment === "paypal" ? "bg-blue-500 text-white" : "bg-gray-600 text-gray-300"
                  )}>P</div>
                  <div>
                    <p className={cn("text-sm font-medium", selectedPayment === "paypal" ? "text-white" : "text-gray-400")}>
                      PayPal
                    </p>
                    <p className="text-xs text-gray-500">compte PayPal</p>
                  </div>
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" />Création en cours…</>
                : "Démarrer mon essai gratuit de 14 jours"}
            </Button>

            <p className="text-center text-xs text-gray-500">
              En créant un compte vous acceptez nos{" "}
              <a href="#" className="text-violet-400 hover:underline">CGU</a>
            </p>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-800 text-center text-sm text-gray-400">
            Déjà un compte ?{" "}
            <Link href="/auth/signin" className="text-violet-400 hover:text-violet-300 font-medium">
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpForm />
    </Suspense>
  );
}
