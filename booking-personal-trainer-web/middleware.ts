import { NextRequest, NextResponse } from 'next/server';

/** Routes that do NOT require authentication (auth pages, error pages) */
const PUBLIC_ROUTES = ["/signin", "/signup", "/register", "/error-404"];

/**
 * Check if pathname is a public route (auth or error pages only)
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow Next.js internal assets and static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/assets') ||
    pathname.startsWith('/images')
  ) {
    return NextResponse.next();
  }

  // access_token has path=/ and is sent with page requests; refresh_token
  // has path=/api/v1/token/refresh and is only sent to that API
  const accessToken = req.cookies.get('access_token')?.value;
  const isAuthenticated = Boolean(accessToken);


  /**
   * Case 1 (disabled on Vercel): Backend cookies aren't visible when
   * frontend/backend are different domains. Auth redirect is client-side on 401.
   */

  /**
   * Case 2: User IS logged in but trying to access auth pages (signin/signup)
   * → block and redirect to dashboard (root). User must logout first.
   */
  if (
    isAuthenticated &&
    (pathname === "/signin" || pathname === "/signup" || pathname === "/register")
  ) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export function middleware(req: NextRequest) {
  return proxy(req);
}

/**
 * Configure which paths middleware applies to
 */
export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - API routes
     * - static files
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
