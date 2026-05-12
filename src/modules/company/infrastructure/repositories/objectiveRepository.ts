import { Prisma } from "@/generated/prisma/client";
import prisma from "@/infrastructure/db/prisma/client";
import { ObjectiveRecord } from "../../domain/types";

export class ObjectiveRepository {
  async findByCompanyId(companyId: string): Promise<any[]> {
    return prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT
        o.objective_id::text,
        o.company_id::text,
        o.objective_code,
        o.objective_name,
        o.objective_description,
        o.rationale,
        o.sequence_order,
        o.is_active,
        o.created_at,
        o.updated_at,
        o.kpi,
        o.id_appetite::text,
        a.id::text AS appetite_id,
        a.appetite_level,
        a.tolerance_min,
        a.tolerance_max,
        a.metric_name,
        a.metric_unit,
        a.is_active AS appetite_status
      FROM public.company_objective o
      LEFT JOIN public.catalog_appetite a ON a.id = o.id_appetite
      WHERE o.company_id = ${companyId}::uuid
      ORDER BY o.sequence_order ASC NULLS LAST, o.objective_code ASC
    `);
  }

  async findById(objectiveId: string): Promise<any | null> {
    const rows = await prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT
        o.objective_id::text,
        o.company_id::text,
        o.objective_code,
        o.objective_name,
        o.objective_description,
        o.rationale,
        o.sequence_order,
        o.is_active,
        o.created_at,
        o.updated_at,
        o.kpi,
        o.id_appetite::text,
        a.id::text AS appetite_id,
        a.appetite_level,
        a.tolerance_min,
        a.tolerance_max,
        a.metric_name,
        a.metric_unit,
        a.is_active AS appetite_status
      FROM public.company_objective o
      LEFT JOIN public.catalog_appetite a ON a.id = o.id_appetite
      WHERE o.objective_id = ${objectiveId}::uuid
      LIMIT 1
    `);
    return rows[0] || null;
  }

  async countByCompanyId(companyId: string): Promise<number> {
    const rows = await prisma.$queryRaw<Array<{ total: number }>>(Prisma.sql`
      SELECT COUNT(*)::int AS total
      FROM public.company_objective
      WHERE company_id = ${companyId}::uuid
    `);
    return Number(rows[0]?.total || 0);
  }

  async create(data: Partial<ObjectiveRecord>): Promise<string> {
    const rows = await prisma.$queryRaw<Array<{ objective_id: string }>>(Prisma.sql`
      INSERT INTO public.company_objective (
        company_id,
        objective_code,
        objective_name,
        objective_description,
        kpi,
        sequence_order,
        is_active,
        rationale,
        id_appetite,
        created_at,
        updated_at
      )
      VALUES (
        ${data.company_id}::uuid,
        ${data.objective_code},
        ${data.objective_name},
        ${data.objective_description},
        ${data.kpi},
        ${data.sequence_order},
        ${data.is_active ?? true},
        ${data.rationale},
        ${data.id_appetite}::uuid,
        NOW(),
        NOW()
      )
      RETURNING objective_id::text
    `);
    return rows[0].objective_id;
  }

  async update(objectiveId: string, data: Partial<ObjectiveRecord>): Promise<void> {
    await prisma.$executeRaw(Prisma.sql`
      UPDATE public.company_objective
      SET
        objective_name = COALESCE(${data.objective_name}, objective_name),
        objective_description = ${data.objective_description},
        kpi = ${data.kpi},
        sequence_order = ${data.sequence_order},
        is_active = COALESCE(${data.is_active}, is_active),
        id_appetite = ${data.id_appetite}::uuid,
        updated_at = NOW()
      WHERE objective_id = ${objectiveId}::uuid
    `);
  }

  async delete(objectiveId: string): Promise<void> {
    await prisma.$executeRaw(Prisma.sql`
      DELETE FROM public.company_objective
      WHERE objective_id = ${objectiveId}::uuid
    `);
  }

  async findAppetiteById(appetiteId: string): Promise<boolean> {
    const found = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT id::text
      FROM public.catalog_appetite
      WHERE id = ${appetiteId}::uuid
      LIMIT 1
    `);
    return found.length > 0;
  }
}
