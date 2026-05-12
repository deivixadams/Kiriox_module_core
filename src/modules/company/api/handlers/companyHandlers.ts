import { NextResponse } from "next/server";
import { companyUseCase } from "../../application/use-cases/company.use-case";

export async function getCompanyHandler() {
  try {
    const items = await companyUseCase.getAll();
    return NextResponse.json({ items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function createCompanyHandler(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });
    const item = await companyUseCase.create({
      name,
      legalName: body.legalName,
      description: body.description,
      status: body.status,
      createdAt: body.createdAt,
      updatedAt: body.updatedAt,
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function updateCompanyHandler(request: Request) {
  try {
    const body = await request.json();
    const id = String(body.id ?? "").trim();
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
    const name = String(body.name ?? "").trim();
    if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });
    const item = await companyUseCase.update(id, {
      name,
      legalName: body.legalName,
      description: body.description,
      status: body.status,
      createdAt: body.createdAt,
      updatedAt: body.updatedAt,
    });
    return NextResponse.json({ item });
  } catch (error: any) {
    const status = error.message === "Company not found" ? 404 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function deleteCompanyHandler(request: Request) {
  try {
    const url = new URL(request.url);
    const id = String(url.searchParams.get("id") ?? "").trim();
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
    await companyUseCase.delete(id);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    const status = error.message === "Company not found" ? 404 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
