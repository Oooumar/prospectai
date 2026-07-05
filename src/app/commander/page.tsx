"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Check, ChevronRight, Globe, Smartphone, Zap,
  ShoppingCart, Code2, Phone, Wrench, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { type Locale, LOCALES, LOCALE_FLAGS, LOCALE_LABELS, translations } from "@/lib/i18n";
import type { T } from "@/lib/i18n";

// ─── Zone system ───────────────────────────────────────────────────────────────

type Zone   = "africa-fr" | "africa-en" | "europe" | "amerique";
type Devise = "FCFA" | "USD" | "EUR";
type Tf     = (key: keyof T) => string;

interface ZoneConfig {
  label:  string;   // display label (language-agnostic identifier)
  emoji:  string;
  locale: Locale;
  devise: Devise;
}

const ZONES: Record<Zone, ZoneConfig> = {
  "africa-fr": { label: "Africa FR", emoji: "🌍", locale: "fr", devise: "FCFA" },
  "africa-en": { label: "Africa EN", emoji: "🌍", locale: "en", devise: "USD"  },
  "europe":    { label: "Europe",    emoji: "🇪🇺", locale: "fr", devise: "EUR"  },
  "amerique":  { label: "Amérique",  emoji: "🌎", locale: "en", devise: "USD"  },
};

const ZONE_ORDER: Zone[] = ["africa-fr", "africa-en", "europe", "amerique"];

const DEVISE_LABEL: Record<Zone, string> = {
  "africa-fr": "FCFA", "africa-en": "USD", "europe": "EUR", "amerique": "USD",
};

// ─── Data types ────────────────────────────────────────────────────────────────

type QuadPrice = Record<Zone, number>;

interface ServiceItem {
  id:           string;
  price:        QuadPrice;
  monthly?:     Partial<QuadPrice>;
  priceLabel?:  boolean;
  icon:         React.ElementType;
  color:        string;
  lk:           keyof T;
  dk:           keyof T;
}
interface OptionItem { id: string; price: QuadPrice; lk: keyof T }

// ─── Price data ────────────────────────────────────────────────────────────────

const SITES: ServiceItem[] = [
  {
    id: "vitrine",
    price:   { "africa-fr": 150_000, "africa-en": 250,   "europe": 690,   "amerique": 770   },
    monthly: { "europe": 69,         "amerique": 79 },
    icon: Globe, color: "from-violet-500 to-purple-600",
    lk: "cmd_vitrine_label", dk: "cmd_vitrine_desc",
  },
  {
    id: "pro_seo",
    price: { "africa-fr": 350_000, "africa-en": 580,   "europe": 1_400, "amerique": 1_550 },
    icon: Zap, color: "from-indigo-500 to-violet-600",
    lk: "cmd_pro_seo_label", dk: "cmd_pro_seo_desc",
  },
  {
    id: "boutique",
    price: { "africa-fr": 600_000, "africa-en": 990,   "europe": 2_500, "amerique": 2_800 },
    icon: ShoppingCart, color: "from-purple-500 to-pink-600",
    lk: "cmd_boutique_label", dk: "cmd_boutique_desc",
  },
];

const APPS: ServiceItem[] = [
  {
    id: "webapp",
    price: { "africa-fr": 800_000, "africa-en": 1_300, "europe": 3_500, "amerique": 3_900 },
    priceLabel: true,
    icon: Code2, color: "from-cyan-500 to-blue-600",
    lk: "cmd_webapp_label", dk: "cmd_webapp_desc",
  },
  {
    id: "native",
    price: { "africa-fr": 1_500_000, "africa-en": 2_500, "europe": 6_500, "amerique": 7_200 },
    priceLabel: true,
    icon: Smartphone, color: "from-emerald-500 to-teal-600",
    lk: "cmd_native_label", dk: "cmd_native_desc",
  },
];

const OPTIONS: OptionItem[] = [
  { id: "reservation",   lk: "cmd_opt_reservation",
    price: { "africa-fr": 50_000,  "africa-en": 85,  "europe": 99,  "amerique": 110 } },
  { id: "mobile_money",  lk: "cmd_opt_mobile_money",
    price: { "africa-fr": 80_000,  "africa-en": 130, "europe": 149, "amerique": 165 } },
  { id: "espace_client", lk: "cmd_opt_espace_client",
    price: { "africa-fr": 100_000, "africa-en": 165, "europe": 199, "amerique": 220 } },
  { id: "seo_avance",    lk: "cmd_opt_seo_avance",
    price: { "africa-fr": 120_000, "africa-en": 199, "europe": 249, "amerique": 275 } },
  { id: "chat_whatsapp", lk: "cmd_opt_chat_whatsapp",
    price: { "africa-fr": 30_000,  "africa-en": 50,  "europe": 49,  "amerique": 55  } },
];

const MAINT: Record<Zone, { min: number; max: number }> = {
  "africa-fr":  { min: 15_000, max: 25_000 },
  "africa-en":  { min: 25,     max: 40     },
  "europe":     { min: 49,     max: 99     },
  "amerique":   { min: 55,     max: 110    },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

const EUR_RATE = 655.957;

function fmtNum(n: number, devise: Devise): string {
  return devise === "USD" ? n.toLocaleString("en-US") : n.toLocaleString("fr-FR");
}

function fmtP(n: number, devise: Devise): string {
  const f = fmtNum(n, devise);
  if (devise === "FCFA") return `${f} FCFA`;
  if (devise === "USD")  return `$${f}`;
  return `${f} €`;
}

function fmtEq(n: number, devise: Devise): string {
  if (devise === "FCFA") return `≈ ${fmtNum(Math.round(n / EUR_RATE), "EUR")} €`;
  return "";
}

// ─── Payment constants — Mobile Money (africa-fr only) ────────────────────────
// Edit these values to update payment numbers without touching the UI.
const PAIEMENT_MOBILE = {
  nomCompte:   "Yameogo Sophie Léa",
  orangeMoney: "+22677456549",
  wave:        "+22677456549",
  moovMoney:   "+22670245211",
  whatsapp:    "https://wa.me/4915566701184",
} as const;

// ─── Zone selector ─────────────────────────────────────────────────────────────

function ZoneSelector({ zone, onChange }: { zone: Zone; onChange: (z: Zone) => void }) {
  return (
    <div className="flex justify-center mb-8">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full max-w-xl">
        {ZONE_ORDER.map(zId => {
          const z = ZONES[zId];
          const active = zone === zId;
          return (
            <button
              key={zId}
              type="button"
              onClick={() => onChange(zId)}
              className={`flex flex-col items-center gap-1.5 rounded-xl border py-3 px-2 transition-all duration-200 ${
                active
                  ? "border-violet-500/60 bg-violet-500/15 shadow-lg shadow-violet-500/10"
                  : "border-gray-800 bg-gray-900/60 hover:border-gray-700 hover:bg-gray-900"
              }`}
            >
              <span className="text-xl">{z.emoji}</span>
              <span className={`text-xs font-semibold leading-tight ${active ? "text-violet-200" : "text-gray-300"}`}>
                {z.label}
              </span>
              <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${
                active ? "bg-violet-500/30 text-violet-300" : "bg-gray-800 text-gray-500"
              }`}>
                {DEVISE_LABEL[zId]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Language selector ─────────────────────────────────────────────────────────

function LangSelector({ locale, onChange }: { locale: Locale; onChange: (l: Locale) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-gray-800"
      >
        <span>{LOCALE_FLAGS[locale]}</span>
        <span className="hidden sm:inline">{LOCALE_LABELS[locale]}</span>
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 rounded-xl border border-gray-800 bg-gray-950 shadow-xl overflow-hidden min-w-[120px]">
            {LOCALES.map(l => (
              <button
                key={l}
                type="button"
                onClick={() => { onChange(l); setOpen(false); }}
                className={`flex items-center gap-2.5 w-full px-3 py-2 text-xs transition-colors hover:bg-gray-800 ${
                  l === locale ? "text-violet-300 bg-violet-500/10" : "text-gray-300"
                }`}
              >
                <span>{LOCALE_FLAGS[l]}</span>
                <span>{LOCALE_LABELS[l]}</span>
                {l === locale && <Check className="w-3 h-3 ml-auto text-violet-400" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Trust steps ───────────────────────────────────────────────────────────────

function TrustSteps({ t }: { t: Tf }) {
  const steps: Array<{ n: string; tk: keyof T; sk: keyof T }> = [
    { n: "1", tk: "cmd_step1_title", sk: "cmd_step1_sub" },
    { n: "2", tk: "cmd_step2_title", sk: "cmd_step2_sub" },
    { n: "3", tk: "cmd_step3_title", sk: "cmd_step3_sub" },
    { n: "4", tk: "cmd_step4_title", sk: "cmd_step4_sub" },
  ];
  return (
    <div className="mb-10 rounded-2xl border border-gray-800 bg-gray-900/50 p-5 sm:p-6">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-center mb-5">
        {t("cmd_how_it_works")}
      </p>
      <div className="grid sm:grid-cols-4 gap-5">
        {steps.map(({ n, tk, sk }) => (
          <div key={n} className="flex sm:flex-col items-start sm:items-center gap-3 sm:gap-2 sm:text-center">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/20">
              <span className="text-sm font-bold text-white">{n}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-tight">{t(tk)}</p>
              <p className="text-xs text-gray-400 mt-0.5">{t(sk)}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 px-4 py-3 text-center">
        <p className="text-sm text-emerald-300 font-medium leading-relaxed">{t("cmd_trust_banner")}</p>
      </div>
    </div>
  );
}

// ─── Service card ──────────────────────────────────────────────────────────────

function ServiceCard({ item, zone, devise, selected, onSelect, t, locale }: {
  item: ServiceItem; zone: Zone; devise: Devise; selected: boolean;
  onSelect: () => void; t: Tf; locale: Locale;
}) {
  const { price, priceLabel, monthly, icon: Icon, color, lk, dk } = item;
  const amount   = price[zone];
  const equiv    = fmtEq(amount, devise);
  const monthlyV = monthly?.[zone];

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left rounded-2xl border p-5 transition-all duration-200 ${
        selected
          ? "border-violet-500/60 bg-violet-500/10 shadow-lg shadow-violet-500/10"
          : "border-gray-800 bg-gray-900/60 hover:border-gray-700 hover:bg-gray-900"
      }`}
    >
      <div className="flex items-start gap-4">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shrink-0`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-white text-sm">{t(lk)}</span>
            {selected && (
              <span className="flex items-center gap-1 text-[11px] text-violet-400 bg-violet-500/20 rounded-full px-2 py-0.5">
                <Check className="w-3 h-3" />{t("cmd_selected")}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">{t(dk)}</p>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            {priceLabel && <span className="text-xs text-gray-400">{t("cmd_from")}</span>}
            <span className="font-bold text-white text-sm">{fmtP(amount, devise)}</span>
            {equiv && <span className="text-xs text-gray-500">({equiv})</span>}
            {monthlyV != null && (
              <span className="text-xs text-gray-400">
                · {fmtP(monthlyV, devise)}/{locale === "fr" ? "mois" : "mo"}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Option checkbox ───────────────────────────────────────────────────────────

function OptionCheckbox({ opt, zone, devise, checked, onChange, t }: {
  opt: OptionItem; zone: Zone; devise: Devise; checked: boolean; onChange: () => void; t: Tf;
}) {
  const amount = opt.price[zone];
  return (
    <label className={`flex items-center gap-3 rounded-xl border p-3.5 cursor-pointer transition-all duration-150 ${
      checked ? "border-violet-500/50 bg-violet-500/8" : "border-gray-800 hover:border-gray-700"
    }`}>
      <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
        checked ? "bg-violet-600 border-violet-600" : "border-gray-600 bg-gray-800"
      }`}>
        {checked && <Check className="w-3 h-3 text-white" />}
      </div>
      <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
      <span className="flex-1 text-sm text-white font-medium">{t(opt.lk)}</span>
      <div className="text-right shrink-0">
        <span className="text-sm text-gray-400">+{fmtP(amount, devise)}</span>
        {devise === "FCFA" && (
          <span className="block text-[11px] text-gray-600">{fmtEq(amount, devise)}</span>
        )}
      </div>
    </label>
  );
}

// ─── Maintenance row ───────────────────────────────────────────────────────────

function MaintenanceRow({ zone, devise, checked, onChange, t, locale }: {
  zone: Zone; devise: Devise; checked: boolean; onChange: () => void; t: Tf; locale: Locale;
}) {
  const { min, max } = MAINT[zone];
  return (
    <label className={`flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-all duration-150 ${
      checked ? "border-violet-500/50 bg-violet-500/8" : "border-gray-800 hover:border-gray-700"
    }`}>
      <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
        checked ? "bg-violet-600 border-violet-600" : "border-gray-600 bg-gray-800"
      }`}>
        {checked && <Check className="w-3 h-3 text-white" />}
      </div>
      <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
      <div className="flex-1">
        <div className="flex items-center gap-1.5">
          <Wrench className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="text-sm text-white font-medium">{t("cmd_opt_maintenance")}</span>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{t("cmd_maint_desc")}</p>
      </div>
      <div className="text-right shrink-0">
        <span className="text-xs text-gray-400 whitespace-nowrap">
          {fmtP(min, devise)} – {fmtP(max, devise)}/{locale === "fr" ? "mois" : "mo"}
        </span>
        <span className="block text-[11px] text-gray-600">{t("cmd_maint_recurrent")}</span>
      </div>
    </label>
  );
}

// ─── ProspectAI Duo section ────────────────────────────────────────────────────

const WA_SVG = (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0" aria-hidden>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

function DuoSection({ t }: { t: Tf }) {
  return (
    <div className="mt-10 rounded-2xl border border-violet-500/25 bg-gray-900/50 overflow-hidden">
      <div className="h-px bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500" />
      <div className="p-6 sm:p-8">
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-semibold mb-5">
          <Zap className="w-3 h-3" />
          {t("cmd_duo_tag")}
        </div>

        <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 items-start">
          {/* Content */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight mb-2">
              {t("cmd_duo_title")}
            </h2>
            <p className="text-sm sm:text-base font-semibold text-violet-300 mb-3">
              {t("cmd_duo_tagline")}
            </p>
            <p className="text-sm text-gray-400 leading-relaxed mb-5">
              {t("cmd_duo_pitch")}
            </p>
            <div className="space-y-2.5">
              {(["cmd_duo_feat1", "cmd_duo_feat2", "cmd_duo_feat3"] as const).map(k => (
                <div key={k} className="flex items-center gap-2.5 text-sm text-gray-300">
                  <div className="w-5 h-5 rounded-full bg-violet-500/15 border border-violet-500/25 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-violet-400" />
                  </div>
                  {t(k)}
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="w-full sm:w-auto flex-shrink-0 flex flex-col items-stretch sm:items-center gap-2.5">
            <a
              href="https://wa.me/4915566701184"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-semibold text-sm px-5 py-3 rounded-xl transition-colors shadow-md shadow-green-500/20 whitespace-nowrap"
            >
              {WA_SVG}
              {t("cmd_duo_cta")}
            </a>
            <p className="text-[11px] text-gray-500 text-center leading-relaxed">
              {t("cmd_duo_note")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Payment block (confirmation screen) ──────────────────────────────────────

const MM_METHODS = [
  { label: "Orange Money", key: "orangeMoney" as const, colorCls: "text-orange-400", bgCls: "bg-orange-500/10 border-orange-500/20" },
  { label: "Wave",         key: "wave"        as const, colorCls: "text-blue-400",   bgCls: "bg-blue-500/10 border-blue-500/20"   },
  { label: "Moov Money",  key: "moovMoney"   as const, colorCls: "text-teal-400",   bgCls: "bg-teal-500/10 border-teal-500/20"   },
] as const;

function PaymentBlock({ zone, t }: { zone: Zone; t: Tf }) {
  if (zone === "africa-fr") {
    const { nomCompte, whatsapp } = PAIEMENT_MOBILE;
    return (
      <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-5 mb-6 text-left">
        {/* Journey reminder */}
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[11px] mb-4">
          <span className="text-emerald-400 font-semibold">Aperçu gratuit</span>
          <span className="text-gray-600">→</span>
          <span className="text-amber-400 font-semibold">30 % pour démarrer</span>
          <span className="text-gray-600">→</span>
          <span className="text-gray-400">70 % à la livraison</span>
        </div>

        <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-3">
          {t("cmd_pay_title")}
        </p>

        <div className="space-y-2 mb-4">
          {MM_METHODS.map(({ label, key, colorCls, bgCls }) => (
            <div key={label} className={`rounded-xl border ${bgCls} px-3.5 py-2.5 flex items-center justify-between gap-3`}>
              <span className={`text-xs font-bold ${colorCls} shrink-0`}>{label}</span>
              <div className="text-right min-w-0">
                <p className="text-sm text-white font-mono font-medium tracking-wide">{PAIEMENT_MOBILE[key]}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {t("cmd_pay_account")} <span className="text-gray-400">{nomCompte}</span>
                </p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-400 leading-relaxed mb-3">{t("cmd_pay_after")}</p>

        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#1ebe5d] text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors shadow-md shadow-green-500/20"
        >
          {WA_SVG}
          {t("cmd_pay_btn")}
        </a>
      </div>
    );
  }

  // Other zones: contact message + journey reminder
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/50 px-5 py-4 mb-6 text-center">
      <p className="text-sm text-gray-300 leading-relaxed">{t("cmd_pay_other")}</p>
      <p className="text-[11px] text-gray-500 mt-1.5">{t("cmd_pay_journey")}</p>
    </div>
  );
}

// ─── Category types ────────────────────────────────────────────────────────────

type Category = "site" | "app";

// ─── Main page (inner — needs Suspense for useSearchParams) ───────────────────

function CommanderPageInner() {
  const searchParams = useSearchParams();

  const [zone,   setZoneState]   = useState<Zone>("africa-fr");
  const [locale, setLocaleState] = useState<Locale>("fr");

  // Priority:
  //  1. ?lang=  → always wins, regardless of zone
  //  2. ?zone= (no lang) → zone's natural language
  //     Exception: europe with no lang → browser language or fr
  //  3. Neither → browser language or fr (zone: africa-fr)
  useEffect(() => {
    const rawZone = searchParams.get("zone");
    const rawLang = searchParams.get("lang");

    // Resolve zone (only affects devise + prices)
    const resolvedZone: Zone = rawZone && (ZONE_ORDER as string[]).includes(rawZone)
      ? rawZone as Zone
      : "africa-fr";
    setZoneState(resolvedZone);

    // ?lang= wins over everything — check raw string against locale list
    if (rawLang && (LOCALES as string[]).includes(rawLang)) {
      setLocaleState(rawLang as Locale);
      return;
    }

    // No ?lang= — derive from zone or browser
    const browserLang = typeof navigator !== "undefined"
      ? (navigator.language.slice(0, 2).toLowerCase() as Locale)
      : "fr";
    const browserLocale: Locale = (LOCALES as string[]).includes(browserLang) ? browserLang : "fr";

    if (!rawZone) {
      // No zone, no lang → browser
      setLocaleState(browserLocale);
    } else if (resolvedZone === "europe") {
      // Europe with no ?lang= → honour visitor's browser language
      setLocaleState(browserLocale);
    } else {
      // Other zones have a fixed natural language
      setLocaleState(ZONES[resolvedZone].locale);
    }
  }, [searchParams]);

  function setZone(z: Zone) {
    setZoneState(z);
    // Manual zone click → switch to that zone's natural language (good UX default).
    // The user can always override with the LangSelector afterwards.
    setLocaleState(ZONES[z].locale);
  }

  const devise = ZONES[zone].devise;

  function t(key: keyof T): string {
    return String(translations[locale][key] ?? translations["fr"][key] ?? key);
  }

  // ── Page state ──────────────────────────────────────────────────────────────
  const [category, setCategory] = useState<Category>("site");
  const [selectedType, setSelectedType] = useState("vitrine");
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set());
  const [maintenanceSelected, setMaintenanceSelected] = useState(false);

  const [form, setForm]         = useState({ nom: "", entreprise: "", email: "", telephone: "", besoin: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [error, setError]           = useState("");

  function switchCategory(cat: Category) {
    setCategory(cat);
    setSelectedType(cat === "site" ? "vitrine" : "webapp");
    setSelectedOptions(new Set());
  }

  const items = category === "site" ? SITES : APPS;

  const basePrice = useMemo(
    () => (category === "site" ? SITES : APPS).find(i => i.id === selectedType)?.price[zone] ?? 0,
    [category, selectedType, zone]
  );

  const optionsTotal = useMemo(
    () => OPTIONS.filter(o => selectedOptions.has(o.id)).reduce((s, o) => s + o.price[zone], 0),
    [selectedOptions, zone]
  );

  const totalPrice  = basePrice + optionsTotal;
  const selectedItem = items.find(i => i.id === selectedType);

  function toggleOption(id: string) {
    setSelectedOptions(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleField(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/commander", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          categorie:  category,
          typePrecis: selectedType,
          options:    [...Array.from(selectedOptions), ...(maintenanceSelected ? ["maintenance"] : [])],
          marche:     zone,
          devise,
          prixEstime: totalPrice,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || t("cmd_form_submitting")); return; }
      setSubmitted(true);
    } catch {
      setError("Impossible de contacter le serveur. Vérifiez votre connexion.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Success ─────────────────────────────────────────────────────────────────
  if (submitted) {
    const zConf = ZONES[zone];
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-violet-500/30">
            <Check className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">{t("cmd_success_title")}</h1>
          <p className="text-gray-400 text-sm leading-relaxed mb-2">
            {t("cmd_success_thanks").replace("{nom}", form.nom)}
          </p>
          <p className="text-gray-400 text-sm leading-relaxed mb-8">
            {t("cmd_success_next_contact")}
          </p>
          <div className="rounded-2xl border border-violet-500/20 bg-violet-500/8 p-5 text-left mb-6">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-3">
              {t("cmd_success_recap")}
            </p>
            <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-300 mb-2">
              {zConf.emoji} {zConf.label} · {devise}
            </span>
            <p className="text-sm text-white font-medium">{selectedItem ? t(selectedItem.lk) : ""}</p>
            {(selectedOptions.size > 0 || maintenanceSelected) && (
              <ul className="mt-2 space-y-1">
                {OPTIONS.filter(o => selectedOptions.has(o.id)).map(o => (
                  <li key={o.id} className="text-xs text-gray-400 flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-violet-400" />{t(o.lk)}
                  </li>
                ))}
                {maintenanceSelected && (
                  <li className="text-xs text-gray-400 flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-violet-400" />{t("cmd_opt_maintenance")}
                  </li>
                )}
              </ul>
            )}
            <p className="mt-3 font-bold text-white">
              {t("cmd_success_estimate").replace("{price}", fmtP(totalPrice, devise))}
              {devise === "FCFA" && (
                <span className="text-xs font-normal text-gray-400 ml-2">({fmtEq(totalPrice, devise)})</span>
              )}
            </p>
          </div>

          {/* Next-step reminder */}
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/8 p-5 mb-6 text-left">
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
              {t("cmd_success_step_title")}
            </p>
            <p className="text-sm text-white font-medium mb-1.5">{t("cmd_success_step_msg")}</p>
            <p className="text-xs text-gray-400 leading-relaxed">{t("cmd_success_step_detail")}</p>
          </div>

          {/* Payment block — Mobile Money for africa-fr, contact message otherwise */}
          <PaymentBlock zone={zone} t={t} />

          <Link href="/"><Button variant="outline" className="w-full">{t("cmd_back_home")}</Button></Link>
        </div>
      </div>
    );
  }

  // ── Main form ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-40 glass border-b border-gray-800/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <svg viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg" width="32" height="32">
              <defs>
                <linearGradient id="nav-g" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#7B61FF"/>
                  <stop offset="100%" stopColor="#C77DFF"/>
                </linearGradient>
              </defs>
              <rect width="52" height="52" rx="14" fill="url(#nav-g)"/>
              <path d="M15 43 L15 13 L30 13 Q44 13 44 23 Q44 33 30 33 L15 33"
                    fill="none" stroke="white" strokeWidth="4"
                    strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="42" cy="43" r="4" fill="white"/>
            </svg>
            <span className="font-bold text-sm text-white">ProspectAI</span>
          </Link>
          <div className="flex items-center gap-3">
            <LangSelector locale={locale} onChange={setLocaleState} />
            <a href="https://wa.me/+4915566701184" target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors">
              <Phone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t("cmd_help")}</span>
            </a>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 pb-20">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-medium mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            {t("cmd_badge")}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 leading-tight">
            {t("cmd_title").split(" ").slice(0, -2).join(" ")}{" "}
            <span className="gradient-text">{t("cmd_title").split(" ").slice(-2).join(" ")}</span>
          </h1>
          <p className="text-gray-400 text-base max-w-xl mx-auto leading-relaxed">
            {t("cmd_subtitle")}
          </p>
        </div>

        {/* Trust steps */}
        <TrustSteps t={t} />

        {/* Zone selector (replaces market toggle) */}
        <ZoneSelector zone={zone} onChange={setZone} />

        <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
          {/* Left column */}
          <div className="space-y-8">
            {/* Step 1 */}
            <div>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                {t("cmd_cat_title")}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {([["site", "cmd_cat_site", Globe], ["app", "cmd_cat_app", Smartphone]] as const).map(([id, lk, Icon]) => (
                  <button key={id} type="button" onClick={() => switchCategory(id)}
                    className={`flex items-center justify-center gap-2.5 rounded-xl border py-4 font-semibold text-sm transition-all duration-200 ${
                      category === id
                        ? "border-violet-500/60 bg-violet-500/15 text-violet-300 shadow-lg shadow-violet-500/10"
                        : "border-gray-800 bg-gray-900/60 text-gray-400 hover:border-gray-700 hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4" />{t(lk)}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2 */}
            <div>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                {t("cmd_formula_title")}
              </h2>
              <div className="space-y-3">
                {items.map(item => (
                  <ServiceCard
                    key={item.id} item={item} zone={zone} devise={devise}
                    selected={selectedType === item.id}
                    onSelect={() => setSelectedType(item.id)}
                    t={t} locale={locale}
                  />
                ))}
              </div>
            </div>

            {/* Step 3 */}
            <div>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                {t("cmd_options_title")}
              </h2>
              <div className="space-y-2.5">
                {OPTIONS.map(opt => (
                  <OptionCheckbox
                    key={opt.id} opt={opt} zone={zone} devise={devise}
                    checked={selectedOptions.has(opt.id)}
                    onChange={() => toggleOption(opt.id)}
                    t={t}
                  />
                ))}
                <div className="pt-2.5 border-t border-gray-800/60">
                  <MaintenanceRow
                    zone={zone} devise={devise}
                    checked={maintenanceSelected}
                    onChange={() => setMaintenanceSelected(v => !v)}
                    t={t} locale={locale}
                  />
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                {t("cmd_form_title")}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">
                      {t("cmd_form_nom")} <span className="text-red-400">*</span>
                    </label>
                    <input name="nom" value={form.nom} onChange={handleField} required
                      placeholder={t("cmd_form_nom_ph")}
                      className="w-full rounded-lg bg-gray-900 border border-gray-700 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">{t("cmd_form_entreprise")}</label>
                    <input name="entreprise" value={form.entreprise} onChange={handleField}
                      placeholder={t("cmd_form_entreprise_ph")}
                      className="w-full rounded-lg bg-gray-900 border border-gray-700 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors" />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">
                      {t("cmd_form_email")} <span className="text-red-400">*</span>
                    </label>
                    <input name="email" type="email" value={form.email} onChange={handleField} required
                      placeholder={t("cmd_form_email_ph")}
                      className="w-full rounded-lg bg-gray-900 border border-gray-700 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">
                      {t("cmd_form_tel")} <span className="text-red-400">*</span>
                    </label>
                    <input name="telephone" type="tel" value={form.telephone} onChange={handleField} required
                      placeholder={t("cmd_form_tel_ph")}
                      className="w-full rounded-lg bg-gray-900 border border-gray-700 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">
                    {t("cmd_form_besoin")} <span className="text-red-400">*</span>
                  </label>
                  <textarea name="besoin" value={form.besoin} onChange={handleField} required rows={4}
                    placeholder={t("cmd_form_besoin_ph")}
                    className="w-full rounded-lg bg-gray-900 border border-gray-700 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none transition-colors" />
                </div>

                {error && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
                )}

                <Button type="submit" variant="gradient" size="lg" disabled={submitting} className="w-full">
                  {submitting ? t("cmd_form_submitting") : (<>{t("cmd_form_submit")} <ChevronRight className="w-4 h-4" /></>)}
                </Button>
                <p className="text-center text-xs text-gray-500">{t("cmd_form_no_payment")}</p>
              </form>
            </div>
          </div>

          {/* Right: sticky price summary */}
          <div className="lg:sticky lg:top-20">
            <div className="rounded-2xl border border-violet-500/20 bg-gray-900/80 backdrop-blur p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t("cmd_estimate")}</p>
                <span className="flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-gray-800 border border-gray-700 text-gray-300">
                  {ZONES[zone].emoji} {ZONES[zone].label}
                </span>
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-gray-300">{selectedItem ? t(selectedItem.lk) : ""}</span>
                  <span className="text-white font-medium shrink-0">{fmtP(basePrice, devise)}</span>
                </div>
                {OPTIONS.filter(o => selectedOptions.has(o.id)).map(o => (
                  <div key={o.id} className="flex justify-between items-start gap-2 text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-violet-400 shrink-0" />{t(o.lk)}
                    </span>
                    <span className="shrink-0">+{fmtP(o.price[zone], devise)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-800 pt-4">
                <div className="flex justify-between items-end gap-2">
                  <span className="text-sm text-gray-400">
                    {maintenanceSelected ? t("cmd_excl_maint") : t("cmd_total")}
                  </span>
                  <div className="text-right">
                    <p className="text-xl font-bold text-white">{fmtP(totalPrice, devise)}</p>
                    {devise === "FCFA" && (
                      <p className="text-xs text-gray-500">{fmtEq(totalPrice, devise)}</p>
                    )}
                  </div>
                </div>
              </div>

              {maintenanceSelected && (
                <div className="mt-3 pt-3 border-t border-gray-800 flex justify-between items-start gap-2">
                  <span className="flex items-center gap-1.5 text-sm text-gray-400">
                    <Wrench className="w-3 h-3 text-violet-400 shrink-0" />{t("cmd_opt_maintenance")}
                  </span>
                  <span className="text-xs text-gray-400 text-right whitespace-nowrap">
                    {fmtP(MAINT[zone].min, devise)} – {fmtP(MAINT[zone].max, devise)}/{locale === "fr" ? "mois" : "mo"}
                  </span>
                </div>
              )}

              {selectedType === "native" && (
                <div className="mt-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2.5">
                  <p className="text-xs text-emerald-400 leading-relaxed">{t("cmd_custom_quote")}</p>
                </div>
              )}

              <div className="mt-5 space-y-2.5">
                {(["cmd_reassurance_1", "cmd_reassurance_2", "cmd_reassurance_3", "cmd_reassurance_4"] as const).map(k => (
                  <div key={k} className="flex items-start gap-2.5 text-xs text-gray-400">
                    <Check className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />{t(k)}
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 px-3.5 py-3 text-center">
                <p className="text-xs font-semibold text-emerald-300 leading-relaxed">{t("cmd_trust_30")}</p>
                <p className="text-[11px] text-gray-500 mt-1">{t("cmd_trust_free")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ProspectAI complementary offer */}
        <DuoSection t={t} />

      </main>
    </div>
  );
}

// ─── Default export (Suspense required for useSearchParams) ───────────────────

export default function CommanderPage() {
  return (
    <Suspense>
      <CommanderPageInner />
    </Suspense>
  );
}
