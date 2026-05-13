import type { IMonitoringRepository } from "@/modules/monitoring/domain/contracts/IMonitoringRepository";
import type { TableKey, FieldKey } from "@/modules/monitoring/domain/types/MonitoringDateTypes";

const ALLOWED: Record<TableKey, FieldKey[]> = {
  run_ra_risks:         ['next_review_date'],
  run_ra_controls:      ['next_execution_date', 'next_review_date'],
  run_ra_control_tests: ['expiration_date'],
  run_ra_evidence:      ['expiration_date'],
};

export class UpdateMonitoringDateUseCase {
  constructor(private readonly repo: IMonitoringRepository) {}

  async execute(input: {
    table: TableKey;
    id: string;
    field: FieldKey;
    value: string | null;
  }): Promise<{ ok: boolean; error?: string }> {
    const allowed = ALLOWED[input.table];
    if (!allowed) return { ok: false, error: 'Tabla no permitida' };
    if (!allowed.includes(input.field)) return { ok: false, error: 'Campo no permitido para esta tabla' };
    if (
      input.value !== null &&
      typeof input.value === 'string' &&
      !/^\d{4}-\d{2}-\d{2}$/.test(input.value)
    ) {
      return { ok: false, error: 'Formato de fecha inválido (esperado YYYY-MM-DD)' };
    }

    return this.repo.updateDate(input.table, input.id, input.field, input.value);
  }
}
