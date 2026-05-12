import {
  getImpactsHandler,
  createImpactHandler,
  updateImpactHandler,
  deleteImpactHandler,
} from "@/modules/catalog/api/handlers";

export const dynamic = "force-dynamic";

export async function GET() {
  return getImpactsHandler();
}

export async function POST(request: Request) {
  return createImpactHandler(request);
}

export async function PUT(request: Request) {
  return updateImpactHandler(request);
}

export async function DELETE(request: Request) {
  return deleteImpactHandler(request);
}
