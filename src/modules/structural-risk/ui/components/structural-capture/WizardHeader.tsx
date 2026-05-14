'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { RunRow, StructuralStep } from './types';

export function WizardHeader({
  steps,
  activeStep,
  onChangeStep,
  onSave,
  onClose,
  saving,
  currentRun,
  extraActions,
  hideSave,
}: {
  steps: StructuralStep[];
  activeStep: StructuralStep['key'];
  onChangeStep: (step: StructuralStep['key']) => void;
  onSave: () => void;
  onClose?: () => void;
  saving?: boolean;
  currentRun: RunRow | null;
  extraActions?: React.ReactNode;
  hideSave?: boolean;
}) {
  const activeIndex = Math.max(0, steps.findIndex((s) => s.key === activeStep));
  const hasPrev = activeIndex > 0;
  const hasNext = activeIndex < steps.length - 1;

  return (
    <div style={{ marginBottom: '0.9rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {currentRun && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.55rem', background: 'rgba(10,18,44,0.85)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 10, padding: '0.38rem 0.9rem' }}>
              <span style={{ color: '#e2e8f0', fontSize: '0.78rem', fontWeight: 700 }}>Run actual:</span>
              <span style={{ color: '#60a5fa', fontSize: '0.78rem', fontWeight: 800 }}>{currentRun.code}</span>
              <span style={{ color: '#475569', fontSize: '0.7rem' }}>•</span>
              <span style={{ background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.3)', borderRadius: 6, padding: '0.1rem 0.5rem', color: '#93c5fd', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.05em' }}>
                {currentRun.lifecycle_code ?? 'DRAFT'}
              </span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          {extraActions}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              disabled={Boolean(saving)}
              style={{
                borderRadius: 10,
                border: '1px solid rgba(148,163,184,0.38)',
                background: 'rgba(15,23,42,0.58)',
                color: '#cbd5e1',
                padding: '0.5rem 0.9rem',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              Cerrar
            </button>
          )}
          {!hideSave && (
            <button
              type="button"
              onClick={onSave}
              disabled={Boolean(saving)}
              style={{
                borderRadius: 10,
                border: '1px solid rgba(52,211,153,0.45)',
                background: 'linear-gradient(135deg, rgba(22,163,74,0.24), rgba(16,185,129,0.22))',
                color: '#d1fae5',
                padding: '0.5rem 0.9rem',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'Grabando...' : 'Grabar'}
            </button>
          )}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', background: 'rgba(8,20,54,0.88)', border: '1px solid rgba(96,165,250,0.3)', borderRadius: 12, padding: '0.3rem' }}>
            <button
              type="button"
              onClick={() => hasPrev && onChangeStep(steps[activeIndex - 1].key)}
              disabled={!hasPrev}
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                border: '1px solid rgba(96,165,250,0.3)',
                background: hasPrev ? 'rgba(30,64,175,0.18)' : 'rgba(15,23,42,0.5)',
                color: hasPrev ? '#bfdbfe' : '#64748b',
                cursor: hasPrev ? 'pointer' : 'not-allowed',
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <select
              value={activeStep}
              onChange={(e) => onChangeStep(e.target.value as StructuralStep['key'])}
              style={{
                minWidth: 190,
                borderRadius: 8,
                border: '1px solid rgba(96,165,250,0.25)',
                background: 'rgba(15,23,42,0.65)',
                color: '#dbeafe',
                fontSize: '0.8rem',
                fontWeight: 700,
                padding: '0.35rem 0.5rem',
              }}
            >
              {steps.map((step, idx) => (
                <option key={step.key} value={step.key}>
                  {idx + 1}. {step.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => hasNext && onChangeStep(steps[activeIndex + 1].key)}
              disabled={!hasNext}
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                border: '1px solid rgba(96,165,250,0.3)',
                background: hasNext ? 'rgba(30,64,175,0.18)' : 'rgba(15,23,42,0.5)',
                color: hasNext ? '#bfdbfe' : '#64748b',
                cursor: hasNext ? 'pointer' : 'not-allowed',
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
