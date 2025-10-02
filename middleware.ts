import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Admin routes protection
    if (pathname.startsWith('/admin')) {
      if (!token || token.role !== 'admin') {
        return NextResponse.redirect(new URL('/auth/login', req.url));
      }
    }

    // Domain lead routes protection
    if (pathname.startsWith('/domain-lead')) {
      if (!token || (token.role !== 'domain_lead' && token.role !== 'admin')) {
        return NextResponse.redirect(new URL('/auth/login', req.url));
      }
    }

    // API routes protection
    if (pathname.startsWith('/api/admin')) {
      if (!token || token.role !== 'admin') {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    if (pathname.startsWith('/api/domain-lead')) {
      if (!token || (token.role !== 'domain_lead' && token.role !== 'admin')) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Public routes that don't require authentication
        const publicRoutes = [
          '/',
          '/auth/login',
          '/auth/register',
          '/api/auth',
          '/api/health'
        ];

        // Check if route is public
        if (publicRoutes.some(route => pathname.startsWith(route))) {
          return true;
        }

        // All other routes require authentication
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};