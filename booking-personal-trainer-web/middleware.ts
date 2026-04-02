import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_ROUTES = ['/signin', '/signup', '/register', '/error-404'];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow static / internal files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/assets') ||
    pathname.startsWith('/images')
  ) {
    return NextResponse.next();
  }

  // Auth cookie set by client when user logs in (tokens stored in localStorage)
  const authCookie = req.cookies.get('auth')?.value;
  const isAuthenticated = authCookie === '1';
  const isPublic = isPublicRoute(pathname);

  // Logged in but trying to access auth pages
  if (
    isAuthenticated &&
    ['/signin', '/signup', '/register'].includes(pathname)
  ) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Not logged in and accessing protected route
  if (!isAuthenticated && !isPublic) {
    return NextResponse.redirect(new URL('/signin', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
