'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Flame, Loader2, X } from 'lucide-react';
import { extractError } from './ContextWizardShared';

type ValuationRisk = {
  id: string;
  code: string;
  risk: string;
  cause: string;
  event: string;
  consequence: string;
  id_valoration: string | null;
  activity: string;
  owner: string;
  owner_id: string | null;
  impact_score: number | null;
  probability_score: number | null;
  residual_impact_pos: number | null;
  residual_probability_pos: number | null;
  inherent_score: number;
  residual_score: number;
  reduction_score: number;
  reduction_percent: number;
  inherent_level: string | null;
  inherent_level_color: string | null;
  residual_level: string | null;
  residual_level_color: string | null;
  controls: Array<{ id: string; name: string }>;
};

type ValuationData = {
  meta: {
    run_ra_code: string;
    evaluated_process: string;
    risk_appetite: string;
    appetite_tolerance_min?: number | null;
    appetite_tolerance_max?: number | null;
  };
  summary: {
    total_inherent: number;
    total_residual: number;
    total_reduction: number;
    total_reduction_percent: number;
  };
  risks: ValuationRisk[];
  catalogs?: {
    valoration?: Array<{ id: string; label: string }>;
    owners?: Array<{ id: string; name: string }>;
    risk_levels?: Array<{ code: string; name: string; min_score: number; max_score: number; color: string }>;
  };
};

// ─── Heat Map ─────────────────────────────────────────────────────────────────

function heatMapRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawHeatMapToCanvas(
  canvas: HTMLCanvasElement,
  risks: ValuationRisk[],
  levels: Array<{ code: string; name: string; min_score: number; max_score: number; color: string }>,
  mode: HeatMapMode,
  evalCode: string,
) {
  const CW = 124, CH = 92, GAP = 4, LW = 114, LEGW = 200, PAD = 40, TITLEH = 72;
  const gridW = LW + 5 * CW + 4 * GAP;
  const gridH = 5 * CH + 4 * GAP;
  canvas.width  = PAD + gridW + PAD + LEGW + PAD;
  canvas.height = TITLEH + PAD + gridH + 50 + PAD;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#020c1f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 20px system-ui,sans-serif';
  ctx.fillText(`MAPA DE CALOR — ${mode === 'inherent' ? 'RIESGO INHERENTE' : 'RIESGO RESIDUAL'}`, PAD, 32);
  if (evalCode) {
    ctx.fillStyle = '#475569';
    ctx.font = '13px system-ui,sans-serif';
    ctx.fillText(`Evaluación: ${evalCode}`, PAD, 54);
  }

  const sx = PAD + LW, sy = TITLEH + PAD;

  for (let row = 0; row < 5; row++) {
    const impact = 5 - row;
    const imp = IMPACT_LABELS[row];
    const y = sy + row * (CH + GAP);

    ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 12px system-ui,sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(imp.code, sx - 10, y + CH / 2 - 4);
    ctx.fillStyle = '#475569'; ctx.font = '10px system-ui,sans-serif';
    ctx.fillText(imp.name, sx - 10, y + CH / 2 + 10);
    ctx.textAlign = 'left';

    for (let col = 0; col < 5; col++) {
      const prob = col + 1;
      const score = impact * prob * 4;
      const lvl = levels.find((l) => score >= l.min_score && score <= l.max_score) ?? levels[0];
      const c = lvl.color;
      const x = sx + col * (CW + GAP);

      ctx.globalAlpha = 0.16; ctx.fillStyle = c;
      heatMapRoundRect(ctx, x, y, CW, CH, 8); ctx.fill();
      ctx.globalAlpha = 0.38; ctx.strokeStyle = c; ctx.lineWidth = 1;
      heatMapRoundRect(ctx, x, y, CW, CH, 8); ctx.stroke();
      ctx.globalAlpha = 1;

      const cellRisks = mode === 'inherent'
        ? risks.filter((r) => Math.round(r.impact_score ?? 0) === impact && Math.round(r.probability_score ?? 0) === prob)
        : risks.filter((r) => r.residual_impact_pos === impact && r.residual_probability_pos === prob);

      let dx = x + 8, dy = y + 8;
      const DR = 16;
      for (const r of cellRisks) {
        const dc = (mode === 'inherent' ? r.inherent_level_color : r.residual_level_color) ?? c;
        ctx.globalAlpha = 0.22; ctx.fillStyle = dc;
        ctx.beginPath(); ctx.arc(dx + DR, dy + DR, DR, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1; ctx.strokeStyle = dc; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(dx + DR, dy + DR, DR, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = dc; ctx.font = 'bold 7px system-ui,sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText((r.code || r.risk).slice(0, 4), dx + DR, dy + DR);
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
        dx += DR * 2 + 4;
        if (dx + DR * 2 > x + CW - 4) { dx = x + 8; dy += DR * 2 + 4; }
      }
    }
  }

  for (let col = 0; col < 5; col++) {
    const p = PROB_LABELS[col];
    const cx2 = sx + col * (CW + GAP) + CW / 2;
    const py = sy + 5 * (CH + GAP) + 4;
    ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 12px system-ui,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(p.code, cx2, py + 14);
    ctx.fillStyle = '#475569'; ctx.font = '10px system-ui,sans-serif';
    ctx.fillText(p.name, cx2, py + 28);
  }
  ctx.fillStyle = '#334155'; ctx.font = 'bold 11px system-ui,sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('PROBABILIDAD →', sx + (5 * (CW + GAP) - GAP) / 2, sy + gridH + 46);

  ctx.save(); ctx.translate(16, sy + gridH / 2); ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = '#334155'; ctx.font = 'bold 11px system-ui,sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('IMPACTO →', 0, 0); ctx.restore();

  const lx = PAD + gridW + PAD, ly = TITLEH + PAD;
  ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 11px system-ui,sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('NIVELES DE RIESGO', lx, ly + 14);
  [...levels].reverse().forEach((l, i) => {
    const ry = ly + 36 + i * 30;
    ctx.globalAlpha = 0.22; ctx.fillStyle = l.color; ctx.fillRect(lx, ry, 14, 14);
    ctx.globalAlpha = 1; ctx.strokeStyle = l.color; ctx.lineWidth = 1.5; ctx.strokeRect(lx, ry, 14, 14);
    ctx.fillStyle = '#94a3b8'; ctx.font = '11px system-ui,sans-serif'; ctx.fillText(l.name, lx + 20, ry + 11);
    ctx.fillStyle = '#334155'; ctx.font = '10px system-ui,sans-serif'; ctx.fillText(`${l.min_score}–${l.max_score}`, lx + 20, ry + 24);
  });
  ctx.textAlign = 'left';
}

const IMPACT_LABELS = [
  { ordinal: 5, code: 'I5', name: 'Crítico' },
  { ordinal: 4, code: 'I4', name: 'Mayor' },
  { ordinal: 3, code: 'I3', name: 'Moderado' },
  { ordinal: 2, code: 'I2', name: 'Menor' },
  { ordinal: 1, code: 'I1', name: 'Insignificante' },
] as const;

const PROB_LABELS = [
  { ordinal: 1, code: 'P1', name: 'Muy baja' },
  { ordinal: 2, code: 'P2', name: 'Baja' },
  { ordinal: 3, code: 'P3', name: 'Media' },
  { ordinal: 4, code: 'P4', name: 'Alta' },
  { ordinal: 5, code: 'P5', name: 'Muy alta' },
] as const;

const FALLBACK_LEVELS = [
  { code: 'VERY_LOW', name: 'Muy bajo',  min_score:  1, max_score:  5, color: '#22c55e' },
  { code: 'LOW',      name: 'Bajo',      min_score:  6, max_score: 20, color: '#84cc16' },
  { code: 'MEDIUM',   name: 'Medio',     min_score: 21, max_score: 40, color: '#eab308' },
  { code: 'HIGH',     name: 'Alto',      min_score: 41, max_score: 70, color: '#f97316' },
  { code: 'CRITICAL', name: 'Crítico',   min_score: 71, max_score: 100, color: '#ef4444' },
];

type HeatMapMode = 'inherent' | 'residual';

export function HeatMapModal({ runRaId, onClose }: { runRaId: string; onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ValuationData | null>(null);
  const [mode, setMode] = useState<HeatMapMode>('inherent');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/linear-risk/risk-valuation?runRaId=${encodeURIComponent(runRaId)}`, {
          credentials: 'include', cache: 'no-store',
        });
        const body = await res.json() as ValuationData & { error?: string };
        if (res.ok) setData(body);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [runRaId]);

  async function saveCurrentMode(d: ValuationData, m: HeatMapMode, lvls: typeof FALLBACK_LEVELS) {
    setSaveStatus('saving');
    try {
      const canvas = document.createElement('canvas');
      drawHeatMapToCanvas(canvas, d.risks, lvls, m, d.meta.run_ra_code);
      const imageBase64 = canvas.toDataURL('image/png').split(',')[1];
      const res = await fetch('/api/linear-risk/heatmap-save', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runRaId, imageBase64, mode: m }),
      });
      setSaveStatus(res.ok ? 'saved' : 'error');
    } catch {
      setSaveStatus('error');
    }
    setTimeout(() => setSaveStatus('idle'), 3000);
  }

  useEffect(() => {
    if (!data) return;
    const lvls = (data.catalogs?.risk_levels && data.catalogs.risk_levels.length > 0)
      ? data.catalogs.risk_levels : FALLBACK_LEVELS;
    void saveCurrentMode(data, mode, lvls);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, mode]);

  const levels = (data?.catalogs?.risk_levels && data.catalogs.risk_levels.length > 0)
    ? data.catalogs.risk_levels
    : FALLBACK_LEVELS;

  function getCellLevel(impact: number, prob: number) {
    const score = impact * prob * 4;
    return levels.find((l) => score >= l.min_score && score <= l.max_score) ?? levels[0];
  }

  function getRisksAtCell(impact: number, prob: number): ValuationRisk[] {
    if (!data) return [];
    if (mode === 'inherent') {
      return data.risks.filter(
        (r) => Math.round(r.impact_score ?? 0) === impact && Math.round(r.probability_score ?? 0) === prob,
      );
    }
    return data.risks.filter(
      (r) => r.residual_impact_pos === impact && r.residual_probability_pos === prob,
    );
  }

  const CELL_W = 108;
  const CELL_H = 84;
  const LABEL_W = 96;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9998,
      background: 'rgba(2,8,28,0.98)',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'inherit',
    }}>
      {/* Header */}
      <div style={{
        padding: '0.9rem 2rem',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
        background: 'rgba(7,16,42,0.95)', backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Flame size={18} color="#f97316" />
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>MAPA DE CALOR</div>
              <div style={{ fontSize: '0.66rem', color: '#475569' }}>Matriz de riesgo 5 × 5 — Impacto vs Probabilidad</div>
            </div>
          </div>
          {/* Mode toggle */}
          <div style={{ display: 'flex', gap: '0.3rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '0.22rem' }}>
            {(['inherent', 'residual'] as const).map((m) => {
              const isActive = mode === m;
              const color = m === 'inherent' ? '#f87171' : '#60a5fa';
              const label = m === 'inherent' ? 'Riesgo Inherente' : 'Riesgo Residual';
              return (
                <button key={m} onClick={() => setMode(m)} style={{
                  padding: '0.38rem 1.1rem', borderRadius: 7, cursor: 'pointer', fontWeight: 700,
                  fontSize: '0.75rem', fontFamily: 'inherit', transition: 'all .15s',
                  background: isActive ? `${color}20` : 'transparent',
                  color: isActive ? color : '#475569',
                  border: isActive ? `1px solid ${color}55` : '1px solid transparent',
                }}>{label}</button>
              );
            })}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {saveStatus !== 'idle' && (
            <span style={{
              fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem',
              color: saveStatus === 'saved' ? '#34d399' : saveStatus === 'error' ? '#f87171' : '#60a5fa',
            }}>
              {saveStatus === 'saving' && <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />}
              {saveStatus === 'saved' && <CheckCircle2 size={13} />}
              {saveStatus === 'saving' ? 'Guardando…' : saveStatus === 'saved' ? 'Guardado en C:\\_CRE\\mapa' : 'Error al guardar'}
            </span>
          )}
          <button onClick={onClose} style={{
            width: 34, height: 34, borderRadius: 8, border: '1px solid rgba(239,68,68,0.25)',
            background: 'rgba(239,68,68,0.08)', color: '#f87171', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Loader2 size={32} color="#3b82f6" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 2rem', gap: '2.5rem', overflowY: 'auto' }}>

          {/* Matrix */}
          <div>
            <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
              {/* Y-axis title */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: CELL_H * 5 + 4 * 4 }}>
                <span style={{
                  writingMode: 'vertical-rl', transform: 'rotate(180deg)',
                  fontSize: '0.6rem', fontWeight: 800, color: '#334155',
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                }}>IMPACTO →</span>
              </div>

              <div>
                {/* Grid rows */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {IMPACT_LABELS.map((imp) => (
                    <div key={imp.ordinal} style={{ display: 'flex', gap: 4, alignItems: 'stretch' }}>
                      {/* Row label */}
                      <div style={{ width: LABEL_W, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end', paddingRight: 10, flexShrink: 0 }}>
                        <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#94a3b8' }}>{imp.code}</span>
                        <span style={{ fontSize: '0.52rem', color: '#475569', lineHeight: 1.3 }}>{imp.name}</span>
                      </div>
                      {/* Cells */}
                      {PROB_LABELS.map((prob) => {
                        const lvl = getCellLevel(imp.ordinal, prob.ordinal);
                        const c = lvl.color;
                        const cellRisks = getRisksAtCell(imp.ordinal, prob.ordinal);
                        return (
                          <div key={prob.ordinal} style={{
                            width: CELL_W, height: CELL_H,
                            background: `${c}1a`,
                            border: `1px solid ${c}40`,
                            borderRadius: 8,
                            display: 'flex', flexWrap: 'wrap', gap: 4,
                            padding: 6, boxSizing: 'border-box',
                            boxShadow: cellRisks.length > 0 ? `inset 0 0 0 2px ${c}60` : 'none',
                          }}>
                            {cellRisks.map((r) => {
                              const dotColor = (mode === 'inherent' ? r.inherent_level_color : r.residual_level_color) ?? c;
                              const score = mode === 'inherent' ? r.inherent_score : r.residual_score;
                              const level = mode === 'inherent' ? r.inherent_level : r.residual_level;
                              const label = (r.code || r.risk).slice(0, 4);
                              return (
                                <div
                                  key={r.id}
                                  title={`${r.code ? r.code + ': ' : ''}${r.risk}\nScore: ${score.toFixed(1)}\nNivel: ${level ?? '—'}`}
                                  style={{
                                    width: 34, height: 34, borderRadius: '50%',
                                    background: `${dotColor}28`,
                                    border: `2.5px solid ${dotColor}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.46rem', fontWeight: 900, color: dotColor,
                                    cursor: 'default', flexShrink: 0, textAlign: 'center', lineHeight: 1, letterSpacing: '-0.01em',
                                  }}
                                >
                                  {label}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>

                {/* X-axis labels */}
                <div style={{ display: 'flex', gap: 4, marginLeft: LABEL_W + 10, marginTop: 8 }}>
                  {PROB_LABELS.map((p) => (
                    <div key={p.ordinal} style={{ width: CELL_W, textAlign: 'center' }}>
                      <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#94a3b8' }}>{p.code}</div>
                      <div style={{ fontSize: '0.52rem', color: '#475569' }}>{p.name}</div>
                    </div>
                  ))}
                </div>
                <div style={{ textAlign: 'center', marginLeft: LABEL_W + 10, marginTop: 6 }}>
                  <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#334155', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                    PROBABILIDAD →
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', minWidth: 220, maxWidth: 260 }}>

            {/* Legend */}
            <div style={{ background: 'rgba(9,18,48,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '1rem 1.2rem' }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.75rem' }}>Niveles de riesgo</div>
              {[...levels].reverse().map((l) => (
                <div key={l.code} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.45rem' }}>
                  <div style={{ width: 14, height: 14, borderRadius: 4, background: `${l.color}28`, border: `1.5px solid ${l.color}` }} />
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, flex: 1 }}>{l.name}</span>
                  <span style={{ fontSize: '0.6rem', color: '#334155' }}>{l.min_score}–{l.max_score}</span>
                </div>
              ))}
            </div>

            {/* Summary stats */}
            {data && (
              <div style={{ background: 'rgba(9,18,48,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '1rem 1.2rem' }}>
                <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.75rem' }}>Resumen</div>
                {[
                  { label: 'Total riesgos', value: String(data.risks.length), color: '#e2e8f0' },
                  { label: 'Score total', value: (mode === 'inherent' ? data.summary.total_inherent : data.summary.total_residual).toFixed(1), color: mode === 'inherent' ? '#f87171' : '#60a5fa' },
                  { label: 'Modo activo', value: mode === 'inherent' ? 'Inherente' : 'Residual', color: mode === 'inherent' ? '#f87171' : '#60a5fa' },
                ].map((row) => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.7rem', color: '#475569' }}>{row.label}</span>
                    <span style={{ fontSize: '0.75rem', color: row.color, fontWeight: 700 }}>{row.value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Risk list */}
            {data && data.risks.length > 0 && (
              <div style={{ background: 'rgba(9,18,48,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '1rem 1.2rem', flex: 1, overflowY: 'auto', maxHeight: 280 }}>
                <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.75rem' }}>
                  Riesgos ({data.risks.length})
                </div>
                {data.risks.map((r) => {
                  const score = mode === 'inherent' ? r.inherent_score : r.residual_score;
                  const color = (mode === 'inherent' ? r.inherent_level_color : r.residual_level_color) ?? '#f97316';
                  const level = mode === 'inherent' ? r.inherent_level : r.residual_level;
                  return (
                    <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.55rem' }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                        background: `${color}22`, border: `2px solid ${color}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.46rem', fontWeight: 900, color,
                      }}>
                        {(r.code || r.risk).slice(0, 4)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.68rem', color: '#e2e8f0', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.risk}</div>
                        <div style={{ fontSize: '0.6rem', color, fontWeight: 700 }}>{score.toFixed(1)} · {level ?? '—'}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


