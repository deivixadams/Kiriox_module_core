import { LinearRiskRepository, LinearRiskDashboardSummary } from "../../domain/types";

export class GetLinearRiskDashboardUseCase {
  constructor(private repository: LinearRiskRepository) {}

  async execute(): Promise<LinearRiskDashboardSummary> {
    return this.repository.getDashboardRows();
  }
}
