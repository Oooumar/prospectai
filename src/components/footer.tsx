"use client";

import Link from "next/link";
import Image from "next/image";
import { useI18n } from "@/components/language-provider";

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="py-8 px-6 border-t border-gray-800/50 bg-gray-950">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Image src="/logo-prospectai.png" alt="ProspectAI" width={24} height={24} className="rounded-md" />
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
