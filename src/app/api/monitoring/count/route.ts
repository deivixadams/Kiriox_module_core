import { NextResponse } from 'next/server';
import { Prisma } from '@/generated/prisma/client';
import prisma from '@/infrastructure/db/prisma/client';

export async function GET() {
  try {
    type CountRow = { count: number };
    const rows = await prisma.$queryRaw<CountRow[]>(Prisma.sql`
      SELECT COUNT(*)::int AS count FROM public.monitoring_event WHERE status = 'active'
    `);
    return NextResponse.json({ ok: true, count: rows[0]?.count ?? 0 });
  } catch {
    return NextResponse.json({ ok: true, count: 0 });
  }
}
