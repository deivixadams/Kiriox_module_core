import { getLinearRiskDashboardHandler } from "@/modules/linear-risk/api/handlers/linearRiskHandlers";

export async function GET() {
  return getLinearRiskDashboardHandler();
}
