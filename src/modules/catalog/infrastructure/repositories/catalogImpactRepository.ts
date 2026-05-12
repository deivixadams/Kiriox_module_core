import prisma from "@/infrastructure/db/prisma/client";
import { CatalogImpact } from "../../domain/types";

export class CatalogImpactRepository {
  async findAll(): Promise<CatalogImpact[]> {
    const data = await (prisma as any).catalog_ra_impact.findMany({
      orderBy: { ordinal: "asc" },
    });
    return data;
  }

  async create(data: Partial<CatalogImpact>): Promise<CatalogImpact> {
    const result = await (prisma as any).catalog_ra_impact.create({
      data: {
        code: data.code || "",
        name: data.name,
        description: data.description,
        ordinal: Number(data.ordinal) || 0,
        numeric_value: Number(data.numeric_value) || 0,
        is_active: data.is_active !== false,
      },
    });
    return result;
  }

  async update(id: number, data: Partial<CatalogImpact>): Promise<CatalogImpact | null> {
    const result = await (prisma as any).catalog_ra_impact.update({
      where: { catalog_impact_id: BigInt(id) },
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        ordinal: Number(data.ordinal) || 0,
        numeric_value: Number(data.numeric_value) || 0,
        is_active: data.is_active !== undefined ? data.is_active : true,
      },
    });
    return result;
  }

  async delete(id: number): Promise<void> {
    await (prisma as any).catalog_ra_impact.delete({
      where: { catalog_impact_id: BigInt(id) },
    });
  }
}

export const catalogImpactRepository = new CatalogImpactRepository();
