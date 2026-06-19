import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  const protectedPaths = ["/dashboard"];
  const authPaths = ["/auth/signin", "/auth/signup"];

  if (protectedPaths.some((p) => pathname.startsWith(p)) && !isLoggedIn) {
    return NextResponse.redirect(new URL("/auth/signin", req.url));
  }

  if (authPaths.includes(pathname) && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
};
