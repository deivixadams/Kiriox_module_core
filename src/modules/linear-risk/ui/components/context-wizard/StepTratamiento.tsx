'use client';

import React, { useEffect, useState } from 'react';
import { Calendar, CheckCircle2, ChevronRight, Loader2, Plus, Search, Trash2, AlertCircle } from 'lucide-react';
import { CARD, ErrorAlert, LoaderSection, INPUT_S } from './ContextWizardShared';

export function StepTratamiento({ runRaId }: { runRaId: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [risks, setRisks] = useState<any[]>([]);
  const [selectedRiskId, setSelectedRiskId] = useState<string>('');
  const [actions, setActions] = useState<any[]>([]);
  const [owners, setOwners] = useState<any[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  async function loadInitial() {
    setLoading(true);
    try {
      // Step 5 needs to know which risks were evaluated in Step 4
      const res = await fetch(`/api/linear-risk/risk-valuation?runRaId=${encodeURIComponent(runRaId)}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Error al cargar valoración');
      const data = await res.json();
      
      // Filter risks that need treatment (optional, but let's show all for now)
      setRisks(data.risks || []);
      setOwners(data.catalogs?.owners || []); // We might need to fetch owners if not in valuation
      
      if (data.risks.length > 0) {
        setSelectedRiskId(data.risks[0].id);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadActions(riskId: string) {
    if (!riskId) return;
    try {
      const res = await fetch(`/api/linear-risk/risk-treatment?runRaId=${encodeURIComponent(runRaId)}&riskId=${riskId}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Error al cargar acciones');
      const data = await res.json();
      setActions(data.actions.map((a: any) => ({
        id: a.id,
        action: a.treatment_action,
        responsible_id: a.responsible_id || '',
        due_date: a.target_date || '',
        monitored: a.monitored,
        status: a.status
      })) || []);
    } catch (e: any) {
      console.error(e);
    }
  }

  useEffect(() => { loadInitial(); }, [runRaId]);
  useEffect(() => { if (selectedRiskId) loadActions(selectedRiskId); }, [selectedRiskId]);

  async function handleAddAction() {
    if (!selectedRiskId) return;
    setAdding(true);
    try {
      const res = await fetch('/api/linear-risk/risk-treatment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runRaId,
          riskId: selectedRiskId,
          action: 'Nueva acción de tratamiento',
          responsible_id: null,
          due_date: null,
          monitored: false,
          status: 'Pendiente'
        })
      });
      if (!res.ok) throw new Error('Error al agregar');
      await loadActions(selectedRiskId);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setAdding(false);
    }
  }

  async function handleSaveRow(row: any) {
    setSavingId(row.id);
    try {
      await fetch('/api/linear-risk/risk-treatment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runRaId,
          riskId: selectedRiskId,
          ...row
        })
      });
    } catch (e: any) {
      console.error(e);
    } finally {
      setSavingId(null);
    }
  }

  async function handleDeleteAction(id: string) {
    if (!window.confirm('¿Eliminar esta acción?')) return;
    try {
      const res = await fetch(`/api/linear-risk/risk-treatment?runRaId=${encodeURIComponent(runRaId)}&id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      await loadActions(selectedRiskId);
    } catch (e: any) {
      alert(e.message);
    }
  }

  if (loading) return <LoaderSection />;
  if (error) return <ErrorAlert message={error} />;
  if (risks.length === 0) return <ErrorAlert message="No hay riesgos identificados para tratamiento." />;

  const currentRisk = risks.find(r => r.id === selectedRiskId);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.2rem', alignItems: 'start' }}>
      {/* RISK LIST */}
      <div style={{ ...CARD, padding: '1rem', border: '1px solid rgba(139,92,246,0.3)' }}>
        <h4 style={{ margin: '0 0 1rem', fontSize: '0.9rem', color: '#e2e8f0', fontWeight: 800 }}>Riesgos a Tratar</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {risks.map(r => {
            const active = r.id === selectedRiskId;
            return (
              <button 
                key={r.id} 
                onClick={() => setSelectedRiskId(r.id)}
                style={{
                  textAlign: 'left', padding: '0.8rem', borderRadius: 12, border: active ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.06)',
                  background: active ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: active ? '#60a5fa' : '#cbd5e1', marginBottom: '0.3rem' }}>{r.risk}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <span style={{ fontSize: '0.6rem', color: '#64748b' }}>Residual: {r.residual_score.toFixed(2)}</span>
                   <span style={{ fontSize: '0.6rem', fontWeight: 800, color: r.residual_level_color }}>{r.residual_level}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ACTION PLANS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        <div style={{ ...CARD, padding: '1.5rem', border: '1px solid rgba(59,130,246,0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#f8fafc', fontWeight: 900 }}>Plan de Acción</h3>
              <p style={{ margin: '0.3rem 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>{currentRisk?.risk}</p>
            </div>
            <button 
              onClick={handleAddAction}
              disabled={adding}
              style={{
                background: 'linear-gradient(90deg, #8b5cf6, #7c3aed)', color: '#fff', border: 'none',
                padding: '0.5rem 1rem', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.4rem'
              }}
            >
              {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Agregar Acción
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {actions.map((a, idx) => (
              <div key={a.id} style={{ 
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '1rem'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px 150px 140px auto', gap: '1rem', alignItems: 'center' }}>
                  <div>
                     <input style={{ ...INPUT_S, width: '100%' }} value={a.action} onChange={e => {
                       const newList = [...actions];
                       newList[idx].action = e.target.value;
                       setActions(newList);
                     }} onBlur={() => handleSaveRow(a)} placeholder="Describa la acción..." />
                  </div>
                  <div>
                     <select style={{ ...INPUT_S, width: '100%' }} value={a.responsible_id} onChange={e => {
                       const newList = [...actions];
                       newList[idx].responsible_id = e.target.value;
                       setActions(newList);
                       handleSaveRow({ ...a, responsible_id: e.target.value });
                     }}>
                       <option value="">Responsable</option>
                       {owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                     </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                     <Calendar size={14} color="#64748b" />
                     <input type="date" style={{ ...INPUT_S, flex: 1 }} value={a.due_date} onChange={e => {
                       const newList = [...actions];
                       newList[idx].due_date = e.target.value;
                       setActions(newList);
                       handleSaveRow({ ...a, due_date: e.target.value });
                     }} />
                  </div>
                  <div>
                     <select style={{ ...INPUT_S, width: '100%' }} value={a.status} onChange={e => {
                       const newList = [...actions];
                       newList[idx].status = e.target.value;
                       setActions(newList);
                       handleSaveRow({ ...a, status: e.target.value });
                     }}>
                       <option value="Pendiente">Pendiente</option>
                       <option value="En curso">En curso</option>
                       <option value="Completado">Completado</option>
                     </select>
                  </div>
                  <button onClick={() => handleDeleteAction(a.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                </div>
                {savingId === a.id && <div style={{ fontSize: '0.6rem', color: '#60a5fa', marginTop: '0.4rem', textAlign: 'right' }}>Guardando...</div>}
              </div>
            ))}
            {actions.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#475569', border: '1px dashed rgba(255,255,255,0.06)', borderRadius: 12 }}>
                 No hay acciones definidas para este riesgo.
              </div>
            )}
          </div>
        </div>

        <div style={{ ...CARD, padding: '1rem', background: 'rgba(139,92,246,0.05)', border: '1px dashed rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
           <AlertCircle size={20} color="#a78bfa" />
           <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.5 }}>
              Defina acciones específicas, con responsables y fechas límite para reducir el riesgo residual a un nivel aceptable según el apetito de riesgo de la organización.
           </p>
        </div>
      </div>
    </div>
  );
}
