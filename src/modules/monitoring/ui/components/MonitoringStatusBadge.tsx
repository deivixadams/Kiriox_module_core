'use client';

import type { DateStatus } from '@/modules/monitoring/domain/types/MonitoringDateTypes';

const CFG: Record<DateStatus, { label: string; color: string; bg: string; border: string }> = {
  vencida:   { label: 'Vencido',   color: '#dc2626', bg: 'rgba(220,38,38,0.09)',   border: 'rgba(220,38,38,0.22)'   },
  proxima:   { label: 'Próximo',   color: '#ca8a04', bg: 'rgba(202,138,4,0.09)',   border: 'rgba(202,138,4,0.22)'   },
  vigente:   { label: 'Vigente',   color: '#16a34a', bg: 'rgba(22,163,74,0.09)',   border: 'rgba(22,163,74,0.22)'   },
  sin_fecha: { label: 'Sin fecha', color: '#6b7280', bg: 'rgba(107,114,128,0.06)', border: 'rgba(107,114,128,0.18)' },
};

export function getDateStatus(dateStr: string | null): DateStatus {
  if (!dateStr) return 'sin_fecha';
  const date  = new Date(dateStr);
  const now   = new Date();
  const in30  = new Date(Date.now() + 30 * 864e5);
  if (date < now)   return 'vencida';
  if (date <= in30) return 'proxima';
  return 'vigente';
}

export function MonitoringStatusBadge({ status, small }: { status: DateStatus; small?: boolean }) {
  const c = CFG[status];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      background: c.bg, color: c.color,
      border: `1px solid ${c.border}`,
      borderRadius: 5,
      padding: small ? '1px 6px' : '2px 8px',
      fontSize: small ? '0.66rem' : '0.72rem',
      fontWeight: 600,
      letterSpacing: '0.02em',
      whiteSpace: 'nowrap',
    }}>
      {c.label}
    </span>
  );
}

const ENTITY_CFG: Record<string, { color: string; bg: string }> = {
  PENDING:   { color: '#6b7280', bg: 'rgba(107,114,128,0.08)' },
  COMPLETED: { color: '#16a34a', bg: 'rgba(22,163,74,0.08)'   },
  FAILED:    { color: '#dc2626', bg: 'rgba(220,38,38,0.08)'   },
  VALID:     { color: '#16a34a', bg: 'rgba(22,163,74,0.08)'   },
  INVALID:   { color: '#dc2626', bg: 'rgba(220,38,38,0.08)'   },
  EXPIRED:   { color: '#ca8a04', bg: 'rgba(202,138,4,0.08)'   },
  Activo:    { color: '#16a34a', bg: 'rgba(22,163,74,0.08)'   },
  Inactivo:  { color: '#6b7280', bg: 'rgba(107,114,128,0.06)' },
};

export function EntityStatusBadge({ label }: { label: string }) {
  const c = ENTITY_CFG[label] ?? { color: '#94a3b8', bg: 'rgba(148,163,184,0.07)' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      background: c.bg, color: c.color,
      borderRadius: 4,
      padding: '1px 6px',
      fontSize: '0.66rem',
      fontWeight: 600,
    }}>
      {label}
    </span>
  );
}
