"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Zap, Mail, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Minimum 6 caractères"),
});

type FormData = z.infer<typeof schema>;

export default function SignInPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setError("");
    const res = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (res?.error) {
      setError("Email ou mot de passe incorrect.");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 grid-bg">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">ProspectAI</span>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-gray-900/80 backdrop-blur-sm p-8 shadow-2xl">
          <h1 className="text-2xl font-bold text-white mb-1">Bon retour</h1>
          <p className="text-gray-400 text-sm mb-8">Connectez-vous à votre compte</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="vous@exemple.com"
                  className="pl-9"
                  {...register("email")}
                />
              </div>
              {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-9"
                  {...register("password")}
                />
              </div>
              {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="gradient"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connexion…
                </>
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-800 text-center text-sm text-gray-400">
            Pas encore de compte ?{" "}
            <Link href="/auth/signup" className="text-violet-400 hover:text-violet-300 font-medium">
              S&apos;inscrire
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-600">
          En continuant, vous acceptez nos{" "}
          <a href="#" className="hover:text-gray-400">CGU</a> et{" "}
          <a href="#" className="hover:text-gray-400">Politique de confidentialité</a>
        </p>
      </div>
    </div>
  );
}
