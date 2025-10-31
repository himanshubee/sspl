import { NextResponse } from "next/server";
import { computeSessionToken } from "@/lib/auth";

const COOKIE_NAME = "admin_session";

export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") {
      return NextResponse.next();
    }

    const sessionCookie = request.cookies.get(COOKIE_NAME)?.value;
    const expectedToken = computeSessionToken();

    if (sessionCookie !== expectedToken) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/admin/login";
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
