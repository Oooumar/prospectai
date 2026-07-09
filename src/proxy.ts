import { NextRequest, NextResponse } from "next/server";

const LOCALES = ["fr", "en", "de", "it", "es"] as const;
type Locale = (typeof LOCALES)[number];
const LOCALE_COOKIE = "prospectai_locale";

// ── Zone detection ────────────────────────────────────────────────────────────
const ZONE_COOKIE   = "prospectai_zone";
const VALID_ZONES   = ["africa-fr", "africa-en", "europe", "amerique"] as const;
type PriceZone = (typeof VALID_ZONES)[number];

// ISO 3166-1 alpha-2 country code → pricing zone
const COUNTRY_ZONE: Record<string, PriceZone> = {
  // Africa FR (francophone)
  BJ:"africa-fr", BF:"africa-fr", CM:"africa-fr", CF:"africa-fr", TD:"africa-fr",
  KM:"africa-fr", CG:"africa-fr", CD:"africa-fr", CI:"africa-fr", DJ:"africa-fr",
  GQ:"africa-fr", GA:"africa-fr", GN:"africa-fr", MG:"africa-fr", ML:"africa-fr",
  MR:"africa-fr", NE:"africa-fr", SN:"africa-fr", SC:"africa-fr", TG:"africa-fr",
  TN:"africa-fr", DZ:"africa-fr", MA:"africa-fr", HT:"africa-fr",
  // Africa EN (anglophone)
  NG:"africa-en", GH:"africa-en", KE:"africa-en", TZ:"africa-en", UG:"africa-en",
  ZA:"africa-en", ZW:"africa-en", ZM:"africa-en", ET:"africa-en", SD:"africa-en",
  SS:"africa-en", SL:"africa-en", LR:"africa-en", GM:"africa-en", MW:"africa-en",
  MZ:"africa-en", LS:"africa-en", SZ:"africa-en", BW:"africa-en", NA:"africa-en",
  BI:"africa-en", ER:"africa-en", SO:"africa-en", AO:"africa-en", CV:"africa-en",
  // Europe
  FR:"europe", DE:"europe", AT:"europe", IT:"europe", ES:"europe", GB:"europe",
  IE:"europe", NL:"europe", BE:"europe", PT:"europe", PL:"europe", CZ:"europe",
  HU:"europe", RO:"europe", BG:"europe", HR:"europe", SK:"europe", SI:"europe",
  SE:"europe", DK:"europe", FI:"europe", NO:"europe", GR:"europe", LU:"europe",
  LT:"europe", LV:"europe", EE:"europe", CY:"europe", MT:"europe", IS:"europe",
  CH:"europe", AL:"europe", RS:"europe", UA:"europe", MD:"europe",
  // Amérique
  US:"amerique", CA:"amerique", MX:"amerique", CO:"amerique", AR:"amerique",
  PE:"amerique", CL:"amerique", VE:"amerique", EC:"amerique", UY:"amerique",
  PY:"amerique", CR:"amerique", PA:"amerique", HN:"amerique", GT:"amerique",
  SV:"amerique", NI:"amerique", DO:"amerique", CU:"amerique", PR:"amerique",
  BO:"amerique", BR:"amerique", TT:"amerique", JM:"amerique", BB:"amerique",
};

// Fallback when no country code available — by base language
const BASE_LANG_ZONE: Record<string, PriceZone> = {
  de: "europe", it: "europe", nl: "europe",
  es: "amerique", pt: "amerique",
  // fr and en → africa-fr (primary market) for unidentifiable visitors
};

function detectZone(acceptLanguage: string): PriceZone {
  const langs = acceptLanguage.split(",").map((l) => l.split(";")[0].trim());
  for (const lang of langs) {
    const [base, country] = lang.split("-");
    if (country) {
      const zone = COUNTRY_ZONE[country.toUpperCase()];
      if (zone) return zone;
    }
    const zone = BASE_LANG_ZONE[base.toLowerCase()];
    if (zone) return zone;
  }
  return "africa-fr"; // default: our primary market
}

function detectLocaleFromHeader(acceptLanguage: string): Locale {
  const langs = acceptLanguage
    .split(",")
    .map((l) => l.split(";")[0].trim().slice(0, 2).toLowerCase());
  for (const lang of langs) {
    if (LOCALES.includes(lang as Locale)) return lang as Locale;
  }
  return "fr";
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // NextAuth v5 JWT cookie — "authjs.session-token" (HTTP) or "__Secure-authjs.session-token" (HTTPS)
  const token =
    req.cookies.get("authjs.session-token")?.value ??
    req.cookies.get("__Secure-authjs.session-token")?.value;

  const isLoggedIn = !!token;
  const isProtected = pathname.startsWith("/dashboard");
  const isAuthPage = pathname === "/auth/signin" || pathname === "/auth/signup";

  if (isProtected && !isLoggedIn) {
    const url = new URL("/auth/signin", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Detect locale: saved cookie takes priority, then Accept-Language header
  const storedLocale = req.cookies.get(LOCALE_COOKIE)?.value;
  const locale: Locale =
    storedLocale && LOCALES.includes(storedLocale as Locale)
      ? (storedLocale as Locale)
      : detectLocaleFromHeader(req.headers.get("accept-language") ?? "");

  // Detect zone: saved cookie > Accept-Language country codes
  const storedZone = req.cookies.get(ZONE_COOKIE)?.value;
  const zone: PriceZone =
    storedZone && (VALID_ZONES as readonly string[]).includes(storedZone)
      ? (storedZone as PriceZone)
      : detectZone(req.headers.get("accept-language") ?? "");

  // Forward locale + zone as request headers for server components
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-locale", locale);
  requestHeaders.set("x-zone",   zone);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  // Prevent CDN from caching locale/zone-sensitive pages
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.append("Vary", "Accept-Language");

  // Persist locale cookie if not already saved
  if (!storedLocale || !LOCALES.includes(storedLocale as Locale)) {
    response.cookies.set(LOCALE_COOKIE, locale, {
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
      sameSite: "lax",
    });
  }

  // Persist zone cookie (7 days — travellers move zones)
  if (!storedZone || !(VALID_ZONES as readonly string[]).includes(storedZone)) {
    response.cookies.set(ZONE_COOKIE, zone, {
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
