"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Zap, Target, Mail, BarChart3, ArrowRight, Check, Rocket
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/footer";
import { LanguageSelector } from "@/components/language-selector";
import { useI18n } from "@/components/language-provider";

// ── Zone / pricing ────────────────────────────────────────────────────────────
type PriceZone = "africa-fr" | "africa-en" | "europe" | "amerique";
const ZONE_COOKIE = "prospectai_zone";
const VALID_ZONES: PriceZone[] = ["africa-fr", "africa-en", "europe", "amerique"];

// Prices per zone, indexed by plan (0=Découverte, 1=Starter, 2=Pro, 3=Business)
const ZONE_PRICES: Record<PriceZone, string[]> = {
  "africa-fr": ["10 000", "20 000", "35 000", "60 000"],
  "africa-en": ["8",      "16",     "28",     "48"],
  "europe":    ["9",      "19",     "35",     "59"],
  "amerique":  ["10",     "20",     "40",     "65"],
};

const ZONE_OPTIONS: { id: PriceZone; emoji: string; label: string }[] = [
  { id: "africa-fr", emoji: "🌍", label: "Afrique FR" },
  { id: "africa-en", emoji: "🌍", label: "Afrique EN" },
  { id: "europe",    emoji: "🇪🇺", label: "Europe"     },
  { id: "amerique",  emoji: "🌎", label: "Amérique"   },
];

function fmtPrice(amount: string, zone: PriceZone): string {
  if (zone === "africa-fr") return `${amount} FCFA`;
  if (zone === "europe")    return `${amount} €`;
  return `$${amount}`;
}

function readZoneCookie(): PriceZone {
  if (typeof document === "undefined") return "africa-fr";
  const m = document.cookie.match(/prospectai_zone=([^;]+)/);
  const v = m?.[1];
  return (v && VALID_ZONES.includes(v as PriceZone)) ? (v as PriceZone) : "africa-fr";
}

// ── Plans (names / slugs / descriptions only — prices are zone-dynamic) ───────
const PLANS = [
  { name: "Découverte", slug: "decouverte", popular: false, desc: "Pour tester ProspectAI" },
  { name: "Starter",    slug: "starter",    popular: false, desc: "Pour indépendants et PME" },
  { name: "Pro",        slug: "pro",        popular: true,  desc: "Pour les équipes commerciales" },
  { name: "Business",   slug: "business",   popular: false, desc: "Pour les agences" },
];

export default function LandingPage() {
  const { t } = useI18n();
  const [zone, setZone] = useState<PriceZone>("africa-fr");

  // Read zone from cookie after hydration (cookie set by proxy on first request)
  useEffect(() => { setZone(readZoneCookie()); }, []);

  function handleZoneChange(z: PriceZone) {
    setZone(z);
    document.cookie = `${ZONE_COOKIE}=${z};path=/;max-age=${60 * 60 * 24 * 7};samesite=lax`;
  }

  const features = [
    { icon: Target, title: t("feat1_title"), description: t("feat1_desc") },
    { icon: Zap, title: t("feat2_title"), description: t("feat2_desc") },
    { icon: Mail, title: t("feat3_title"), description: t("feat3_desc") },
    { icon: BarChart3, title: t("feat4_title"), description: t("feat4_desc") },
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
            <Image src="/logo-prospectai.png" alt="ProspectAI" width={36} height={36} className="rounded-xl" />
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
            <Link
              href="/demo"
              className="border border-white/20 text-white hover:bg-white/10 px-6 py-3 rounded-xl font-medium transition text-sm"
            >
              Tester la démo gratuitement →
            </Link>
          </div>

          <p className="mt-4 text-sm text-gray-500">{t("hero_no_card")}</p>

          {/* Dashboard mockup */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent z-10 pointer-events-none" style={{ top: "55%" }} />
            <div className="rounded-2xl border border-gray-800 bg-[#0a0d28] shadow-2xl shadow-violet-900/20 overflow-hidden text-left">

              {/* Browser chrome */}
              <div className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-800/80 bg-[#070A1C]">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
                </div>
                <div className="flex-1 flex justify-center">
                  <span className="text-[10px] text-gray-600 bg-gray-800/50 px-3 py-0.5 rounded-md">prospectai.company/dashboard/prospects</span>
                </div>
              </div>

              <div className="flex">
                {/* Mini sidebar */}
                <div className="hidden md:flex w-40 shrink-0 flex-col border-r border-gray-800/60 bg-[#070A1C] p-3 gap-0.5">
                  <div className="flex items-center gap-2 px-2 py-2 mb-2">
                    <Image src="/logo-prospectai.png" alt="" width={20} height={20} className="rounded-md" />
                    <span className="text-xs font-bold text-white">ProspectAI</span>
                    <span className="ml-auto text-[8px] bg-violet-600 text-white px-1.5 py-0.5 rounded-full">PRO</span>
                  </div>
                  {["Dashboard", "Prospects", "Campagnes", "Emails", "WhatsApp"].map((item, i) => (
                    <div key={item} className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] ${i === 1 ? "bg-violet-600/20 text-violet-300 font-medium" : "text-gray-500"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${i === 1 ? "bg-violet-400" : "bg-gray-700"}`} />
                      {item}
                    </div>
                  ))}
                </div>

                {/* Main panel */}
                <div className="flex-1 p-4 min-w-0">
                  {/* Stats row */}
                  <div className="grid grid-cols-4 gap-2.5 mb-4">
                    {[
                      { label: "Prospects", value: "328", sub: "+24 sem.", color: "text-violet-400" },
                      { label: "Emails envoyés", value: "47", sub: "+12 sem.", color: "text-indigo-400" },
                      { label: "Taux d'ouverture", value: "34%", sub: "Moy: 20%", color: "text-emerald-400" },
                      { label: "Réponses", value: "8%", sub: "4 reçues", color: "text-amber-400" },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-lg bg-[#0D1035] border border-gray-800/60 p-3">
                        <p className="text-[9px] text-gray-500 mb-1">{stat.label}</p>
                        <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                        <p className="text-[9px] text-gray-600 mt-0.5">{stat.sub}</p>
                      </div>
                    ))}
                  </div>

                  {/* Prospect table */}
                  <div className="rounded-lg border border-gray-800/60 bg-[#0D1035] overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800/60">
                      <span className="text-[11px] font-semibold text-white">Prospects récents</span>
                      <span className="text-[9px] text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-violet-400 inline-block animate-pulse" />
                        En direct
                      </span>
                    </div>
                    {[
                      { initials: "AW", name: "Agence Web Dakar",    city: "Dakar",         niche: "Agence digitale",   status: "Répondu", sc: "text-emerald-400 bg-emerald-500/10" },
                      { initials: "SN", name: "Salon Beauté Nadia",  city: "Abidjan",        niche: "Beauté & bien-être",status: "Ouvert",   sc: "text-violet-400 bg-violet-500/10" },
                      { initials: "MR", name: "Maquis Royal",        city: "Ouagadougou",    niche: "Restaurant",        status: "Envoyé",   sc: "text-indigo-400 bg-indigo-500/10" },
                      { initials: "PE", name: "Plombier Express",    city: "Yaoundé",        niche: "Plomberie",         status: "Généré ✦", sc: "text-amber-400 bg-amber-500/10" },
                    ].map((p) => (
                      <div key={p.name} className="flex items-center gap-3 px-3 py-2.5 border-b border-gray-800/40 last:border-0">
                        <div className="w-7 h-7 rounded-full bg-violet-600/20 border border-violet-500/20 flex items-center justify-center text-[9px] font-bold text-violet-300 shrink-0">
                          {p.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-medium text-white truncate">{p.name} <span className="text-gray-500">— {p.city}</span></p>
                          <p className="text-[9px] text-gray-500">{p.niche}</p>
                        </div>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium shrink-0 ${p.sc}`}>{p.status}</span>
                      </div>
                    ))}
                  </div>
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

          <div className="flex items-center justify-center gap-2 mb-8 px-4 py-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 max-w-lg mx-auto">
            <span className="text-emerald-400 text-lg">🎁</span>
            <p className="text-sm text-emerald-300 font-medium">{t("price_trial_banner")}</p>
          </div>

          {/* Zone switcher */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
            {ZONE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleZoneChange(opt.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                  zone === opt.id
                    ? "bg-violet-600 border-violet-500 text-white"
                    : "bg-gray-900 border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-600"
                }`}
              >
                <span>{opt.emoji}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
            {PLANS.map((plan, idx) => {
              const price     = ZONE_PRICES[zone][idx];
              const formatted = fmtPrice(price, zone);
              const isUsd     = zone === "africa-en" || zone === "amerique";
              return (
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
                    <p className="text-gray-400 text-xs mb-3">{plan.desc}</p>
                    <div className="space-y-0.5">
                      <div className="flex items-baseline gap-1 flex-wrap">
                        {isUsd && <span className="text-2xl font-bold text-white">$</span>}
                        <span className="text-3xl font-bold text-white">{price}</span>
                        <span className="text-gray-400 text-sm">
                          {zone === "africa-fr" && " FCFA"}
                          {zone === "europe"    && " €"}
                          {t("price_month")}
                        </span>
                      </div>
                      <p className="text-xs text-emerald-400 font-medium">
                        {t("price_trial_then", { price: formatted })}
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
                  <Link href={`/auth/signup?plan=${plan.slug}&zone=${zone}`}>
                    <Button variant={plan.popular ? "gradient" : "outline"} size="sm" className="w-full">
                      {t("price_trial_btn")}
                    </Button>
                  </Link>
                </div>
              );
            })}
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
