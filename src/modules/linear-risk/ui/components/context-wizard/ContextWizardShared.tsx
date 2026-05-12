'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  BriefcaseBusiness, ClipboardList, BarChart3, Scale, ShieldPlus, Bell,
  ChevronRight, ChevronLeft, ChevronsRight, ChevronsLeft, LogOut, AlertTriangle, Loader2, CheckCircle2,
  X, Save, ShieldCheck, Globe, Cpu, Users, Home, Target, Layers,
  AlertCircle, ArrowRight, Calendar, FileText, FlaskConical, BookOpen,
  FolderOpen, Info, Trash2, Eye, TrendingUp,
  Search, Filter, MoreVertical, Plus, Play, RefreshCw, Shield, Pencil,
} from 'lucide-react';

export const RUN_RA_KEY = 'kiriox_active_run_ra_id';

export function extractError(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object') return fallback;
  const d = data as Record<string, unknown>;
  if (typeof d.error === 'string') return d.error;
  if (d.error && typeof d.error === 'object') {
    const e = d.error as Record<string, unknown>;
    if (typeof e.message === 'string') return e.message;
  }
  return fallback;
}

// ─── Data ────────────────────────────────────────────────────────────────────

export const STEPS = [
  { id: 1, key: 'contexto',       label: 'Contexto',       Icon: BriefcaseBusiness,
    desc: 'Base organizacional, alcance de la evaluación y criterios de riesgo.' },
  { id: 2, key: 'analisis-riesgo', label: 'Análisis riesgos', Icon: BarChart3,
    desc: '' },
  { id: 3, key: 'analisis-control', label: 'Análisis Ctrl', Icon: ShieldCheck,
    desc: 'Evalúa los controles mitigantes vinculados a cada riesgo identificado.' },
  { id: 4, key: 'valoracion',     label: 'Valoración',      Icon: Scale,
    desc: 'Valora cada riesgo frente a los criterios definidos y toma decisiones.' },
  { id: 5, key: 'tratamiento',    label: 'Tratamiento',     Icon: ShieldPlus,
    desc: 'Define las acciones de tratamiento para los riesgos inaceptables.' },
] as const;

export const APPETITE_OPTIONS = [
  { value: 'muy_bajo', label: 'Muy bajo',  color: '#10b981' },
  { value: 'bajo',     label: 'Bajo',      color: '#34d399' },
  { value: 'medio',    label: 'Medio',     color: '#3b82f6' },
  { value: 'moderado', label: 'Moderado',  color: '#3b82f6' },
  { value: 'alto',     label: 'Alto',      color: '#f59e0b' },
  { value: 'muy_alto', label: 'Muy alto',  color: '#ef4444' },
];

// ─── Shared styles ────────────────────────────────────────────────────────────

export const CARD: React.CSSProperties = {
  background: 'linear-gradient(160deg, rgba(13,22,50,0.97), rgba(7,16,42,0.95))',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 14,
  padding: '1.5rem',
};

export const INPUT_S: React.CSSProperties = {
  width: '100%', background: 'rgba(17,35,77,0.5)',
  border: '1px solid rgba(120,149,210,0.2)', borderRadius: 10,
  color: '#e2e8f0', fontSize: '0.82rem', padding: '0.6rem 0.75rem',
  outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
};

export const TEXTAREA_S: React.CSSProperties = { ...INPUT_S, resize: 'vertical', minHeight: 88 };

export const LABEL_S: React.CSSProperties = {
  fontSize: '0.73rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.4rem',
};

export const SECTION_HDR: React.CSSProperties = {
  fontSize: '0.68rem', fontWeight: 700, color: '#3b4a6b',
  textTransform: 'uppercase', letterSpacing: '0.07em',
  margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.45rem',
};

// ─── Welcome splash ────────────────────────────────────────────────────────────

export function WelcomeSplash({ onClose, onContinue, loading }: {
  onClose: () => void;
  onContinue: () => void;
  loading: boolean;
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: `
        radial-gradient(circle at 12% 8%, rgba(164,212,255,0.45) 0, rgba(164,212,255,0.08) 24%, transparent 40%),
        radial-gradient(circle at 90% 86%, rgba(236,72,153,0.28) 0, rgba(236,72,153,0.08) 18%, transparent 36%),
        linear-gradient(120deg, #0f64e7 0%, #3b74f2 35%, #514bcb 72%, #5532c8 100%)
      `,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem',
    }}>
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `
          radial-gradient(circle at 0 100%, rgba(1,45,157,0.85), transparent 30%),
          radial-gradient(circle at 100% 0, rgba(126,58,242,0.5), transparent 25%)
        `,
      }} />

      <div style={{
        position: 'relative', zIndex: 1, width: 'min(92vw, 520px)',
        borderRadius: 26, border: '1px solid rgba(255,255,255,0.32)',
        background: 'linear-gradient(160deg, rgba(255,255,255,0.18), rgba(255,255,255,0.07))',
        boxShadow: '0 40px 80px rgba(12,22,60,0.4)', backdropFilter: 'blur(20px)',
        padding: '2.5rem 2rem 2rem',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem',
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: '1rem', right: '1rem',
          background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '50%', width: 32, height: 32, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.7)',
        }}><X size={15} /></button>

        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ShieldCheck size={38} color="#fff" strokeWidth={1.5} />
        </div>

        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            margin: 0, fontSize: 'clamp(1.4rem, 4vw, 2rem)',
            fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.03em', lineHeight: 1.2,
          }}>
            Evaluación de riesgo
          </h1>
          <p style={{ margin: '0.65rem 0 0', fontSize: '0.85rem', color: 'rgba(241,245,249,0.72)', lineHeight: 1.6 }}>
            Inicia un proceso guiado de evaluación. Cada paso te llevará desde el
            contexto hasta el monitoreo de riesgos.
          </p>
        </div>

        <div style={{
          width: '100%', background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, padding: '1rem 1.2rem',
          display: 'flex', flexDirection: 'column', gap: '0.45rem',
        }}>
          {STEPS.map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.62rem', fontWeight: 800, color: '#fff',
              }}>{s.id}</span>
              <span style={{ fontSize: '0.79rem', color: 'rgba(241,245,249,0.85)', flex: 1 }}>{s.label}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '0.75rem', borderRadius: 14,
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)',
            color: 'rgba(241,245,249,0.8)', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
          }}>Cerrar</button>
          <button onClick={onContinue} disabled={loading} style={{
            flex: 2, padding: '0.75rem', borderRadius: 14,
            background: 'linear-gradient(95deg, #3b82f6, #8552f5)',
            border: '1px solid rgba(255,255,255,0.25)', color: '#fff',
            fontSize: '0.85rem', fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            opacity: loading ? 0.75 : 1,
          }}>
            {loading
              ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Iniciando…</>
              : <><ArrowRight size={16} /> Iniciar evaluación</>}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ─── Exit dialog ───────────────────────────────────────────────────────────────

export function ExitDialog({ onContinue, onDraft, onDelete, deleting }: {
  onContinue: () => void;
  onDraft: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem',
    }}>
      <div style={{
        width: 'min(92vw, 440px)', borderRadius: 22,
        background: 'linear-gradient(160deg, rgba(13,22,50,0.99), rgba(7,16,42,0.98))',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 32px 60px rgba(0,0,0,0.5)',
        padding: '2rem 1.75rem',
        display: 'flex', flexDirection: 'column', gap: '1.25rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AlertTriangle size={20} color="#f59e0b" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
              ¿Salir de la evaluación?
            </h3>
            <p style={{ margin: 0, fontSize: '0.74rem', color: '#64748b' }}>
              El ID de evaluación se conserva en el sistema.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <button onClick={onDraft} style={{
            width: '100%', padding: '0.85rem 1rem', borderRadius: 12, textAlign: 'left',
            background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem',
          }}>
            <Save size={18} color="#3b82f6" style={{ flexShrink: 0 }} />
            <div>
              <p style={{ margin: 0, fontSize: '0.84rem', fontWeight: 700, color: '#93c5fd' }}>
                Guardar como borrador
              </p>
              <p style={{ margin: 0, fontSize: '0.72rem', color: '#475569' }}>
                El progreso se conserva. Puedes retomar la evaluación después.
              </p>
            </div>
          </button>

          <button onClick={onDelete} disabled={deleting} style={{
            width: '100%', padding: '0.85rem 1rem', borderRadius: 12, textAlign: 'left',
            background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.22)',
            cursor: deleting ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem',
            opacity: deleting ? 0.7 : 1,
          }}>
            {deleting
              ? <Loader2 size={18} color="#f87171" style={{ flexShrink: 0, animation: 'spin 1s linear infinite' }} />
              : <X size={18} color="#f87171" style={{ flexShrink: 0 }} />}
            <div>
              <p style={{ margin: 0, fontSize: '0.84rem', fontWeight: 700, color: '#f87171' }}>
                Cancelar evaluación
              </p>
              <p style={{ margin: 0, fontSize: '0.72rem', color: '#475569' }}>
                Elimina todo el progreso de esta sesión permanentemente.
              </p>
            </div>
          </button>
        </div>

        <button onClick={onContinue} style={{
          padding: '0.6rem', borderRadius: 10,
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          color: '#64748b', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
        }}>
          Continuar evaluación
        </button>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ─── Empresarial tab (Step 1 › Tab 1) ─────────────────────────────────────────

type EmpForm = {
  sector: string;
  regulacion: string;
  procesos_principales: string;
};
const EMP_EMPTY: EmpForm = {
  sector: '',
  regulacion: '',
  procesos_principales: '',
};

export function EmpresarialTab({ runRaId }: { runRaId: string }) {
  const [form, setForm] = useState<EmpForm>(EMP_EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/linear-risk/profile')
      .then(r => r.json())
      .then((d: { profile: EmpForm | null }) => {
        if (d.profile) setForm({
          sector: d.profile.sector ?? '',
          regulacion: d.profile.regulacion ?? '',
          procesos_principales: d.profile.procesos_principales ?? '',
        });
      })
      .catch(() => setError('No se pudo cargar el perfil empresarial.'))
      .finally(() => setLoading(false));
  }, []);

  function set(key: keyof EmpForm) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }));
  }

  async function handleSave() {
    setSaving(true); setError(null);
    try {
      const res = await fetch('/api/linear-risk/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, runRaId }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', gap: '0.6rem', color: '#475569' }}>
      <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
      <span style={{ fontSize: '0.82rem' }}>Cargando…</span>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div>
      {error && <ErrorAlert message={error} />}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={LABEL_S}>Sector</label>
          <input style={INPUT_S} value={form.sector} onChange={set('sector')}
            placeholder="Financiero, Seguros, Retail, Energía…" />
        </div>
        <div>
          <label style={LABEL_S}>Regulación aplicable</label>
          <input style={INPUT_S} value={form.regulacion} onChange={set('regulacion')}
            placeholder="ISO 31000, COSO ERM, Superintendencia…" />
        </div>
      </div>
      <SaveButton saving={saving} saved={saved} onClick={handleSave} color="#38bdf8" />
    </div>
  );
}

// ─── Evaluación tab (Step 1 › Tab 2) ──────────────────────────────────────────

type EvalForm = {
  objetivo: string; alcance: string; objeto_evaluado: string; responsable: string;
  inclusiones: string; exclusiones: string;
  periodo_inicio: string; periodo_fin: string;
  metodologia: string; supuestos: string; fuentes: string;
  apetito: string;
  element_id: string;
  activity_id: string;
};
const EVAL_EMPTY: EvalForm = {
  objetivo: '', alcance: '', objeto_evaluado: '', responsable: '',
  inclusiones: '', exclusiones: '',
  periodo_inicio: '', periodo_fin: '',
  metodologia: '', supuestos: '', fuentes: '',
  apetito: '',
  element_id: '',
  activity_id: '',
};

export function EvaluacionTab({ runRaId }: { runRaId: string }) {
  const [form, setForm]     = useState<EvalForm>(EVAL_EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [appetiteCatalog, setAppetiteCatalog] = useState<Array<{ appetite_level: string; tolerance_min: number; tolerance_max: number }>>([]);
  const [elements, setElements] = useState<Array<{ id: string; name: string }>>([]);
  const [activities, setActivities] = useState<Array<{ id: string; name: string; element_id: string }>>([]);

  const filteredActivities = useMemo(() => {
    if (!form.element_id) return [];
    return activities.filter(a => a.element_id === form.element_id);
  }, [activities, form.element_id]);

  useEffect(() => {
    fetch(`/api/linear-risk/general-context?runRaId=${encodeURIComponent(runRaId)}`)
      .then(r => r.json())
      .then((d: { 
        context: EvalForm | null; 
        appetiteCatalog: any[]; 
        elements: any[]; 
        activities: any[] 
      }) => {
        if (d.elements) setElements(d.elements);
        if (d.activities) setActivities(d.activities);
        if (d.appetiteCatalog) setAppetiteCatalog(d.appetiteCatalog);

        const preProcessId = sessionStorage.getItem('KIRIOX_PRESELECTED_PROCESS_ID');
        const preActivityId = sessionStorage.getItem('KIRIOX_PRESELECTED_ACTIVITY_ID');

        setForm(f => ({
          ...(d.context || EVAL_EMPTY),
          element_id: d.context?.element_id || preProcessId || '',
          activity_id: d.context?.activity_id || preActivityId || ''
        }));
      })
      .catch(() => setError('No se pudo cargar el contexto de evaluación.'))
      .finally(() => setLoading(false));
  }, [runRaId]);

  function set(key: keyof EvalForm) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }));
  }

  async function handleSave() {
    setSaving(true); setError(null);
    try {
      const res = await fetch('/api/linear-risk/general-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, runRaId }),
      });
      if (!res.ok) {
        const body = await res.json() as { error?: { message?: string } };
        throw new Error(body?.error?.message ?? `HTTP ${res.status}`);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', gap: '0.6rem', color: '#475569' }}>
      <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
      <span style={{ fontSize: '0.82rem' }}>Cargando…</span>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const MAX_CHARS = 500;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      {error && <ErrorAlert message={error} />}

      {/* ── Two-column main layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 412px', gap: '1.2rem', alignItems: 'start' }}>

        {/* Left: textareas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={LABEL_S}>Objetivo de la evaluación <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <textarea
                maxLength={MAX_CHARS}
                style={{ ...TEXTAREA_S, minHeight: 90, paddingBottom: '1.4rem' }}
                value={form.objetivo} onChange={set('objetivo')}
                placeholder="¿Qué busca determinar esta evaluación?…"
              />
              <span style={{ position: 'absolute', bottom: '0.4rem', right: '0.6rem', fontSize: '0.62rem', color: '#475569' }}>
                {form.objetivo.length}/{MAX_CHARS}
              </span>
            </div>
          </div>
          <div>
            <label style={LABEL_S}>Alcance <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <textarea
                maxLength={MAX_CHARS}
                style={{ ...TEXTAREA_S, minHeight: 80, paddingBottom: '1.4rem' }}
                value={form.alcance} onChange={set('alcance')}
                placeholder="¿Qué procesos, unidades y periodos cubre?…"
              />
              <span style={{ position: 'absolute', bottom: '0.4rem', right: '0.6rem', fontSize: '0.62rem', color: '#475569' }}>
                {form.alcance.length}/{MAX_CHARS}
              </span>
            </div>
          </div>
        </div>

        {/* Right: proceso evaluado */}
        <div style={{
          border: '1px solid rgba(245,158,11,0.25)', borderRadius: 12,
          padding: '1rem', background: 'rgba(245,158,11,0.04)',
          display: 'flex', flexDirection: 'column', gap: '0.9rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <FileText size={13} color="#f59e0b" />
            <span style={{ color: '#f59e0b', fontSize: '0.8rem', fontWeight: 700 }}>Proceso evaluado</span>
          </div>
          <div>
            <label style={LABEL_S}>Proceso asociado</label>
            <select 
              style={{ ...INPUT_S, width: '100%', appearance: 'auto' }} 
              value={form.element_id} 
              onChange={(e) => setForm(f => ({ ...f, element_id: e.target.value, activity_id: '' }))}
            >
              <option value="">Seleccione un proceso...</option>
              {elements.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div>
            <label style={LABEL_S}>Actividad específica</label>
            <select 
              style={{ ...INPUT_S, width: '100%', appearance: 'auto' }} 
              value={form.activity_id} 
              onChange={(e) => setForm(f => ({ ...f, activity_id: e.target.value }))}
              disabled={!form.element_id}
            >
              <option value="">{form.element_id ? 'Seleccione una actividad...' : 'Primero seleccione un proceso'}</option>
              {filteredActivities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label style={LABEL_S}>Responsable de la evaluación</label>
            <input style={INPUT_S} value={form.responsable} onChange={set('responsable')}
              placeholder="Nombre o cargo…" />
          </div>
        </div>
      </div>

      <div style={{
        marginTop: '0.5rem', padding: '1.25rem', borderRadius: 16,
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', flexDirection: 'column', gap: '1rem'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <label style={{ ...LABEL_S, marginBottom: 0, fontSize: '0.82rem', color: '#f8fafc' }}>Apetito general de riesgo</label>
          <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b', lineHeight: 1.4 }}>
            El apetito general de riesgo establece el nivel de exposición que la organización está dispuesta
            a asumir para alcanzar sus objetivos estratégicos en este proceso.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {(appetiteCatalog.length > 0 ? appetiteCatalog : APPETITE_OPTIONS).map(o => {
            const level = 'appetite_level' in o ? o.appetite_level : o.label;
            const val = 'appetite_level' in o ? o.appetite_level.toLowerCase().replace(/ /g, '_') : o.value;
            const min = 'tolerance_min' in o ? o.tolerance_min : null;
            const max = 'tolerance_max' in o ? o.tolerance_max : null;
            const baseOpt = APPETITE_OPTIONS.find(x => x.value === val || x.label.toLowerCase() === level.toLowerCase());
            const color = baseOpt?.color || '#64748b';
            const active = form.apetito === val;
            return (
              <button key={val}
                onClick={() => setForm(f => ({ ...f, apetito: f.apetito === val ? '' : val }))}
                style={{
                  padding: '0.45rem 1rem', borderRadius: 10, fontSize: '0.74rem', fontWeight: 700,
                  background: active ? `${color}22` : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${active ? color + '88' : 'rgba(255,255,255,0.08)'}`,
                  color: active ? color : '#64748b', cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.18rem',
                  minWidth: 90,
                }}>
                <span>{level}</span>
                {min !== null && max !== null && (
                  <span style={{ fontSize: '0.6rem', opacity: 0.75, fontWeight: 500 }}>{min}% - {max}%</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Additional Details Section ── */}
      <div style={{
        marginTop: '0.5rem', padding: '1.25rem', borderRadius: 16,
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', flexDirection: 'column', gap: '1.2rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <Layers size={13} color="#f59e0b" />
          <span style={{ color: '#f59e0b', fontSize: '0.8rem', fontWeight: 700 }}>Detalles adicionales y criterios</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
          <div>
            <label style={LABEL_S}>Inclusiones</label>
            <textarea style={{ ...TEXTAREA_S, minHeight: 60 }} value={form.inclusiones} onChange={set('inclusiones')} placeholder="Ej: Sedes, departamentos..." />
          </div>
          <div>
            <label style={LABEL_S}>Exclusiones</label>
            <textarea style={{ ...TEXTAREA_S, minHeight: 60 }} value={form.exclusiones} onChange={set('exclusiones')} placeholder="Ej: Procesos tercerizados..." />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.2rem' }}>
          <div>
            <label style={LABEL_S}>Periodo Inicio</label>
            <input type="date" style={INPUT_S} value={form.periodo_inicio} onChange={set('periodo_inicio')} />
          </div>
          <div>
            <label style={LABEL_S}>Periodo Fin</label>
            <input type="date" style={INPUT_S} value={form.periodo_fin} onChange={set('periodo_fin')} />
          </div>
          <div>
            <label style={LABEL_S}>Metodología</label>
            <input style={INPUT_S} value={form.metodologia} onChange={set('metodologia')} placeholder="Ej: ISO 31000..." />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
          <div>
            <label style={LABEL_S}>Supuestos (uno por línea)</label>
            <textarea style={{ ...TEXTAREA_S, minHeight: 80 }} value={form.supuestos} onChange={set('supuestos')} placeholder="Ingrese los supuestos de la evaluación..." />
          </div>
          <div>
            <label style={LABEL_S}>Fuentes de información (uno por línea)</label>
            <textarea style={{ ...TEXTAREA_S, minHeight: 80 }} value={form.fuentes} onChange={set('fuentes')} placeholder="Ingrese las fuentes de datos consultadas..." />
          </div>
        </div>
      </div>

      <SaveButton saving={saving} saved={saved} onClick={handleSave} color="#f59e0b" />
    </div>
  );
}

type InternalForm = {
  recursos: string;
  capacidades: string;
  procesos: string;
  sistemas: string;
  personas_clave: string;
};

const INTERNAL_EMPTY: InternalForm = {
  recursos: '',
  capacidades: '',
  procesos: '',
  sistemas: '',
  personas_clave: '',
};

export function InternoTab({ runRaId }: { runRaId: string }) {
  const [form, setForm] = useState<InternalForm>(INTERNAL_EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/linear-risk/internal-external?runRaId=${encodeURIComponent(runRaId)}&type=INTERNO`)
      .then((r) => r.json())
      .then((d: { context?: InternalForm }) => setForm({ ...INTERNAL_EMPTY, ...(d.context ?? {}) }))
      .catch(() => setError('No se pudo cargar el contexto interno.'))
      .finally(() => setLoading(false));
  }, [runRaId]);

  function set(key: keyof InternalForm) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/linear-risk/internal-external', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, runRaId, type: 'INTERNO' }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoaderSection />;

  return (
    <div>
      {error && <ErrorAlert message={error} />}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <SimpleTextarea label="Recursos" value={form.recursos} onChange={set('recursos')} minHeight={90} />
        <SimpleTextarea label="Capacidades" value={form.capacidades} onChange={set('capacidades')} minHeight={90} />
        <SimpleTextarea label="Sistemas" value={form.sistemas} onChange={set('sistemas')} minHeight={90} />
        <div style={{ gridColumn: '1 / -1' }}>
          <SimpleInput label="Personas clave" value={form.personas_clave} onChange={set('personas_clave')} />
        </div>
      </div>
      <SaveButton saving={saving} saved={saved} onClick={handleSave} color="#22c55e" />
    </div>
  );
}

type ExternalForm = {
  regulacion: string;
  mercado: string;
  economia: string;
  competencia: string;
};

const EXTERNAL_EMPTY: ExternalForm = {
  regulacion: '',
  mercado: '',
  economia: '',
  competencia: '',
};

export function ExternoTab({ runRaId }: { runRaId: string }) {
  const [form, setForm] = useState<ExternalForm>(EXTERNAL_EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/linear-risk/internal-external?runRaId=${encodeURIComponent(runRaId)}&type=EXTERNO`)
      .then((r) => r.json())
      .then((d: { context?: ExternalForm }) => setForm({ ...EXTERNAL_EMPTY, ...(d.context ?? {}) }))
      .catch(() => setError('No se pudo cargar el contexto externo.'))
      .finally(() => setLoading(false));
  }, [runRaId]);

  function set(key: keyof ExternalForm) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/linear-risk/internal-external', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, runRaId, type: 'EXTERNO' }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoaderSection />;

  return (
    <div>
      {error && <ErrorAlert message={error} />}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <SimpleInput label="Regulación" value={form.regulacion} onChange={set('regulacion')} />
        <SimpleInput label="Mercado" value={form.mercado} onChange={set('mercado')} />
        <SimpleInput label="Economía" value={form.economia} onChange={set('economia')} />
        <SimpleInput label="Competencia" value={form.competencia} onChange={set('competencia')} />
      </div>
      <SaveButton saving={saving} saved={saved} onClick={handleSave} color="#a78bfa" />
    </div>
  );
}

export function LoaderSection() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', gap: '0.6rem', color: '#475569' }}>
      <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
      <span style={{ fontSize: '0.82rem' }}>Cargando…</span>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export function ErrorAlert({ message }: { message: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.5rem',
      background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)',
      borderRadius: 10, padding: '0.65rem 0.9rem', fontSize: '0.77rem', color: '#f87171',
    }}>
      <AlertCircle size={13} />{message}
    </div>
  );
}

export function SaveButton({ saving, saved, onClick, color = '#3b82f6' }: { saving: boolean; saved: boolean; onClick: () => void; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.1rem' }}>
      <button onClick={onClick} disabled={saving} style={{
        display: 'flex', alignItems: 'center', gap: '0.45rem',
        padding: '0.5rem 1.4rem', borderRadius: 10,
        background: saved ? 'rgba(16,185,129,0.15)' : `${color}22`,
        border: `1px solid ${saved ? 'rgba(16,185,129,0.4)' : color + '88'}`,
        color: saved ? '#34d399' : color, fontSize: '0.82rem', fontWeight: 700,
        cursor: saving ? 'wait' : 'pointer',
      }}>
        {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
          : saved ? <CheckCircle2 size={14} />
          : <Save size={14} />}
        {saving ? 'Guardando…' : saved ? 'Guardado' : 'Guardar'}
      </button>
    </div>
  );
}

export function SimpleInput({ label, value, onChange }: { label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div>
      <label style={LABEL_S}>{label}</label>
      <input style={INPUT_S} value={value} onChange={onChange} />
    </div>
  );
}

export function SimpleTextarea({
  label,
  value,
  onChange,
  minHeight = 90,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  minHeight?: number;
}) {
  return (
    <div>
      <label style={LABEL_S}>{label}</label>
      <textarea style={{ ...TEXTAREA_S, minHeight }} value={value} onChange={onChange} />
    </div>
  );
}

export function SectionBlock({
  title,
  color,
  Icon,
  children,
}: {
  title: string;
  color: string;
  Icon: any;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: `${color}15`, border: `1px solid ${color}35`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color,
        }}>
          <Icon size={16} />
        </div>
        <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.01em' }}>
          {title}
        </h3>
      </div>
      <div style={CARD}>
        {children}
      </div>
    </div>
  );
}
