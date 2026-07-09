import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Démo gratuite — Testez ProspectAI sans créer de compte",
  description:
    "Entrez un secteur et une ville. En 10 secondes, l'IA génère un vrai email de prospection personnalisé — sans inscription, sans carte bancaire.",
  alternates: { canonical: "/demo" },
  openGraph: {
    title: "Démo gratuite ProspectAI — Testez l'IA de prospection",
    description:
      "Voyez ProspectAI en action. Prospects simulés + email IA réel généré en 10 secondes. Aucun compte requis.",
    url: "https://prospectai.company/demo",
  },
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
