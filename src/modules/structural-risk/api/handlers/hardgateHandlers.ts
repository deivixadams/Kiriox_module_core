import { NextResponse } from 'next/server';
import type { AccessContext } from '@/shared/http/withAccess';
import { PrismaHardgateRepository } from '@/modules/structural-risk/infrastructure/repositories/PrismaHardgateRepository';

function toUuid(value: unknown): string | null {
  const v = String(value ?? '').trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v) ? v : null;
}

export async function getHardgateHandler(request: Request, access: AccessContext) {
  const url = new URL(request.url);
  const runSaId = toUuid(url.searchParams.get('runSaId'));
  if (!runSaId) return NextResponse.json({ error: 'runSaId inválido.' }, { status: 400 });

  const repo = new PrismaHardgateRepository();
  const evaluations = await repo.getHardgates(runSaId, access.company.id);
  return NextResponse.json({ evaluations });
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

  const repo = new PrismaHardgateRepository();
  const exists = await repo.verifyRun(runSaId, access.company.id);
  if (!exists) return NextResponse.json({ error: 'Run no encontrado.' }, { status: 404 });

  await repo.upsertHardgate({
    runSaId,
    controlId,
    riskCascadeId,
    isHardGate: Boolean(body.isHardGate),
    answeredYesQuestion: typeof body.answeredYesQuestion === 'string' ? body.answeredYesQuestion : null,
    hardgateReason: typeof body.hardgateReason === 'string' ? body.hardgateReason : null,
  });

  return NextResponse.json({ ok: true });
}
