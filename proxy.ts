import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutes = ["/sign-in", "/sign-up"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // explicit public routes (e.g. /sign-in, /sign-up)
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // api routes, static files, next internals
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // check for session token
  // better-auth uses "better-auth.session_token" by default, or "better-auth.session_token.sig" etc.
  // We check for the main token.
  const sessionCookie = request.cookies.get("better-auth.session_token");

  if (!sessionCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
