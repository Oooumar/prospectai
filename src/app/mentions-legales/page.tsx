import Link from "next/link";
import { Zap, ArrowLeft } from "lucide-react";
import { Footer } from "@/components/footer";

export const metadata = {
  title: "Mentions légales — ProspectAI",
};

export default function MentionsLegales() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Nav */}
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

      {/* Content */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-16">
        <h1 className="text-3xl font-bold text-white mb-2">Mentions légales</h1>
        <p className="text-gray-500 text-sm mb-12">Dernière mise à jour : juin 2026</p>

        <div className="space-y-10 text-gray-300 leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. Éditeur du site</h2>
            <div className="space-y-1 text-sm">
              <p><span className="text-gray-400">Nom :</span> Ouedraogo Check Oumar Aziz</p>
              <p><span className="text-gray-400">Statut :</span> Auto-entrepreneur / Freelance indépendant</p>
              <p><span className="text-gray-400">Adresse :</span> Jahnstr. 9, 67304 Eisenberg (Pfalz), Allemagne</p>
              <p><span className="text-gray-400">Email :</span>{" "}
                <a href="mailto:azizssro72@gmail.com" className="text-violet-400 hover:underline">
                  azizssro72@gmail.com
                </a>
              </p>
              <p><span className="text-gray-400">Activité :</span> Édition et exploitation du logiciel SaaS ProspectAI</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. Statut fiscal</h2>
            <p className="text-sm">
              Activité exercée en Allemagne sous le statut de Freiberufler / Kleinunternehmer
              (§ 19 UStG — exonération de TVA applicable en dessous du seuil Kleinunternehmer).
            </p>
            <p className="text-sm mt-2 text-amber-400/80">
              Numéro fiscal (Steuernummer) en cours d'attribution par le Finanzamt compétent —
              mise à jour de cette page prévue dès réception.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. Hébergement</h2>
            <div className="space-y-1 text-sm">
              <p><span className="text-gray-400">Hébergeur :</span> Vercel Inc.</p>
              <p><span className="text-gray-400">Adresse :</span> 340 Pine Street, Suite 701, San Francisco, CA 94104, États-Unis</p>
              <p><span className="text-gray-400">Site :</span>{" "}
                <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline">
                  vercel.com
                </a>
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. Base de données</h2>
            <p className="text-sm">
              Les données sont stockées sur l'infrastructure Neon (PostgreSQL serverless),
              hébergée sur Amazon Web Services (AWS) us-east-1.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. Propriété intellectuelle</h2>
            <p className="text-sm">
              L'ensemble du contenu de ce site (code, design, textes, logotypes) est la propriété
              exclusive de Ouedraogo Check Oumar Aziz. Toute reproduction, même partielle, est
              interdite sans autorisation écrite préalable.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. Contact</h2>
            <p className="text-sm">
              Pour toute question relative au site :{" "}
              <a href="mailto:azizssro72@gmail.com" className="text-violet-400 hover:underline">
                azizssro72@gmail.com
              </a>
            </p>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
