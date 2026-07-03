"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Check, ChevronRight, Globe, Smartphone, Zap, ShoppingCart, Code2, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Pricing data ──────────────────────────────────────────────────────────────

const EUR = 655.957; // 1 EUR = 655.957 FCFA (taux fixe XOF/EUR)
function toEur(fcfa: number) { return Math.round(fcfa / EUR); }
function fmt(n: number) { return n.toLocaleString("fr-FR"); }

const SITES = [
  {
    id: "vitrine",
    label: "Site vitrine",
    price: 150_000,
    desc: "3-5 pages, domaine + hébergement 1 an, responsive, bouton WhatsApp intégré",
    icon: Globe,
    color: "from-violet-500 to-purple-600",
  },
  {
    id: "pro_seo",
    label: "Site Pro + SEO",
    price: 350_000,
    desc: "Jusqu'à 8 pages, SEO local, email pro, formulaire de devis",
    icon: Zap,
    color: "from-indigo-500 to-violet-600",
  },
  {
    id: "boutique",
    label: "Boutique en ligne",
    price: 600_000,
    desc: "E-commerce complet, paiement Mobile Money, gestion de catalogue",
    icon: ShoppingCart,
    color: "from-purple-500 to-pink-600",
  },
] as const;

const APPS = [
  {
    id: "webapp",
    label: "Web App / PWA",
    price: 800_000,
    priceLabel: "à partir de",
    desc: "Application accessible via navigateur, installable sur mobile. Réservation, gestion, commande en ligne.",
    icon: Code2,
    color: "from-cyan-500 to-blue-600",
  },
  {
    id: "native",
    label: "App mobile native",
    price: 1_500_000,
    priceLabel: "à partir de",
    desc: "Flutter, publiée sur Play Store & App Store. Devis personnalisé selon les fonctionnalités.",
    icon: Smartphone,
    color: "from-emerald-500 to-teal-600",
  },
] as const;

const OPTIONS = [
  { id: "reservation",   label: "Réservation en ligne",       price: 50_000 },
  { id: "mobile_money",  label: "Paiement Mobile Money",       price: 80_000 },
  { id: "espace_client", label: "Espace client / Connexion",   price: 100_000 },
  { id: "seo_avance",    label: "SEO avancé",                  price: 120_000 },
  { id: "chat_whatsapp", label: "Chat / WhatsApp intégré",     price: 30_000 },
] as const;

type SiteId   = typeof SITES[number]["id"];
type AppId    = typeof APPS[number]["id"];
type OptionId = typeof OPTIONS[number]["id"];
type Category = "site" | "app";

// ─── Sub-components ────────────────────────────────────────────────────────────

function ServiceCard({
  id, label, price, priceLabel, desc, icon: Icon, color, selected, onSelect,
}: {
  id: string; label: string; price: number; priceLabel?: string;
  desc: string; icon: React.ElementType; color: string;
  selected: boolean; onSelect: () => void;
}) {
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
            <span className="font-semibold text-white text-sm">{label}</span>
            {selected && (
              <span className="flex items-center gap-1 text-[11px] text-violet-400 bg-violet-500/20 rounded-full px-2 py-0.5">
                <Check className="w-3 h-3" />Sélectionné
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">{desc}</p>
          <p className="mt-2 font-bold text-white text-sm">
            {priceLabel && <span className="text-xs font-normal text-gray-400 mr-1">{priceLabel}</span>}
            {fmt(price)} FCFA
            <span className="text-xs font-normal text-gray-400 ml-2">(≈ {fmt(toEur(price))} €)</span>
          </p>
        </div>
      </div>
    </button>
  );
}

function OptionCheckbox({
  opt, checked, onChange,
}: {
  opt: typeof OPTIONS[number]; checked: boolean; onChange: () => void;
}) {
  return (
    <label className={`flex items-center gap-3 rounded-xl border p-3.5 cursor-pointer transition-all duration-150 ${
      checked
        ? "border-violet-500/50 bg-violet-500/8"
        : "border-gray-800 hover:border-gray-700"
    }`}>
      <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
        checked ? "bg-violet-600 border-violet-600" : "border-gray-600 bg-gray-800"
      }`}>
        {checked && <Check className="w-3 h-3 text-white" />}
      </div>
      <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
      <div className="flex-1 min-w-0">
        <span className="text-sm text-white font-medium">{opt.label}</span>
      </div>
      <span className="text-sm text-gray-400 shrink-0">+{fmt(opt.price)} FCFA</span>
    </label>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function CommanderPage() {
  const [category, setCategory] = useState<Category>("site");
  const [selectedType, setSelectedType] = useState<string>("vitrine");
  const [selectedOptions, setSelectedOptions] = useState<Set<OptionId>>(new Set());

  const [form, setForm] = useState({
    nom: "", entreprise: "", email: "", telephone: "", besoin: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  // Reset type when switching category
  function switchCategory(cat: Category) {
    setCategory(cat);
    setSelectedType(cat === "site" ? "vitrine" : "webapp");
    setSelectedOptions(new Set());
  }

  const basePrice = useMemo(() => {
    if (category === "site") {
      return SITES.find(s => s.id === selectedType)?.price ?? 0;
    }
    return APPS.find(a => a.id === selectedType)?.price ?? 0;
  }, [category, selectedType]);

  const optionsTotal = useMemo(() => {
    return OPTIONS.filter(o => selectedOptions.has(o.id)).reduce((s, o) => s + o.price, 0);
  }, [selectedOptions]);

  const totalPrice = basePrice + optionsTotal;

  function toggleOption(id: OptionId) {
    setSelectedOptions(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
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
          categorie: category,
          typePrecis: selectedType,
          options: Array.from(selectedOptions),
          prixEstime: totalPrice,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erreur. Veuillez réessayer."); return; }
      setSubmitted(true);
    } catch {
      setError("Impossible de contacter le serveur. Vérifiez votre connexion.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Success screen ──
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-violet-500/30">
            <Check className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Commande envoyée !</h1>
          <p className="text-gray-400 text-sm leading-relaxed mb-2">
            Merci <strong className="text-white">{form.nom}</strong>, votre demande a bien été reçue.
          </p>
          <p className="text-gray-400 text-sm leading-relaxed mb-8">
            Nous vous recontactons sous <strong className="text-white">24-48 h</strong> par email ou WhatsApp pour confirmer les détails et démarrer votre projet.
          </p>
          <div className="rounded-2xl border border-violet-500/20 bg-violet-500/8 p-5 text-left mb-6">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-3">Récapitulatif</p>
            <p className="text-sm text-white font-medium">
              {category === "site"
                ? SITES.find(s => s.id === selectedType)?.label
                : APPS.find(a => a.id === selectedType)?.label}
            </p>
            {selectedOptions.size > 0 && (
              <ul className="mt-2 space-y-1">
                {OPTIONS.filter(o => selectedOptions.has(o.id)).map(o => (
                  <li key={o.id} className="text-xs text-gray-400 flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-violet-400" />{o.label}
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 font-bold text-white">
              Estimation : {fmt(totalPrice)} FCFA
              <span className="text-xs font-normal text-gray-400 ml-2">(≈ {fmt(toEur(totalPrice))} €)</span>
            </p>
          </div>
          <Link href="/">
            <Button variant="outline" className="w-full">Retour à l&apos;accueil</Button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Main form ──
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
          <a
            href="https://wa.me/+4915566701184"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Besoin d'aide ?</span>
            <span className="sm:hidden">Aide</span>
          </a>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 pb-20">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-medium mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            Sites web & Applications mobiles
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 leading-tight">
            Commander votre{" "}
            <span className="gradient-text">présence digitale</span>
          </h1>
          <p className="text-gray-400 text-base max-w-xl mx-auto leading-relaxed">
            Artisans, commerçants, PME — obtenez un site ou une app sur-mesure.
            Réponse sous 24 h. Paiement par Mobile Money ou virement.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
          {/* Left column — configurator */}
          <div className="space-y-8">
            {/* Category tabs */}
            <div>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                1 — Que souhaitez-vous créer ?
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {([["site", "Site web", Globe], ["app", "Application", Smartphone]] as const).map(([id, label, Icon]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => switchCategory(id)}
                    className={`flex items-center justify-center gap-2.5 rounded-xl border py-4 font-semibold text-sm transition-all duration-200 ${
                      category === id
                        ? "border-violet-500/60 bg-violet-500/15 text-violet-300 shadow-lg shadow-violet-500/10"
                        : "border-gray-800 bg-gray-900/60 text-gray-400 hover:border-gray-700 hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Service type */}
            <div>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                2 — Choisissez votre formule
              </h2>
              <div className="space-y-3">
                {category === "site"
                  ? SITES.map(s => (
                      <ServiceCard
                        key={s.id} {...s}
                        selected={selectedType === s.id}
                        onSelect={() => setSelectedType(s.id)}
                      />
                    ))
                  : APPS.map(a => (
                      <ServiceCard
                        key={a.id} {...a}
                        selected={selectedType === a.id}
                        onSelect={() => setSelectedType(a.id)}
                      />
                    ))
                }
              </div>
            </div>

            {/* Options */}
            <div>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                3 — Options supplémentaires
              </h2>
              <div className="space-y-2.5">
                {OPTIONS.map(opt => (
                  <OptionCheckbox
                    key={opt.id}
                    opt={opt}
                    checked={selectedOptions.has(opt.id)}
                    onChange={() => toggleOption(opt.id)}
                  />
                ))}
              </div>
            </div>

            {/* Contact form */}
            <div>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                4 — Vos coordonnées
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Prénom / Nom <span className="text-red-400">*</span></label>
                    <input
                      name="nom"
                      value={form.nom}
                      onChange={handleField}
                      required
                      placeholder="Jean Koné"
                      className="w-full rounded-lg bg-gray-900 border border-gray-700 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Entreprise / Activité</label>
                    <input
                      name="entreprise"
                      value={form.entreprise}
                      onChange={handleField}
                      placeholder="Boulangerie Koffi"
                      className="w-full rounded-lg bg-gray-900 border border-gray-700 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors"
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Email <span className="text-red-400">*</span></label>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleField}
                      required
                      placeholder="jean@exemple.com"
                      className="w-full rounded-lg bg-gray-900 border border-gray-700 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">
                      Téléphone / WhatsApp <span className="text-red-400">*</span>
                    </label>
                    <input
                      name="telephone"
                      type="tel"
                      value={form.telephone}
                      onChange={handleField}
                      required
                      placeholder="+225 07 XX XX XX XX"
                      className="w-full rounded-lg bg-gray-900 border border-gray-700 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">
                    Décrivez votre projet <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    name="besoin"
                    value={form.besoin}
                    onChange={handleField}
                    required
                    rows={4}
                    placeholder="Ex : Je vends des pâtisseries à Abidjan. J'ai besoin d'un site pour présenter mes gâteaux et permettre aux clients de commander en ligne..."
                    className="w-full rounded-lg bg-gray-900 border border-gray-700 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none transition-colors"
                  />
                </div>

                {error && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  variant="gradient"
                  size="lg"
                  disabled={submitting}
                  className="w-full"
                >
                  {submitting ? "Envoi en cours…" : (
                    <>Envoyer ma demande <ChevronRight className="w-4 h-4" /></>
                  )}
                </Button>
                <p className="text-center text-xs text-gray-500">
                  Pas de paiement en ligne — encaissement par Mobile Money ou virement après accord.
                </p>
              </form>
            </div>
          </div>

          {/* Right column — price summary (sticky) */}
          <div className="lg:sticky lg:top-20">
            <div className="rounded-2xl border border-violet-500/20 bg-gray-900/80 backdrop-blur p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Estimation de prix</p>

              {/* Base */}
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-gray-300">
                    {category === "site"
                      ? SITES.find(s => s.id === selectedType)?.label
                      : APPS.find(a => a.id === selectedType)?.label}
                  </span>
                  <span className="text-white font-medium shrink-0">{fmt(basePrice)} FCFA</span>
                </div>
                {OPTIONS.filter(o => selectedOptions.has(o.id)).map(o => (
                  <div key={o.id} className="flex justify-between items-start gap-2 text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-violet-400 shrink-0" />{o.label}
                    </span>
                    <span className="shrink-0">+{fmt(o.price)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-800 pt-4">
                <div className="flex justify-between items-end">
                  <span className="text-sm text-gray-400">Total estimé</span>
                  <div className="text-right">
                    <p className="text-xl font-bold text-white">{fmt(totalPrice)} <span className="text-sm font-normal text-gray-400">FCFA</span></p>
                    <p className="text-xs text-gray-500">≈ {fmt(toEur(totalPrice))} €</p>
                  </div>
                </div>
              </div>

              {(selectedType === "native") && (
                <div className="mt-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2.5">
                  <p className="text-xs text-emerald-400 leading-relaxed">
                    Prix indicatif — l&apos;estimation finale sera établie sur devis après analyse de votre projet.
                  </p>
                </div>
              )}

              <div className="mt-5 space-y-2.5">
                <div className="flex items-start gap-2.5 text-xs text-gray-400">
                  <Check className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />
                  Réponse sous 24-48 h
                </div>
                <div className="flex items-start gap-2.5 text-xs text-gray-400">
                  <Check className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />
                  Paiement Mobile Money ou virement
                </div>
                <div className="flex items-start gap-2.5 text-xs text-gray-400">
                  <Check className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />
                  Marché Côte d&apos;Ivoire & Europe
                </div>
                <div className="flex items-start gap-2.5 text-xs text-gray-400">
                  <Check className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />
                  Support WhatsApp inclus
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
