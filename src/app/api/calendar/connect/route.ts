// src/app/api/calendar/connect/route.ts
// Starts Google OAuth through NextAuth so the callback receives the
// expected auth state cookies while still requesting calendar scope.

import { NextRequest, NextResponse } from 'next/server';
import { auth, signIn } from '@/lib/auth';

const DEFAULT_CALLBACK_URL = '/student/dashboard?calendar=connected#calendar';

function getDefaultCallbackUrl(role?: string | null) {
  if (role === 'advisor') return '/advisor/profile?calendar=connected#calendar';
  if (role === 'dept_head') return '/dept/profile?calendar=connected#calendar';
  if (role === 'employer') return '/employer/dashboard#calendar';
  return DEFAULT_CALLBACK_URL;
}

export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXTAUTH_URL ?? req.nextUrl.origin;
  const callbackUrl = req.nextUrl.searchParams.get('callbackUrl');
  const session = await auth();
  const redirectTo =
    callbackUrl && callbackUrl.startsWith('/') && !callbackUrl.startsWith('//')
      ? callbackUrl
      : getDefaultCallbackUrl(session?.user?.role ?? null);

  if (!session?.user?.id) {
    const loginUrl = new URL('/login', baseUrl);
    loginUrl.searchParams.set('callbackUrl', redirectTo);
    return NextResponse.redirect(loginUrl);
  }

  const redirectUrl = await signIn(
    'google',
    {
      redirect: false,
      redirectTo,
    },
    {
      prompt: 'consent',
      access_type: 'offline',
      response_type: 'code',
      scope: ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/calendar'].join(' '),
    }
  );

  if (typeof redirectUrl === 'string') {
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.redirect(new URL(redirectTo, baseUrl));
}
