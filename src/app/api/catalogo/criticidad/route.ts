import {
  getCriticalitiesHandler,
  createCriticalityHandler,
  updateCriticalityHandler,
  deleteCriticalityHandler,
} from "@/modules/catalog/api/handlers";

export const dynamic = "force-dynamic";

export async function GET() {
  return getCriticalitiesHandler();
}

export async function POST(request: Request) {
  return createCriticalityHandler(request);
}

export async function PUT(request: Request) {
  return updateCriticalityHandler(request);
}

export async function DELETE(request: Request) {
  return deleteCriticalityHandler(request);
}
