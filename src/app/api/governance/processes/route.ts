import { NextResponse } from 'next/server';
import prisma from '@/infrastructure/db/prisma/client';
import { getAuthContext } from '@/core/auth/auth-server';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  const auth = await getAuthContext();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const companyId = (searchParams.get('company_id') || searchParams.get('companyId') || '').trim();

  if (!companyId || !UUID_REGEX.test(companyId)) {
    return NextResponse.json({ items: [] });
  }

  try {
    const processes = await prisma.elements.findMany({
      where: { company_id: companyId },
      include: { element_types: true, _count: { select: { activities: true } } },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({
      items: processes.map(p => ({
        id: p.id,
        code: p.code,
        name: p.name,
        description: p.description ?? '',
        isActive: p.is_active,
        activitiesCount: p._count.activities,
        createdAt: p.created_at.toISOString(),
        updatedAt: p.updated_at.toISOString(),
        elementTypeName: p.element_types?.name ?? 'General',
        elementTypeCode: p.element_types?.code ?? 'GEN',
      })),
    });
  } catch (error: unknown) {
    console.error('Error fetching governance processes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
