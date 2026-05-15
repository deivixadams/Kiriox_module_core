import { NextResponse } from 'next/server';
import prisma from '@/infrastructure/db/prisma/client';
import { getAuthContext } from '@/core/auth/auth-server';

function isAdmin(roleCode: string) {
  const code = (roleCode || '').trim().toLowerCase();
  return code === 'admin' || code === 'super_admin';
}

export async function POST(request: Request) {
  const auth = await getAuthContext();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAdmin(auth.roleCode)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const { userId, roleId } = await request.json();
    if (!userId || !roleId) {
      return NextResponse.json({ error: 'userId y roleId son obligatorios' }, { status: 400 });
    }

    const existing = await prisma.map_users_x_roles.findFirst({
      where: { user_id: userId, role_id: roleId }
    });

    if (existing) {
      await prisma.map_users_x_roles.update({
        where: { id: existing.id },
        data: { is_active: true }
      });
    } else {
      await prisma.map_users_x_roles.create({
        data: { user_id: userId, role_id: roleId, is_active: true }
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Internal server error', details: msg }, { status: 500 });
  }
}
