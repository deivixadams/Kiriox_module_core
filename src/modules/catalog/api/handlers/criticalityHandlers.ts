import { NextResponse } from "next/server";
import { catalogCriticalityUseCase } from "../../application/use-cases/criticality.use-case";

export async function getCriticalitiesHandler() {
  try {
    const data = await catalogCriticalityUseCase.getAll();
    return NextResponse.json({ items: data, data: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function createCriticalityHandler(request: Request) {
  try {
    const body = await request.json();
    const data = await catalogCriticalityUseCase.create(body);
    return NextResponse.json({ item: data, data: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function updateCriticalityHandler(request: Request) {
  try {
    const body = await request.json();
    const id = body.id;
    if (!id) return NextResponse.json({ error: "id inválido" }, { status: 400 });
    const data = await catalogCriticalityUseCase.update(id, body);
    if (!data) return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 });
    return NextResponse.json({ item: data, data: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function deleteCriticalityHandler(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id inválido" }, { status: 400 });
    await catalogCriticalityUseCase.delete(id);
    return NextResponse.json({ ok: true, success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
