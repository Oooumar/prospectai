"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  Zap, Target, Mail, BarChart3, ArrowRight, Check, Rocket
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/footer";
import { LanguageSelector } from "@/components/language-selector";
import { useI18n } from "@/components/language-provider";

const FEATURE_ICONS = [Target, Zap, Mail, BarChart3];

const PLANS = [
  { name: "Starter", slug: "starter", price: "9", popular: false },
  { name: "Creator", slug: "creator", price: "19", popular: true },
  { name: "Pro", slug: "pro", price: "49", popular: false },
  { name: "Agency", slug: "agency", price: "99", popular: false },
];

export default function LandingPage() {
  const { t } = useI18n();

  const features = [
    { icon: Target, title: t("feat1_title"), description: t("feat1_desc") },
    { icon: Zap, title: t("feat2_title"), description: t("feat2_desc") },
    { icon: Mail, title: t("feat3_title"), description: t("feat3_desc") },
    { icon: BarChart3, title: t("feat4_title"), description: t("feat4_desc") },
  ];

  const planDescs = [
    t("plan_starter_desc"), t("plan_creator_desc"), t("plan_pro_desc"), t("plan_agency_desc"),
  ];
  const planFeatureKeys = [
    [t("pf_s1"), t("pf_s2"), t("pf_s3"), t("pf_s4"), t("pf_s5")],
    [t("pf_c1"), t("pf_c2"), t("pf_c3"), t("pf_c4"), t("pf_c5"), t("pf_c6")],
    [t("pf_p1"), t("pf_p2"), t("pf_p3"), t("pf_p4"), t("pf_p5"), t("pf_p6")],
    [t("pf_a1"), t("pf_a2"), t("pf_a3"), t("pf_a4"), t("pf_a5"), t("pf_a6")],
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg text-white">ProspectAI</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">{t("nav_features")}</a>
            <a href="#pricing" className="hover:text-white transition-colors">{t("nav_pricing")}</a>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSelector />
            <Link href="/auth/signin">
              <Button variant="ghost" size="sm">{t("nav_signin")}</Button>
            </Link>
            <Link href="/auth/signup">
              <Button variant="gradient" size="sm">{t("nav_signup_free")}</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 grid-bg">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 left-1/4 w-[300px] h-[300px] bg-indigo-600/8 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            {t("hero_badge")}
          </div>

          <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight mb-6">
            {t("hero_title1")}{" "}
            <span className="gradient-text">{t("hero_title2")}</span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            {t("hero_sub")}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/signup">
              <Button variant="gradient" size="xl" className="group">
                {t("hero_btn_start")}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="xl">{t("hero_btn_demo")}</Button>
            </Link>
          </div>

          <p className="mt-4 text-sm text-gray-500">{t("hero_no_card")}</p>

          {/* Dashboard mockup */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent z-10 pointer-events-none" style={{ top: "60%" }} />
            <div className="rounded-2xl border border-gray-800 bg-gray-900/50 backdrop-blur-sm p-6 shadow-2xl shadow-black/50">
              <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                  { label: t("prev_prospects"), value: "—", color: "text-violet-400" },
                  { label: t("prev_emails_sent"), value: "—", color: "text-indigo-400" },
                  { label: t("prev_open_rate"), value: "—", color: "text-emerald-400" },
                  { label: t("prev_replies"), value: "—", color: "text-amber-400" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl bg-gray-800/50 p-4">
                    <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl bg-gray-800/50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-300 font-medium">{t("prev_scraped")}</span>
                  <span className="text-xs text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full">{t("prev_live")}</span>
                </div>
                <div className="space-y-2">
                  {["Plomberie Dupont — Paris 15e", "Restaurant Le Mistral — Marseille", "Garage Auto Martin — Lyon"].map((p, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-700/50 last:border-0">
                      <span className="text-sm text-gray-300">{p}</span>
                      <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">{t("prev_generated")}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Early adopter banner */}
      <section className="py-14 px-6 border-y border-gray-800/50">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-sm font-medium mb-4">
            <Rocket className="w-4 h-4 text-violet-400" />
            {t("early_tag")}
          </div>
          <p className="text-gray-300 text-lg leading-relaxed">
            {t("early_line1")}<br />
            <span className="text-gray-500 text-base">{t("early_line2")}</span>
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">{t("feat_title")}</h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">{t("feat_sub")}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-gray-800 bg-gray-900/30 p-8 hover:border-violet-500/50 hover:bg-gray-900/60 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-5 group-hover:bg-violet-500/20 transition-colors">
                  <f.icon className="w-5 h-5 text-violet-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{f.title}</h3>
                <p className="text-gray-400 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 bg-gray-900/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-4">
            <h2 className="text-4xl font-bold text-white mb-4">{t("price_title")}</h2>
            <p className="text-gray-400 text-lg">{t("price_sub")}</p>
          </div>

          <div className="flex items-center justify-center gap-2 mb-12 px-4 py-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 max-w-lg mx-auto">
            <span className="text-emerald-400 text-lg">🎁</span>
            <p className="text-sm text-emerald-300 font-medium">{t("price_trial_banner")}</p>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
            {PLANS.map((plan, idx) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-6 flex flex-col ${
                  plan.popular
                    ? "border-violet-500 bg-violet-500/5 shadow-xl shadow-violet-500/10 scale-[1.02]"
                    : "border-gray-800 bg-gray-900/30"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-violet-600 rounded-full text-xs font-bold text-white whitespace-nowrap">
                    ⭐ {t("plan_popular_badge")}
                  </div>
                )}
                <div className="mb-5">
                  <h3 className="text-base font-bold text-white mb-0.5">{plan.name}</h3>
                  <p className="text-gray-400 text-xs mb-3">{planDescs[idx]}</p>
                  <div className="space-y-0.5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-white">{plan.price}€</span>
                      <span className="text-gray-400 text-sm">{t("price_month")}</span>
                    </div>
                    <p className="text-xs text-emerald-400 font-medium">
                      {t("price_trial_then", { price: `${plan.price}€` })}
                    </p>
                  </div>
                </div>
                <ul className="space-y-2.5 flex-1 mb-6">
                  {planFeatureKeys[idx].map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={`/auth/signup?plan=${plan.slug}`}>
                  <Button variant={plan.popular ? "gradient" : "outline"} size="sm" className="w-full">
                    {t("price_trial_btn")}
                  </Button>
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-gray-500 mt-6">{t("price_payment_note")}</p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="rounded-3xl border border-violet-500/20 bg-violet-500/5 p-12">
            <h2 className="text-4xl font-bold text-white mb-4">{t("cta_title")}</h2>
            <p className="text-gray-400 text-lg mb-8">{t("cta_sub")}</p>
            <Link href="/auth/signup">
              <Button variant="gradient" size="xl" className="group">
                {t("cta_btn")}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
