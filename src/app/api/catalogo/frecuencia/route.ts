import {
  getFrequenciesHandler,
  createFrequencyHandler,
  updateFrequencyHandler,
  deleteFrequencyHandler,
} from "@/modules/catalog/api/handlers";

export const dynamic = "force-dynamic";

export async function GET() {
  return getFrequenciesHandler();
}

export async function POST(request: Request) {
  return createFrequencyHandler(request);
}

export async function PUT(request: Request) {
  return updateFrequencyHandler(request);
}

export async function DELETE(request: Request) {
  return deleteFrequencyHandler(request);
}
