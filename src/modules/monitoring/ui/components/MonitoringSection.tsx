'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { MonitoringFilters, type FilterState } from './MonitoringFilters';
import { SaveChangesBar } from './SaveChangesBar';
import { DateCell, RowActions, TH, TD } from './MonitoringDateRow';
import { MonitoringStatusBadge, EntityStatusBadge, getDateStatus } from './MonitoringStatusBadge';
import { saveSectionChanges } from '@/app/gestion/dashboard_monitoreo/definir/actions';
import type {
  RiskRow, ControlRow, TestRow, EvidenceRow,
  TableKey, FieldKey, PendingChange,
} from '@/modules/monitoring/domain/types/MonitoringDateTypes';

// suppress unused import warning
void (null as unknown as PendingChange);

const CARD: React.CSSProperties = {
  background: 'rgba(13,17,38,0.72)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 12,
  backdropFilter: 'blur(12px)',
  overflow: 'hidden',
};

function getPrimaryDate(row: RiskRow | ControlRow | TestRow | EvidenceRow): string | null {
  if ('next_review_date' in row && 'next_execution_date' in row) {
    const c = row as ControlRow;
    if (c.next_execution_date && c.next_review_date) {
      return c.next_execution_date < c.next_review_date ? c.next_execution_date : c.next_review_date;
    }
    return c.next_execution_date ?? c.next_review_date;
  }
  if ('next_review_date' in row) return (row as RiskRow).next_review_date;
  if ('expiration_date'  in row) return (row as TestRow | EvidenceRow).expiration_date;
  return null;
}

function getDisplayName(row: RiskRow | ControlRow | TestRow | EvidenceRow): string {
  if ('name'      in row) return row.name;
  if ('test_name' in row) return (row as TestRow).test_name;
  if ('title'     in row) return (row as EvidenceRow).title;
  return (row as { id: string }).id;
}

function applyFilter(
  rows: (RiskRow | ControlRow | TestRow | EvidenceRow)[],
  pending: Map<string, Record<FieldKey, string | null>>,
  filter: FilterState,
) {
  const q = filter.search.toLowerCase();
  return rows
    .filter((r) => {
      if (q) {
        const name = getDisplayName(r).toLowerCase();
        const code = ('code' in r ? (r as RiskRow | ControlRow).code : '').toLowerCase();
        if (!name.includes(q) && !code.includes(q)) return false;
      }
      if (filter.status !== 'all') {
        const pendingRow = pending.get(r.id);
        const date = pendingRow ? (Object.values(pendingRow)[0] ?? null) : getPrimaryDate(r);
        if (getDateStatus(date) !== filter.status) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (filter.sort === 'name_asc') return getDisplayName(a).localeCompare(getDisplayName(b));
      const da = getPrimaryDate(a) ?? '9999';
      const db = getPrimaryDate(b) ?? '9999';
      return filter.sort === 'date_desc' ? db.localeCompare(da) : da.localeCompare(db);
    });
}

function SectionHeader({
  icon, title, count, pendingCount, saving, saved, onSaveAll,
}: {
  icon: React.ReactNode; title: string; count: number;
  pendingCount: number; saving: boolean; saved: boolean; onSaveAll: () => void;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 18px 10px',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: '#6366f1' }}>{icon}</span>
        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#e2e8f0' }}>{title}</span>
        <span style={{ fontSize: '0.7rem', color: '#475569', background: 'rgba(255,255,255,0.04)', borderRadius: 4, padding: '1px 6px' }}>
          {count} registros
        </span>
      </div>
      <SaveChangesBar count={pendingCount} saving={saving} saved={saved} onSave={onSaveAll} />
    </div>
  );
}

interface SectionProps<T extends RiskRow | ControlRow | TestRow | EvidenceRow> {
  icon: React.ReactNode;
  title: string;
  table: TableKey;
  rows: T[];
  renderRows: (
    visibleRows: T[],
    pending: Map<string, Record<FieldKey, string | null>>,
    handlers: {
      onChange: (id: string, field: FieldKey, value: string | null) => void;
      onSaveRow: (id: string) => void;
      onResetRow: (id: string) => void;
      saving: boolean;
    },
  ) => React.ReactNode;
  tableHead: React.ReactNode;
}

const PAGE_SIZE = 4;

function Section<T extends RiskRow | ControlRow | TestRow | EvidenceRow>({
  icon, title, table, rows, renderRows, tableHead,
}: SectionProps<T>) {
  const router = useRouter();
  const [pending, setPending] = useState<Map<string, Record<FieldKey, string | null>>>(new Map());
  const [filter, setFilter]   = useState<FilterState>({ search: '', status: 'all', sort: 'date_asc' });
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [expanded, setExpanded] = useState(false);

  const allVisible = useMemo(
    () => applyFilter(rows as (RiskRow | ControlRow | TestRow | EvidenceRow)[], pending, filter) as T[],
    [rows, pending, filter],
  );

  const visible = expanded ? allVisible : allVisible.slice(0, PAGE_SIZE);
  const hiddenCount = allVisible.length - PAGE_SIZE;

  function onChange(id: string, field: FieldKey, value: string | null) {
    setPending((prev) => {
      const next = new Map(prev);
      const cur  = next.get(id) ?? ({} as Record<FieldKey, string | null>);
      next.set(id, { ...cur, [field]: value });
      return next;
    });
    setSaved(false);
  }

  function onResetRow(id: string) {
    setPending((prev) => { const n = new Map(prev); n.delete(id); return n; });
  }

  async function onSaveRow(id: string) {
    const changes = pending.get(id);
    if (!changes) return;
    setSaving(true);
    const list = Object.entries(changes).map(([field, value]) => ({ id, field: field as FieldKey, value }));
    await saveSectionChanges(table, list);
    onResetRow(id);
    setSaving(false);
    setSaved(true);
    router.refresh();
  }

  async function onSaveAll() {
    if (pending.size === 0) return;
    setSaving(true);
    const list = Array.from(pending.entries()).flatMap(([id, fields]) =>
      Object.entries(fields).map(([field, value]) => ({ id, field: field as FieldKey, value })),
    );
    await saveSectionChanges(table, list);
    setPending(new Map());
    setSaving(false);
    setSaved(true);
    router.refresh();
  }

  const pendingCount = Array.from(pending.values()).reduce((sum, fields) => sum + Object.keys(fields).length, 0);

  return (
    <div id={`section-${table}`} style={CARD}>
      <SectionHeader
        icon={icon} title={title} count={rows.length}
        pendingCount={pendingCount} saving={saving} saved={saved}
        onSaveAll={onSaveAll}
      />
      <div style={{ padding: '10px 18px 8px' }}>
        <MonitoringFilters value={filter} onChange={setFilter} />
      </div>
      <div style={{ overflowX: 'auto', maxHeight: 360, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
          <thead style={{ position: 'sticky', top: 0, background: 'rgba(13,17,38,0.95)', zIndex: 1 }}>
            <tr>{tableHead}</tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={99} style={{ padding: '1.5rem', textAlign: 'center', color: '#334155', fontSize: '0.8rem' }}>
                  No hay registros que coincidan con el filtro
                </td>
              </tr>
            ) : (
              renderRows(visible, pending, { onChange, onSaveRow, onResetRow, saving })
            )}
          </tbody>
        </table>
      </div>
      {allVisible.length > PAGE_SIZE && (
        <div style={{ padding: '8px 18px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <button
            onClick={() => setExpanded((v) => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'none', border: 'none',
              fontSize: '0.72rem', color: '#475569', cursor: 'pointer',
            }}
          >
            {expanded
              ? <>Mostrar menos <ChevronRight size={11} style={{ transform: 'rotate(-90deg)' }} /></>
              : <>Ver {hiddenCount} registros más <ChevronRight size={11} /></>
            }
          </button>
        </div>
      )}
    </div>
  );
}

export function RisksSection({ rows, icon }: { rows: RiskRow[]; icon: React.ReactNode }) {
  return (
    <Section
      icon={icon} title="Riesgos" table="run_ra_risks" rows={rows}
      tableHead={<><TH>Riesgo</TH><TH>Estado</TH><TH>Próx. revisión</TH><TH align="center">Acciones</TH></>}
      renderRows={(visible, pending, h) =>
        visible.map((r, i) => {
          const pend    = pending.get(r.id);
          const curDate = pend?.next_review_date !== undefined ? pend.next_review_date : r.next_review_date;
          return (
            <tr key={r.id} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.012)' : 'transparent' }}>
              <TD><span style={{ color: '#cbd5e1', fontWeight: 500 }}>{r.name}</span></TD>
              <TD><MonitoringStatusBadge status={getDateStatus(curDate)} small /></TD>
              <TD>
                <DateCell label="" field="next_review_date"
                  currentValue={curDate} isPending={!!pend}
                  onChange={(f, v) => h.onChange(r.id, f, v)} />
              </TD>
              <TD align="center">
                <RowActions hasPending={!!pend} saving={h.saving}
                  onSave={() => h.onSaveRow(r.id)} onReset={() => h.onResetRow(r.id)} />
              </TD>
            </tr>
          );
        })
      }
    />
  );
}

export function ControlsSection({ rows, icon }: { rows: ControlRow[]; icon: React.ReactNode }) {
  return (
    <Section
      icon={icon} title="Controles" table="run_ra_controls" rows={rows}
      tableHead={<><TH>Control</TH><TH>Estado</TH><TH>Próx. ejecución</TH><TH>Próx. revisión</TH><TH align="center">Acciones</TH></>}
      renderRows={(visible, pending, h) =>
        visible.map((r, i) => {
          const pend    = pending.get(r.id);
          const curExec = pend?.next_execution_date !== undefined ? pend.next_execution_date : r.next_execution_date;
          const curRev  = pend?.next_review_date    !== undefined ? pend.next_review_date    : r.next_review_date;
          const primDate = curExec && curRev ? (curExec < curRev ? curExec : curRev) : curExec ?? curRev;
          return (
            <tr key={r.id} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.012)' : 'transparent' }}>
              <TD><span style={{ color: '#cbd5e1', fontWeight: 500 }}>{r.name}</span></TD>
              <TD>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <MonitoringStatusBadge status={getDateStatus(primDate)} small />
                  <EntityStatusBadge label={r.is_active ? 'Activo' : 'Inactivo'} />
                </div>
              </TD>
              <TD>
                <DateCell label="" field="next_execution_date"
                  currentValue={curExec} isPending={!!pend && 'next_execution_date' in (pend ?? {})}
                  onChange={(f, v) => h.onChange(r.id, f, v)} />
              </TD>
              <TD>
                <DateCell label="" field="next_review_date"
                  currentValue={curRev} isPending={!!pend && 'next_review_date' in (pend ?? {})}
                  onChange={(f, v) => h.onChange(r.id, f, v)} />
              </TD>
              <TD align="center">
                <RowActions hasPending={!!pend} saving={h.saving}
                  onSave={() => h.onSaveRow(r.id)} onReset={() => h.onResetRow(r.id)} />
              </TD>
            </tr>
          );
        })
      }
    />
  );
}

export function TestsSection({ rows, icon }: { rows: TestRow[]; icon: React.ReactNode }) {
  return (
    <Section
      icon={icon} title="Pruebas de Control" table="run_ra_control_tests" rows={rows}
      tableHead={<><TH>Prueba</TH><TH>Control</TH><TH>Estado</TH><TH>Vencimiento</TH><TH align="center">Acciones</TH></>}
      renderRows={(visible, pending, h) =>
        visible.map((r, i) => {
          const pend    = pending.get(r.id);
          const curDate = pend?.expiration_date !== undefined ? pend.expiration_date : r.expiration_date;
          return (
            <tr key={r.id} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.012)' : 'transparent' }}>
              <TD><span style={{ color: '#cbd5e1', fontWeight: 500 }}>{r.test_name}</span></TD>
              <TD><span style={{ color: '#475569', fontSize: '0.72rem' }}>{r.control_name}</span></TD>
              <TD>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <MonitoringStatusBadge status={getDateStatus(curDate)} small />
                  <EntityStatusBadge label={r.status} />
                </div>
              </TD>
              <TD>
                <DateCell label="" field="expiration_date"
                  currentValue={curDate} isPending={!!pend}
                  onChange={(f, v) => h.onChange(r.id, f, v)} />
              </TD>
              <TD align="center">
                <RowActions hasPending={!!pend} saving={h.saving}
                  onSave={() => h.onSaveRow(r.id)} onReset={() => h.onResetRow(r.id)} />
              </TD>
            </tr>
          );
        })
      }
    />
  );
}

export function EvidencesSection({ rows, icon }: { rows: EvidenceRow[]; icon: React.ReactNode }) {
  return (
    <Section
      icon={icon} title="Evidencias" table="run_ra_evidence" rows={rows}
      tableHead={<><TH>Evidencia</TH><TH>Tipo</TH><TH>Estado</TH><TH>Vencimiento</TH><TH align="center">Acciones</TH></>}
      renderRows={(visible, pending, h) =>
        visible.map((r, i) => {
          const pend    = pending.get(r.id);
          const curDate = pend?.expiration_date !== undefined ? pend.expiration_date : r.expiration_date;
          return (
            <tr key={r.id} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.012)' : 'transparent' }}>
              <TD><span style={{ color: '#cbd5e1', fontWeight: 500 }}>{r.title}</span></TD>
              <TD><span style={{ color: '#475569', fontSize: '0.72rem' }}>{r.evidence_type}</span></TD>
              <TD>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <MonitoringStatusBadge status={getDateStatus(curDate)} small />
                  <EntityStatusBadge label={r.validity_status} />
                </div>
              </TD>
              <TD>
                <DateCell label="" field="expiration_date"
                  currentValue={curDate} isPending={!!pend}
                  onChange={(f, v) => h.onChange(r.id, f, v)} />
              </TD>
              <TD align="center">
                <RowActions hasPending={!!pend} saving={h.saving}
                  onSave={() => h.onSaveRow(r.id)} onReset={() => h.onResetRow(r.id)} />
              </TD>
            </tr>
          );
        })
      }
    />
  );
}
