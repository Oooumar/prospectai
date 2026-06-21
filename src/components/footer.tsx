"use client";

import Link from "next/link";
import { Zap } from "lucide-react";
import { useI18n } from "@/components/language-provider";

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="py-8 px-6 border-t border-gray-800/50 bg-gray-950">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <Zap className="w-3 h-3 text-white" />
          </div>
          <span className="text-sm font-semibold text-white">ProspectAI</span>
        </div>

        <p className="text-sm text-gray-500">{t("footer_copyright")}</p>

        <div className="flex flex-wrap justify-center gap-5 text-sm text-gray-500">
          <Link href="/mentions-legales" className="hover:text-white transition-colors">
            {t("footer_legal")}
          </Link>
          <Link href="/cgu" className="hover:text-white transition-colors">
            {t("footer_cgu")}
          </Link>
          <Link href="/politique-confidentialite" className="hover:text-white transition-colors">
            {t("footer_privacy")}
          </Link>
          <a href="mailto:azizssro72@gmail.com" className="hover:text-white transition-colors">
            {t("footer_contact")}
          </a>
        </div>
      </div>
    </footer>
  );
}
