"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { type Locale, type T, translations, LOCALES, STORAGE_KEY, saveLocale, interpolate } from "@/lib/i18n";

interface I18nContext {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: keyof T, vars?: Record<string, string | number>) => string;
}

const Ctx = createContext<I18nContext | null>(null);

export function LanguageProvider({ children, initialLocale }: { children: ReactNode; initialLocale: Locale }) {
  // initialLocale comes from the server (middleware → x-locale header → layout.tsx)
  // It already reflects: saved cookie preference OR browser Accept-Language header
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    // On mount, check if the user has a manual localStorage preference
    // (handles legacy users and cases where the cookie was cleared)
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored && LOCALES.includes(stored) && stored !== locale) {
      setLocaleState(stored);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    saveLocale(l); // persists to localStorage + cookie + API
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
