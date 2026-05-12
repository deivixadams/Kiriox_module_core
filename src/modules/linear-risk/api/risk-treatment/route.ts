import { withAccess } from "@/shared/http/withAccess";
import { ok, created } from "@/shared/http";
import { PrismaLinearRiskRepository } from "../../infrastructure/repositories/PrismaLinearRiskRepository";

const repo = new PrismaLinearRiskRepository();

export const GET = withAccess(async (request) => {
  const { searchParams } = new URL(request.url);
  const runRaId = searchParams.get('runRaId');
  const riskId = searchParams.get('riskId');

  if (!runRaId || !riskId) return new Response('runRaId and riskId are required', { status: 400 });

  const actions = await repo.getRiskTreatmentActions(runRaId, riskId);
  return ok({ actions });
});

export const POST = withAccess(async (request) => {
  const body = await request.json();
  const { runRaId, riskId, ...data } = body;

  if (!runRaId || !riskId) return new Response('runRaId and riskId are required', { status: 400 });

  const id = await repo.upsertRiskTreatmentAction(runRaId, riskId, data);
  return created({ ok: true, id });
});

export const DELETE = withAccess(async (request) => {
  const { searchParams } = new URL(request.url);
  const runRaId = searchParams.get('runRaId');
  const id = searchParams.get('id');

  if (!runRaId || !id) return new Response('runRaId and id are required', { status: 400 });

  await repo.deleteRiskTreatmentAction(runRaId, id);
  return ok({ ok: true });
});
