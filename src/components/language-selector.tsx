"use client";

import { useState, useRef, useEffect } from "react";
import { LOCALES, LOCALE_FLAGS, LOCALE_LABELS, type Locale } from "@/lib/i18n";
import { useI18n } from "@/components/language-provider";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
}

export function LanguageSelector({ className }: Props) {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-700 bg-gray-800/60 text-sm text-gray-300 hover:text-white hover:border-gray-600 transition-colors"
        aria-label="Select language"
      >
        <span>{LOCALE_FLAGS[locale]}</span>
        <span className="hidden sm:inline text-xs font-medium">{LOCALE_LABELS[locale]}</span>
        <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-36 rounded-xl border border-gray-700 bg-gray-900 shadow-2xl z-50 overflow-hidden">
          {LOCALES.map((l) => (
            <button
              key={l}
              onClick={() => { setLocale(l as Locale); setOpen(false); }}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors",
                l === locale
                  ? "bg-violet-500/15 text-violet-300"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
            >
              <span>{LOCALE_FLAGS[l as Locale]}</span>
              <span>{LOCALE_LABELS[l as Locale]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
