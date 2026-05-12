import { NextResponse } from "next/server";
import { companySummaryUseCase } from "../../application/use-cases/companySummary.use-case";

export async function getCompanySummaryHandler(request: Request) {
  try {
    const url = new URL(request.url);
    const companyId = (url.searchParams.get("company_id") || url.searchParams.get("companyId") || "").trim();
    const summary = await companySummaryUseCase.getSummary(companyId || undefined);
    return NextResponse.json(summary);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
