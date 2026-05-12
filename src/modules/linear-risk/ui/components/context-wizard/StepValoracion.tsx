'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, BarChart3, CheckCircle2, Eye, Flame, Info, ShieldCheck, ShieldPlus, TrendingUp, X, Bell, FileText } from 'lucide-react';
import { CARD, ErrorAlert, LoaderSection, INPUT_S } from './ContextWizardShared';

export function StepValoracion({ runRaId }: { runRaId: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [savingRiskId, setSavingRiskId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/linear-risk/risk-valuation?runRaId=${encodeURIComponent(runRaId)}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Error al cargar valoración');
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [runRaId]);

  async function handleChangeDecision(riskId: string, valorationId: string) {
    setSavingRiskId(riskId);
    try {
      const res = await fetch('/api/linear-risk/risk-valuation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runRaId, riskId, valorationId: valorationId || null }),
      });
      if (!res.ok) throw new Error('Error al guardar decisión');
      
      // Update local state
      setData((prev: any) => ({
        ...prev,
        risks: prev.risks.map((r: any) => r.id === riskId ? { ...r, id_valoration: valorationId || null } : r)
      }));
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSavingRiskId(null);
    }
  }

  if (loading) return <LoaderSection />;
  if (error) return <ErrorAlert message={error} />;
  if (!data || data.risks.length === 0) return <ErrorAlert message="No hay riesgos para valorar. Complete los pasos anteriores." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      {/* SUMMARY CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {[
          { label: 'Riesgo Inherente Total', value: data.summary.total_inherent.toFixed(2), icon: <AlertTriangle size={20} color="#f87171" />, color: '#fca5a5' },
          { label: 'Riesgo Residual Total', value: data.summary.total_residual.toFixed(2), icon: <ShieldCheck size={20} color="#34d399" />, color: '#6ee7b7' },
          { label: 'Reducción Acumulada', value: `${data.summary.total_reduction_percent.toFixed(1)}%`, icon: <BarChart3 size={20} color="#38bdf8" />, color: '#7dd3fc' },
        ].map(card => (
          <div key={card.label} style={{ ...CARD, padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>
              {card.icon} {card.label}
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: card.color, lineHeight: 1 }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* VALUATION TABLE */}
      <div style={{ ...CARD, padding: '1.5rem', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', minWidth: 900 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#94a3b8' }}>
              <th style={{ textAlign: 'left', padding: '0.8rem' }}>Riesgo Identificado</th>
              <th style={{ textAlign: 'center', padding: '0.8rem' }}>Inherente</th>
              <th style={{ textAlign: 'center', padding: '0.8rem' }}>Mitigación</th>
              <th style={{ textAlign: 'center', padding: '0.8rem' }}>Residual</th>
              <th style={{ textAlign: 'right', padding: '0.8rem' }}>Decisión de Tratamiento</th>
            </tr>
          </thead>
          <tbody style={{ color: '#cbd5e1' }}>
            {data.risks.map((r: any) => (
              <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <td style={{ padding: '1rem 0.8rem' }}>
                   <div style={{ fontWeight: 800, color: '#f8fafc', marginBottom: '0.2rem' }}>{r.risk}</div>
                   <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{r.cause || 'Sin causa definida'}</div>
                </td>
                <td style={{ textAlign: 'center', padding: '0.8rem' }}>
                   <div style={{ fontWeight: 900, color: '#fca5a5' }}>{r.inherent_score.toFixed(2)}</div>
                   <div style={{ fontSize: '0.55rem', color: r.inherent_level_color }}>{r.inherent_level}</div>
                </td>
                <td style={{ textAlign: 'center', padding: '0.8rem' }}>
                   <div style={{ fontWeight: 800, color: '#34d399' }}>{r.reduction_percent.toFixed(1)}%</div>
                   <div style={{ fontSize: '0.55rem', color: '#475569' }}>-{r.reduction_score.toFixed(2)} pts</div>
                </td>
                <td style={{ textAlign: 'center', padding: '0.8rem' }}>
                   <div style={{ fontWeight: 900, color: r.residual_level_color || '#fbbf24' }}>{r.residual_score.toFixed(2)}</div>
                   <div style={{ fontSize: '0.55rem', color: '#475569' }}>{r.residual_level}</div>
                </td>
                <td style={{ textAlign: 'right', padding: '0.8rem' }}>
                   <select 
                     style={{ 
                       ...INPUT_S, 
                       width: 140, 
                       padding: '0.4rem', 
                       fontSize: '0.7rem',
                       border: r.id_valoration ? '1px solid rgba(59,130,246,0.5)' : '1px solid rgba(255,255,255,0.1)',
                       background: r.id_valoration ? 'rgba(59,130,246,0.05)' : 'transparent'
                     }}
                     value={r.id_valoration || ''}
                     onChange={e => handleChangeDecision(r.id, e.target.value)}
                     disabled={savingRiskId === r.id}
                   >
                     <option value="">- Seleccionar -</option>
                     {data.catalogs.valoration.map((v: any) => <option key={v.id} value={v.id}>{v.label}</option>)}
                   </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ ...CARD, padding: '1rem', background: 'rgba(59,130,246,0.05)', border: '1px dashed rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
        <Info size={20} color="#60a5fa" />
        <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.5 }}>
           La valoración del riesgo residual permite definir la estrategia de respuesta (Aceptar, Mitigar, Transferir o Evitar). 
           Los riesgos marcados para <strong>Tratamiento</strong> requerirán definir un plan de acción en el siguiente paso.
        </p>
      </div>
    </div>
  );
}
