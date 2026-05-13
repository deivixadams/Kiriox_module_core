import { Prisma } from '@/generated/prisma/client';
import prisma from '@/infrastructure/db/prisma/client';
import type { IStructuralAnalysisRepository } from '@/modules/structural-risk/domain/contracts/IStructuralAnalysisRepository';

export class PrismaStructuralAnalysisRepository implements IStructuralAnalysisRepository {
  async runAnalysis(runSaId: string): Promise<unknown> {
    const rows = await prisma.$queryRaw<Array<{ result: unknown }>>(Prisma.sql`
      SELECT public.fn_structural_analysis(${runSaId}::uuid) AS result
    `);
    return rows[0]?.result ?? null;
  }
}
