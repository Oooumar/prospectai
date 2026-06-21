"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { type Locale, type T, translations, detectLocale, saveLocale, interpolate } from "@/lib/i18n";

interface I18nContext {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: keyof T, vars?: Record<string, string | number>) => string;
}

const Ctx = createContext<I18nContext | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("fr");

  useEffect(() => {
    setLocaleState(detectLocale());
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    saveLocale(l);
  }, []);

  const t = useCallback(
    (key: keyof T, vars?: Record<string, string | number>) => {
      const str = translations[locale][key] ?? translations["fr"][key] ?? key;
      return vars ? interpolate(str, vars) : str;
    },
    [locale]
  );

  return <Ctx.Provider value={{ locale, setLocale, t }}>{children}</Ctx.Provider>;
}

export function useI18n(): I18nContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n must be used inside LanguageProvider");
  return ctx;
}
