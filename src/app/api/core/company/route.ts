import { getCompanyHandler, createCompanyHandler, updateCompanyHandler, deleteCompanyHandler } from "@/modules/company/api/handlers";

export async function GET() {
  return getCompanyHandler();
}

export async function POST(request: Request) {
  return createCompanyHandler(request);
}

export async function PUT(request: Request) {
  return updateCompanyHandler(request);
}

export async function DELETE(request: Request) {
  return deleteCompanyHandler(request);
}
