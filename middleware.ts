import { NextRequest, NextResponse } from 'next/server';

// Protected route patterns
const adminRoutes = ['/admin'];
const ownerRoutes = ['/owner'];
const authRoutes = ['/login', '/signup', '/verify-email'];
const publicRoutes = ['/', '/search', '/venues', '/api/health'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files and API routes (except auth API)
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.') ||
    (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/'))
  ) {
    return NextResponse.next();
  }

  try {
    // Get the session cookie
    const sessionToken = request.cookies.get('better-auth.session_token')?.value;
    
    if (!sessionToken) {
      // No session - handle unauthenticated user
      if (adminRoutes.some(route => pathname.startsWith(route)) ||
          ownerRoutes.some(route => pathname.startsWith(route)) ||
          ['/bookings', '/profile'].some(route => pathname.startsWith(route))) {
        return redirectToLogin(pathname, request.nextUrl.origin);
      }
      return NextResponse.next();
    }

    // For authenticated users, we'll let the page components handle the session validation
    // This avoids importing the full auth module in the Edge Runtime
    return NextResponse.next();
    
  } catch (error) {
    console.error('Middleware error:', error);
    // If there's an error with session validation, continue but log it
    return NextResponse.next();
  }
}

function redirectToLogin(returnUrl: string, origin?: string) {
  const baseUrl = origin || 'http://localhost:3000';
  const url = new URL('/login', baseUrl);
  url.searchParams.set('returnUrl', returnUrl);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (anything with a file extension)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
