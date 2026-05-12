import {
  getAppetitesHandler,
  createAppetiteHandler,
  updateAppetiteHandler,
  deleteAppetiteHandler,
} from "@/modules/catalog/api/handlers";

export const dynamic = "force-dynamic";

export async function GET() {
  return getAppetitesHandler();
}

export async function POST(request: Request) {
  return createAppetiteHandler(request);
}

export async function PUT(request: Request) {
  return updateAppetiteHandler(request);
}

export async function DELETE(request: Request) {
  return deleteAppetiteHandler(request);
}
