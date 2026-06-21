import type { T } from "./types";
import { fr } from "./fr";
import { en } from "./en";
import { de } from "./de";
import { it } from "./it";
import { es } from "./es";

export type Locale = "fr" | "en" | "de" | "it" | "es";

export const LOCALES: Locale[] = ["fr", "en", "de", "it", "es"];

export const LOCALE_FLAGS: Record<Locale, string> = {
  fr: "🇫🇷",
  en: "🇬🇧",
  de: "🇩🇪",
  it: "🇮🇹",
  es: "🇪🇸",
};

export const LOCALE_LABELS: Record<Locale, string> = {
  fr: "Français",
  en: "English",
  de: "Deutsch",
  it: "Italiano",
  es: "Español",
};

export const translations: Record<Locale, T> = { fr, en, de, it, es };

export const STORAGE_KEY = "prospectai_locale";

export function detectLocale(): Locale {
  if (typeof window === "undefined") return "fr";
  const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
  if (stored && LOCALES.includes(stored)) return stored;
  const browser = navigator.language.slice(0, 2).toLowerCase() as Locale;
  if (LOCALES.includes(browser)) return browser;
  return "fr";
}

export function saveLocale(locale: Locale): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, locale);
  // Also set a cookie so the server can read the preference on next request
  document.cookie = `${STORAGE_KEY}=${locale};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
  fetch("/api/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ language: locale }),
  }).catch(() => {});
}

export function interpolate(str: string, vars: Record<string, string | number>): string {
  return str.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? `{${key}}`));
}

export type { T };
