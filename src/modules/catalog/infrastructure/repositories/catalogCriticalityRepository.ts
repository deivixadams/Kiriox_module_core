import prisma from "@/infrastructure/db/prisma/client";
import { CatalogActivityCriticalityLevel } from "../../domain/types";

export class CatalogCriticalityRepository {
  async findAll(): Promise<CatalogActivityCriticalityLevel[]> {
    const data = await (prisma as any).catalog_activity_criticality_level.findMany({
      orderBy: [
        { sort_order: "asc" },
        { name: "asc" }
      ],
    });
    return data;
  }

  async create(data: Partial<CatalogActivityCriticalityLevel>): Promise<CatalogActivityCriticalityLevel> {
    const result = await (prisma as any).catalog_activity_criticality_level.create({
      data: {
        code: data.code || "",
        name: data.name || "",
        sort_order: Number(data.sort_order) || 0,
        is_active: data.is_active !== false,
      },
    });
    return result;
  }

  async update(id: string, data: Partial<CatalogActivityCriticalityLevel>): Promise<CatalogActivityCriticalityLevel | null> {
    const result = await (prisma as any).catalog_activity_criticality_level.update({
      where: { id },
      data: {
        code: data.code,
        name: data.name,
        sort_order: data.sort_order != null ? Number(data.sort_order) : undefined,
        is_active: data.is_active,
      },
    });
    return result;
  }

  async delete(id: string): Promise<void> {
    await (prisma as any).catalog_activity_criticality_level.delete({
      where: { id },
    });
  }
}

export const catalogCriticalityRepository = new CatalogCriticalityRepository();
