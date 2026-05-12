import { NextResponse } from "next/server";
import { ObjectiveUseCase } from "../../application/use-cases/objective.use-case";
import { ObjectiveRepository } from "../../infrastructure/repositories/objectiveRepository";

const repository = new ObjectiveRepository();
const useCase = new ObjectiveUseCase(repository);

export async function getObjectivesHandler(request: Request) {
  try {
    const url = new URL(request.url);
    const companyId = url.searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json({ error: "companyId is required" }, { status: 400 });
    }

    const data = await useCase.getByCompany(companyId);
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Handler Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function createObjectiveHandler(request: Request) {
  try {
    const body = await request.json();
    const data = await useCase.create(body);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Handler Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function updateObjectiveHandler(request: Request) {
  try {
    const body = await request.json();
    const { objective_id, ...fields } = body;
    if (!objective_id) {
      return NextResponse.json({ error: "objective_id is required" }, { status: 400 });
    }
    const data = await useCase.update(objective_id, fields);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Handler Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function deleteObjectiveHandler(request: Request) {
  try {
    const url = new URL(request.url);
    const objectiveId = url.searchParams.get("objectiveId");
    if (!objectiveId) {
      return NextResponse.json({ error: "objectiveId is required" }, { status: 400 });
    }
    await useCase.delete(objectiveId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Handler Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
