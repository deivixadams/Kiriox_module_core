import prisma from "@/infrastructure/db/prisma/client";
import { CatalogProbability } from "../../domain/types";

export class CatalogProbabilityRepository {
  async findAll(): Promise<CatalogProbability[]> {
    const data = await (prisma as any).catalog_ra_probability.findMany({
      orderBy: { ordinal: "asc" },
    });
    return data;
  }

  async create(data: Partial<CatalogProbability>): Promise<CatalogProbability> {
    const result = await (prisma as any).catalog_ra_probability.create({
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

  async update(id: number, data: Partial<CatalogProbability>): Promise<CatalogProbability | null> {
    const result = await (prisma as any).catalog_ra_probability.update({
      where: { catalog_probability_id: BigInt(id) },
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
    await (prisma as any).catalog_ra_probability.delete({
      where: { catalog_probability_id: BigInt(id) },
    });
  }
}

export const catalogProbabilityRepository = new CatalogProbabilityRepository();
