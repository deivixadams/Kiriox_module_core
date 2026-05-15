import { NextResponse } from 'next/server';
import prisma from '@/infrastructure/db/prisma/client';
import { getAuthContext } from '@/core/auth/auth-server';

export async function GET() {
  const auth = await getAuthContext();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const companies = await prisma.company.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true, code: true },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ items: companies });
  } catch (error: unknown) {
    console.error('Error fetching governance companies:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
