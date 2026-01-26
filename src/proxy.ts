import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutes = ["/signin", "/signup"];

const publicPatterns = ["/api", "/_next", "/favicon.ico", "/images", "/public"];

function addCorsHeaders(response: NextResponse, origin: string) {
  // Must use specific origin (not *) when credentials are allowed
  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie, Next-Action, Next-Router-State-Tree");
  response.headers.set("Access-Control-Allow-Credentials", "true");
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const origin = request.headers.get("origin") || request.headers.get("referer") || "";

  // Handle preflight requests
  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 200 });
    return addCorsHeaders(response, origin);
  }

  const isPublicPattern = publicPatterns.some((pattern) =>
    pathname.startsWith(pattern)
  );

  if (isPublicPattern) {
    const response = NextResponse.next();
    return addCorsHeaders(response, origin);
  }

  if (publicRoutes.includes(pathname)) {
    const response = NextResponse.next();
    return addCorsHeaders(response, origin);
  }

  const sessionToken = request.cookies.get("better-auth.session_token");

  if (!sessionToken) {
    const url = request.nextUrl.clone();
    url.pathname = "/signup";
    const response = NextResponse.redirect(url);
    return addCorsHeaders(response, origin);
  }

  const response = NextResponse.next();
  return addCorsHeaders(response, origin);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
