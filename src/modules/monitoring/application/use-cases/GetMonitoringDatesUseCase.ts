import type { IMonitoringRepository } from "@/modules/monitoring/domain/contracts/IMonitoringRepository";
import type { RiskRow, ControlRow, TestRow, EvidenceRow } from "@/modules/monitoring/domain/types/MonitoringDateTypes";

export type MonitoringDatesResult = {
  risks: RiskRow[];
  controls: ControlRow[];
  tests: TestRow[];
  evidences: EvidenceRow[];
};

export class GetMonitoringDatesUseCase {
  constructor(private readonly repo: IMonitoringRepository) {}

  async execute(input: { companyId: string }): Promise<MonitoringDatesResult> {
    const [risks, controls, tests, evidences] = await Promise.all([
      this.repo.getRisks(input.companyId),
      this.repo.getControls(input.companyId),
      this.repo.getTests(input.companyId),
      this.repo.getEvidences(input.companyId),
    ]);
    return { risks, controls, tests, evidences };
  }
}
