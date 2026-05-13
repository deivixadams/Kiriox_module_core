import { NextResponse } from 'next/server';
import { Prisma } from '@/generated/prisma/client';
import prisma from '@/infrastructure/db/prisma/client';
import type { AccessContext } from '@/shared/http/withAccess';

function toUuid(value: unknown): string | null {
  const v = String(value ?? '').trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v) ? v : null;
}

export async function getHardgateHandler(request: Request, access: AccessContext) {
  const url = new URL(request.url);
  const runSaId = toUuid(url.searchParams.get('runSaId'));
  if (!runSaId) return NextResponse.json({ error: 'runSaId inválido.' }, { status: 400 });

  const rows = await prisma.$queryRaw<Array<{
    id: string;
    run_id: string;
    risk_cascade_id: string;
    control_id: string;
    is_hard_gate: boolean;
    hardgate_reason: string | null;
    answered_yes_question: string | null;
  }>>(Prisma.sql`
    SELECT
      h.id::text,
      h.run_id::text,
      h.risk_cascade_id::text,
      h.control_id::text,
      h.is_hard_gate,
      h.hardgate_reason,
      h.answered_yes_question
    FROM public.graph_control_hardgate h
    JOIN public.graph_run_sa r ON r.id = h.run_id
    WHERE h.run_id = ${runSaId}::uuid
      AND r.company_id = ${access.company.id}::uuid
  `);

  return NextResponse.json({ evaluations: rows });
}

export async function patchHardgateHandler(request: Request, access: AccessContext) {
  const body = (await request.json()) as {
    runSaId?: string;
    controlId?: string;
    riskCascadeId?: string;
    isHardGate?: boolean;
    answeredYesQuestion?: string | null;
    hardgateReason?: string | null;
  };

  const runSaId = toUuid(body.runSaId);
  const controlId = toUuid(body.controlId);
  const riskCascadeId = toUuid(body.riskCascadeId);
  if (!runSaId || !controlId || !riskCascadeId) {
    return NextResponse.json({ error: 'runSaId, controlId y riskCascadeId son obligatorios.' }, { status: 400 });
  }

  const isHardGate = Boolean(body.isHardGate);
  const answeredYesQuestion = typeof body.answeredYesQuestion === 'string' ? body.answeredYesQuestion : null;
  const hardgateReason = typeof body.hardgateReason === 'string' ? body.hardgateReason : null;

  const runRows = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT id::text FROM public.graph_run_sa
    WHERE id = ${runSaId}::uuid AND company_id = ${access.company.id}::uuid
    LIMIT 1
  `);
  if (!runRows[0]) return NextResponse.json({ error: 'Run no encontrado.' }, { status: 404 });

  await prisma.$executeRaw(Prisma.sql`
    INSERT INTO public.graph_control_hardgate (
      id, run_id, risk_cascade_id, control_id,
      is_hard_gate, hardgate_reason, answered_yes_question,
      created_at, updated_at
    ) VALUES (
      gen_random_uuid(), ${runSaId}::uuid, ${riskCascadeId}::uuid, ${controlId}::uuid,
      ${isHardGate}, ${hardgateReason}, ${answeredYesQuestion},
      now(), now()
    )
    ON CONFLICT (run_id, control_id) DO UPDATE SET
      risk_cascade_id        = EXCLUDED.risk_cascade_id,
      is_hard_gate           = EXCLUDED.is_hard_gate,
      hardgate_reason        = EXCLUDED.hardgate_reason,
      answered_yes_question  = EXCLUDED.answered_yes_question,
      updated_at             = now()
  `);

  return NextResponse.json({ ok: true });
}
