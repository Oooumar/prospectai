import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { Providers } from "@/components/providers";
import type { Locale } from "@/lib/i18n";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ProspectAI — Prospection automatisée par IA",
  description: "Trouvez des prospects, générez des emails personnalisés et automatisez votre prospection commerciale grâce à l'IA.",
  icons: { icon: "/favicon.ico" },
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
