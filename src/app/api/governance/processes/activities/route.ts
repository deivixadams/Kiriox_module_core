import { NextResponse } from 'next/server';
import prisma from '@/infrastructure/db/prisma/client';
import { Prisma } from '@/generated/prisma/client';
import { getAuthContext } from '@/core/auth/auth-server';

async function buildUniqueActivityCode(name: string): Promise<string> {
  const seed = name
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toUpperCase().replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '').replace(/_+/g, '_').slice(0, 40) || 'ACT';

  const rows = await prisma.$queryRaw<{ code: string }[]>(Prisma.sql`
    SELECT code FROM public.activities
    WHERE code = ${seed} OR code LIKE ${`${seed}_%`}
  `);

  const existing = new Set(rows.map(r => r.code));
  if (!existing.has(seed)) return seed;
  let suffix = 2;
  while (existing.has(`${seed}_${suffix}`)) suffix++;
  return `${seed}_${suffix}`;
}

export async function POST(request: Request) {
  const auth = await getAuthContext();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json() as {
      companyId?: string; elementId?: string; name?: string;
      description?: string; isActive?: boolean; ownerId?: string;
    };

    const companyId = String(body.companyId ?? '').trim();
    const elementId = String(body.elementId ?? '').trim();
    const name = String(body.name ?? '').trim();

    if (!companyId || !elementId || !name) {
      return NextResponse.json({ error: 'companyId, elementId y name son obligatorios' }, { status: 400 });
    }

    const code = await buildUniqueActivityCode(name);

    const act = await prisma.activities.create({
      data: {
        company_id: companyId,
        element_id: elementId,
        code,
        name,
        description: body.description ?? null,
        is_active: body.isActive !== false,
        owner_id: body.ownerId || null,
      },
    });

    return NextResponse.json({ item: act }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating activity:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
