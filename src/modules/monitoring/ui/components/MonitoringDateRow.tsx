'use client';

import { Check, X, Calendar } from 'lucide-react';
import { MonitoringStatusBadge, getDateStatus } from './MonitoringStatusBadge';
import type { FieldKey } from '@/modules/monitoring/domain/types/MonitoringDateTypes';

interface DateCellProps {
  label: string;
  field: FieldKey;
  currentValue: string | null;
  isPending: boolean;
  onChange: (field: FieldKey, value: string | null) => void;
}

export function DateCell({ label, field, currentValue, isPending, onChange }: DateCellProps) {
  const status = getDateStatus(currentValue);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 130 }}>
      <span style={{ fontSize: '0.65rem', color: '#475569', letterSpacing: '0.03em' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <MonitoringStatusBadge status={status} small />
        <div style={{ position: 'relative' }}>
          <input
            type="date"
            value={currentValue ?? ''}
            onChange={(e) => onChange(field, e.target.value || null)}
            style={{
              background: isPending ? 'rgba(99,102,241,0.10)' : 'rgba(255,255,255,0.04)',
              border: isPending ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.08)',
              borderRadius: 6,
              color: isPending ? '#c7d2fe' : '#94a3b8',
              fontSize: '0.75rem',
              padding: '3px 7px',
              outline: 'none',
              cursor: 'pointer',
              colorScheme: 'dark',
              width: 126,
            }}
          />
          {!currentValue && (
            <Calendar
              size={11}
              style={{
                position: 'absolute', right: 8, top: '50%',
                transform: 'translateY(-50%)',
                color: '#475569', pointerEvents: 'none',
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

interface ActionsProps {
  hasPending: boolean;
  saving: boolean;
  onSave: () => void;
  onReset: () => void;
}

export function RowActions({ hasPending, saving, onSave, onReset }: ActionsProps) {
  const btn: React.CSSProperties = {
    width: 26, height: 26,
    borderRadius: 6,
    border: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: hasPending ? 'pointer' : 'default',
    opacity: hasPending ? 1 : 0.25,
    transition: 'all 0.15s',
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <button
        onClick={hasPending ? onSave : undefined}
        disabled={!hasPending || saving}
        title="Guardar esta fila"
        style={{ ...btn, background: 'rgba(22,163,74,0.12)', color: '#16a34a' }}
      >
        <Check size={12} />
      </button>
      <button
        onClick={hasPending ? onReset : undefined}
        disabled={!hasPending}
        title="Descartar cambios"
        style={{ ...btn, background: 'rgba(220,38,38,0.10)', color: '#dc2626' }}
      >
        <X size={12} />
      </button>
    </div>
  );
}

export function TH({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'center' | 'right' }) {
  return (
    <th style={{
      padding: '6px 10px',
      fontSize: '0.68rem', fontWeight: 600,
      color: '#475569',
      textTransform: 'uppercase', letterSpacing: '0.04em',
      textAlign: align,
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      whiteSpace: 'nowrap',
    }}>
      {children}
    </th>
  );
}

export function TD({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'center' | 'right' }) {
  return (
    <td style={{ padding: '7px 10px', textAlign: align, verticalAlign: 'middle' }}>
      {children}
    </td>
  );
}
