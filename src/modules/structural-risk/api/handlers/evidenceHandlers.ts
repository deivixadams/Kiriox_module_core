import { NextResponse } from 'next/server';
import { Prisma } from '@/generated/prisma/client';
import prisma from '@/infrastructure/db/prisma/client';
import type { AccessContext } from '@/shared/http/withAccess';

function toUuid(value: unknown): string | null {
  const v = String(value ?? '').trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v) ? v : null;
}

// Maps the 5 evidence boolean answers to specific columns.
// answers[0] → evidence_exists
// answers[1] → evidence_current
// answers[2] → evidence_sufficient
// answers[3] → evidence_traceable
// answers[4] → evidence_capture_mode ('automatic' if true, 'manual' otherwise)
// evidence_strength = (count of truthy in answers[0..3]) / 4

export async function getEvidenceHandler(request: Request, access: AccessContext) {
  const url = new URL(request.url);
  const runSaId = toUuid(url.searchParams.get('runSaId'));
  if (!runSaId) return NextResponse.json({ error: 'runSaId inválido.' }, { status: 400 });

  const rows = await prisma.$queryRaw<Array<{
    control_id: string;
    evidence_exists: boolean;
    evidence_current: boolean;
    evidence_sufficient: boolean;
    evidence_traceable: boolean;
    evidence_capture_mode: string;
    evidence_strength: number;
    evidence_notes: string | null;
    is_hard_gate: boolean;
  }>>(Prisma.sql`
    SELECT
      e.control_id::text,
      e.evidence_exists,
      e.evidence_current,
      e.evidence_sufficient,
      e.evidence_traceable,
      e.evidence_capture_mode,
      e.evidence_strength,
      e.evidence_notes,
      COALESCE(h.is_hard_gate, false) AS is_hard_gate
    FROM public.graph_control_evidence e
    JOIN public.graph_run_sa r ON r.id = e.run_id
    LEFT JOIN public.graph_control_hardgate h
      ON h.run_id = e.run_id AND h.control_id = e.control_id
    WHERE e.run_id = ${runSaId}::uuid
      AND r.company_id = ${access.company.id}::uuid
  `);

  const evaluations = rows.map((row) => ({
    control_id: row.control_id,
    is_hard_gate: row.is_hard_gate,
    answered_yes_question: JSON.stringify([
      row.evidence_exists,
      row.evidence_current,
      row.evidence_sufficient,
      row.evidence_traceable,
      row.evidence_capture_mode === 'automatic',
    ]),
  }));

  return NextResponse.json({ evaluations });
}

export async function patchEvidenceHandler(request: Request, access: AccessContext) {
  const body = (await request.json()) as {
    runSaId?: string;
    controlId?: string;
    riskCascadeId?: string;
    answeredYesQuestion?: string | null;
    evidenceNotes?: string | null;
  };

  const runSaId = toUuid(body.runSaId);
  const controlId = toUuid(body.controlId);
  const riskCascadeId = toUuid(body.riskCascadeId);
  if (!runSaId || !controlId || !riskCascadeId) {
    return NextResponse.json({ error: 'runSaId, controlId y riskCascadeId son obligatorios.' }, { status: 400 });
  }

  const runRows = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT id::text FROM public.graph_run_sa
    WHERE id = ${runSaId}::uuid AND company_id = ${access.company.id}::uuid
    LIMIT 1
  `);
  if (!runRows[0]) return NextResponse.json({ error: 'Run no encontrado.' }, { status: 404 });

  let answers: (boolean | null)[] = [null, null, null, null, null];
  try {
    const parsed = JSON.parse(body.answeredYesQuestion ?? 'null');
    if (Array.isArray(parsed)) answers = parsed;
  } catch { /* use defaults */ }

  const evidenceExists   = answers[0] === true;
  const evidenceCurrent  = answers[1] === true;
  const evidenceSufficient = answers[2] === true;
  const evidenceTraceable  = answers[3] === true;
  const captureMode = answers[4] === true ? 'automatic' : 'manual';
  const trueCount = [evidenceExists, evidenceCurrent, evidenceSufficient, evidenceTraceable].filter(Boolean).length;
  const evidenceStrength = trueCount / 4;
  const evidenceNotes = typeof body.evidenceNotes === 'string' ? body.evidenceNotes : null;

  await prisma.$executeRaw(Prisma.sql`
    INSERT INTO public.graph_control_evidence (
      evidence_eval_id, run_id, risk_cascade_id, control_id,
      evidence_exists, evidence_current, evidence_sufficient, evidence_traceable,
      evidence_capture_mode, evidence_strength, evidence_notes,
      created_at, updated_at
    ) VALUES (
      gen_random_uuid(), ${runSaId}::uuid, ${riskCascadeId}::uuid, ${controlId}::uuid,
      ${evidenceExists}, ${evidenceCurrent}, ${evidenceSufficient}, ${evidenceTraceable},
      ${captureMode}, ${evidenceStrength}, ${evidenceNotes},
      now(), now()
    )
    ON CONFLICT (run_id, control_id) DO UPDATE SET
      risk_cascade_id      = EXCLUDED.risk_cascade_id,
      evidence_exists      = EXCLUDED.evidence_exists,
      evidence_current     = EXCLUDED.evidence_current,
      evidence_sufficient  = EXCLUDED.evidence_sufficient,
      evidence_traceable   = EXCLUDED.evidence_traceable,
      evidence_capture_mode = EXCLUDED.evidence_capture_mode,
      evidence_strength    = EXCLUDED.evidence_strength,
      evidence_notes       = EXCLUDED.evidence_notes,
      updated_at           = now()
  `);

  return NextResponse.json({ ok: true });
}
