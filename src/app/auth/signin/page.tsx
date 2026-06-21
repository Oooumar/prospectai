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
import { LanguageSelector } from "@/components/language-selector";
import { useI18n } from "@/components/language-provider";

type FormData = { email: string; password: string };

export default function SignInPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [error, setError] = useState("");

  const schema = z.object({
    email: z.string().email(t("val_email")),
    password: z.string().min(6, t("val_pw_min")),
  });

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
      setError(t("si_error"));
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 grid-bg">
      <div className="w-full max-w-md">
        {/* Logo + Language selector */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 mx-auto">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">ProspectAI</span>
          </div>
          <LanguageSelector className="absolute right-6 top-6" />
        </div>

        <div className="rounded-2xl border border-gray-800 bg-gray-900/80 backdrop-blur-sm p-8 shadow-2xl">
          <h1 className="text-2xl font-bold text-white mb-1">{t("si_title")}</h1>
          <p className="text-gray-400 text-sm mb-8">{t("si_sub")}</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">{t("si_email")}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder={t("si_email_ph")}
                  className="pl-9"
                  {...register("email")}
                />
              </div>
              {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">{t("si_pw")}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  id="password"
                  type="password"
                  placeholder={t("si_pw_ph")}
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

            <Button type="submit" variant="gradient" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" />{t("si_loading")}</>
              ) : t("si_btn")}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-800 text-center text-sm text-gray-400">
            {t("si_no_account")}{" "}
            <Link href="/auth/signup" className="text-violet-400 hover:text-violet-300 font-medium">
              {t("si_signup_link")}
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-600">
          {t("auth_terms")}{" "}
          <Link href="/cgu" className="hover:text-gray-400">{t("auth_cgu")}</Link>{" "}
          {" & "}
          <Link href="/politique-confidentialite" className="hover:text-gray-400">{t("auth_privacy")}</Link>
        </p>
      </div>
    </div>
  );
}
