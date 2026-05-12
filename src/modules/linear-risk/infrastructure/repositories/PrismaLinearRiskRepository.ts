import { Prisma } from "@/generated/prisma/client";
import prisma from "@/infrastructure/db/prisma/client";
import { LinearRiskRepository, LinearRiskDashboardSummary, LinearRiskDashboardRow } from "../../domain/types";

export class PrismaLinearRiskRepository implements LinearRiskRepository {
  async getDashboardRows(): Promise<LinearRiskDashboardSummary> {
    try {
      const rows = await prisma.$queryRaw<LinearRiskDashboardRow[]>(Prisma.sql`
        SELECT * FROM views.dashboard_top_control
      `);
      return { rows, source: "views.dashboard_top_control" };
    } catch {
      try {
        const rows = await prisma.$queryRaw<LinearRiskDashboardRow[]>(Prisma.sql`
          SELECT * FROM corpus.dashboard_top_control
        `);
        return { rows, source: "corpus.dashboard_top_control" };
      } catch {
        const rows = await prisma.$queryRaw<LinearRiskDashboardRow[]>(Prisma.sql`
          SELECT * FROM dashboard_top_control
        `);
        return { rows, source: "dashboard_top_control" };
      }
    }
  }
}
