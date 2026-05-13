import { NextResponse } from 'next/server';
import type { AccessContext } from '@/shared/http/withAccess';
import { PrismaEvidenceRepository } from '@/modules/structural-risk/infrastructure/repositories/PrismaEvidenceRepository';

function toUuid(value: unknown): string | null {
  const v = String(value ?? '').trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v) ? v : null;
}

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

  const repo = new PrismaEvidenceRepository();
  const rows = await repo.getEvidence(runSaId, access.company.id);

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

  const repo = new PrismaEvidenceRepository();
  const exists = await repo.verifyRun(runSaId, access.company.id);
  if (!exists) return NextResponse.json({ error: 'Run no encontrado.' }, { status: 404 });

  let answers: (boolean | null)[] = [null, null, null, null, null];
  try {
    const parsed = JSON.parse(body.answeredYesQuestion ?? 'null');
    if (Array.isArray(parsed)) answers = parsed;
  } catch { /* use defaults */ }

  const evidenceExists     = answers[0] === true;
  const evidenceCurrent    = answers[1] === true;
  const evidenceSufficient = answers[2] === true;
  const evidenceTraceable  = answers[3] === true;
  const captureMode        = answers[4] === true ? 'automatic' : 'manual';
  const trueCount          = [evidenceExists, evidenceCurrent, evidenceSufficient, evidenceTraceable].filter(Boolean).length;

  await repo.upsertEvidence({
    runSaId,
    controlId,
    riskCascadeId,
    evidenceExists,
    evidenceCurrent,
    evidenceSufficient,
    evidenceTraceable,
    captureMode,
    evidenceStrength: trueCount / 4,
    evidenceNotes: typeof body.evidenceNotes === 'string' ? body.evidenceNotes : null,
  });

  return NextResponse.json({ ok: true });
}
