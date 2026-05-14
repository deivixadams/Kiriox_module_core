'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, ChevronDown, Info, Loader2, Save, Trash2, X, ChevronRight, CheckCircle2, Target, BarChart3, ShieldCheck, TrendingUp, Briefcase } from 'lucide-react';

export const CARD: React.CSSProperties = {
  background: 'rgba(15, 23, 42, 0.4)',
  borderRadius: 16,
  border: '1px solid rgba(255, 255, 255, 0.05)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
  backdropFilter: 'blur(8px)',
};

export const INPUT_S: React.CSSProperties = {
  width: '100%',
  padding: '0.6rem 0.8rem',
  borderRadius: 8,
  background: 'rgba(255, 255, 255, 0.03)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  color: '#fff',
  fontSize: '0.85rem',
  outline: 'none',
  transition: 'all 0.2s',
};

export const TEXTAREA_S: React.CSSProperties = {
  ...INPUT_S,
  resize: 'vertical',
  minHeight: 88,
};

export const LABEL_S: React.CSSProperties = {
  fontSize: '0.73rem',
  fontWeight: 600,
  color: '#64748b',
  display: 'block',
  marginBottom: '0.4rem',
};

export const SECTION_HDR: React.CSSProperties = {
  fontSize: '0.68rem',
  fontWeight: 700,
  color: '#3b4a6b',
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  margin: '0 0 1rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.45rem',
};

export function extractError(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object') return fallback;
  const record = data as Record<string, unknown>;
  if (typeof record.error === 'string') return record.error;
  if (record.error && typeof record.error === 'object') {
    const errorRecord = record.error as Record<string, unknown>;
    if (typeof errorRecord.message === 'string') return errorRecord.message;
  }
  return fallback;
}

export function LoaderSection({ label = 'Cargando...' }: { label?: string }) {
  return (
    <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
      <Loader2 className="animate-spin" style={{ margin: '0 auto 1rem' }} size={32} />
      <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>{label}</p>
    </div>
  );
}

export function ErrorAlert({ message }: { message: string }) {
  return (
    <div style={{
      padding: '1.5rem', borderRadius: 12, background: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171',
      display: 'flex', gap: '0.8rem', alignItems: 'flex-start'
    }}>
      <AlertCircle size={20} style={{ flexShrink: 0 }} />
      <p style={{ fontSize: '0.9rem', margin: 0 }}>{message}</p>
    </div>
  );
}

export function SaveButton({
  saving,
  saved,
  onClick,
  color = '#38bdf8',
  label = 'Guardar',
}: {
  saving: boolean;
  saved: boolean;
  onClick: () => void;
  color?: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={saving}
      style={{
        marginTop: '1rem',
        padding: '0.72rem 1rem',
        borderRadius: 10,
        border: `1px solid ${color}55`,
        background: `${color}1a`,
        color,
        fontWeight: 800,
        fontSize: '0.78rem',
        cursor: saving ? 'wait' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
      }}
    >
      {saving ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : saved ? <CheckCircle2 size={15} /> : <Save size={15} />}
      {saving ? 'Guardando...' : saved ? 'Guardado' : label}
    </button>
  );
}

export function SectionBlock({ title, color, Icon, children }: any) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ ...CARD, overflow: 'hidden' }}>
      <button 
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', padding: '1rem 1.5rem', background: 'rgba(0,0,0,0.2)',
          border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer', borderBottom: open ? '1px solid rgba(255,255,255,0.05)' : 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: color || '#fff' }}>
          <Icon size={18} />
          <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</h3>
        </div>
        <ChevronDown size={16} color="#64748b" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>
      {open && <div style={{ padding: '1.5rem' }}>{children}</div>}
    </div>
  );
}

export function EvaluacionTab({ runRaId }: { runRaId: string }) {
  const [form, setForm] = useState({
    title: '',
    objetivo: '',
    alcance: '',
    metodologia: '',
    objeto_evaluado: '',
    company_id: '',
    element_id: ''
  });
  const [catalogs, setCatalogs] = useState<{ companies: any[], elements: any[] }>({ companies: [], elements: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const MAX_CHARS = 2000;

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/linear-risk/general-context?runRaId=${encodeURIComponent(runRaId)}`);
        const data = await res.json();
        if (data.context) setForm({
          ...data.context,
          title: data.context.title || '',
          objetivo: data.context.objetivo || '',
          alcance: data.context.alcance || '',
          metodologia: data.context.metodologia || '',
          objeto_evaluado: data.context.objeto_evaluado || '',
        });
        setCatalogs({ companies: data.companies || [], elements: data.elements || [] });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [runRaId]);

  const save = async (patch: any) => {
    const next = { ...form, ...patch };
    setForm(next);
    setSaving(true);
    try {
      await fetch('/api/linear-risk/general-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runRaId, context: next })
      });
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoaderSection />;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Empresa</label>
          <select style={INPUT_S} value={form.company_id} onChange={e => save({ company_id: e.target.value })}>
            <option value="">Seleccione...</option>
            {catalogs.companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Título de evaluación</label>
          <input style={INPUT_S} value={form.title} onChange={e => setForm({...form, title: e.target.value})} onBlur={() => save({})} placeholder="Ej: Evaluación integral 2026" />
        </div>
        <div>
          <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Macroproceso / Proceso</label>
          <select style={INPUT_S} value={form.element_id} onChange={e => save({ element_id: e.target.value })}>
            <option value="">Seleccione...</option>
            {catalogs.elements.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Objetivo</label>
          <div style={{ position: 'relative' }}>
            <textarea 
              style={{ ...INPUT_S, minHeight: 100 }} 
              value={form.objetivo} 
              onChange={e => setForm({...form, objetivo: e.target.value.slice(0, MAX_CHARS)})}
              onBlur={() => save({})}
            />
            <span style={{ position: 'absolute', bottom: '0.4rem', right: '0.6rem', fontSize: '0.62rem', color: '#475569' }}>
              {(form.objetivo || '').length}/{MAX_CHARS}
            </span>
          </div>
        </div>
        <div>
          <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Descripción del alcance</label>
          <textarea 
            style={{ ...INPUT_S, minHeight: 80 }} 
            value={form.alcance} 
            onChange={e => setForm({...form, alcance: e.target.value})}
            onBlur={() => save({})}
          />
        </div>
      </div>
    </div>
  );
}

export function ExternoTab({ runRaId }: { runRaId: string }) { return <div style={{ color: '#475569', fontSize: '0.85rem' }}>Configuración de contexto externo (PESTEL).</div>; }
export function InternoTab({ runRaId }: { runRaId: string }) { return <div style={{ color: '#475569', fontSize: '0.85rem' }}>Configuración de contexto interno (Organigrama, Cultura).</div>; }

export function ExitDialog({ onContinue, onDraft, onDelete, deleting }: any) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'
    }}>
      <div style={{ ...CARD, maxWidth: 450, width: '100%', padding: '2rem', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, background: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <AlertCircle size={32} color="#ef4444" />
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>¿Seguro que desea salir?</h3>
        <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '2rem' }}>
          Los cambios se guardan automáticamente. Puede retomar la evaluación más tarde desde el dashboard principal.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button onClick={onContinue} style={{ padding: '0.8rem', borderRadius: 10, background: '#3b82f6', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Continuar editando</button>
          <button onClick={onDraft} style={{ padding: '0.8rem', borderRadius: 10, background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 700, cursor: 'pointer' }}>Salir y guardar borrador</button>
          <button onClick={onDelete} disabled={deleting} style={{ padding: '0.8rem', borderRadius: 10, background: 'transparent', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} Eliminar evaluación
          </button>
        </div>
      </div>
    </div>
  );
}

export const STEPS = [
  { id: 1, key: 'context', label: 'Contexto', desc: 'Definición del alcance y entorno.', Icon: Target },
  { id: 2, key: 'risks', label: 'Análisis riesgos', desc: 'Identificación y valoración inherente.', Icon: BarChart3 },
  { id: 3, key: 'controls', label: 'Análisis Ctrl', desc: 'Evaluación de controles mitigantes.', Icon: ShieldCheck },
  { id: 4, key: 'valuation', label: 'Valoración', desc: 'Semaforización y nivel de riesgo.', Icon: TrendingUp },
  { id: 5, key: 'treatment', label: 'Tratamiento', desc: 'Plan de respuesta y monitoreo.', Icon: Briefcase },
];
