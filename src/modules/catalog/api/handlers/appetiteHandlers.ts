import { NextResponse } from "next/server";
import { catalogAppetiteUseCase } from "../../application/use-cases/appetite.use-case";

export async function getAppetitesHandler() {
  try {
    const data = await catalogAppetiteUseCase.getAll();
    return NextResponse.json({ items: data, data: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function createAppetiteHandler(request: Request) {
  try {
    const body = await request.json();
    const data = await catalogAppetiteUseCase.create(body);
    return NextResponse.json({ item: data, data: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function updateAppetiteHandler(request: Request) {
  try {
    const body = await request.json();
    const id = body.id;
    if (!id) return NextResponse.json({ error: "id inválido" }, { status: 400 });
    const data = await catalogAppetiteUseCase.update(id, body);
    if (!data) return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 });
    return NextResponse.json({ item: data, data: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function deleteAppetiteHandler(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id inválido" }, { status: 400 });
    await catalogAppetiteUseCase.delete(id);
    return NextResponse.json({ ok: true, success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
