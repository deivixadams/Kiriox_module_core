'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, FileText, Loader2, LogOut } from 'lucide-react';
import { CARD, ExitDialog, STEPS } from './ContextWizardShared';
import { StepContexto } from './StepContexto';
import { StepAnalisisRiesgo } from './StepAnalisisRiesgo';
import { StepAnalisisControl } from './StepAnalisisControl';
import { StepValoracion } from './StepValoracion';
import { StepTratamiento } from './StepTratamiento';

function StepPlaceholder({ step }: { step: typeof STEPS[number] }) {
  return (
    <div style={{
      ...CARD,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: '1.25rem', padding: '5rem 2rem', textAlign: 'center', minHeight: 360,
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6',
      }}>
        <step.Icon size={30} strokeWidth={1.5} />
      </div>
      <div>
        <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#64748b', letterSpacing: '-0.02em' }}>
          {step.label}
        </h3>
        <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: '#3b4a6b', maxWidth: 380, lineHeight: 1.6 }}>
          {step.desc}
        </p>
        <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: '#3b4a6b', maxWidth: 360 }}>
          Estamos migrando este componente. Por favor, espere.
        </p>
      </div>
    </div>
  );
}

export function EvaluationWizard({ runRaId, runRaCode, onExit }: {
  runRaId: string;
  runRaCode: string;
  onExit: (action: 'draft' | 'delete') => void;
}) {
  const [step, setStep] = useState(1);
  const [showExit, setShowExit] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [evaluatedProcess, setEvaluatedProcess] = useState('');
  const [lifecycleCode, setLifecycleCode] = useState('DRAFT');
  const [progressPercent, setProgressPercent] = useState(0);
  const [finalizing, setFinalizing] = useState(false);

  useEffect(() => {
    async function loadMeta() {
      try {
        const gcRes = await fetch(`/api/linear-risk/general-context?runRaId=${encodeURIComponent(runRaId)}`, { cache: 'no-store' });
        const gcData = await gcRes.json();
        const selectedElementId = String(gcData?.context?.element_id ?? '').trim();
        const processName = gcData.elements?.find((e: any) => e.id === selectedElementId)?.name?.trim() || '';
        const processFromStep1 = processName || String(gcData?.context?.objeto_evaluado ?? '').trim();

        if (processFromStep1) {
          setEvaluatedProcess(processFromStep1);
        }
      } catch (e) {
        console.error('Error loading process meta:', e);
      }
    }
    loadMeta();
  }, [runRaId]);

  useEffect(() => {
    async function loadLifecycle() {
      try {
        const res = await fetch(`/api/linear-risk/evaluations`, { cache: 'no-store' });
        const data = await res.json();
        const run = data.evaluations?.find((e: any) => e.id === runRaId);
        if (run) {
          setProgressPercent(run.progress);
          setLifecycleCode(run.lifecycle_code || 'DRAFT');
        }
      } catch {
        // silent
      }
    }
    void loadLifecycle();
  }, [runRaId, step]);

  const lifecycleMap: Record<string, { label: string; color: string; bg: string; border: string }> = {
    DRAFT: { label: 'BORRADOR', color: '#fbbf24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.22)' },
    IN_PROGRESS: { label: 'EN PROCESO', color: '#38bdf8', bg: 'rgba(56,189,248,0.08)', border: 'rgba(56,189,248,0.22)' },
    IN_TREATMENT: { label: 'EN TRATAMIENTO', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.22)' },
    COMPLETED: { label: 'COMPLETADA', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.28)' },
    CANCELLED: { label: 'CANCELADA', color: '#fb7185', bg: 'rgba(251,113,133,0.10)', border: 'rgba(251,113,133,0.26)' },
    REOPENED: { label: 'REABIERTA', color: '#22d3ee', bg: 'rgba(34,211,238,0.10)', border: 'rgba(34,211,238,0.26)' },
    DELETED: { label: 'ELIMINADA', color: '#94a3b8', bg: 'rgba(148,163,184,0.10)', border: 'rgba(148,163,184,0.26)' },
  };
  const lifecycleUi = lifecycleMap[lifecycleCode] ?? lifecycleMap.DRAFT;
  const current = STEPS[step - 1];

  async function handleGenerateReport() {
    setGeneratingReport(true);
    try {
      const res = await fetch(`/api/linear-risk/generate-report?runRaId=${encodeURIComponent(runRaId)}`);
      if (!res.ok) throw new Error('Error al generar informe');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `informe_${runRaCode}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Error al generar informe');
    } finally {
      setGeneratingReport(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch('/api/linear-risk/run-ra', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: runRaId }),
      });
      if (!res.ok) throw new Error('Error al eliminar');
      onExit('delete');
    } catch (e) {
      alert('Error al eliminar evaluación');
    } finally {
      setDeleting(false);
    }
  }

  async function handleFinalize() {
    if (!window.confirm('¿Finalizar evaluación?')) return;
    setFinalizing(true);
    try {
      const res = await fetch('/api/linear-risk/run-ra', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: runRaId, to_state: 'COMPLETED' }),
      });
      if (!res.ok) throw new Error('Error al finalizar');
      setLifecycleCode('COMPLETED');
      alert('Evaluación finalizada');
    } catch (e) {
      alert('Error al finalizar');
    } finally {
      setFinalizing(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(175deg, #0b1425 0%, #06101e 100%)',
      display: 'flex', flexDirection: 'column', fontFamily: 'inherit',
    }}>
      <div style={{
        background: 'linear-gradient(90deg, rgba(7,16,42,0.98), rgba(11,20,37,0.96))',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '0.75rem 2rem',
        display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
        position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1, minWidth: 0 }}>
          <h2 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#e2e8f0', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
            Evaluación de riesgo
          </h2>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            background: lifecycleUi.bg, border: `1px solid ${lifecycleUi.border}`,
            borderRadius: 999, padding: '0.18rem 0.6rem',
            fontSize: '0.62rem', fontWeight: 700, color: lifecycleUi.color, letterSpacing: '0.06em',
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: lifecycleUi.color }} />
            {`${lifecycleUi.label} (${progressPercent}%)`}
          </span>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.6rem',
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: 8, padding: '0.4rem 0.9rem',
        }}>
          <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            ID evaluación
          </span>
          <code style={{ fontSize: '0.92rem', color: '#22d3ee', fontWeight: 800, fontFamily: 'monospace', letterSpacing: '0.05em' }}>
            {runRaCode || runRaId.slice(0, 16) + '…'}
          </code>
        </div>

        <span style={{ fontSize: '0.7rem', color: '#3b4a6b', fontWeight: 600, whiteSpace: 'nowrap' }}>
          Paso {step} / {STEPS.length}
        </span>

        <button
          onClick={() => {
            if (lifecycleCode === 'COMPLETED') {
              onExit('draft');
            } else {
              setShowExit(true);
            }
          }}
          style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          padding: '0.38rem 0.8rem', borderRadius: 8,
          background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)',
          color: '#f87171', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
        }}>
          <LogOut size={13} /> Salir
        </button>
      </div>

      <div style={{
        background: 'rgba(7,16,42,0.7)', borderBottom: '1px solid rgba(255,255,255,0.05)',
        padding: '0 1.5rem', display: 'flex', alignItems: 'stretch', overflowX: 'auto',
      }}>
        {STEPS.map((s, i) => {
          const active = s.id === step;
          const done = s.id < step;
          return (
            <button key={s.key} onClick={() => setStep(s.id)} style={{
              display: 'flex', alignItems: 'center', gap: '0.45rem',
              padding: '0.8rem 1rem', background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: active ? '2px solid #3b82f6' : '2px solid transparent',
              color: active ? '#60a5fa' : done ? '#34d399' : '#3b4a6b',
              fontSize: '0.76rem', fontWeight: active ? 700 : 600,
              whiteSpace: 'nowrap', transition: 'color .15s', flexShrink: 0,
            }}>
              <span style={{
                width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.62rem', fontWeight: 800,
                background: active ? 'rgba(59,130,246,0.14)' : done ? 'rgba(52,211,153,0.1)' : 'rgba(59,72,107,0.18)',
                border: `1px solid ${active ? 'rgba(59,130,246,0.35)' : done ? 'rgba(52,211,153,0.28)' : 'rgba(59,72,107,0.28)'}`,
                color: active ? '#60a5fa' : done ? '#34d399' : '#3b4a6b',
              }}>
                {done ? <CheckCircle2 size={10} /> : s.id}
              </span>
              <s.Icon size={13} />
              {s.label}
              {i < STEPS.length - 1 && <ChevronRight size={11} style={{ marginLeft: '0.15rem', color: '#1e2d4d' }} />}
            </button>
          );
        })}
      </div>

      <div style={{ flex: 1, padding: '2rem', maxWidth: 1152, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {step === 1 && <StepContexto runRaId={runRaId} />}
        {step === 2 && <StepAnalisisRiesgo runRaId={runRaId} />}
        {step === 3 && <StepAnalisisControl runRaId={runRaId} />}
        {step === 4 && <StepValoracion runRaId={runRaId} />}
        {step === 5 && <StepTratamiento runRaId={runRaId} />}
      </div>

      <div style={{
        background: 'rgba(7,16,42,0.92)', borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '0.9rem 2rem', backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
        position: 'sticky', bottom: 0, zIndex: 100,
      }}>
        <button
          onClick={() => setStep(s => Math.max(1, s - 1))}
          disabled={step === 1}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.45rem',
            padding: '0.55rem 1.2rem', borderRadius: 10,
            background: step === 1 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${step === 1 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.11)'}`,
            color: step === 1 ? '#1e2d4d' : '#94a3b8', fontSize: '0.8rem', fontWeight: 700,
            cursor: step === 1 ? 'not-allowed' : 'pointer',
          }}>
          <ChevronLeft size={14} /> Anterior
        </button>

        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
          {STEPS.map(s => (
            <div key={s.id} style={{
              width: s.id === step ? 22 : 6, height: 6, borderRadius: 999,
              background: s.id === step ? '#3b82f6' : s.id < step ? '#34d399' : 'rgba(255,255,255,0.1)',
              transition: 'all .2s',
            }} />
          ))}
        </div>

        {step < STEPS.length ? (
          <button
            onClick={() => setStep(s => s + 1)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.45rem',
              padding: '0.55rem 1.2rem', borderRadius: 10,
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              border: '1px solid rgba(59,130,246,0.4)',
              color: '#fff', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 2px 12px rgba(59,130,246,0.25)',
            }}>
            Siguiente <ChevronRight size={14} />
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              onClick={handleFinalize}
              disabled={finalizing || lifecycleCode === 'COMPLETED'}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.45rem',
                padding: '0.55rem 1.2rem', borderRadius: 10,
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: '1px solid rgba(16,185,129,0.4)',
                color: '#fff', fontSize: '0.8rem', fontWeight: 700,
                cursor: (finalizing || lifecycleCode === 'COMPLETED') ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 12px rgba(16,185,129,0.2)',
                opacity: (finalizing || lifecycleCode === 'COMPLETED') ? 0.7 : 1,
              }}
            >
              {finalizing
                ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Finalizando…</>
                : <><CheckCircle2 size={14} /> Finalizar evaluación</>}
            </button>
          </div>
        )}
      </div>

      {showExit && (
        <ExitDialog
          onContinue={() => setShowExit(false)}
          onDraft={() => onExit('draft')}
          onDelete={handleDelete}
          deleting={deleting}
        />
      )}
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
