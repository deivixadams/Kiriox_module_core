import {
  getControlTypesHandler,
  createControlTypeHandler,
  updateControlTypeHandler,
  deleteControlTypeHandler,
} from "@/modules/catalog/api/handlers";

export const dynamic = "force-dynamic";

export async function GET() {
  return getControlTypesHandler();
}

export async function POST(request: Request) {
  return createControlTypeHandler(request);
}

export async function PUT(request: Request) {
  return updateControlTypeHandler(request);
}

export async function DELETE(request: Request) {
  return deleteControlTypeHandler(request);
}
