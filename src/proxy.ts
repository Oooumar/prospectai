import { NextRequest, NextResponse } from "next/server";

const LOCALES = ["fr", "en", "de", "it", "es"] as const;
type Locale = (typeof LOCALES)[number];
const LOCALE_COOKIE = "prospectai_locale";

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

  // Forward detected locale as request header so server components can read it
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-locale", locale);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  // Persist detected locale in cookie if not already saved
  if (!storedLocale || !LOCALES.includes(storedLocale as Locale)) {
    response.cookies.set(LOCALE_COOKIE, locale, {
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
