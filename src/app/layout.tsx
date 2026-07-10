import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { Providers } from "@/components/providers";
import type { Locale } from "@/lib/i18n";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://prospectai.company"),
  title: "ProspectAI — Prospection automatisée par IA | Emails & WhatsApp",
  description:
    "Trouvez vos clients automatiquement avec ProspectAI. Scraping Google Maps, emails personnalisés par IA, campagnes WhatsApp. 14 jours gratuits. Burkina Faso, Côte d'Ivoire, Sénégal, Cameroun et toute l'Afrique.",
  keywords: [
    "prospection automatique Afrique",
    "logiciel prospection commerciale",
    "trouver clients email WhatsApp",
    "scraping Google Maps Afrique",
    "ProspectAI",
    "prospection B2B Afrique",
    "email marketing automatisé",
    "campagne WhatsApp automatique",
    "logiciel prospection Burkina",
    "logiciel prospection Côte d'Ivoire",
    "logiciel prospection Sénégal",
    "CRM prospection Afrique",
  ],
  alternates: { canonical: "/" },
  icons: [{ rel: "icon", url: "/favicon.svg", type: "image/svg+xml" }],
  openGraph: {
    title: "ProspectAI — Prospection automatisée par IA pour l'Afrique",
    description:
      "Scraping Google Maps + emails personnalisés par IA + campagnes WhatsApp. Trouvez vos clients en Afrique automatiquement. Essai 14 jours gratuit.",
    url: "https://prospectai.company",
    siteName: "ProspectAI",
    images: [
      {
        url: "/logo-prospectai.png",
        width: 1200,
        height: 630,
        alt: "ProspectAI — Prospection automatisée par IA pour l'Afrique",
      },
    ],
    type: "website",
    locale: "fr_FR",
  },
  twitter: {
    card: "summary_large_image",
    title: "ProspectAI — Prospection automatisée par IA pour l'Afrique",
    description:
      "Scraping Google Maps + emails IA + WhatsApp automatique. Trouvez vos clients en Afrique. 14 jours gratuits.",
    images: ["/logo-prospectai.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headerStore = await headers();
  const initialLocale = (headerStore.get("x-locale") ?? "fr") as Locale;

  return (
    <html lang={initialLocale} className="dark h-full">
      <body className={`${inter.className} h-full bg-gray-950 text-gray-100 antialiased`}>
        <Providers initialLocale={initialLocale}>{children}</Providers>
      </body>
    </html>
  );
}
