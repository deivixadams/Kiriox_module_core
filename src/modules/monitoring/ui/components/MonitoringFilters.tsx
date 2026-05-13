'use client';

import { Search, ArrowUpDown } from 'lucide-react';
import type { DateStatus } from '@/modules/monitoring/domain/types/MonitoringDateTypes';

export interface FilterState {
  search: string;
  status: DateStatus | 'all';
  sort: 'date_asc' | 'date_desc' | 'name_asc';
}

interface Props {
  value: FilterState;
  onChange: (f: FilterState) => void;
}

const STATUS_OPTIONS: { value: FilterState['status']; label: string }[] = [
  { value: 'all',       label: 'Todos los estados' },
  { value: 'vencida',   label: 'Vencido'           },
  { value: 'proxima',   label: 'Próximo'            },
  { value: 'vigente',   label: 'Vigente'            },
  { value: 'sin_fecha', label: 'Sin fecha'          },
];

const SORT_OPTIONS: { value: FilterState['sort']; label: string }[] = [
  { value: 'date_asc',  label: 'Fecha (más próxima)' },
  { value: 'date_desc', label: 'Fecha (más lejana)'  },
  { value: 'name_asc',  label: 'Nombre A–Z'          },
];

const SELECT_STYLE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 8,
  color: '#94a3b8',
  fontSize: '0.78rem',
  padding: '6px 10px',
  cursor: 'pointer',
  outline: 'none',
  minWidth: 160,
};

export function MonitoringFilters({ value, onChange }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 180 }}>
        <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#475569', pointerEvents: 'none' }} />
        <input
          type="text"
          placeholder="Buscar por nombre, código…"
          value={value.search}
          onChange={(e) => onChange({ ...value, search: e.target.value })}
          style={{ ...SELECT_STYLE, width: '100%', paddingLeft: 30, boxSizing: 'border-box' }}
        />
      </div>

      <select
        value={value.status}
        onChange={(e) => onChange({ ...value, status: e.target.value as FilterState['status'] })}
        style={SELECT_STYLE}
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value} style={{ background: '#0f1226' }}>{o.label}</option>
        ))}
      </select>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <ArrowUpDown size={13} style={{ color: '#475569' }} />
        <select
          value={value.sort}
          onChange={(e) => onChange({ ...value, sort: e.target.value as FilterState['sort'] })}
          style={SELECT_STYLE}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value} style={{ background: '#0f1226' }}>{o.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
