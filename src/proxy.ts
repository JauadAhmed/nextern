// src/proxy.ts
// Next.js Proxy runs before every request.
// Handles: auth guards, role-based redirects, email verification check.

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import {
  getDefaultAuthenticatedRoute,
  getDashboardForRole,
  requiresAdminApproval,
  type UserRole,
  type VerificationStatus,
} from '@/lib/role-routing';

// Routes accessible without authentication
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/verify-email',
  '/forgot-password',
  '/terms',
  '/privacy',
  '/api/auth',
];

// Routes accessible only while NOT authenticated (redirect logged-in users away)
const AUTH_ONLY_ROUTES = ['/login', '/register', '/verify-email', '/forgot-password'];

const authSecret = (process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET)?.trim();

type MiddlewareToken = {
  id?: string;
  sub?: string;
  email?: string | null;
  role?: UserRole;
  isVerified?: boolean;
  verificationStatus?: VerificationStatus;
  mustChangePassword?: boolean;
};

// Protected route prefixes and their allowed roles
const ROLE_ROUTES: { prefix: string; roles: UserRole[] }[] = [
  { prefix: '/student', roles: ['student', 'alumni'] },
  { prefix: '/employer', roles: ['employer'] },
  { prefix: '/advisor', roles: ['advisor', 'dept_head'] },
  { prefix: '/dept', roles: ['dept_head'] },
  { prefix: '/admin', roles: ['admin'] },
];

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip middleware for static assets and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.') ||
    pathname.startsWith('/api/')
  ) {
    return NextResponse.next();
  }

  const token = (await getToken({
    req,
    secret: authSecret,
    secureCookie: req.nextUrl.protocol === 'https:',
  })) as MiddlewareToken | null;

  const isAuthenticated = !!(token?.sub ?? token?.id);

  // Redirect logged-in users away from auth pages
  if (isAuthenticated && AUTH_ONLY_ROUTES.some((route) => pathname.startsWith(route))) {
    const redirectTarget = getDefaultAuthenticatedRoute(token ?? {});
    return NextResponse.redirect(new URL(redirectTarget, req.url));
  }

  // Public routes are always accessible
  if (PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route + '/'))) {
    return NextResponse.next();
  }

  // Require authentication for everything else
  if (!isAuthenticated) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Require email verification
  if (!token?.isVerified) {
    const verifyUrl = new URL('/verify-email', req.url);
    verifyUrl.searchParams.set('email', token?.email ?? '');
    return NextResponse.redirect(verifyUrl);
  }

  if (token?.mustChangePassword && pathname !== '/setup-password') {
    return NextResponse.redirect(new URL('/setup-password', req.url));
  }

  if (
    token?.role &&
    requiresAdminApproval(token.role) &&
    token.verificationStatus !== 'approved' &&
    (pathname.startsWith('/employer') ||
      pathname.startsWith('/advisor') ||
      pathname.startsWith('/dept'))
  ) {
    return NextResponse.redirect(new URL('/pending-approval', req.url));
  }

  // Enforce role-based route access
  for (const { prefix, roles } of ROLE_ROUTES) {
    if (pathname.startsWith(prefix) && (!token?.role || !roles.includes(token.role))) {
      const redirectTarget = token?.role ? getDefaultAuthenticatedRoute(token) : '/';
      return NextResponse.redirect(new URL(redirectTarget, req.url));
    }
  }

  // Strict isolation for alumni: only expose the mentor workspace and shared account tools.
  if (token?.role === 'alumni') {
    const ALUMNI_ALLOWED_ROUTES = [
      '/student/mentorship',
      '/student/messages',
      '/student/notifications',
      '/student/profile',
    ];
    if (
      pathname.startsWith('/student') &&
      !ALUMNI_ALLOWED_ROUTES.some((route) => pathname === route || pathname.startsWith(route + '/'))
    ) {
      return NextResponse.redirect(new URL('/student/mentorship/dashboard', req.url));
    }
  }

  if (pathname === '/pending-approval' && token?.role && !requiresAdminApproval(token.role)) {
    return NextResponse.redirect(new URL(getDashboardForRole(token.role), req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
