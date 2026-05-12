import { withAccess } from "@/shared/http/withAccess";
import { ok, created } from "@/shared/http";
import { PrismaLinearRiskRepository } from "../../infrastructure/repositories/PrismaLinearRiskRepository";

const repo = new PrismaLinearRiskRepository();

export const GET = withAccess(async (request, access) => {
  const { searchParams } = new URL(request.url);
  const runRaId = searchParams.get('runRaId');
  const riskId = searchParams.get('riskId') || undefined;

  if (!runRaId) return new Response('runRaId is required', { status: 400 });

  const data = await repo.getControlAnalysisData(runRaId, access.company.id, riskId);
  return ok(data);
});

export const POST = withAccess(async (request) => {
  const body = await request.json();
  const { action, runRaId, riskId, ...data } = body;

  if (!runRaId || !riskId) return new Response('runRaId and riskId are required', { status: 400 });

  if (action === 'create_control') {
    const id = await repo.createNewControlForRisk(runRaId, riskId, data);
    return created({ ok: true, id });
  } else {
    await repo.upsertControlAnalysis(runRaId, riskId, data);
    return ok({ ok: true });
  }
});

export const DELETE = withAccess(async (request) => {
  const { searchParams } = new URL(request.url);
  const runRaId = searchParams.get('runRaId');
  const riskId = searchParams.get('riskId');
  const controlId = searchParams.get('controlId');

  if (!runRaId || !riskId || !controlId) return new Response('runRaId, riskId and controlId are required', { status: 400 });

  await repo.deleteControlMapping(runRaId, riskId, controlId);
  return ok({ ok: true });
});
