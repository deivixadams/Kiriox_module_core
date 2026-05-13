'use server';

import { UpdateMonitoringDateUseCase } from '@/modules/monitoring/application/use-cases/UpdateMonitoringDateUseCase';
import { PrismaMonitoringRepository } from '@/modules/monitoring/infrastructure/PrismaMonitoringRepository';
import type { FieldKey, TableKey } from '@/modules/monitoring/domain/types/MonitoringDateTypes';

export async function updateMonitoringDate(
  table: TableKey,
  id: string,
  field: FieldKey,
  value: string | null,
): Promise<{ ok: boolean; error?: string }> {
  const useCase = new UpdateMonitoringDateUseCase(new PrismaMonitoringRepository());
  return useCase.execute({ table, id, field, value });
}

export async function saveSectionChanges(
  table: TableKey,
  changes: { id: string; field: FieldKey; value: string | null }[],
): Promise<{ ok: boolean; saved: number; errors: string[] }> {
  const errors: string[] = [];
  let saved = 0;

  for (const c of changes) {
    const r = await updateMonitoringDate(table, c.id, c.field, c.value);
    if (r.ok) saved++;
    else errors.push(`[${c.id.slice(0, 8)}] ${r.error ?? 'Error desconocido'}`);
  }

  return { ok: errors.length === 0, saved, errors };
}
