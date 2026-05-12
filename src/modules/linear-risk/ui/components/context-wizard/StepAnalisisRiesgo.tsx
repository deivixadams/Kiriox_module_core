'use client';

import React, { useEffect, useState } from 'react';
import { BarChart3, ClipboardList, Info, Plus, Trash2, Edit2, AlertCircle } from 'lucide-react';
import { CARD, INPUT_S, LoaderSection, ErrorAlert } from './ContextWizardShared';

type AnalysisItem = {
  id: string;
  name: string;
  description: string | null;
  risk_category: string | null;
  risk_category_id: string | null;
  cause: string;
  event: string;
  consequence: string;
  objective_id: string | null;
  affected_objective: string;
  activity_id: string;
  owner_id: string;
  impact_score: number | null;
  probability_score: number | null;
  inherent_risk_score: number | null;
  peso_id?: string;
  peso_value?: number | null;
  control_ids: string[];
};

type AnalysisMeta = {
  run_ra_id: string;
  run_ra_code: string;
  evaluated_process: string;
  evaluated_activity: string;
  responsible_person: string;
  risk_appetite: string;
  appetite_tolerance_min: number | null;
  appetite_tolerance_max: number | null;
};

type AnalysisCatalogs = {
  impacts: Array<{ id: string; name: string; description: string | null; ordinal: number | null; numeric_value: number }>;
  probabilities: Array<{ id: string; name: string; description: string | null; ordinal: number | null; numeric_value: number }>;
  pesos: Array<{ id: string; descripcion: string; peso: number }>;
  activities: Array<{ id: string; name: string }>;
  owners: Array<{ id: string; name: string }>;
  controls: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string }>;
  objectives: Array<{ id: string; name: string }>;
};

type AnalysisForm = {
  id?: string;
  name: string;
  description: string;
  risk_category: string;
  cause: string;
  event: string;
  consequence: string;
  objective_id: string;
  activity_id: string;
  owner_id: string;
  impact_id: string;
  probability_id: string;
  peso_id: string;
  control_ids: string[];
};

const ANALYSIS_EMPTY: AnalysisForm = {
  name: '',
  description: '',
  risk_category: '',
  cause: '',
  event: '',
  consequence: '',
  objective_id: '',
  activity_id: '',
  owner_id: '',
  impact_id: '',
  probability_id: '',
  peso_id: '',
  control_ids: [],
};

export function StepAnalisisRiesgo({ runRaId }: { runRaId: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<AnalysisItem[]>([]);
  const [meta, setMeta] = useState<AnalysisMeta | null>(null);
  const [catalogs, setCatalogs] = useState<AnalysisCatalogs | null>(null);
  const [form, setForm] = useState<AnalysisForm>(ANALYSIS_EMPTY);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/linear-risk/analysis-risks?runRaId=${encodeURIComponent(runRaId)}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cargar');
      setItems(data.items || []);
      setMeta(data.meta);
      setCatalogs(data.catalogs);
      
      // Default selections
      if (data.catalogs) {
        setForm(f => ({
          ...f,
          impact_id: f.impact_id || data.catalogs.impacts[0]?.id || '',
          probability_id: f.probability_id || data.catalogs.probabilities[0]?.id || '',
          peso_id: f.peso_id || data.catalogs.pesos[0]?.id || '',
          activity_id: f.activity_id || data.catalogs.activities[0]?.id || '',
          owner_id: f.owner_id || data.catalogs.owners[0]?.id || '',
        }));
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [runRaId]);

  async function handleSave() {
    if (!form.name || !form.cause || !form.event || !form.objective_id) {
      alert('Por favor complete los campos obligatorios (Nombre, Causa, Evento, Objetivo)');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/linear-risk/analysis-risks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runRaId, ...form }),
      });
      if (!res.ok) throw new Error('Error al guardar');
      setForm(ANALYSIS_EMPTY);
      load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(id: string) {
    if (!window.confirm('¿Eliminar este riesgo?')) return;
    try {
      const res = await fetch(`/api/linear-risk/analysis-risks?runRaId=${encodeURIComponent(runRaId)}&id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      load();
    } catch (e: any) {
      alert(e.message);
    }
  }

  function handleEdit(it: AnalysisItem) {
    setForm({
      id: it.id,
      name: it.name,
      description: it.description || '',
      risk_category: it.risk_category_id || '',
      cause: it.cause,
      event: it.event,
      consequence: it.consequence,
      objective_id: it.objective_id || '',
      activity_id: it.activity_id,
      owner_id: it.owner_id,
      impact_id: catalogs?.impacts.find(i => i.numeric_value === it.impact_score)?.id || '',
      probability_id: catalogs?.probabilities.find(p => p.numeric_value === it.probability_score)?.id || '',
      peso_id: it.peso_id || '',
      control_ids: it.control_ids,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (loading) return <LoaderSection />;
  if (!catalogs || !meta) return <ErrorAlert message="No se pudo cargar la configuración de análisis." />;

  const totalInherente = items.reduce((acc, it) => acc + (it.inherent_risk_score || 0), 0);
  const appetiteLabel = String(meta.risk_appetite || 'No definido').replace(/_/g, ' ').toUpperCase();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* FORM SECTION */}
      <div style={{ 
        ...CARD, 
        padding: '1.5rem',
        border: '1px solid rgba(56,189,248,0.2)',
        background: 'linear-gradient(135deg, rgba(15,23,42,0.6), rgba(8,18,45,0.8))'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ margin: 0, color: '#7dd3fc', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <BarChart3 size={18} /> Identificación y Análisis de Riesgos
            </h3>
            <p style={{ margin: '0.3rem 0 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>
              Registre los riesgos identificados para la actividad seleccionada.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
             <span style={{ fontSize: '0.7rem', color: '#34d399', background: 'rgba(52,211,153,0.1)', padding: '0.2rem 0.6rem', borderRadius: 999, border: '1px solid rgba(52,211,153,0.2)' }}>
               {meta.evaluated_activity || 'Sin actividad'}
             </span>
             <span style={{ fontSize: '0.7rem', color: '#fb7185', background: 'rgba(251,113,133,0.1)', padding: '0.2rem 0.6rem', borderRadius: 999, border: '1px solid rgba(251,113,133,0.2)' }}>
               Apetito: {appetiteLabel}
             </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
          {/* LEFT COL: IDENTIFICATION */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.8rem' }}>
               <input style={INPUT_S} placeholder="Nombre del riesgo *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
               <textarea style={{...INPUT_S, minHeight: 60}} placeholder="Descripción" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
               <input style={INPUT_S} placeholder="Causa *" value={form.cause} onChange={e => setForm({...form, cause: e.target.value})} />
               <input style={INPUT_S} placeholder="Evento *" value={form.event} onChange={e => setForm({...form, event: e.target.value})} />
               <input style={INPUT_S} placeholder="Consecuencia" value={form.consequence} onChange={e => setForm({...form, consequence: e.target.value})} />
               <select style={INPUT_S} value={form.objective_id} onChange={e => setForm({...form, objective_id: e.target.value})}>
                 <option value="">Objetivo afectado *</option>
                 {catalogs.objectives.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
               </select>
               <select style={INPUT_S} value={form.risk_category} onChange={e => setForm({...form, risk_category: e.target.value})}>
                 <option value="">Categoría</option>
                 {catalogs.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
               </select>
               <select style={INPUT_S} value={form.owner_id} onChange={e => setForm({...form, owner_id: e.target.value})}>
                 <option value="">Propietario</option>
                 {catalogs.owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
               </select>
            </div>
          </div>

          {/* RIGHT COL: ANALYSIS */}
          <div style={{ 
            background: 'rgba(30,41,59,0.4)', 
            padding: '1rem', 
            borderRadius: 12, 
            border: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <h4 style={{ margin: 0, color: '#e2e8f0', fontSize: '0.85rem', fontWeight: 700 }}>Valoración Inherente</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <label style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>Impacto</label>
              <select style={INPUT_S} value={form.impact_id} onChange={e => setForm({...form, impact_id: e.target.value})}>
                {catalogs.impacts.map(i => <option key={i.id} value={i.id}>{i.name} ({i.numeric_value})</option>)}
              </select>

              <label style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>Probabilidad</label>
              <select style={INPUT_S} value={form.probability_id} onChange={e => setForm({...form, probability_id: e.target.value})}>
                {catalogs.probabilities.map(p => <option key={p.id} value={p.id}>{p.name} ({p.numeric_value})</option>)}
              </select>

              <label style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>Peso</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2px', background: 'rgba(255,255,255,0.05)', padding: 2, borderRadius: 8 }}>
                {catalogs.pesos.map(p => (
                  <button 
                    key={p.id}
                    onClick={() => setForm({...form, peso_id: p.id})}
                    style={{
                      border: 'none',
                      padding: '0.4rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      borderRadius: 6,
                      cursor: 'pointer',
                      background: form.peso_id === p.id ? '#3b82f6' : 'transparent',
                      color: form.peso_id === p.id ? '#fff' : '#64748b',
                      transition: 'all 0.2s'
                    }}
                  >
                    {p.peso}
                  </button>
                ))}
              </div>
            </div>

            {/* CONTROLS SELECTION */}
            <div style={{ marginTop: '0.5rem' }}>
               <label style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>Controles Existentes (Mitigantes)</label>
               <div style={{ 
                 maxHeight: 100, overflowY: 'auto', background: 'rgba(0,0,0,0.2)', 
                 borderRadius: 8, marginTop: '0.4rem', padding: '0.4rem',
                 border: '1px solid rgba(255,255,255,0.05)'
               }}>
                 {catalogs.controls.length === 0 && <div style={{ fontSize: '0.7rem', color: '#475569', padding: '0.4rem' }}>No hay controles definidos.</div>}
                 {catalogs.controls.map(c => (
                   <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem', cursor: 'pointer', fontSize: '0.7rem', color: '#cbd5e1' }}>
                     <input 
                       type="checkbox" 
                       checked={form.control_ids.includes(c.id)}
                       onChange={e => {
                         const ids = e.target.checked ? [...form.control_ids, c.id] : form.control_ids.filter(x => x !== c.id);
                         setForm({...form, control_ids: ids});
                       }}
                     />
                     {c.name}
                   </label>
                 ))}
               </div>
            </div>
          </div>
        </div>

        <button 
          onClick={handleSave}
          disabled={saving}
          style={{
            marginTop: '1.5rem', width: '100%', padding: '0.8rem', borderRadius: 10,
            background: 'linear-gradient(90deg, #3b82f6, #2563eb)', color: '#fff',
            border: 'none', fontWeight: 700, fontSize: '0.9rem', cursor: saving ? 'wait' : 'pointer',
            boxShadow: '0 4px 12px rgba(37,99,235,0.2)'
          }}
        >
          {saving ? 'Guardando...' : form.id ? 'Actualizar Riesgo' : 'Agregar Riesgo al Listado'}
        </button>
      </div>

      {/* LIST SECTION */}
      <div style={{ ...CARD, padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.2rem' }}>
          <div>
            <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <ClipboardList size={18} /> Riesgos Registrados
            </h3>
          </div>
          <div style={{ 
            textAlign: 'right', background: 'rgba(251,113,133,0.05)', 
            padding: '0.6rem 1rem', borderRadius: 12, border: '1px solid rgba(251,113,133,0.1)' 
          }}>
            <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Carga Inherente Total</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fb7185' }}>{totalInherente.toFixed(2)}</div>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#94a3b8' }}>
                <th style={{ textAlign: 'left', padding: '0.8rem' }}>Riesgo / Causa</th>
                <th style={{ textAlign: 'left', padding: '0.8rem' }}>Evento</th>
                <th style={{ textAlign: 'left', padding: '0.8rem' }}>Categoría</th>
                <th style={{ textAlign: 'center', padding: '0.8rem' }}>Impacto</th>
                <th style={{ textAlign: 'center', padding: '0.8rem' }}>Prob.</th>
                <th style={{ textAlign: 'center', padding: '0.8rem' }}>Peso</th>
                <th style={{ textAlign: 'center', padding: '0.8rem' }}>Inherente</th>
                <th style={{ textAlign: 'right', padding: '0.8rem' }}>Acciones</th>
              </tr>
            </thead>
            <tbody style={{ color: '#cbd5e1' }}>
              {items.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: '#475569' }}>
                    No se han registrado riesgos para esta evaluación.
                  </td>
                </tr>
              )}
              {items.map(it => (
                <tr key={it.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '0.8rem' }}>
                    <div style={{ fontWeight: 700, color: '#f1f5f9' }}>{it.name}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem' }}>Causa: {it.cause}</div>
                  </td>
                  <td style={{ padding: '0.8rem' }}>{it.event}</td>
                  <td style={{ padding: '0.8rem' }}>
                    <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.05)', padding: '0.1rem 0.4rem', borderRadius: 4 }}>
                      {it.risk_category || 'General'}
                    </span>
                  </td>
                  <td style={{ padding: '0.8rem', textAlign: 'center' }}>{it.impact_score}</td>
                  <td style={{ padding: '0.8rem', textAlign: 'center' }}>{it.probability_score}</td>
                  <td style={{ padding: '0.8rem', textAlign: 'center' }}>{it.peso_value}</td>
                  <td style={{ padding: '0.8rem', textAlign: 'center', fontWeight: 800, color: '#3b82f6' }}>{it.inherent_risk_score}</td>
                  <td style={{ padding: '0.8rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button onClick={() => handleEdit(it)} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer' }}><Edit2 size={14} /></button>
                      <button onClick={() => handleRemove(it.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
