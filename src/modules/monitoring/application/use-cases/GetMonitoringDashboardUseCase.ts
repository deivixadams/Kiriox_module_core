import type { IMonitoringRepository } from "@/modules/monitoring/domain/contracts/IMonitoringRepository";
import type { DashboardData } from "@/modules/monitoring/domain/types/MonitoringDashboardTypes";

export class GetMonitoringDashboardUseCase {
  constructor(private readonly repo: IMonitoringRepository) {}

  async execute(input: { companyId: string }): Promise<DashboardData> {
    return this.repo.getDashboardData(input.companyId);
  }
}
