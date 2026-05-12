'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, BarChart3, BriefcaseBusiness, Calendar, Cpu, FileText, Info, Loader2, Save, ShieldCheck, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { CARD, INPUT_S, LoaderSection, ErrorAlert } from './ContextWizardShared';

export function StepAnalisisControl({ runRaId }: { runRaId: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [risks, setRisks] = useState<any[]>([]);
  const [current, setCurrent] = useState<any>(null);
  const [controls, setControls] = useState<any[]>([]);
  const [owners, setOwners] = useState<Array<{ id: string; name: string }>>([]);
  const [controlTypes, setControlTypes] = useState<Array<{ id: string; name: string }>>([]);
  const [controlNatures, setControlNatures] = useState<Array<{ id: string; name: string }>>([]);
  const [controlFrequencies, setControlFrequencies] = useState<Array<{ id: string; name: string }>>([]);
  const [controlEffectiveness, setControlEffectiveness] = useState<Array<{ id: string; value: number; code: string | null; name: string }>>([]);
  const [controlCoverage, setControlCoverage] = useState<Array<{ id: string; value: number; code: string | null; name: string }>>([]);
  const [justification, setJustification] = useState('');

  async function load(riskId?: string) {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ runRaId });
      if (riskId) qs.set('riskId', riskId);
      const res = await fetch(`/api/linear-risk/control-analysis?${qs.toString()}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cargar');
      setRisks(data.risks || []);
      setCurrent(data.current || null);
      setControls(data.controls || []);
      setOwners(data.catalogs?.owners || []);
      setControlTypes(data.catalogs?.control_types || []);
      setControlNatures(data.catalogs?.control_natures || []);
      setControlFrequencies(data.catalogs?.control_frequencies || []);
      setControlEffectiveness(data.catalogs?.control_effectiveness || []);
      setControlCoverage(data.catalogs?.control_coverage || []);
      setJustification(data.current?.residual_justification || '');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [runRaId]);

  async function handleSave(nextRiskId?: string) {
    if (!current?.id) return;
    setSaving(true);
    try {
      const res = await fetch('/api/linear-risk/control-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runRaId,
          riskId: current.id,
          residualJustification: justification,
          controls: controls.map((c: any) => ({
            control_id: c.control_id,
            name: c.name,
            control_type: c.control_type,
            control_nature: c.control_nature,
            owner_id: c.owner_id,
            frequency: c.frequency,
            design: c.design,
            implementation: c.implementation,
            operation: c.operation,
            cobertura: c.cobertura,
          })),
        }),
      });
      if (!res.ok) throw new Error('Error al guardar');
      if (nextRiskId) await load(nextRiskId);
      else await load(current.id);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddControl() {
    if (!current?.id) return;
    setSaving(true);
    try {
      const res = await fetch('/api/linear-risk/control-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_control',
          runRaId,
          riskId: current.id,
          control_name: `Nuevo Control ${Date.now().toString().slice(-4)}`,
          control_type: controlTypes[0]?.id || '',
        }),
      });
      if (!res.ok) throw new Error('Error al crear control');
      await load(current.id);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteControl(controlId: string) {
    if (!window.confirm('¿Eliminar mapeo de control?')) return;
    try {
      const res = await fetch(`/api/linear-risk/control-analysis?runRaId=${encodeURIComponent(runRaId)}&riskId=${current.id}&controlId=${controlId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      await load(current.id);
    } catch (e: any) {
      alert(e.message);
    }
  }

  if (loading) return <LoaderSection />;
  if (risks.length === 0) return <ErrorAlert message="No hay riesgos registrados. Complete el Paso 2 primero." />;

  const selectedIndex = Math.max(0, risks.findIndex(r => r.id === current?.id));
  const totalRisks = risks.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      {/* RISK SUMMARY HEADER */}
      <div style={{ 
        ...CARD, 
        padding: '1.2rem',
        border: '1px solid rgba(59,130,246,0.3)',
        background: 'linear-gradient(135deg, rgba(15,23,42,0.8), rgba(8,18,45,0.9))'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '1.5rem', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span style={{ background: 'rgba(59,130,246,0.2)', color: '#60a5fa', fontSize: '0.65rem', fontWeight: 800, padding: '0.1rem 0.5rem', borderRadius: 999 }}>
                RIESGO {selectedIndex + 1} DE {totalRisks}
              </span>
              <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.05rem', fontWeight: 800 }}>{current?.name}</h3>
            </div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
               <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Cpu size={12}/> Causa: {current?.cause}</span>
               <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><AlertCircle size={12}/> Evento: {current?.event}</span>
            </div>
          </div>

          <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '1.5rem' }}>
             <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.3rem' }}>Riesgo Inherente</div>
             <div style={{ fontSize: '1.8rem', fontWeight: 900, color: current?.inherent_level_color || '#ef4444', lineHeight: 1 }}>
               {current?.inherent_risk_score}
             </div>
             <div style={{ fontSize: '0.6rem', color: '#64748b', marginTop: '0.2rem' }}>{current?.inherent_level_name}</div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              disabled={selectedIndex === 0 || saving}
              onClick={() => load(risks[selectedIndex - 1].id)}
              style={{ padding: '0.6rem', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer' }}
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              disabled={selectedIndex === totalRisks - 1 || saving}
              onClick={() => handleSave(risks[selectedIndex + 1].id)}
              style={{ padding: '0.6rem', borderRadius: 10, background: 'linear-gradient(90deg, #10b981, #059669)', border: 'none', color: '#fff', cursor: 'pointer' }}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* CONTROLS TABLE */}
      <div style={{ ...CARD, padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
          <h4 style={{ margin: 0, color: '#e2e8f0', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShieldCheck size={18} /> Análisis de Controles
          </h4>
          <button 
            onClick={handleAddControl}
            style={{ 
              background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)', 
              padding: '0.4rem 0.8rem', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.4rem'
            }}
          >
            <Plus size={14} /> Agregar Control
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#94a3b8' }}>
                <th style={{ textAlign: 'left', padding: '0.6rem' }}>Control</th>
                <th style={{ textAlign: 'left', padding: '0.6rem' }}>Responsable</th>
                <th style={{ textAlign: 'center', padding: '0.6rem' }}>Diseño</th>
                <th style={{ textAlign: 'center', padding: '0.6rem' }}>Implement.</th>
                <th style={{ textAlign: 'center', padding: '0.6rem' }}>Operación</th>
                <th style={{ textAlign: 'center', padding: '0.6rem' }}>Cobertura</th>
                <th style={{ textAlign: 'center', padding: '0.6rem' }}>Efectividad</th>
                <th style={{ textAlign: 'right', padding: '0.6rem' }}>Acciones</th>
              </tr>
            </thead>
            <tbody style={{ color: '#cbd5e1' }}>
              {controls.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#475569' }}>No hay controles asociados.</td></tr>
              )}
              {controls.map((c, idx) => {
                const internalEff = (
                  (Number(c.design ?? 3) / 5 * 0.35) + 
                  (Number(c.implementation ?? 3) / 5 * 0.30) + 
                  (Number(c.operation ?? 3) / 5 * 0.35)
                );
                const finalEff = internalEff * (Number(c.cobertura ?? 75) / 100);

                return (
                  <tr key={c.control_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '0.6rem' }}>
                      <input style={{ ...INPUT_S, padding: '0.3rem' }} value={c.name} onChange={e => {
                        const newList = [...controls];
                        newList[idx].name = e.target.value;
                        setControls(newList);
                      }} />
                    </td>
                    <td style={{ padding: '0.6rem' }}>
                      <select style={{ ...INPUT_S, padding: '0.3rem' }} value={c.owner_id || ''} onChange={e => {
                        const newList = [...controls];
                        newList[idx].owner_id = e.target.value;
                        setControls(newList);
                      }}>
                        <option value="">- Sel -</option>
                        {owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                      </select>
                    </td>
                    {['design', 'implementation', 'operation'].map(key => (
                      <td key={key} style={{ padding: '0.6rem', textAlign: 'center' }}>
                        <select style={{ ...INPUT_S, padding: '0.3rem', width: 50 }} value={c[key]} onChange={e => {
                          const newList = [...controls];
                          newList[idx][key] = Number(e.target.value);
                          setControls(newList);
                        }}>
                          {controlEffectiveness.map(opt => <option key={opt.id} value={opt.value}>{opt.value}</option>)}
                        </select>
                      </td>
                    ))}
                    <td style={{ padding: '0.6rem', textAlign: 'center' }}>
                      <input type="number" style={{ ...INPUT_S, padding: '0.3rem', width: 50, textAlign: 'center' }} value={c.cobertura} onChange={e => {
                        const newList = [...controls];
                        newList[idx].cobertura = Number(e.target.value);
                        setControls(newList);
                      }} />
                    </td>
                    <td style={{ padding: '0.6rem', textAlign: 'center' }}>
                      <div style={{ fontWeight: 800, color: '#10b981' }}>{(finalEff * 100).toFixed(1)}%</div>
                    </td>
                    <td style={{ padding: '0.6rem', textAlign: 'right' }}>
                       <button onClick={() => handleDeleteControl(c.control_id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={14} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* RESIDUAL SUMMARY */}
        {controls.length > 0 && (
          <div style={{ 
            marginTop: '2rem', padding: '1.5rem', background: 'rgba(15,23,42,0.4)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '3rem'
          }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Mitigación Total</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10b981' }}>
                {(() => {
                   let totalMit = 0;
                   controls.forEach(c => {
                     const eff = ((Number(c.design)/5*0.35)+(Number(c.implementation)/5*0.3)+(Number(c.operation)/5*0.35)) * (Number(c.cobertura)/100);
                     totalMit += eff;
                   });
                   return `${(totalMit * 100).toFixed(1)}%`;
                })()}
              </div>
            </div>
            <div style={{ height: 40, width: 1, background: 'rgba(255,255,255,0.1)' }} />
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.7rem', color: '#7dd3fc', fontWeight: 800, textTransform: 'uppercase' }}>Riesgo Residual</div>
              <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#fff', lineHeight: 1, textShadow: '0 0 20px rgba(59,130,246,0.5)' }}>
                {(() => {
                   const inherent = Number(current?.inherent_risk_score ?? 0);
                   let reduction = 0;
                   controls.forEach(c => {
                     const eff = ((Number(c.design)/5*0.35)+(Number(c.implementation)/5*0.3)+(Number(c.operation)/5*0.35)) * (Number(c.cobertura)/100);
                     reduction += (inherent * eff);
                   });
                   return Math.max(0, inherent - reduction).toFixed(2);
                })()}
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: '1.5rem' }}>
          <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Justificación del Riesgo Residual</label>
          <textarea 
            style={{ ...INPUT_S, minHeight: 80, width: '100%' }} 
            placeholder="Explique por qué este nivel de riesgo residual es aceptable o qué acciones adicionales se tomarán..."
            value={justification}
            onChange={e => setJustification(e.target.value)}
          />
        </div>

        <button 
          onClick={() => handleSave()}
          disabled={saving}
          style={{
            marginTop: '1.5rem', width: '100%', padding: '0.8rem', borderRadius: 10,
            background: 'linear-gradient(90deg, #3b82f6, #2563eb)', color: '#fff',
            border: 'none', fontWeight: 700, fontSize: '0.9rem', cursor: saving ? 'wait' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem'
          }}
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          Guardar Análisis de Controles
        </button>
      </div>
    </div>
  );
}
