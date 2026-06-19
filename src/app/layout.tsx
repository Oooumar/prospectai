import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ProspectAI — Prospection automatisée par IA",
  description: "Trouvez des prospects, générez des emails personnalisés et automatisez votre prospection commerciale grâce à l'IA.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark h-full">
      <body className={`${inter.className} h-full bg-gray-950 text-gray-100 antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
