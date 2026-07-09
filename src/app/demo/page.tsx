"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search, Zap, ArrowRight, Copy, Check,
  Star, Globe, Mail, Phone, Loader2, CheckCircle2,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

type Prospect = {
  id: string;
  name: string;
  niche: string;
  city: string;
  hasWebsite: boolean;
  hasEmail: boolean;
  rating: number;
  reviews: number;
  address: string;
};

type GeneratedEmail = { subject: string; body: string; remaining: number };

// ── Mock prospect templates ────────────────────────────────────────────────

const NICHE_NAMES: Record<string, [string, string, string]> = {
  restaurant:      ["Maquis La Bonne Table",      "Restaurant Chez Adjoua",       "Le Carrefour des Saveurs"],
  maquis:          ["Maquis Chez Germaine",         "Maquis de la Paix",            "Maquis Bonne Chance"],
  coiffure:        ["Salon Beauté Prestige",        "Coiffure Élégance Plus",       "Salon Moderne"],
  "salon beauté":  ["Beauty Queen Salon",           "Salon Éclat d'Afrique",        "Espace Beauté Plus"],
  pharmacie:       ["Pharmacie du Marché",          "Pharmacie Centrale",           "Pharmacie Providence"],
  clinique:        ["Clinique du Progrès",          "Centre Médical Providence",    "Clinique Sainte-Marie"],
  médecin:         ["Cabinet Dr. Konaté",           "Centre de Santé du Centre",    "Clinique Espérance"],
  "lavage auto":   ["Pacific Wash",                 "Auto Prestige",                "Star Lavage"],
  garage:          ["Garage Central Services",      "Auto Service Pro",             "Atelier Mécanique Plus"],
  boulangerie:     ["Boulangerie du Soleil",        "Le Pain Doré",                 "Boulangerie Centrale"],
  pâtisserie:      ["Pâtisserie Délices",           "La Gourmandise",               "Sweet Corner"],
  hotel:           ["Hôtel Le Souvenir",            "Résidence Confort",            "Hôtel Plaza"],
  boutique:        ["Boutique Tendance",            "Mode & Style",                 "Chez Marie Boutique"],
  supermarché:     ["Super Marché du Centre",       "Mini Market Express",          "Épicerie Moderne"],
  plombier:        ["Plomberie Express",            "Service Plomberie Pro",        "Dépannage Rapide"],
  électricien:     ["Électricité Pro",              "Service Électrique Plus",      "Tech Électro"],
  informatique:    ["Tech Solution",                "InfoService Plus",             "Digital Pro"],
  "agence marketing": ["Agence Créative Plus",      "Marketing Pro Agency",         "Com & Digital"],
  immobilier:      ["Immo Prestige",                "Agence Horizon",               "Invest Immo Plus"],
  école:           ["École Avenir Brillant",        "Institut Savoir Plus",         "École Moderne"],
  transport:       ["Transport Express",            "Voyages Confort Plus",         "Trans-Africa Services"],
  menuiserie:      ["Menuiserie du Progrès",        "Atelier Bois & Design",        "Menuiserie Moderne"],
  imprimerie:      ["Imprimerie Rapide",            "Print Express",                "Copie & Com"],
};

function getMockProspects(niche: string, city: string): Prospect[] {
  const key = niche.trim().toLowerCase();
  const names: [string, string, string] = NICHE_NAMES[key] ?? [
    `${niche.trim().charAt(0).toUpperCase() + niche.trim().slice(1)} Excellence`,
    `${niche.trim().charAt(0).toUpperCase() + niche.trim().slice(1)} du Centre`,
    `${niche.trim().charAt(0).toUpperCase() + niche.trim().slice(1)} Pro Services`,
  ];
  return [
    { id: "1", name: names[0], niche, city, hasWebsite: false, hasEmail: false, rating: 4.1, reviews: 18,  address: `Quartier Zongo, ${city}` },
    { id: "2", name: names[1], niche, city, hasWebsite: true,  hasEmail: true,  rating: 4.7, reviews: 94,  address: `Centre-ville, ${city}` },
    { id: "3", name: names[2], niche, city, hasWebsite: false, hasEmail: false, rating: 3.9, reviews: 11,  address: `Secteur 12, ${city}` },
  ];
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function DemoPage() {
  const [niche,       setNiche]       = useState("");
  const [city,        setCity]        = useState("");
  const [searching,   setSearching]   = useState(false);
  const [prospects,   setProspects]   = useState<Prospect[]>([]);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [selected,    setSelected]    = useState<Prospect | null>(null);
  const [email,       setEmail]       = useState<GeneratedEmail | null>(null);
  const [genCount,    setGenCount]    = useState(0);
  const [limitReached, setLimitReached] = useState(false);
  const [copied,      setCopied]      = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  // Derived current step
  const step = email ? 3 : prospects.length > 0 ? 2 : 1;

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!niche.trim() || !city.trim()) return;
    setSearching(true);
    setError(null);
    setEmail(null);
    setSelected(null);
    setProspects([]);
    await new Promise(r => setTimeout(r, 1400)); // simulated latency
    setProspects(getMockProspects(niche.trim(), city.trim()));
    setSearching(false);
  }

  async function onGenerate(prospect: Prospect) {
    if (generatingId || limitReached) return;
    setGeneratingId(prospect.id);
    setSelected(prospect);
    setEmail(null);
    setError(null);

    try {
      const res = await fetch("/api/demo/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:       prospect.name,
          niche:      prospect.niche,
          city:       prospect.city,
          hasWebsite: prospect.hasWebsite,
        }),
      });

      if (res.status === 429) { setLimitReached(true); return; }
      if (!res.ok) throw new Error("generation_failed");

      const data: GeneratedEmail = await res.json();
      setEmail(data);
      setGenCount(c => c + 1);
      if (data.remaining <= 0) setLimitReached(true);
    } catch {
      setError("Erreur lors de la génération. Réessayez.");
    } finally {
      setGeneratingId(null);
    }
  }

  async function onCopy() {
    if (!email) return;
    await navigator.clipboard.writeText(`Sujet : ${email.subject}\n\n${email.body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function onReset() {
    setEmail(null);
    setSelected(null);
    setError(null);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-20 border-b border-gray-800/50 bg-gray-950/90 backdrop-blur-sm px-4 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo-prospectai.png" alt="ProspectAI" width={32} height={32} className="rounded-xl" />
            <span className="font-bold text-white">ProspectAI</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden sm:inline text-xs bg-violet-600/20 border border-violet-500/30 text-violet-300 px-2.5 py-1 rounded-full">
              🎯 Démo gratuite
            </span>
            <Link href="/auth/signin" className="text-sm text-gray-400 hover:text-white transition-colors">
              Connexion
            </Link>
            <Link
              href="/auth/signup"
              className="text-sm bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Essai gratuit
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">

        {/* ── Hero ── */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-violet-600/20 border border-violet-500/30 text-violet-300 text-xs px-3 py-1.5 rounded-full mb-5">
            <Zap className="w-3.5 h-3.5" />
            Sans compte · Sans carte bancaire · 3 générations gratuites
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            Voyez ProspectAI{" "}
            <span className="text-violet-400">en action</span>
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto">
            Entrez un secteur et une ville — l'IA génère un vrai email de
            prospection personnalisé en quelques secondes.
          </p>
        </div>

        {/* ── Step indicator ── */}
        <div className="flex items-center justify-center mb-10">
          <StepCircle n={1} current={step} label="Prospects" />
          <StepLine active={step >= 2} />
          <StepCircle n={2} current={step} label="Email IA" />
          <StepLine active={step >= 3} />
          <StepCircle n={3} current={step} label="Démarrer" />
        </div>

        {/* ── Step 1: Search ── */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="flex items-center gap-2 font-semibold text-white mb-5">
            <StepBadge n={1} active={true} />
            Chercher des prospects
          </h2>

          <form onSubmit={onSearch} className="flex flex-col sm:flex-row gap-3">
            <input
              value={niche}
              onChange={e => setNiche(e.target.value)}
              placeholder="Secteur (ex : restaurant, coiffure…)"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
            />
            <input
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="Ville (ex : Ouagadougou, Abidjan…)"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
            />
            <button
              type="submit"
              disabled={searching || !niche.trim() || !city.trim()}
              className="flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-medium whitespace-nowrap transition-all"
            >
              {searching
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Search className="w-4 h-4" />}
              {searching ? "Recherche…" : "Rechercher"}
            </button>
          </form>
        </div>

        {/* ── Loading state ── */}
        {searching && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 text-violet-400 animate-spin mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              Recherche de <span className="text-white font-medium">{niche}</span> à{" "}
              <span className="text-white font-medium">{city}</span>…
            </p>
          </div>
        )}

        {/* ── Prospect cards ── */}
        {!searching && prospects.length > 0 && (
          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                <p className="text-sm text-gray-300">
                  <span className="text-white font-medium">3 prospects trouvés</span>
                  {" "}— {niche} · {city}
                </p>
              </div>
              <span className="ml-auto text-xs text-gray-600 italic hidden sm:inline">
                Données simulées — scraping réel sur votre compte
              </span>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              {prospects.map(p => (
                <ProspectCard
                  key={p.id}
                  prospect={p}
                  isSelected={selected?.id === p.id}
                  isGenerating={generatingId === p.id}
                  disabled={!!generatingId || limitReached}
                  onGenerate={() => onGenerate(p)}
                />
              ))}
            </div>

            {genCount > 0 && !limitReached && (
              <p className="text-center text-xs text-gray-600 mt-3">
                {3 - genCount} génération{3 - genCount !== 1 ? "s" : ""} restante{3 - genCount !== 1 ? "s" : ""} en mode démo
              </p>
            )}
          </div>
        )}

        {/* ── Limit reached ── */}
        {limitReached && (
          <div className="bg-amber-600/10 border border-amber-500/30 rounded-xl p-4 mb-6 text-center">
            <p className="text-amber-300 font-medium text-sm">
              Limite atteinte — 3/3 générations utilisées
            </p>
            <p className="text-amber-300/60 text-xs mt-1">
              Créez un compte pour des générations illimitées et envoyer de vraies campagnes.
            </p>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <p className="text-center text-sm text-red-400 mb-4">{error}</p>
        )}

        {/* ── Generated email ── */}
        {email && selected && (
          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <h2 className="flex items-center gap-2 font-semibold text-white">
                <StepBadge n={2} active={true} />
                Email généré par l'IA
              </h2>
              <span className="ml-auto flex items-center gap-1.5 text-xs bg-green-600/20 border border-green-500/30 text-green-400 px-2.5 py-1 rounded-full">
                <Check className="w-3 h-3" />
                Personnalisé pour {selected.name}
              </span>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              {/* Email header */}
              <div className="px-6 py-4 border-b border-gray-800 space-y-1.5">
                <div className="text-xs text-gray-600">
                  De :{" "}
                  <span className="text-gray-400">contact@prospectai.company</span>
                </div>
                <div className="text-xs text-gray-600">
                  À :{" "}
                  <span className="text-gray-400">{selected.name}</span>
                </div>
                <div className="pt-1 font-semibold text-white">
                  📧 {email.subject}
                </div>
              </div>

              {/* Email body */}
              <div className="px-6 py-5">
                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {email.body}
                </p>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-between">
                <button
                  onClick={onCopy}
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {copied
                    ? <><Check className="w-4 h-4 text-green-400" /> Copié !</>
                    : <><Copy className="w-4 h-4" /> Copier l'email</>}
                </button>
                {!limitReached && (
                  <button
                    onClick={onReset}
                    className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    ↺ Générer un autre
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── CTA (step 3) ── */}
        {step === 3 && (
          <div className="relative overflow-hidden rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-900/40 via-indigo-900/30 to-purple-900/40 p-8 sm:p-10 text-center">
            {/* Decorative glow */}
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-40 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-violet-500/30">
                <Zap className="w-7 h-7 text-white" />
              </div>

              <div className="inline-flex items-center gap-2 bg-violet-600/20 border border-violet-500/30 text-violet-300 text-xs px-3 py-1 rounded-full mb-4">
                <StepBadge n={3} active={true} />
                Étape 3
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                Impressionné ?
              </h2>
              <p className="text-gray-300 mb-2 max-w-lg mx-auto">
                Commencez votre essai gratuit de{" "}
                <span className="text-white font-semibold">14 jours</span> — aucune carte bancaire requise.
              </p>
              <p className="text-gray-500 text-sm mb-8">
                Jusqu'à 500 emails IA/jour · Campagnes WhatsApp · Scraping Google Maps
              </p>

              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40"
              >
                Démarrer gratuitement
                <ArrowRight className="w-5 h-5" />
              </Link>

              <p className="text-xs text-gray-600 mt-4">
                Annulation possible à tout moment · Aucun engagement
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Page footer ── */}
      <div className="border-t border-gray-800/50 px-6 py-6 mt-4 text-center">
        <p className="text-xs text-gray-600">
          Démo gratuite · Données de scraping simulées · Génération IA réelle via Groq Llama 3 ·{" "}
          <Link href="/" className="hover:text-gray-400 transition-colors">
            Retour à l'accueil
          </Link>
        </p>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StepBadge({ n, active }: { n: number; active: boolean }) {
  return (
    <span
      className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-bold flex-shrink-0 ${active ? "bg-violet-600 text-white" : "bg-gray-700 text-gray-400"}`}
    >
      {n}
    </span>
  );
}

function StepCircle({ n, current, label }: { n: number; current: number; label: string }) {
  const done   = current > n;
  const active = current === n;
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${done ? "bg-green-500 text-white" : active ? "bg-violet-600 text-white" : "bg-gray-800 text-gray-500"}`}
      >
        {done ? <Check className="w-4 h-4" /> : n}
      </div>
      <span className={`text-xs font-medium ${done || active ? "text-white" : "text-gray-600"}`}>
        {label}
      </span>
    </div>
  );
}

function StepLine({ active }: { active: boolean }) {
  return (
    <div
      className={`w-16 sm:w-24 h-0.5 mb-5 transition-all ${active ? "bg-violet-600" : "bg-gray-800"}`}
    />
  );
}

function ProspectCard({
  prospect, isSelected, isGenerating, disabled, onGenerate,
}: {
  prospect:    Prospect;
  isSelected:  boolean;
  isGenerating: boolean;
  disabled:    boolean;
  onGenerate:  () => void;
}) {
  return (
    <div
      className={`bg-gray-900 border rounded-xl p-5 flex flex-col transition-all ${isSelected ? "border-violet-500 shadow-lg shadow-violet-500/10" : "border-gray-800 hover:border-gray-700"}`}
    >
      {/* Rating */}
      <div className="flex items-center gap-1 mb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`w-3 h-3 ${i < Math.round(prospect.rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-700"}`}
          />
        ))}
        <span className="text-xs text-gray-500 ml-1">
          {prospect.rating} ({prospect.reviews})
        </span>
      </div>

      {/* Name & address */}
      <h3 className="font-semibold text-white leading-tight mb-1">{prospect.name}</h3>
      <p className="text-xs text-gray-600 mb-4">📍 {prospect.address}</p>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        <Badge icon={<Phone className="w-2.5 h-2.5" />} label="Mobile" variant="green" />
        <Badge
          icon={<Globe className="w-2.5 h-2.5" />}
          label={prospect.hasWebsite ? "Site web" : "Sans site"}
          variant={prospect.hasWebsite ? "blue" : "gray"}
        />
        <Badge
          icon={<Mail className="w-2.5 h-2.5" />}
          label={prospect.hasEmail ? "Email" : "Sans email"}
          variant={prospect.hasEmail ? "violet" : "gray"}
        />
      </div>

      {/* Generate button */}
      <button
        onClick={onGenerate}
        disabled={disabled}
        className="mt-auto w-full flex items-center justify-center gap-2 text-sm px-4 py-2.5 rounded-lg font-medium transition-all border disabled:opacity-40 disabled:cursor-not-allowed bg-violet-600/20 border-violet-500/30 text-violet-300 hover:bg-violet-600/30 hover:border-violet-500/60 hover:text-violet-200"
      >
        {isGenerating ? (
          <><Loader2 className="w-3.5 h-3.5 animate-spin" />Génération…</>
        ) : (
          <><Zap className="w-3.5 h-3.5" />Générer un email IA</>
        )}
      </button>
    </div>
  );
}

type BadgeVariant = "green" | "blue" | "violet" | "gray";

const BADGE_STYLES: Record<BadgeVariant, string> = {
  green:  "bg-green-600/10  text-green-400  border-green-500/20",
  blue:   "bg-blue-600/10   text-blue-400   border-blue-500/20",
  violet: "bg-violet-600/10 text-violet-400 border-violet-500/20",
  gray:   "bg-gray-800/50   text-gray-600   border-gray-700/30",
};

function Badge({ icon, label, variant }: { icon: React.ReactNode; label: string; variant: BadgeVariant }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${BADGE_STYLES[variant]}`}>
      {icon}{label}
    </span>
  );
}
