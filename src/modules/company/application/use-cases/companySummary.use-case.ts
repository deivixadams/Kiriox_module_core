import { CompanySummaryDTO } from "../../domain/types";
import { companyRepository } from "../../infrastructure/repositories/companyRepository";

export class CompanySummaryUseCase {
  async getSummary(companyId?: string): Promise<CompanySummaryDTO> {
    const row = await companyRepository.getSummary(companyId);
    return {
      elements: row.elements_count,
      keyActivities: row.activities_count,
      risks: row.risks_count,
      controls: row.controls_count,
      tests: row.tests_count,
      users: row.users_count,
    };
  }
}

export const companySummaryUseCase = new CompanySummaryUseCase();
