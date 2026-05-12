import { withAccess } from "@/shared/http/withAccess";
import { ok, created } from "@/shared/http";
import { PrismaLinearRiskRepository } from "../../infrastructure/repositories/PrismaLinearRiskRepository";

const repository = new PrismaLinearRiskRepository();

export const POST = withAccess(async (request, access) => {
  const { searchParams } = new URL(request.url);
  const forceNew = searchParams.get("forceNew") === "true";

  const result = await repository.createEvaluation(access.company.id, forceNew);

  return created(result);
});

export const DELETE = withAccess(async (request) => {
  const body = await request.json();
  const { id } = body;

  if (!id) return new Response("ID is required", { status: 400 });

  await repository.deleteEvaluation(id);
  return ok({ deleted: true });
});
