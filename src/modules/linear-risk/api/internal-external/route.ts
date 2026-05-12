import { withAccess } from "@/shared/http/withAccess";
import { ok, created } from "@/shared/http";
import { PrismaLinearRiskRepository } from "../../infrastructure/repositories/PrismaLinearRiskRepository";

const repository = new PrismaLinearRiskRepository();

const EXTERNAL_CATEGORIES = ['regulacion', 'mercado', 'economia', 'competencia'] as const;
const INTERNAL_CATEGORIES = ['recursos', 'capacidades', 'procesos', 'sistemas', 'personas_clave'] as const;

export const GET = withAccess(async (req) => {
  const url = new URL(req.url);
  const runRaId = url.searchParams.get("runRaId");
  const type = url.searchParams.get("type") || "INTERNAL";

  if (!runRaId) return new Response("runRaId is required", { status: 400 });

  const rows = await repository.getInternalExternalContext(runRaId, type);
  const context: Record<string, string> = {};

  for (const row of rows) {
    context[row.factor_category] = row.factor_name ?? "";
  }

  return ok({ context });
});

export const POST = withAccess(async (req) => {
  const body = await req.json();
  const { runRaId, type } = body;

  if (!runRaId) return new Response("runRaId is required", { status: 400 });
  if (!type) return new Response("type is required", { status: 400 });

  const categories = type === 'EXTERNAL' ? EXTERNAL_CATEGORIES : INTERNAL_CATEGORIES;
  const values = categories
    .map((category) => ({
      category,
      text: String((body as Record<string, unknown>)[category] ?? '').trim(),
    }))
    .filter((item) => item.text.length > 0);

  await repository.upsertInternalExternalContext(runRaId, type, values);

  return created({ ok: true });
});
