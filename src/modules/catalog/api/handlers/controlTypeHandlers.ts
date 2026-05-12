import { NextResponse } from "next/server";
import { catalogControlTypeUseCase } from "../../application/use-cases/control-type.use-case";

export async function getControlTypesHandler() {
  try {
    const data = await catalogControlTypeUseCase.getAll();
    return NextResponse.json({ items: data, data: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function createControlTypeHandler(request: Request) {
  try {
    const body = await request.json();
    const data = await catalogControlTypeUseCase.create(body);
    return NextResponse.json({ item: data, data: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function updateControlTypeHandler(request: Request) {
  try {
    const body = await request.json();
    const id = body.id;
    if (!id) return NextResponse.json({ error: "id inválido" }, { status: 400 });
    const data = await catalogControlTypeUseCase.update(id, body);
    if (!data) return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 });
    return NextResponse.json({ item: data, data: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function deleteControlTypeHandler(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id inválido" }, { status: 400 });
    await catalogControlTypeUseCase.delete(id);
    return NextResponse.json({ ok: true, success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
