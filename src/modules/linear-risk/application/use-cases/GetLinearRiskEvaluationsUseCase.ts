import { LinearRiskRepository, LinearRiskEvaluationsSummary } from "../../domain/types";

export class GetLinearRiskEvaluationsUseCase {
  constructor(private repository: LinearRiskRepository) {}

  async execute(companyId: string, elementId?: string, activityId?: string): Promise<LinearRiskEvaluationsSummary> {
    return this.repository.getEvaluations(companyId, elementId, activityId);
  }
}
