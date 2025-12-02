import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutes = ["/signin", "/signup"];

const publicPatterns = ["/api", "/_next", "/favicon.ico", "/images", "/public"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicPattern = publicPatterns.some((pattern) =>
    pathname.startsWith(pattern)
  );

  if (isPublicPattern) {
    return NextResponse.next();
  }

  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get("better-auth.session_token");

  if (!sessionToken) {
    const url = request.nextUrl.clone();
    url.pathname = "/signup";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
