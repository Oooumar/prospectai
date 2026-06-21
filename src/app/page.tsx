import Link from "next/link";
import {
  Zap, Target, Mail, BarChart3, ArrowRight, Check,
  Star, TrendingUp, Users, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/footer";

const features = [
  {
    icon: Target,
    title: "Scraping intelligent",
    description: "Trouvez des milliers de prospects qualifiés en quelques secondes. Plombiers, restaurants, avocats — n'importe quelle niche, n'importe quelle ville.",
  },
  {
    icon: Zap,
    title: "Emails générés par IA",
    description: "Llama 3 rédige des emails 100% personnalisés pour chaque prospect. Adapté à votre profil : B2B, créateur de contenu ou agence.",
  },
  {
    icon: Mail,
    title: "Envoi automatisé",
    description: "Planifiez vos campagnes et envoyez automatiquement avec des limites journalières configurables. Zero effort après le setup.",
  },
  {
    icon: BarChart3,
    title: "Suivi en temps réel",
    description: "Taux d'ouverture, réponses, conversions — suivez chaque interaction et optimisez vos campagnes avec des données précises.",
  },
];

const stats = [
  { value: "10x", label: "Plus de prospects", icon: TrendingUp },
  { value: "94%", label: "Taux de delivrabilité", icon: Mail },
  { value: "3min", label: "Setup d'une campagne", icon: Clock },
  { value: "2K+", label: "Utilisateurs actifs", icon: Users },
];

const plans = [
  {
    name: "Starter",
    slug: "starter",
    price: "9",
    description: "Pour débuter la prospection",
    features: ["50 prospects/mois", "1 langue", "Scraping de base", "Génération IA", "Support email"],
    popular: false,
    badge: null,
  },
  {
    name: "Creator",
    slug: "creator",
    price: "19",
    description: "Pour les créateurs de contenu",
    features: ["200 prospects/mois", "Toutes les langues", "Génération email illimitée", "Niches créateurs", "Templates personnalisés", "Support prioritaire"],
    popular: true,
    badge: "Populaire",
  },
  {
    name: "Pro",
    slug: "pro",
    price: "49",
    description: "Pour les équipes ambitieuses",
    features: ["Prospects illimités", "Toutes fonctionnalités", "Campagnes illimitées", "IA avancée", "Analytics complets", "Support prioritaire"],
    popular: false,
    badge: null,
  },
  {
    name: "Agency",
    slug: "agency",
    price: "99",
    description: "Pour les agences",
    features: ["Multi-utilisateurs", "White-label", "API access", "Prospects illimités", "Account manager dédié", "Onboarding personnalisé"],
    popular: false,
    badge: null,
  },
];

const testimonials = [
  {
    name: "Thomas Durand",
    role: "Consultant indépendant",
    text: "En 2 semaines j'ai signé 3 nouveaux clients. ProspectAI a transformé ma façon de prospecter.",
    rating: 5,
  },
  {
    name: "Sarah Martin",
    role: "Directrice commerciale",
    text: "Nos équipes économisent 15h/semaine. Les emails IA sont bluffants, les prospects pensent qu'on les a écrits manuellement.",
    rating: 5,
  },
  {
    name: "Karim Benali",
    role: "Fondateur d'agence",
    text: "ROI de 800% dès le premier mois. Je recommande à tous les freelances et agences.",
    rating: 5,
  },
];

export default function LandingPage() {
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
            <a href="#features" className="hover:text-white transition-colors">Fonctionnalités</a>
            <a href="#pricing" className="hover:text-white transition-colors">Tarifs</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Témoignages</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/signin">
              <Button variant="ghost" size="sm">Connexion</Button>
            </Link>
            <Link href="/auth/signup">
              <Button variant="gradient" size="sm">Démarrer gratuitement</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 grid-bg">
        {/* Glow effects */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 left-1/4 w-[300px] h-[300px] bg-indigo-600/8 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            Alimenté par GPT-4 · Nouveau : suivi des réponses en temps réel
          </div>

          <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight mb-6">
            Prospectez 10x plus vite{" "}
            <span className="gradient-text">grâce à l&apos;IA</span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Trouvez des milliers de prospects qualifiés, générez des emails ultra-personnalisés
            et automatisez toute votre prospection commerciale en quelques clics.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/signup">
              <Button variant="gradient" size="xl" className="group">
                Commencer gratuitement
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="xl">
                Voir la démo
              </Button>
            </Link>
          </div>

          <p className="mt-4 text-sm text-gray-500">
            Aucune carte de crédit requise · Essai 14 jours gratuit
          </p>

          {/* Dashboard mockup */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent z-10 pointer-events-none" style={{ top: "60%" }} />
            <div className="rounded-2xl border border-gray-800 bg-gray-900/50 backdrop-blur-sm p-6 shadow-2xl shadow-black/50">
              <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                  { label: "Prospects", value: "2,847", color: "text-violet-400" },
                  { label: "Emails envoyés", value: "1,234", color: "text-indigo-400" },
                  { label: "Taux d'ouverture", value: "34.2%", color: "text-emerald-400" },
                  { label: "Réponses", value: "89", color: "text-amber-400" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl bg-gray-800/50 p-4">
                    <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl bg-gray-800/50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-300 font-medium">Derniers prospects scrappés</span>
                  <span className="text-xs text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full">En direct</span>
                </div>
                <div className="space-y-2">
                  {["Plomberie Dupont — Paris 15e", "Restaurant Le Mistral — Marseille", "Garage Auto Martin — Lyon"].map((p, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-700/50 last:border-0">
                      <span className="text-sm text-gray-300">{p}</span>
                      <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Email généré</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 border-y border-gray-800/50">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <stat.icon className="w-5 h-5 text-violet-400 mx-auto mb-2" />
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Tout ce dont vous avez besoin</h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              Une plateforme complète pour automatiser votre prospection du début à la fin.
            </p>
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
            <h2 className="text-4xl font-bold text-white mb-4">Tarifs simples et transparents</h2>
            <p className="text-gray-400 text-lg">Sans engagement. Annulez à tout moment.</p>
          </div>

          {/* Trial banner */}
          <div className="flex items-center justify-center gap-2 mb-12 px-4 py-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 max-w-lg mx-auto">
            <span className="text-emerald-400 text-lg">🎁</span>
            <p className="text-sm text-emerald-300 font-medium">
              Essai gratuit <strong>14 jours</strong> sur tous les plans — aucun prélèvement avant le jour 15
            </p>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-6 flex flex-col ${
                  plan.popular
                    ? "border-violet-500 bg-violet-500/5 shadow-xl shadow-violet-500/10 scale-[1.02]"
                    : "border-gray-800 bg-gray-900/30"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-violet-600 rounded-full text-xs font-bold text-white whitespace-nowrap">
                    ⭐ {plan.badge}
                  </div>
                )}
                <div className="mb-5">
                  <h3 className="text-base font-bold text-white mb-0.5">{plan.name}</h3>
                  <p className="text-gray-400 text-xs mb-3">{plan.description}</p>
                  <div className="space-y-0.5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-white">{plan.price}€</span>
                      <span className="text-gray-400 text-sm">/mois</span>
                    </div>
                    <p className="text-xs text-emerald-400 font-medium">
                      Essai gratuit 14 jours puis {plan.price}€/mois
                    </p>
                  </div>
                </div>
                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={`/auth/signup?plan=${plan.slug}`}>
                  <Button
                    variant={plan.popular ? "gradient" : "outline"}
                    size="sm"
                    className="w-full"
                  >
                    Essai gratuit 14 jours
                  </Button>
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-gray-500 mt-6">
            Paiement par carte bancaire (Stripe) ou PayPal · Annulation en 1 clic
          </p>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Ce que disent nos utilisateurs</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-2xl border border-gray-800 bg-gray-900/30 p-6">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-300 mb-4 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                <div>
                  <p className="text-white font-medium text-sm">{t.name}</p>
                  <p className="text-gray-500 text-xs">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="rounded-3xl border border-violet-500/20 bg-violet-500/5 p-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Prêt à automatiser votre prospection ?
            </h2>
            <p className="text-gray-400 text-lg mb-8">
              Rejoignez 2000+ professionnels qui utilisent ProspectAI.
            </p>
            <Link href="/auth/signup">
              <Button variant="gradient" size="xl" className="group">
                Démarrer maintenant — C&apos;est gratuit
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
