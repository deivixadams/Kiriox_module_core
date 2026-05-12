import { NextResponse } from "next/server";
import { catalogImpactUseCase } from "../../application/use-cases/impact.use-case";

export async function getImpactsHandler() {
  try {
    const data = await catalogImpactUseCase.getAll();
    const serializedData = JSON.parse(
      JSON.stringify(data, (key, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    );
    return NextResponse.json({ items: serializedData, data: serializedData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function createImpactHandler(request: Request) {
  try {
    const body = await request.json();
    const data = await catalogImpactUseCase.create(body);
    const serializedData = JSON.parse(
      JSON.stringify(data, (key, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    );
    return NextResponse.json({ item: serializedData, data: serializedData }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function updateImpactHandler(request: Request) {
  try {
    const body = await request.json();
    const id = Number(body.catalog_impact_id);
    if (!id) return NextResponse.json({ error: "id inválido" }, { status: 400 });
    const data = await catalogImpactUseCase.update(id, body);
    if (!data) return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 });
    const serializedData = JSON.parse(
      JSON.stringify(data, (key, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    );
    return NextResponse.json({ item: serializedData, data: serializedData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function deleteImpactHandler(request: Request) {
  try {
    const url = new URL(request.url);
    const id = Number(url.searchParams.get("id"));
    if (!id) return NextResponse.json({ error: "id inválido" }, { status: 400 });
    await catalogImpactUseCase.delete(id);
    return NextResponse.json({ ok: true, success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
