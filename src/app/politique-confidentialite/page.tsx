import Link from "next/link";
import { Zap, ArrowLeft } from "lucide-react";
import { Footer } from "@/components/footer";

export const metadata = {
  title: "Politique de confidentialité — ProspectAI",
};

export default function PolitiqueConfidentialite() {
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
        <h1 className="text-3xl font-bold text-white mb-2">Politique de confidentialité</h1>
        <p className="text-gray-500 text-sm mb-12">Dernière mise à jour : juin 2026</p>

        <div className="space-y-10 text-gray-300 leading-relaxed text-sm">

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. Responsable du traitement</h2>
            <p>
              Ouedraogo Check Oumar Aziz — Jahnstr. 9, 67304 Eisenberg (Pfalz), Allemagne
              —{" "}
              <a href="mailto:azizssro72@gmail.com" className="text-violet-400 hover:underline">
                azizssro72@gmail.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. Données collectées</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-white mb-1">2.1 Données de compte</h3>
                <ul className="list-disc list-inside text-gray-400 space-y-1">
                  <li>Nom complet</li>
                  <li>Adresse email</li>
                  <li>Mot de passe (haché via bcrypt — jamais stocké en clair)</li>
                  <li>Type de profil (B2B, créateur, agence)</li>
                  <li>Date de création du compte</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-white mb-1">2.2 Données de paiement</h3>
                <p className="text-gray-400">
                  Les informations de carte bancaire sont traitées exclusivement par{" "}
                  <strong className="text-white">Stripe</strong> (PCI-DSS Level 1). ProspectAI
                  ne stocke que l'identifiant d'abonnement Stripe, le plan souscrit et le
                  statut de l'abonnement. Aucune donnée de carte n'est stockée sur nos serveurs.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-white mb-1">2.3 Données de prospection</h3>
                <p className="text-gray-400">
                  Les prospects ajoutés par l'utilisateur (via scraping Google Places ou
                  manuellement) sont stockés dans sa base de données personnelle :
                  nom d'entreprise, adresse, téléphone, site web, email de contact, secteur.
                  Ces données sont associées uniquement au compte de l'utilisateur qui les
                  a collectées.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-white mb-1">2.4 Logs d'emails</h3>
                <p className="text-gray-400">
                  Les emails envoyés via ProspectAI sont enregistrés (objet, corps, statut,
                  date d'envoi, ouvertures) à des fins de suivi de campagne.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-white mb-1">2.5 Données techniques</h3>
                <p className="text-gray-400">
                  Logs de connexion, adresse IP, navigateur — collectés automatiquement par
                  Vercel pour des raisons de sécurité et de stabilité.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. Finalités du traitement</h2>
            <ul className="list-disc list-inside text-gray-400 space-y-1">
              <li>Fourniture et amélioration du service ProspectAI</li>
              <li>Gestion des comptes utilisateurs et authentification</li>
              <li>Traitement des paiements et gestion des abonnements</li>
              <li>Envoi d'emails transactionnels (confirmation, rappel d'essai, facturation)</li>
              <li>Génération d'emails par IA à la demande de l'utilisateur</li>
              <li>Prévention de la fraude et sécurité</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. Sous-traitants et transferts</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse mt-2">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-2 pr-4 text-gray-400 font-medium">Prestataire</th>
                    <th className="text-left py-2 pr-4 text-gray-400 font-medium">Rôle</th>
                    <th className="text-left py-2 text-gray-400 font-medium">Localisation</th>
                  </tr>
                </thead>
                <tbody className="text-gray-400">
                  {[
                    ["Vercel Inc.", "Hébergement de l'application", "États-Unis (SCC)"],
                    ["Neon Inc.", "Base de données PostgreSQL", "États-Unis / AWS us-east-1"],
                    ["Groq Inc.", "Génération d'emails par IA", "États-Unis"],
                    ["Resend Inc.", "Envoi d'emails transactionnels", "États-Unis"],
                    ["Stripe Inc.", "Traitement des paiements", "États-Unis (PCI-DSS)"],
                    ["Google LLC", "API Places (données publiques)", "États-Unis"],
                  ].map(([p, r, l]) => (
                    <tr key={p} className="border-b border-gray-800/50">
                      <td className="py-2 pr-4 text-white">{p}</td>
                      <td className="py-2 pr-4">{r}</td>
                      <td className="py-2">{l}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-gray-400">
              Les transferts hors UE reposent sur les Clauses Contractuelles Types (SCC) de la
              Commission européenne ou sur les certifications équivalentes des prestataires.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. Durée de conservation</h2>
            <ul className="list-disc list-inside text-gray-400 space-y-1">
              <li>Données de compte actif : durée de l'abonnement + 12 mois</li>
              <li>Données après suppression du compte : 30 jours maximum (sauf obligation légale)</li>
              <li>Logs d'emails : 24 mois glissants</li>
              <li>Données de paiement (Stripe) : 5 ans à des fins comptables</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. Vos droits RGPD</h2>
            <p className="mb-3">
              Conformément au Règlement Général sur la Protection des Données (RGPD —
              Règlement UE 2016/679), vous disposez des droits suivants :
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-1">
              <li><span className="text-white">Droit d'accès</span> — obtenir une copie de vos données personnelles</li>
              <li><span className="text-white">Droit de rectification</span> — corriger des données inexactes</li>
              <li><span className="text-white">Droit à l'effacement</span> — demander la suppression de votre compte et de vos données</li>
              <li><span className="text-white">Droit à la portabilité</span> — recevoir vos données dans un format structuré</li>
              <li><span className="text-white">Droit d'opposition</span> — vous opposer à un traitement basé sur l'intérêt légitime</li>
              <li><span className="text-white">Droit à la limitation</span> — limiter temporairement le traitement de vos données</li>
            </ul>
            <p className="mt-3">
              Pour exercer ces droits, envoyez un email à{" "}
              <a href="mailto:azizssro72@gmail.com" className="text-violet-400 hover:underline">
                azizssro72@gmail.com
              </a>{" "}
              avec pour objet « Exercice droits RGPD ». Réponse sous 30 jours.
            </p>
            <p className="mt-2 text-gray-400">
              Vous pouvez également introduire une réclamation auprès de votre autorité de
              contrôle nationale (CNIL en France, BfDI en Allemagne).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. Cookies</h2>
            <p>
              ProspectAI utilise uniquement des cookies techniques strictement nécessaires au
              fonctionnement du service (cookie de session d'authentification NextAuth). Aucun
              cookie publicitaire ou de traçage tiers n'est utilisé.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">8. Sécurité</h2>
            <p>
              Les données sont transmises exclusivement via HTTPS. Les mots de passe sont hachés
              (bcrypt, facteur 12). L'accès à la base de données est restreint et chiffré en transit.
              Des mesures techniques et organisationnelles appropriées sont mises en œuvre pour
              protéger vos données contre tout accès non autorisé.
            </p>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
