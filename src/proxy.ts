import { NextRequest, NextResponse } from "next/server";

export default function proxy(req: NextRequest) {
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

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
