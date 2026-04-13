import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";

const PUBLIC_ROUTE_PREFIXES = [
  "/signin",
  "/signup",
  "/register",
  "/error-404",
] as const;

const isPublicPath = (pathname: string): boolean =>
  PUBLIC_ROUTE_PREFIXES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

export const proxy = async (request: NextRequest): Promise<NextResponse> => {
  const authResponse = await auth0.middleware(request);
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/auth")) {
    return authResponse;
  }
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/assets") ||
    pathname.startsWith("/images")
  ) {
    return NextResponse.next();
  }
  const authCookie = request.cookies.get("auth")?.value;
  const hasLocalSession = authCookie === "1";
  const session = await auth0.getSession(request);
  const hasAuth0Session = Boolean(session?.user);
  const isAuthenticated = hasLocalSession || hasAuth0Session;
  const isPublic = isPublicPath(pathname);
  if (
    isAuthenticated &&
    ["/signin", "/signup", "/register"].includes(pathname)
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (!isAuthenticated && !isPublic) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }
  return authResponse;
};

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
