import { withAccess } from "@/shared/http/withAccess";
import { ok } from "@/shared/http";
import { PrismaLinearRiskRepository } from "../../infrastructure/repositories/PrismaLinearRiskRepository";
import { GetLinearRiskEvaluationsUseCase } from "../../application/use-cases/GetLinearRiskEvaluationsUseCase";

const repository = new PrismaLinearRiskRepository();
const getEvaluationsUseCase = new GetLinearRiskEvaluationsUseCase(repository);

export const GET = withAccess(async (request, access) => {
  const { searchParams } = new URL(request.url);
  const elementId = searchParams.get("elementId") || undefined;
  const activityId = searchParams.get("activityId") || undefined;

  const result = await getEvaluationsUseCase.execute(
    access.company.id,
    elementId,
    activityId
  );

  return ok(result);
});
