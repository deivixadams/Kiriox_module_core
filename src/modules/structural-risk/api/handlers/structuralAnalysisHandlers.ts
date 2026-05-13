import { NextResponse } from 'next/server';
import { Prisma } from '@/generated/prisma/client';
import prisma from '@/infrastructure/db/prisma/client';
import type { AccessContext } from '@/shared/http/withAccess';

function toUuid(value: unknown): string | null {
  const v = String(value ?? '').trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v) ? v : null;
}

export async function getStructuralAnalysisResultHandler(request: Request, access: AccessContext) {
  const url = new URL(request.url);
  const runSaId = toUuid(url.searchParams.get('runSaId'));
  if (!runSaId) return NextResponse.json({ error: 'runSaId inválido.' }, { status: 400 });

  try {
    const rows = await prisma.$queryRaw<Array<{ result: unknown }>>(Prisma.sql`
      SELECT public.fn_structural_analysis(${runSaId}::uuid) AS result
    `);

    const result = rows[0]?.result;
    if (!result) {
      return NextResponse.json(
        { error: 'No se pudo obtener el análisis estructural.' },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    const e = error as { code?: string; message?: string; meta?: { code?: string; message?: string; cause?: string } };
    const dbCode = e?.meta?.code;
    const msg = `${e?.message ?? ''} ${e?.meta?.message ?? ''} ${e?.meta?.cause ?? ''}`;
    const missingFn = dbCode === '42883' || msg.includes('42883') || msg.includes('fn_structural_analysis');
    if (e?.code === 'P2010' && missingFn) {
      return NextResponse.json(
        {
          error: 'Motor SQL no desplegado',
          message:
            'La función public.fn_structural_analysis(uuid) no existe en esta base. Ejecuta el script prisma/create_structural_analysis_engine.sql en interval_db y reintenta.',
          expected_function: 'public.fn_structural_analysis(uuid)',
        },
        { status: 503 }
      );
    }
    throw error;
  }
}
