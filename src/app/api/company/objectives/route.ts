import {
  createObjectiveHandler,
  deleteObjectiveHandler,
  getObjectivesHandler,
  updateObjectiveHandler,
} from "@/modules/company/api/handlers";

export async function GET(request: Request) {
  return getObjectivesHandler(request);
}

export async function POST(request: Request) {
  return createObjectiveHandler(request);
}

export async function PUT(request: Request) {
  return updateObjectiveHandler(request);
}

export async function DELETE(request: Request) {
  return deleteObjectiveHandler(request);
}
