import { NextResponse } from "next/server";
import { catalogProbabilityUseCase } from "../../application/use-cases/probability.use-case";

export async function getProbabilitiesHandler() {
  try {
    const data = await catalogProbabilityUseCase.getAll();
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

export async function createProbabilityHandler(request: Request) {
  try {
    const body = await request.json();
    const data = await catalogProbabilityUseCase.create(body);
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

export async function updateProbabilityHandler(request: Request) {
  try {
    const body = await request.json();
    const id = Number(body.catalog_probability_id);
    if (!id) return NextResponse.json({ error: "id inválido" }, { status: 400 });
    const data = await catalogProbabilityUseCase.update(id, body);
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

export async function deleteProbabilityHandler(request: Request) {
  try {
    const url = new URL(request.url);
    const id = Number(url.searchParams.get("id"));
    if (!id) return NextResponse.json({ error: "id inválido" }, { status: 400 });
    await catalogProbabilityUseCase.delete(id);
    return NextResponse.json({ ok: true, success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
