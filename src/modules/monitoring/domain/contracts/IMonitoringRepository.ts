import type { DashboardData } from "../types/MonitoringDashboardTypes";
import type { RiskRow, ControlRow, TestRow, EvidenceRow, TableKey, FieldKey } from "../types/MonitoringDateTypes";

export interface IMonitoringRepository {
  getDashboardData(companyId: string): Promise<DashboardData>;
  getActiveEventCount(): Promise<number>;
  syncEvents(): Promise<{ inserted: number; resolved: number }>;
  getRisks(companyId: string): Promise<RiskRow[]>;
  getControls(companyId: string): Promise<ControlRow[]>;
  getTests(companyId: string): Promise<TestRow[]>;
  getEvidences(companyId: string): Promise<EvidenceRow[]>;
  updateDate(
    table: TableKey,
    id: string,
    field: FieldKey,
    value: string | null,
  ): Promise<{ ok: boolean; error?: string }>;
}
