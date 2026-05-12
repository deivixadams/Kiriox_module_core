import { getCompanySummaryHandler } from "@/modules/company/api/handlers";

export async function GET(request: Request) {
  return getCompanySummaryHandler(request);
}
