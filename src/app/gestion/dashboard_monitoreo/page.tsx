'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  AlertTriangle, RefreshCw, Filter, Shield, FileText, Activity,
  ClipboardCheck, Clock, CheckCircle, BarChart2, Calendar,
  ChevronRight, Loader2, CalendarCog,
} from 'lucide-react';
import type { DashboardData, CatItem, MonitorItem, AlertaRiesgoResidual, SimpleEvento, Kpis } from '@/modules/monitoring/domain/types/MonitoringDashboardTypes';

// ── Design tokens ──────────────────────────────────────────────────────────────

const GLASS: React.CSSProperties = {
  background: 'rgba(13,18,50,0.82)',
  border: '1px solid rgba(96,165,250,0.12)',
  borderRadius: 14,
  backdropFilter: 'blur(12px)',
};

const CATEGORY_CFG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  risks:    { label: 'Riesgos',            icon: <AlertTriangle size={14} />, color: '#6366f1' },
  controls: { label: 'Controles',          icon: <Shield size={14} />,        color: '#0891b2' },
  tests:    { label: 'Pruebas de Control', icon: <ClipboardCheck size={14} />,color: '#059669' },
  evidences:{ label: 'Evidencias',         icon: <FileText size={14} />,      color: '#b45309' },
};

const DATE_STATUS_CFG: Record<string, { label: string; color: string }> = {
  vencida:   { label: 'Vencida',   color: '#ef4444' },
  proxima:   { label: 'Próxima',   color: '#f59e0b' },
  vigente:   { label: 'Vigente',   color: '#22c55e' },
  sin_fecha: { label: 'Sin fecha', color: '#64748b' },
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: string }) {
  const c = DATE_STATUS_CFG[status]?.color ?? '#64748b';
  return <div style={{ width: 7, height: 7, borderRadius: '50%', background: c, flexShrink: 0 }} />;
}

void StatusDot;

function MediosBar({ value, total, color }: { value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: '0.7rem', color: '#94a3b8', minWidth: 22, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

function Num({ n, color }: { n: number; color: string }) {
  if (n === 0) return <span style={{ color: '#334155', fontWeight: 700, fontSize: '0.82rem' }}>—</span>;
  return <span style={{ color, fontWeight: 700, fontSize: '0.82rem' }}>{n}</span>;
}

function DonutChart({ data }: { data: { label: string; count: number; pct: number; color: string }[] }) {
  const r = 58, cx = 76, cy = 76;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const totalCount = data.reduce((s, d) => s + d.count, 0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <svg width={152} height={152}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={22} />
        {data.map((seg) => {
          const dash = (seg.pct / 100) * circ;
          const gap  = circ - dash;
          const el = (
            <circle key={seg.label} cx={cx} cy={cy} r={r}
              fill="none" stroke={seg.color} strokeWidth={22}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          );
          offset += dash;
          return el;
        })}
        <text x={cx} y={cy - 6} textAnchor="middle" fill="#f8fafc" fontSize={20} fontWeight={900}>{totalCount}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="#64748b" fontSize={10}>Total</text>
      </svg>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', width: '100%' }}>
        {data.map((s) => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 9, height: 9, borderRadius: 2, background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', flex: 1 }}>{s.label}</span>
            <span style={{ fontSize: '0.75rem', color: '#f8fafc', fontWeight: 700 }}>{s.count}</span>
            <span style={{ fontSize: '0.68rem', color: '#475569', marginLeft: 3 }}>{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SimpleEventTable({ rows }: { rows: SimpleEvento[] }) {
  const sevColor: Record<string, string> = { critico: '#ef4444', alto: '#f59e0b', medio: '#f97316', bajo: '#22c55e' };
  const sevLabel: Record<string, string> = { critico: 'Crítico', alto: 'Alto', medio: 'Medio', bajo: 'Bajo' };
  const statusCfg: Record<string, { label: string; color: string }> = {
    active:    { label: 'Activo',      color: '#ef4444' },
    monitored: { label: 'Monitoreado', color: '#f59e0b' },
    resolved:  { label: 'Resuelto',    color: '#22c55e' },
    discarded: { label: 'Descartado',  color: '#64748b' },
  };
  return (
    <div style={{ overflowX: 'auto', maxHeight: 320, overflowY: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
        <thead style={{ position: 'sticky', top: 0, background: 'rgba(13,18,50,0.98)', zIndex: 1 }}>
          <tr style={{ color: '#475569', textTransform: 'uppercase', fontSize: '0.67rem', letterSpacing: '0.04em' }}>
            {['Estado','Criticidad','Evento','Responsable','Vencimiento'].map((h) => (
              <th key={h} style={{ padding: '5px 10px', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.06)', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((ev, i) => {
            const sc  = statusCfg[ev.status] ?? { label: ev.status, color: '#94a3b8' };
            const sc2 = sevColor[ev.sev_key] ?? '#94a3b8';
            return (
              <tr key={ev.id}
                style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(96,165,250,0.06)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent')}
              >
                <td style={{ padding: '6px 10px' }}>
                  <span style={{ background: sc.color+'22', color: sc.color, border: `1px solid ${sc.color}44`, fontSize: '0.67rem', fontWeight: 700, padding: '2px 7px', borderRadius: 5 }}>{sc.label}</span>
                </td>
                <td style={{ padding: '6px 10px' }}>
                  <span style={{ background: sc2+'22', color: sc2, border: `1px solid ${sc2}44`, fontSize: '0.67rem', fontWeight: 700, padding: '2px 7px', borderRadius: 5 }}>{sevLabel[ev.sev_key] ?? ev.sev_key}</span>
                </td>
                <td style={{ padding: '6px 10px', color: '#e2e8f0', maxWidth: 220 }}>
                  <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>{ev.title}</div>
                </td>
                <td style={{ padding: '6px 10px', color: '#475569', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{ev.responsible_name ?? '—'}</td>
                <td style={{ padding: '6px 10px', color: ev.due_date ? '#f59e0b' : '#334155', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                  {ev.due_date ? new Date(ev.due_date+'T00:00:00').toLocaleDateString('es-DO') : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#334155' }}><div style={{ fontSize: '0.82rem' }}>{label}</div></div>;
}

function ItemCard({ item, showOverdue }: { item: MonitorItem; showOverdue?: boolean }) {
  const catCfg = CATEGORY_CFG[item.category];
  const dias = item.dias_restantes;
  const isOverdue = showOverdue || dias < 0;
  const absDias = Math.abs(dias);
  const boxColor = isOverdue ? 'rgba(239,68,68,0.15)' : dias <= 7 ? 'rgba(245,158,11,0.12)' : 'rgba(59,130,246,0.10)';
  const numColor = isOverdue ? '#ef4444' : dias <= 7 ? '#f59e0b' : '#60a5fa';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.025)', borderRadius: 10, padding: '10px 12px', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ minWidth: 42, height: 42, borderRadius: 9, flexShrink: 0, background: boxColor, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '1.1rem', fontWeight: 900, lineHeight: 1, color: numColor }}>{absDias}</span>
        <span style={{ fontSize: '0.58rem', color: '#64748b', lineHeight: 1 }}>{isOverdue ? 'atrás' : 'días'}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.82rem', color: '#e2e8f0', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
          {catCfg && <span style={{ color: catCfg.color, display: 'flex', alignItems: 'center' }}>{catCfg.icon}</span>}
          <span style={{ fontSize: '0.72rem', color: '#475569' }}>{catCfg?.label ?? item.category}</span>
          {item.due_date && <span style={{ fontSize: '0.7rem', color: '#334155' }}>· {new Date(item.due_date + 'T00:00:00').toLocaleDateString('es-DO')}</span>}
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function DashboardMonitoreoPage() {
  const [data, setData]       = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('Todos');

  const fetchDashboard = useCallback(async () => {
    try {
      const res  = await fetch('/api/monitoring/dashboard');
      const json = await res.json();
      if (json.ok) setData(json as DashboardData);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await fetchDashboard(); } finally { setRefreshing(false); }
  }, [fetchDashboard]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const kpis: Kpis | undefined = data?.kpis;
  const total = kpis?.total ?? 0;

  const KPI_CARDS = [
    { label: 'Vencidos',        value: kpis?.vencidos  ?? 0, color: '#ef4444', bg: 'rgba(239,68,68,0.12)',    icon: <AlertTriangle size={18} /> },
    { label: 'Próximos 30d',    value: kpis?.proximos  ?? 0, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',   icon: <Clock size={18} />         },
    { label: 'Vigentes',        value: kpis?.vigentes  ?? 0, color: '#22c55e', bg: 'rgba(34,197,94,0.10)',    icon: <CheckCircle size={18} />   },
    { label: 'Sin fecha',       value: kpis?.sin_fecha ?? 0, color: '#64748b', bg: 'rgba(100,116,139,0.10)',  icon: <Calendar size={18} />      },
    { label: 'Con fecha',       value: kpis?.con_fecha ?? 0, color: '#60a5fa', bg: 'rgba(59,130,246,0.10)',   icon: <ClipboardCheck size={18} />},
    { label: 'Total elementos', value: total,                color: '#818cf8', bg: 'rgba(99,102,241,0.10)',   icon: <BarChart2 size={18} />     },
  ];

  const donutData = [
    { label: 'Vencida',   count: kpis?.vencidos  ?? 0, pct: total > 0 ? Math.round(((kpis?.vencidos  ?? 0) / total) * 100) : 0, color: '#ef4444' },
    { label: 'Próxima',   count: kpis?.proximos  ?? 0, pct: total > 0 ? Math.round(((kpis?.proximos  ?? 0) / total) * 100) : 0, color: '#f59e0b' },
    { label: 'Vigente',   count: kpis?.vigentes  ?? 0, pct: total > 0 ? Math.round(((kpis?.vigentes  ?? 0) / total) * 100) : 0, color: '#22c55e' },
    { label: 'Sin fecha', count: kpis?.sin_fecha ?? 0, pct: total > 0 ? Math.round(((kpis?.sin_fecha ?? 0) / total) * 100) : 0, color: '#64748b' },
  ];

  const nResidual    = data?.alertas_riesgo_residual?.length  ?? 0;
  const nSinCtrl     = data?.riesgos_sin_control?.length      ?? 0;
  const nSinEv       = data?.controles_sin_evidencia?.length  ?? 0;
  const totalAlertas = nResidual + nSinCtrl + nSinEv;
  const pctA = (n: number) => totalAlertas > 0 ? Math.round((n / totalAlertas) * 100) : 0;
  const alertasDonutData = [
    { label: 'Riesgo residual',    count: nResidual, pct: pctA(nResidual), color: '#ef4444' },
    { label: 'Riesgo sin control', count: nSinCtrl,  pct: pctA(nSinCtrl),  color: '#6366f1' },
    { label: 'Sin evidencia',      count: nSinEv,    pct: pctA(nSinEv),    color: '#0891b2' },
  ];

  const FILTERS = ['Todos', 'Vencidos', 'Próximos', 'Vigentes', 'Sin fecha'];
  const FILTER_KEY: Record<string, keyof CatItem> = {
    Vencidos: 'vencidos', Próximos: 'proximos', Vigentes: 'vigentes', 'Sin fecha': 'sin_fecha',
  };
  const categorias = (data?.por_categoria ?? []).filter((c) => {
    if (activeFilter === 'Todos') return true;
    const key = FILTER_KEY[activeFilter];
    return key ? Number(c[key]) > 0 : true;
  });

  const ultimaAct = data?.ultima_actualizacion
    ? new Date(data.ultima_actualizacion).toLocaleString('es-DO', { dateStyle: 'short', timeStyle: 'short' })
    : '—';

  return (
    <div style={{ padding: '2rem', minHeight: '100vh', color: '#f8fafc' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 11,
              background: 'linear-gradient(135deg,rgba(59,130,246,0.22) 0%,rgba(99,102,241,0.22) 100%)',
              border: '1px solid rgba(59,130,246,0.28)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Activity size={20} style={{ color: '#60a5fa' }} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#f8fafc' }}>Monitoreo Ejecutivo</h1>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Monitoreo Adentro, afuera, tiempo · Act: {ultimaAct}</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {FILTERS.map((f) => (
              <button key={f} onClick={() => setActiveFilter(f)}
                style={{
                  background: activeFilter === f ? 'rgba(59,130,246,0.18)' : 'rgba(255,255,255,0.04)',
                  border: activeFilter === f ? '1px solid rgba(59,130,246,0.45)' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 7, padding: '5px 11px',
                  fontSize: '0.76rem', fontWeight: activeFilter === f ? 700 : 400,
                  color: activeFilter === f ? '#60a5fa' : '#64748b',
                  cursor: 'pointer',
                }}
              >{f}</button>
            ))}
            <Link href="/gestion/dashboard_monitoreo/definir"
              style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(99,102,241,0.10)', border: '1px solid rgba(99,102,241,0.28)', borderRadius: 8, padding: '5px 12px', fontSize: '0.76rem', color: '#a5b4fc', textDecoration: 'none' }}
            >
              <CalendarCog size={13} /> Definir
            </Link>
            <button onClick={handleRefresh} disabled={refreshing || loading}
              style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(59,130,246,0.14)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, padding: '5px 12px', fontSize: '0.76rem', color: '#60a5fa', cursor: refreshing ? 'wait' : 'pointer', opacity: refreshing ? 0.6 : 1 }}
            >
              {refreshing ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Actualizando…</> : <><RefreshCw size={13} /> Actualizar</>}
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0', color: '#475569' }}>
          <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      )}

      {!loading && (
        <>
          {/* KPI cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12, marginBottom: '1.5rem' }}>
            {KPI_CARDS.map((k) => (
              <div key={k.label} style={{ ...GLASS, padding: '1rem 1.1rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{k.label}</span>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: k.color }}>{k.icon}</div>
                </div>
                <span style={{ fontSize: '2rem', fontWeight: 900, color: k.color, lineHeight: 1 }}>{k.value}</span>
              </div>
            ))}
          </div>

          {/* Donuts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: '1.5rem' }}>
            <div style={{ ...GLASS, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <BarChart2 size={15} style={{ color: '#60a5fa' }} />
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#e2e8f0' }}>Distribución por estado</span>
              </div>
              {total === 0 ? <EmptyState label="Sin datos" /> : <DonutChart data={donutData} />}
            </div>
            <div style={{ ...GLASS, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={15} style={{ color: '#ef4444' }} />
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#e2e8f0' }}>Distribución de alertas</span>
              </div>
              {totalAlertas === 0 ? <EmptyState label="Sin alertas activas" /> : <DonutChart data={alertasDonutData} />}
            </div>
          </div>

          {/* Estado por categoría */}
          <div style={{ ...GLASS, padding: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
              <Filter size={15} style={{ color: '#60a5fa' }} />
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#e2e8f0' }}>Estado por categoría</span>
              <span style={{ fontSize: '0.7rem', color: '#334155', marginLeft: 4 }}>({categorias.length} categorías)</span>
            </div>
            {categorias.length === 0 ? <EmptyState label="No hay datos disponibles." /> : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                  <thead>
                    <tr style={{ color: '#475569', textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.04em' }}>
                      {['Categoría','Total','Vencidos','Próximos','Vigentes','Sin fecha','Distribución'].map((h) => (
                        <th key={h} style={{ padding: '5px 8px', textAlign: h === 'Distribución' || h === 'Categoría' ? 'left' : 'center', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.06)', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {categorias.map((cat, i) => {
                      const cfg = CATEGORY_CFG[cat.category];
                      return (
                        <tr key={cat.category}
                          style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent' }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(96,165,250,0.06)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent')}
                        >
                          <td style={{ padding: '6px 8px', color: '#cbd5e1' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ color: cfg?.color ?? '#94a3b8' }}>{cfg?.icon}</span>
                              {cfg?.label ?? cat.category}
                            </div>
                          </td>
                          <td style={{ textAlign: 'center', padding: '6px 8px' }}><Num n={cat.total}     color="#94a3b8" /></td>
                          <td style={{ textAlign: 'center', padding: '6px 8px' }}><Num n={cat.vencidos}  color="#ef4444" /></td>
                          <td style={{ textAlign: 'center', padding: '6px 8px' }}><Num n={cat.proximos}  color="#f59e0b" /></td>
                          <td style={{ textAlign: 'center', padding: '6px 8px' }}><Num n={cat.vigentes}  color="#22c55e" /></td>
                          <td style={{ textAlign: 'center', padding: '6px 8px' }}><Num n={cat.sin_fecha} color="#64748b" /></td>
                          <td style={{ padding: '6px 8px', minWidth: 100 }}>
                            <MediosBar value={cat.vencidos + cat.proximos} total={cat.total} color={cfg?.color ?? '#94a3b8'} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Próximos y vencidos */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ ...GLASS, padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={15} style={{ color: '#f59e0b' }} />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#e2e8f0' }}>Próximos vencimientos</span>
                </div>
                <span style={{ fontSize: '0.72rem', color: '#475569' }}>Próximos 30 días</span>
              </div>
              {(data?.proximos_vencimientos ?? []).length === 0
                ? <EmptyState label="No hay vencimientos próximos" />
                : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{(data?.proximos_vencimientos ?? []).map((item) => <ItemCard key={item.id} item={item} />)}</div>
              }
            </div>
            <div style={{ ...GLASS, padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={15} style={{ color: '#ef4444' }} />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#e2e8f0' }}>Elementos vencidos</span>
                </div>
                <button style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'transparent', border: 'none', fontSize: '0.72rem', color: '#60a5fa', cursor: 'pointer' }}>
                  Ver todos <ChevronRight size={12} />
                </button>
              </div>
              {(data?.elementos_vencidos ?? []).length === 0
                ? <EmptyState label="No hay elementos vencidos" />
                : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{(data?.elementos_vencidos ?? []).map((item) => <ItemCard key={item.id} item={item} showOverdue />)}</div>
              }
            </div>
          </div>

          {/* Alerta riesgo residual */}
          <div style={{ ...GLASS, padding: '1.25rem', marginTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={15} style={{ color: '#ef4444' }} />
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#e2e8f0' }}>Alerta Riesgo residual</span>
                <span style={{ fontSize: '0.7rem', color: '#334155', marginLeft: 4 }}>({(data?.alertas_riesgo_residual ?? []).length} alertas · valor actual &gt; umbral)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {(['active','monitored','resolved'] as const).map((s) => {
                  const cfg = { active: { label: 'Activo', color: '#ef4444' }, monitored: { label: 'Monitoreado', color: '#f59e0b' }, resolved: { label: 'Resuelto', color: '#22c55e' } }[s];
                  const n = (data?.alertas_riesgo_residual ?? []).filter(e => e.status === s).length;
                  return (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.color }} />
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{cfg.label}: </span>
                      <span style={{ fontSize: '0.72rem', color: cfg.color, fontWeight: 700 }}>{n}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            {(data?.alertas_riesgo_residual ?? []).length === 0
              ? <EmptyState label="No hay alertas de riesgo residual activas (current_value > threshold_value)." />
              : (
                <div style={{ overflowX: 'auto', maxHeight: 380, overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                    <thead style={{ position: 'sticky', top: 0, background: 'rgba(13,18,50,0.98)', zIndex: 1 }}>
                      <tr style={{ color: '#475569', textTransform: 'uppercase', fontSize: '0.67rem', letterSpacing: '0.04em' }}>
                        {['Estado','Criticidad','Categoría','Evento','Trigger','Valor actual','Umbral','Responsable','Vencimiento'].map((h) => (
                          <th key={h} style={{ padding: '5px 10px', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.06)', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.alertas_riesgo_residual ?? []).map((ev: AlertaRiesgoResidual, i) => {
                        const catCfg = CATEGORY_CFG[ev.category];
                        const sevColor: Record<string, string> = { critico: '#ef4444', alto: '#f59e0b', medio: '#f97316', bajo: '#22c55e' };
                        const sevLabel: Record<string, string> = { critico: 'Crítico', alto: 'Alto', medio: 'Medio', bajo: 'Bajo' };
                        const statusCfg: Record<string, { label: string; color: string }> = { active: { label: 'Activo', color: '#ef4444' }, monitored: { label: 'Monitoreado', color: '#f59e0b' }, resolved: { label: 'Resuelto', color: '#22c55e' }, discarded: { label: 'Descartado', color: '#64748b' } };
                        const sc  = statusCfg[ev.status] ?? { label: ev.status, color: '#94a3b8' };
                        const sc2 = sevColor[ev.sev_key] ?? '#94a3b8';
                        const cur = ev.current_value   ? Number(ev.current_value).toFixed(1)   : '—';
                        const thr = ev.threshold_value ? Number(ev.threshold_value).toFixed(1) : '—';
                        return (
                          <tr key={ev.id} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent' }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(96,165,250,0.06)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent')}
                          >
                            <td style={{ padding: '6px 10px' }}><span style={{ background: sc.color+'22', color: sc.color, border: `1px solid ${sc.color}44`, fontSize: '0.67rem', fontWeight: 700, padding: '2px 7px', borderRadius: 5 }}>{sc.label}</span></td>
                            <td style={{ padding: '6px 10px' }}><span style={{ background: sc2+'22', color: sc2, border: `1px solid ${sc2}44`, fontSize: '0.67rem', fontWeight: 700, padding: '2px 7px', borderRadius: 5 }}>{sevLabel[ev.sev_key] ?? ev.sev_key}</span></td>
                            <td style={{ padding: '6px 10px', color: '#cbd5e1' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <span style={{ color: catCfg?.color ?? '#94a3b8' }}>{catCfg?.icon}</span>
                                <span style={{ fontSize: '0.75rem' }}>{catCfg?.label ?? ev.category}</span>
                              </div>
                            </td>
                            <td style={{ padding: '6px 10px', color: '#e2e8f0', maxWidth: 240 }}><div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>{ev.title}</div></td>
                            <td style={{ padding: '6px 10px' }}><span style={{ fontSize: '0.72rem', color: '#64748b', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', padding: '2px 7px', borderRadius: 5 }}>{ev.trigger_type}</span></td>
                            <td style={{ padding: '6px 10px', textAlign: 'right' }}><span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#ef4444' }}>{cur}</span></td>
                            <td style={{ padding: '6px 10px', textAlign: 'right' }}><span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b' }}>{thr}</span></td>
                            <td style={{ padding: '6px 10px', color: '#475569', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{ev.responsible_name ?? '—'}</td>
                            <td style={{ padding: '6px 10px', color: ev.due_date ? '#f59e0b' : '#334155', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{ev.due_date ? new Date(ev.due_date+'T00:00:00').toLocaleDateString('es-DO') : '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            }
          </div>

          {/* Controles sin evidencia + Riesgos sin control */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
            <div style={{ ...GLASS, padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
                <Shield size={15} style={{ color: '#0891b2' }} />
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#e2e8f0' }}>Control sin evidencia</span>
                <span style={{ fontSize: '0.7rem', color: '#334155', marginLeft: 4 }}>({(data?.controles_sin_evidencia ?? []).length})</span>
              </div>
              {(data?.controles_sin_evidencia ?? []).length === 0
                ? <EmptyState label="No hay controles sin evidencia válida" />
                : <SimpleEventTable rows={data!.controles_sin_evidencia} />
              }
            </div>
            <div style={{ ...GLASS, padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
                <AlertTriangle size={15} style={{ color: '#6366f1' }} />
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#e2e8f0' }}>Riesgo sin control</span>
                <span style={{ fontSize: '0.7rem', color: '#334155', marginLeft: 4 }}>({(data?.riesgos_sin_control ?? []).length})</span>
              </div>
              {(data?.riesgos_sin_control ?? []).length === 0
                ? <EmptyState label="No hay riesgos sin controles mitigantes" />
                : <SimpleEventTable rows={data!.riesgos_sin_control} />
              }
            </div>
          </div>
        </>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
