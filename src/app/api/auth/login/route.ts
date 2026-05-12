import { NextResponse } from 'next/server';
import { Prisma } from '@/generated/prisma/client';
import prisma from '@/infrastructure/db/prisma/client';
import { verifyPassword } from '@/core/auth/password';
import { signAuthToken, getAuthCookieName, getCsrfCookieName } from '@/core/auth/auth-server';
import { createCsrfToken } from '@/core/auth/csrf';

const DEFAULT_COMPANY_ID = '05cb4cc6-c215-4d41-84b3-98c6013cda27';
const DEFAULT_ADMIN_EMAIL = 'admin@intervalafi.com';
const DEFAULT_ADMIN_USERNAME = 'admin';
const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 10;

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: string; username?: string; password?: string; company_id?: string };
    const { email, username, password, company_id } = body;
    const identifier = String(email ?? username ?? '').trim().toLowerCase();
    const selectedCompanyId = String(company_id ?? '').trim();

    if (!identifier || !password) {
      return NextResponse.json({ error: 'Faltan credenciales' }, { status: 400 });
    }

    type UserRow = { id: string; email: string | null; username: string | null; password_hash: string; is_active: boolean | null; company_id: string | null };
    const users = await prisma.$queryRaw<UserRow[]>(Prisma.sql`
      SELECT
        u.id::text,
        u.email,
        u.username,
        u.password_hash,
        COALESCE(u.is_active, true) AS is_active,
        u.company_id::text
      FROM public.users u
      WHERE LOWER(COALESCE(u.email, '')) = ${identifier}
         OR LOWER(COALESCE(u.username, '')) = ${identifier}
      LIMIT 1
    `);

    const user = users[0];
    if (!user?.is_active) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    const isValid = await verifyPassword(String(password), user.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    await prisma.$executeRaw(Prisma.sql`
      UPDATE public.users SET last_login_at = NOW() WHERE id = ${user.id}::uuid
    `);

    const isDefaultAdmin =
      user.email?.toLowerCase() === DEFAULT_ADMIN_EMAIL &&
      user.username?.toLowerCase() === DEFAULT_ADMIN_USERNAME;

    const tenantId =
      selectedCompanyId ||
      user.company_id ||
      (isDefaultAdmin ? DEFAULT_COMPANY_ID : DEFAULT_COMPANY_ID);

    const token = await signAuthToken({
      userId: user.id,
      tenantId,
      roleCode: 'ADMIN',
      email: user.email ?? undefined,
    });
    const csrfToken = createCsrfToken();

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, username: user.username },
      message: 'Inicio de sesión exitoso',
    });

    const cookieOpts = {
      httpOnly: true,
      sameSite: 'strict' as const,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: AUTH_COOKIE_MAX_AGE,
    };

    response.cookies.set(getAuthCookieName(), token, cookieOpts);
    response.cookies.set(getCsrfCookieName(), csrfToken, { ...cookieOpts, httpOnly: false });

    return response;
  } catch (err: unknown) {
    const message = process.env.NODE_ENV === 'production'
      ? 'Error interno del servidor'
      : (err instanceof Error ? err.message : 'Error interno del servidor');
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
