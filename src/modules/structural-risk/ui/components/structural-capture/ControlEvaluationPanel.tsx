'use client';

import React, { useEffect, useRef, useState } from 'react';

type ControlItem = {
  risk_id: string;
  control_id: string;
  control_code: string | null;
  control_name: string;
  control_type_name: string | null;
  owner_name: string | null;
  mitigation_strength: number | null;
  reduces_probability: boolean;
  reduces_impact: boolean;
};

type CascadeRef = { risk_cascade_id: string; risk_id: string };

const DEFAULT_QUESTIONS = [
  '¿El proceso debe detenerse si este control no se ejecuta?',
  '¿La operación entra en incumplimiento si este control no existe o no se aplica?',
  '¿La decisión no puede aprobarse legítimamente sin este control?',
  '¿Sin evidencia válida de este control no se puede demostrar que la operación fue correcta?',
  '¿Si este control falla, la información posterior queda contaminada o no confiable?',
  '¿Si este control se omite, el daño no puede corregirse fácilmente después?',
  '¿Este control es obligatorio antes de una acción crítica como aprobar, invertir, pagar, publicar, admitir, reportar o divulgar?',
  '¿Ningún otro control puede reemplazarlo completamente sin perder validez, cumplimiento o evidencia?',
];

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'no-cascade';

export function ControlEvaluationPanel({
  controls,
  runSaId,
  riskCascades,
  questions = DEFAULT_QUESTIONS,
  panelTitle = 'Evaluación de controles',
  lockHardGate = false,
  apiEndpoint = '/api/structural-risk/wizard-hardgate',
  defaultAnswer = null,
}: {
  controls: ControlItem[];
  runSaId: string;
  riskCascades: CascadeRef[];
  questions?: string[];
  panelTitle?: string;
  lockHardGate?: boolean;
  apiEndpoint?: string;
  /** Initial answer for unanswered questions. Use false for evidence mode (No = default). */
  defaultAnswer?: boolean | null;
}) {
  const qCount = questions.length;
  const unique = controls.filter((c, i, arr) => arr.findIndex((x) => x.control_id === c.control_id) === i);
  const [selectedId, setSelectedId] = useState<string | null>(unique[0]?.control_id ?? null);
  const [answers, setAnswers] = useState<Record<string, (boolean | null)[]>>({});
  const [saveStatus, setSaveStatus] = useState<Record<string, SaveStatus>>({});
  const loadedRef = useRef<Record<string, (boolean | null)[]>>({});
  // Stores is_hard_gate classified in paso 5 — never overwritten by evidence answers
  const lockedHardGateRef = useRef<Record<string, boolean>>({});
  const debounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    if (!runSaId) return;
    void loadEvaluations();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runSaId]);

  async function loadEvaluations() {
    try {
      const res = await fetch(`${apiEndpoint}?runSaId=${encodeURIComponent(runSaId)}`, { cache: 'no-store' });
      const data = (await res.json()) as { evaluations?: Array<{ control_id: string; answered_yes_question: string | null; is_hard_gate: boolean }> };
      if (!res.ok || !data.evaluations) return;
      const loaded: Record<string, (boolean | null)[]> = {};
      for (const row of data.evaluations) {
        lockedHardGateRef.current[row.control_id] = row.is_hard_gate;
        try {
          const parsed = JSON.parse(row.answered_yes_question ?? 'null');
          loaded[row.control_id] = Array.isArray(parsed) ? parsed : Array(qCount).fill(defaultAnswer);
        } catch {
          loaded[row.control_id] = Array(qCount).fill(defaultAnswer);
        }
      }
      loadedRef.current = { ...loaded };
      setAnswers(loaded);
    } catch { /* silent */ }
  }

  function getCascadeId(controlId: string): string | null {
    const riskIds = controls.filter((c) => c.control_id === controlId).map((c) => c.risk_id);
    for (const rid of riskIds) {
      const cascade = riskCascades.find((c) => c.risk_id === rid);
      if (cascade) return cascade.risk_cascade_id;
    }
    return null;
  }

  function toggle(controlId: string, idx: number, value: boolean) {
    const current = answers[controlId] ?? Array(qCount).fill(defaultAnswer);
    const next = [...current] as (boolean | null)[];
    next[idx] = next[idx] === value ? null : value;
    const nextAnswers = { ...answers, [controlId]: next };
    setAnswers(nextAnswers);
    clearTimeout(debounceRef.current[controlId]);
    debounceRef.current[controlId] = setTimeout(() => void saveEvaluation(controlId, next), 600);
  }

  async function saveEvaluation(controlId: string, currentAnswers: (boolean | null)[]) {
    const cascadeId = getCascadeId(controlId);
    if (!cascadeId) {
      setSaveStatus((prev) => ({ ...prev, [controlId]: 'no-cascade' }));
      return;
    }
    setSaveStatus((prev) => ({ ...prev, [controlId]: 'saving' }));
    // When lockHardGate, preserve the hard gate status from paso 5 — do not recompute
    const hardGateValue = lockHardGate
      ? (lockedHardGateRef.current[controlId] ?? false)
      : currentAnswers.some((a) => a === true);
    try {
      const res = await fetch(apiEndpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runSaId,
          controlId,
          riskCascadeId: cascadeId,
          isHardGate: hardGateValue,
          answeredYesQuestion: JSON.stringify(currentAnswers),
        }),
      });
      if (res.ok) {
        loadedRef.current[controlId] = [...currentAnswers];
        setSaveStatus((prev) => ({ ...prev, [controlId]: 'saved' }));
      } else {
        setSaveStatus((prev) => ({ ...prev, [controlId]: 'error' }));
      }
    } catch {
      setSaveStatus((prev) => ({ ...prev, [controlId]: 'error' }));
    }
  }

  const emptyRow = () => Array(qCount).fill(defaultAnswer);
  const getAnswers = (id: string): (boolean | null)[] => answers[id] ?? emptyRow();

  const isHardGate = (id: string) =>
    lockHardGate
      ? (lockedHardGateRef.current[id] ?? false)
      : getAnswers(id).some((a) => a === true);

  // Evidence-specific derived states (meaningful only when lockHardGate)
  const hasAnyNo = (id: string) => getAnswers(id).some((a) => a === false);
  const isDiscontinuidad = (id: string) => lockHardGate && isHardGate(id) && hasAnyNo(id);
  const isEvidenciaParcial = (id: string) => lockHardGate && hasAnyNo(id) && !isHardGate(id);

  const selected = unique.find((c) => c.control_id === selectedId) ?? null;

  if (unique.length === 0) {
    return <div style={{ color: '#94a3b8', fontSize: '0.8rem', padding: '0.4rem 0' }}>No hay controles disponibles para evaluar en esta actividad.</div>;
  }

  const leftCard: React.CSSProperties = {
    border: '1px solid rgba(168,85,247,0.28)',
    borderRadius: 12,
    background: 'rgba(10,18,46,0.75)',
    overflow: 'hidden',
    alignSelf: 'start',
  };

  const rightCard: React.CSSProperties = {
    border: isDiscontinuidad(selectedId ?? '')
      ? '1px solid rgba(239,68,68,0.45)'
      : '1px solid rgba(168,85,247,0.28)',
    borderRadius: 12,
    background: 'rgba(10,18,46,0.75)',
    overflow: 'hidden',
  };

  const cardHeader: React.CSSProperties = {
    padding: '0.55rem 0.8rem',
    borderBottom: '1px solid rgba(168,85,247,0.18)',
    background: 'rgba(88,28,135,0.20)',
  };

  function SaveBadge({ status }: { status: SaveStatus }) {
    if (status === 'saving') return <span style={{ fontSize: '0.63rem', color: '#94a3b8' }}>Guardando…</span>;
    if (status === 'saved') return <span style={{ fontSize: '0.63rem', color: '#86efac' }}>✓ Guardado</span>;
    if (status === 'error') return <span style={{ fontSize: '0.63rem', color: '#fca5a5' }}>⚠ Error al guardar</span>;
    if (status === 'no-cascade') return <span style={{ fontSize: '0.63rem', color: '#fbbf24' }}>Sin cascada en paso 4</span>;
    return null;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '0.7rem', marginTop: '0.75rem' }}>

      {/* ── LEFT: Controles a evaluar ── */}
      <div style={leftCard}>
        <div style={cardHeader}>
          <span style={{ color: '#d8b4fe', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Controles a evaluar
          </span>
        </div>
        <div style={{ maxHeight: 460, overflowY: 'auto' }}>
          {unique.map((ctrl) => {
            const active = ctrl.control_id === selectedId;
            const disc = isDiscontinuidad(ctrl.control_id);
            const hg = isHardGate(ctrl.control_id);
            const parcial = isEvidenciaParcial(ctrl.control_id);
            const st = saveStatus[ctrl.control_id] ?? 'idle';
            return (
              <div
                key={ctrl.control_id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedId(ctrl.control_id)}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedId(ctrl.control_id)}
                style={{
                  padding: '0.62rem 0.8rem',
                  borderLeft: `3px solid ${disc ? '#ef4444' : active ? '#a855f7' : 'transparent'}`,
                  borderBottom: '1px solid rgba(30,41,59,0.5)',
                  background: active ? 'rgba(88,28,135,0.25)' : 'transparent',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.4rem' }}>
                  <span style={{ color: active ? '#ede9fe' : '#cbd5e1', fontSize: '0.76rem', fontWeight: 600, lineHeight: 1.35 }}>
                    {ctrl.control_name}
                  </span>
                  {disc ? (
                    <span style={{ flexShrink: 0, fontSize: '0.6rem', fontWeight: 700, color: '#fca5a5', background: 'rgba(239,68,68,0.22)', border: '1px solid rgba(239,68,68,0.45)', borderRadius: 5, padding: '0.1rem 0.32rem', whiteSpace: 'nowrap' }}>
                      Discontinuidad
                    </span>
                  ) : hg ? (
                    <span style={{ flexShrink: 0, fontSize: '0.6rem', fontWeight: 700, color: '#fca5a5', background: 'rgba(239,68,68,0.18)', border: '1px solid rgba(239,68,68,0.32)', borderRadius: 5, padding: '0.1rem 0.32rem', whiteSpace: 'nowrap' }}>
                      Hard Gate
                    </span>
                  ) : parcial ? (
                    <span style={{ flexShrink: 0, fontSize: '0.6rem', fontWeight: 700, color: '#fbbf24', background: 'rgba(245,158,11,0.14)', border: '1px solid rgba(245,158,11,0.32)', borderRadius: 5, padding: '0.1rem 0.32rem', whiteSpace: 'nowrap' }}>
                      Ev. parcial
                    </span>
                  ) : null}
                </div>
                {ctrl.control_type_name && (
                  <div style={{ color: '#475569', fontSize: '0.67rem', marginTop: '0.15rem' }}>{ctrl.control_type_name}</div>
                )}
                <div style={{ marginTop: '0.18rem' }}>
                  <SaveBadge status={st} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── RIGHT: Panel de evaluación ── */}
      {selected && (
        <div style={rightCard}>
          <div style={{
            ...cardHeader,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.6rem',
            background: isDiscontinuidad(selected.control_id)
              ? 'rgba(120,20,20,0.28)'
              : 'rgba(88,28,135,0.20)',
          }}>
            <div>
              <div style={{ color: '#d8b4fe', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.12rem' }}>
                {panelTitle}
              </div>
              <div style={{ color: '#ede9fe', fontSize: '0.86rem', fontWeight: 700 }}>{selected.control_name}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
              {/* Hard Gate badge — only shown in hardgate mode (paso 5) */}
              {!lockHardGate && (
                isHardGate(selected.control_id) ? (
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#fca5a5', background: 'rgba(239,68,68,0.18)', border: '1px solid rgba(239,68,68,0.40)', borderRadius: 8, padding: '0.28rem 0.65rem' }}>
                    🔒 Hard Gate
                  </span>
                ) : (
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#86efac', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.28)', borderRadius: 8, padding: '0.28rem 0.65rem' }}>
                    ✓ Compensable
                  </span>
                )
              )}
              {/* Evidence validity badges — only in lockHardGate mode */}
              {lockHardGate && (
                isDiscontinuidad(selected.control_id) ? (
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#fca5a5', background: 'rgba(185,28,28,0.30)', border: '1px solid rgba(239,68,68,0.55)', borderRadius: 8, padding: '0.22rem 0.6rem', letterSpacing: '0.01em' }}>
                    🚨 Discontinuidad estructural
                  </span>
                ) : hasAnyNo(selected.control_id) ? (
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#fbbf24', background: 'rgba(120,80,0,0.22)', border: '1px solid rgba(245,158,11,0.40)', borderRadius: 8, padding: '0.22rem 0.6rem' }}>
                    ⚠ Evidencia parcial
                  </span>
                ) : (
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#86efac', background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.28)', borderRadius: 8, padding: '0.22rem 0.6rem' }}>
                    ✓ Evidencia plena
                  </span>
                )
              )}
              <SaveBadge status={saveStatus[selected.control_id] ?? 'idle'} />
            </div>
          </div>

          <div>
            {questions.map((q, idx) => {
              const ans = getAnswers(selected.control_id)[idx];
              return (
                <div
                  key={idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    gap: '0.8rem',
                    alignItems: 'center',
                    padding: '0.56rem 0.85rem',
                    borderBottom: '1px solid rgba(30,41,59,0.42)',
                    background: idx % 2 === 0 ? 'rgba(12,22,58,0.35)' : 'transparent',
                  }}
                >
                  <span style={{ color: '#cbd5e1', fontSize: '0.77rem', lineHeight: 1.45 }}>
                    <span style={{ color: '#9333ea', fontWeight: 700, marginRight: '0.35rem' }}>{idx + 1}.</span>
                    {q}
                  </span>
                  <div style={{ display: 'flex', gap: '0.28rem', flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => toggle(selected.control_id, idx, true)}
                      style={{
                        padding: '0.26rem 0.65rem', borderRadius: 7, fontWeight: 700, cursor: 'pointer',
                        fontSize: '0.71rem',
                        border: ans === true ? '1px solid rgba(239,68,68,0.65)' : '1px solid rgba(71,85,105,0.38)',
                        background: ans === true ? 'rgba(239,68,68,0.22)' : 'rgba(15,23,42,0.5)',
                        color: ans === true ? '#fca5a5' : '#64748b',
                      }}
                    >
                      Sí
                    </button>
                    <button
                      type="button"
                      onClick={() => toggle(selected.control_id, idx, false)}
                      style={{
                        padding: '0.26rem 0.65rem', borderRadius: 7, fontWeight: 700, cursor: 'pointer',
                        fontSize: '0.71rem',
                        border: ans === false ? '1px solid rgba(34,197,94,0.65)' : '1px solid rgba(71,85,105,0.38)',
                        background: ans === false ? 'rgba(34,197,94,0.16)' : 'rgba(15,23,42,0.5)',
                        color: ans === false ? '#86efac' : '#64748b',
                      }}
                    >
                      No
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ padding: '0.55rem 0.85rem', borderTop: '1px solid rgba(168,85,247,0.18)', background: 'rgba(88,28,135,0.10)' }}>
            {lockHardGate ? (
              <>
                <span style={{ color: '#a78bfa', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Regla: </span>
                <span style={{ color: '#94a3b8', fontSize: '0.68rem' }}>
                  Un solo <span style={{ color: '#fbbf24', fontWeight: 700 }}>"No"</span> invalida la evidencia.
                  Si el control es <span style={{ color: '#fca5a5', fontWeight: 700 }}>Hard Gate</span>, activa{' '}
                  <span style={{ color: '#fca5a5', fontWeight: 700 }}>Discontinuidad estructural</span>.
                  La clasificación Hard Gate es inmutable desde el paso anterior.
                </span>
              </>
            ) : (
              <>
                <span style={{ color: '#a78bfa', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Regla: </span>
                <span style={{ color: '#94a3b8', fontSize: '0.68rem' }}>Si responde "Sí" a cualquiera de estas preguntas, clasificar como </span>
                <span style={{ color: '#fca5a5', fontSize: '0.68rem', fontWeight: 700 }}>Hard Gate</span>
                <span style={{ color: '#94a3b8', fontSize: '0.68rem' }}>.</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
