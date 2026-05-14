'use client';

import React, { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { Download, Trash2 } from 'lucide-react';
import type { Reporte } from '@/modules/reportes/reportes.types';

// ── Category + file config ─────────────────────────────────────────────────────

interface CatRowDef {
  displayName: string;
  reporteId: string;
  fileName: string;
}

interface CatConfig {
  id: string;
  label: string;
  rows: CatRowDef[];
}

export const CATEGORIAS_CONFIG: CatConfig[] = [
  {
    id: 'liquidez',
    label: 'Liquidez',
    rows: [
      { displayName: 'Porcentaje Liquidez',    reporteId: 'REP-001', fileName: 'Porcentaje-Liquidez.xls' },
      { displayName: 'Instructivo de Liquidez', reporteId: 'REP-018', fileName: 'Instructivo-de-Liquidez.xlsx' },
    ],
  },
  {
    id: 'portafolio',
    label: 'Portafolio e inversiones',
    rows: [
      { displayName: 'Portafolio RF',                reporteId: 'REP-003', fileName: 'Portafolio-de-Inversiones-en-Instrumentos-de-Rf.xls' },
      { displayName: 'Portafolio RV',                reporteId: 'REP-004', fileName: 'Portafolio-inversiones-RV.xls' },
      { displayName: 'Portafolio inversiones otras', reporteId: 'REP-005', fileName: 'Portafolio-inversiones-otras.xls' },
    ],
  },
  {
    id: 'operaciones',
    label: 'Operaciones de aportantes',
    rows: [
      { displayName: 'Suscripción y rescates fondos',          reporteId: 'REP-016', fileName: 'Suscripcion-y-rescates-fondos.xls' },
      { displayName: 'Límites de participación de aportante',  reporteId: 'REP-002', fileName: 'Limites-de-participacion-de-aportante.xls' },
    ],
  },
  {
    id: 'colocacion',
    label: 'Colocación y cuotas',
    rows: [
      { displayName: 'Colocación de los valores', reporteId: 'REP-017', fileName: 'Colocacion-de-los-valores.xls' },
    ],
  },
  {
    id: 'valoracion',
    label: 'Valoración / NAV',
    rows: [
      { displayName: 'Valoración Fondos Abiertos', reporteId: 'REP-006', fileName: 'Valoracion-de-los-valores-Fondos-Abiertos.xls' },
    ],
  },
  {
    id: 'informacion',
    label: 'Información pública diaria',
    rows: [
      { displayName: 'Información diaria a publicar', reporteId: 'REP-008', fileName: 'Informacion-diaria-a-publicar.xls' },
    ],
  },
];

// ── User type ──────────────────────────────────────────────────────────────────

interface UserOption {
  id: string;
  full_name: string | null;
  email: string | null;
}

// ── Per-row state ──────────────────────────────────────────────────────────────

interface RowState {
  responsableId: string;
  activo: boolean;
  enviado: boolean;
}

type RowStateMap = Record<string, RowState>;

type RowAction =
  | { type: 'SET_RESPONSABLE'; id: string; value: string }
  | { type: 'TOGGLE_ACTIVO';   id: string }
  | { type: 'TOGGLE_ENVIADO';  id: string }
  | { type: 'DELETE';          id: string };

function buildInitialState(reportes: Reporte[]): RowStateMap {
  const repById = new Map(reportes.map(r => [r.id, r]));
  const map: RowStateMap = {};
  for (const cat of CATEGORIAS_CONFIG) {
    for (const row of cat.rows) {
      const rep = repById.get(row.reporteId);
      map[row.reporteId] = {
        responsableId: '',
        activo: rep?.estado !== 'vencido',
        enviado: rep?.estado === 'remitido',
      };
    }
  }
  return map;
}

function rowReducer(state: RowStateMap, action: RowAction): RowStateMap {
  switch (action.type) {
    case 'SET_RESPONSABLE':
      return { ...state, [action.id]: { ...state[action.id], responsableId: action.value } };
    case 'TOGGLE_ACTIVO':
      return { ...state, [action.id]: { ...state[action.id], activo: !state[action.id].activo } };
    case 'TOGGLE_ENVIADO':
      return { ...state, [action.id]: { ...state[action.id], enviado: !state[action.id].enviado } };
    case 'DELETE': {
      const next = { ...state };
      delete next[action.id];
      return next;
    }
    default:
      return state;
  }
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const S = {
  card: (): React.CSSProperties => ({
    background: 'linear-gradient(155deg, rgba(12,22,54,0.95), rgba(7,16,42,0.92))',
    border: '1px solid rgba(129,140,248,0.18)',
    borderRadius: 14,
    overflow: 'hidden',
    boxShadow: '0 8px 24px rgba(2,8,23,0.3)',
    marginBottom: '1.25rem',
  }),
  cardHeader: (): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '13px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(255,255,255,0.02)',
  }),
  cardTitle: (): React.CSSProperties => ({
    fontSize: '0.78rem', fontWeight: 800, color: '#c4b5fd',
    textTransform: 'uppercase' as const, letterSpacing: '0.06em', margin: 0,
  }),
  badge: (): React.CSSProperties => ({
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
    color: '#475569', fontSize: '0.67rem', fontWeight: 700,
    padding: '2px 8px', borderRadius: 9999,
  }),
  table: (): React.CSSProperties => ({
    width: '100%', borderCollapse: 'collapse' as const,
  }),
  th: (align: 'left' | 'right' | 'center' = 'left'): React.CSSProperties => ({
    padding: '9px 16px', fontSize: '0.64rem', fontWeight: 800,
    color: '#3d4f6b', textTransform: 'uppercase' as const, letterSpacing: '0.08em',
    textAlign: align, borderBottom: '1px solid rgba(255,255,255,0.05)',
    background: 'rgba(0,0,0,0.18)', whiteSpace: 'nowrap' as const,
  }),
  td: (last: boolean, align: 'left' | 'right' | 'center' = 'left'): React.CSSProperties => ({
    padding: '10px 16px', fontSize: '0.82rem', color: '#cbd5e1',
    borderBottom: last ? 'none' : '1px solid rgba(255,255,255,0.04)',
    verticalAlign: 'middle' as const, textAlign: align,
  }),
  docName: (): React.CSSProperties => ({
    fontWeight: 600, color: '#e2e8f0', fontSize: '0.82rem',
  }),
  select: (): React.CSSProperties => ({
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.09)',
    color: '#94a3b8', fontSize: '0.78rem', fontWeight: 500,
    padding: '5px 8px', borderRadius: 7, cursor: 'pointer',
    outline: 'none', maxWidth: 160,
  }),
  estadoPill: (activo: boolean): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '4px 11px', borderRadius: 9999, cursor: 'pointer',
    fontSize: '0.71rem', fontWeight: 700, userSelect: 'none' as const,
    border: activo ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(239,68,68,0.3)',
    background: activo
      ? 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(34,197,94,0.07))'
      : 'linear-gradient(135deg, rgba(239,68,68,0.14), rgba(220,38,38,0.07))',
    color: activo ? '#4ade80' : '#f87171',
    transition: 'all 0.18s',
  }),
  dot: (activo: boolean): React.CSSProperties => ({
    width: 6, height: 6, borderRadius: '50%',
    background: activo ? '#4ade80' : '#f87171', flexShrink: 0,
  }),
  btnObtener: (downloading: boolean): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '5px 11px', borderRadius: 7,
    background: downloading ? 'rgba(59,130,246,0.18)' : 'rgba(59,130,246,0.08)',
    border: '1px solid rgba(59,130,246,0.25)', color: '#60a5fa',
    fontSize: '0.72rem', fontWeight: 700, cursor: downloading ? 'wait' : 'pointer',
    whiteSpace: 'nowrap' as const, opacity: downloading ? 0.7 : 1,
  }),
  enviadoToggle: (enviado: boolean): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '4px 11px', borderRadius: 9999, cursor: 'pointer',
    fontSize: '0.71rem', fontWeight: 700, userSelect: 'none' as const,
    transition: 'all 0.18s',
    background: enviado ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.04)',
    border: enviado ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(255,255,255,0.08)',
    color: enviado ? '#4ade80' : '#475569',
  }),
  btnDelete: (): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 28, height: 28, borderRadius: 7,
    background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', color: '#f87171',
    cursor: 'pointer',
  }),
  trHover: (idx: number): React.CSSProperties => ({
    background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
  }),
} as const;

// ── Row component ──────────────────────────────────────────────────────────────

interface RowProps {
  def: CatRowDef;
  rowState: RowState;
  users: UserOption[];
  isLast: boolean;
  idx: number;
  dispatch: React.Dispatch<RowAction>;
}

function CatRow({ def, rowState, users, isLast, idx, dispatch }: RowProps) {
  const [downloading, setDownloading] = useState(false);

  const handleObtener = useCallback(async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const res = await fetch(`/api/reportes/file?file=${encodeURIComponent(def.fileName)}`);
      if (!res.ok) throw new Error('Error al obtener el archivo');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = def.fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silent — could show a toast here
    } finally {
      setDownloading(false);
    }
  }, [def.fileName, downloading]);

  return (
    <tr style={S.trHover(idx)}>
      {/* Documento diario */}
      <td style={S.td(isLast)}>
        <span style={S.docName()}>{def.displayName}</span>
      </td>

      {/* Responsable */}
      <td style={S.td(isLast)}>
        <select
          value={rowState.responsableId}
          onChange={e => dispatch({ type: 'SET_RESPONSABLE', id: def.reporteId, value: e.target.value })}
          style={S.select()}
        >
          <option value="">— Asignar —</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>
              {u.full_name ?? u.email ?? u.id}
            </option>
          ))}
        </select>
      </td>

      {/* Estado toggle */}
      <td style={S.td(isLast)}>
        <button
          type="button"
          onClick={() => dispatch({ type: 'TOGGLE_ACTIVO', id: def.reporteId })}
          style={S.estadoPill(rowState.activo)}
        >
          <span style={S.dot(rowState.activo)} />
          {rowState.activo ? 'Activo' : 'Inactivo'}
        </button>
      </td>

      {/* Obtener */}
      <td style={S.td(isLast)}>
        <button type="button" onClick={handleObtener} style={S.btnObtener(downloading)} disabled={downloading}>
          <Download size={12} />
          {downloading ? 'Descargando…' : 'Obtener'}
        </button>
      </td>

      {/* Enviado toggle Sí / No */}
      <td style={S.td(isLast, 'center')}>
        <button
          type="button"
          onClick={() => dispatch({ type: 'TOGGLE_ENVIADO', id: def.reporteId })}
          style={S.enviadoToggle(rowState.enviado)}
        >
          {rowState.enviado ? 'Sí' : 'No'}
        </button>
      </td>

      {/* Acción */}
      <td style={S.td(isLast, 'right')}>
        <button
          type="button"
          title="Eliminar"
          onClick={() => dispatch({ type: 'DELETE', id: def.reporteId })}
          style={S.btnDelete()}
        >
          <Trash2 size={13} />
        </button>
      </td>
    </tr>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

interface Props {
  reportes: Reporte[];
}

export function ReportesCategoriaTable({ reportes }: Props) {
  const [rowState, dispatch] = useReducer(rowReducer, reportes, buildInitialState);
  const [users, setUsers] = useState<UserOption[]>([]);

  useEffect(() => {
    fetch('/api/users')
      .then(r => r.json())
      .then((d: { users?: UserOption[] }) => { if (d.users) setUsers(d.users); })
      .catch(() => {/* silent */});
  }, []);

  const handleDispatch = useCallback((action: RowAction) => dispatch(action), []);

  return (
    <div>
      {CATEGORIAS_CONFIG.map(cat => {
        const visibleRows = cat.rows.filter(r => r.reporteId in rowState);
        if (visibleRows.length === 0) return null;

        return (
          <div key={cat.id} style={S.card()}>
            <div style={S.cardHeader()}>
              <h2 style={S.cardTitle()}>{cat.label}</h2>
              <span style={S.badge()}>
                {visibleRows.length} {visibleRows.length === 1 ? 'documento' : 'documentos'}
              </span>
            </div>

            <table style={S.table()}>
              <thead>
                <tr>
                  <th style={S.th()}>Documento diario</th>
                  <th style={S.th()}>Responsable</th>
                  <th style={S.th()}>Estado</th>
                  <th style={S.th()}>Obtener</th>
                  <th style={S.th('center')}>Enviado</th>
                  <th style={S.th('right')}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row, i) => {
                  const state = rowState[row.reporteId];
                  if (!state) return null;
                  return (
                    <CatRow
                      key={row.reporteId}
                      def={row}
                      rowState={state}
                      users={users}
                      isLast={i === visibleRows.length - 1}
                      idx={i}
                      dispatch={handleDispatch}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
