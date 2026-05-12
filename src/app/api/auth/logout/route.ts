import { NextResponse } from 'next/server';
import { getAuthCookieName, getCsrfCookieName } from '@/core/auth/auth-server';

export async function POST() {
  const response = NextResponse.json({ success: true });

  const expired = {
    httpOnly: true,
    sameSite: 'strict' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  };

  response.cookies.set(getAuthCookieName(), '', expired);
  response.cookies.set(getCsrfCookieName(), '', { ...expired, httpOnly: false });

  return response;
}
