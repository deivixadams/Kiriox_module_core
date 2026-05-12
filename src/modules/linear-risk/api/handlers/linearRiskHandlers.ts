import { NextResponse } from "next/server";
import { getAuthContext } from "@/core/auth/auth-server";
import { GetLinearRiskDashboardUseCase } from "../../application/use-cases/GetLinearRiskDashboardUseCase";
import { PrismaLinearRiskRepository } from "../../infrastructure/repositories/PrismaLinearRiskRepository";

export async function getLinearRiskDashboardHandler() {
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const useCase = new GetLinearRiskDashboardUseCase(new PrismaLinearRiskRepository());
  const result = await useCase.execute();
  
  return NextResponse.json(result);
}
