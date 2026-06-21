import Link from "next/link";
import { Zap, ArrowLeft } from "lucide-react";
import { Footer } from "@/components/footer";

export const metadata = {
  title: "Conditions Générales d'Utilisation — ProspectAI",
};

export default function CGU() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <nav className="border-b border-gray-800/50 px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-white">ProspectAI</span>
        </Link>
        <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour
        </Link>
      </nav>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-16">
        <h1 className="text-3xl font-bold text-white mb-2">Conditions Générales d'Utilisation</h1>
        <p className="text-gray-500 text-sm mb-12">Dernière mise à jour : juin 2026</p>

        <div className="space-y-10 text-gray-300 leading-relaxed text-sm">

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. Présentation du service</h2>
            <p>
              ProspectAI est un logiciel SaaS (Software as a Service) de prospection commerciale
              automatisée. Il permet aux utilisateurs de rechercher des prospects professionnels
              via l'API Google Places, de générer des emails personnalisés par intelligence
              artificielle (Groq / Llama 3), et d'automatiser l'envoi de ces emails.
            </p>
            <p className="mt-2">
              Le service est édité par Ouedraogo Check Oumar Aziz, auto-entrepreneur établi en
              Allemagne. En utilisant ProspectAI, vous acceptez sans réserve les présentes CGU.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. Accès et inscription</h2>
            <p>
              L'accès au service est réservé aux personnes majeures agissant dans un cadre
              professionnel. L'inscription requiert la fourniture d'un nom, d'une adresse email
              valide et d'un mot de passe. L'utilisateur est responsable de la confidentialité
              de ses identifiants.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. Abonnement et facturation</h2>
            <div className="space-y-3">
              <div>
                <h3 className="font-medium text-white mb-1">3.1 Essai gratuit</h3>
                <p>
                  Tout nouvel abonnement bénéficie d'un essai gratuit de <strong className="text-white">14 jours</strong>.
                  Aucun prélèvement n'est effectué pendant cette période. Un moyen de paiement
                  valide est requis pour démarrer l'essai.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-white mb-1">3.2 Plans tarifaires</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-400">
                  <li>Starter — 9 €/mois</li>
                  <li>Creator — 19 €/mois</li>
                  <li>Pro — 49 €/mois</li>
                  <li>Agency — 99 €/mois</li>
                </ul>
                <p className="mt-2">
                  Les prix sont indiqués en euros, hors taxes applicables. La facturation est
                  mensuelle et récurrente à compter du 15e jour suivant l'inscription.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-white mb-1">3.3 Annulation</h3>
                <p>
                  L'utilisateur peut annuler son abonnement à tout moment depuis ses paramètres
                  de compte. L'annulation prend effet à la fin de la période en cours. Aucun
                  remboursement partiel n'est effectué pour la période déjà facturée.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-white mb-1">3.4 Paiement</h3>
                <p>
                  Les paiements sont traités par Stripe (carte bancaire) ou PayPal. ProspectAI
                  ne stocke aucune donnée de carte bancaire — ces données sont gérées
                  exclusivement par le prestataire de paiement.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. Droit de rétractation</h2>
            <p>
              Conformément à la directive européenne 2011/83/UE, l'utilisateur disposant du
              statut de consommateur bénéficie d'un droit de rétractation de <strong className="text-white">14 jours</strong>{" "}
              à compter de la souscription, sans avoir à motiver sa décision.
            </p>
            <p className="mt-2">
              Pour exercer ce droit, envoyez un email à{" "}
              <a href="mailto:azizssro72@gmail.com" className="text-violet-400 hover:underline">
                azizssro72@gmail.com
              </a>{" "}
              en indiquant votre nom, email de compte et la mention « Rétractation ProspectAI ».
              Le remboursement sera effectué dans les 14 jours suivant la réception de votre demande.
            </p>
            <p className="mt-2 text-gray-400">
              Note : l'utilisation effective du service pendant la période d'essai implique une
              renonciation expresse au droit de rétractation pour la partie déjà consommée.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. Limites d'usage</h2>
            <div className="space-y-2">
              <p>
                <span className="text-white font-medium">Envoi d'emails :</span> chaque plan
                inclut une limite journalière d'envois (configurable dans les paramètres).
                L'utilisateur s'engage à ne pas utiliser le service pour envoyer des spams ou
                tout contenu illicite.
              </p>
              <p>
                <span className="text-white font-medium">Données scrapées :</span> les informations
                collectées via Google Places (noms, adresses, téléphones, sites web) sont des
                données publiques. L'utilisateur reste seul responsable de l'usage qu'il en fait,
                notamment au regard du RGPD.
              </p>
              <p>
                <span className="text-white font-medium">RGPD et prospection :</span> en France et
                dans l'UE, la prospection commerciale par email auprès de professionnels (B2B)
                est autorisée si elle respecte l'intérêt légitime et inclut une option de
                désabonnement. L'utilisateur est responsable de la conformité de ses campagnes.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. Responsabilité</h2>
            <p>
              ProspectAI est un outil technologique. L'éditeur ne peut être tenu responsable
              des usages qui en sont faits par les utilisateurs. En particulier :
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
              <li>L'éditeur ne garantit pas l'exactitude des données issues de Google Places.</li>
              <li>L'éditeur n'est pas responsable des emails envoyés par les utilisateurs.</li>
              <li>L'éditeur ne garantit pas un taux de délivrabilité ou de réponse particulier.</li>
              <li>L'éditeur ne peut être tenu responsable d'une interruption de service due à un prestataire tiers (Vercel, Neon, Groq, Stripe, Google).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. Modifications des CGU</h2>
            <p>
              L'éditeur se réserve le droit de modifier les présentes CGU à tout moment.
              Les utilisateurs seront informés par email au moins 15 jours avant l'entrée en
              vigueur de toute modification substantielle. La poursuite de l'utilisation du
              service vaut acceptation des nouvelles CGU.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">8. Droit applicable</h2>
            <p>
              Les présentes CGU sont soumises au droit allemand. En cas de litige, les parties
              s'efforceront de trouver une solution amiable avant tout recours judiciaire.
            </p>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
