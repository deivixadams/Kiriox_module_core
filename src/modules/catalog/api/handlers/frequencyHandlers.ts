import { NextResponse } from "next/server";
import { catalogFrequencyUseCase } from "../../application/use-cases/frequency.use-case";

export async function getFrequenciesHandler() {
  try {
    const data = await catalogFrequencyUseCase.getAll();
    return NextResponse.json({ items: data, data: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function createFrequencyHandler(request: Request) {
  try {
    const body = await request.json();
    const data = await catalogFrequencyUseCase.create(body);
    return NextResponse.json({ item: data, data: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function updateFrequencyHandler(request: Request) {
  try {
    const body = await request.json();
    const id = body.id;
    if (!id) return NextResponse.json({ error: "id inválido" }, { status: 400 });
    const data = await catalogFrequencyUseCase.update(id, body);
    if (!data) return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 });
    return NextResponse.json({ item: data, data: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function deleteFrequencyHandler(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id inválido" }, { status: 400 });
    await catalogFrequencyUseCase.delete(id);
    return NextResponse.json({ ok: true, success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
