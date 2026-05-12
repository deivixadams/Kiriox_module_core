import {
  getProbabilitiesHandler,
  createProbabilityHandler,
  updateProbabilityHandler,
  deleteProbabilityHandler,
} from "@/modules/catalog/api/handlers/probabilityHandlers";

export const dynamic = "force-dynamic";

export async function GET() {
  return getProbabilitiesHandler();
}

export async function POST(request: Request) {
  return createProbabilityHandler(request);
}

export async function PUT(request: Request) {
  return updateProbabilityHandler(request);
}

export async function DELETE(request: Request) {
  return deleteProbabilityHandler(request);
}
