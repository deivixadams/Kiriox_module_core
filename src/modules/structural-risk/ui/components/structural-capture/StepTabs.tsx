'use client';

import React from 'react';
import type { StructuralStep } from './types';

export function StepTabs({
  steps,
  activeStep,
  onChange,
}: {
  steps: StructuralStep[];
  activeStep: StructuralStep['key'];
  onChange: (step: StructuralStep['key']) => void;
}) {
  return (
    <section style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(6, minmax(120px, 1fr))',
      gap: '0.35rem',
      marginBottom: '0.8rem',
      border: '1px solid rgba(59,130,246,0.22)',
      borderRadius: 14,
      background: 'linear-gradient(135deg, rgba(5,15,40,0.92), rgba(8,24,58,0.92))',
      padding: '0.55rem',
    }}>
      {steps.map((step, idx) => {
        const active = step.key === activeStep;
        return (
          <button
            key={step.key}
            onClick={() => onChange(step.key)}
            style={{
              borderRadius: 10,
              border: 'none',
              background: 'transparent',
              color: active ? '#60a5fa' : '#cbd5e1',
              padding: '0.5rem 0.55rem',
              fontSize: '0.74rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              borderBottom: active ? '2px solid rgba(59,130,246,0.9)' : '2px solid transparent',
            }}
          >
            <span style={{
              width: 22,
              height: 22,
              borderRadius: 999,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: active ? 'linear-gradient(135deg,#3b82f6,#2563eb)' : 'rgba(30,41,59,0.95)',
              color: '#e2e8f0',
              fontSize: '0.75rem',
              fontWeight: 900,
              flex: '0 0 auto',
            }}>{idx + 1}</span>
            <span style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <span style={{ display: 'block' }}>{step.label}</span>
              <span style={{ display: 'block', fontSize: '0.67rem', color: '#94a3b8', marginTop: 1 }}>
                {step.key === 'dependencias' ? 'Seleccionar dependencias' :
                  step.key === 'riesgo' ? 'Identificar riesgos' :
                  step.key === 'control' ? 'Definir controles' :
                  step.key === 'evidencia' ? 'Vincular evidencia' :
                  step.key === 'impacto' ? 'Impacto y criticidad' : 'Elementos compartidos'}
              </span>
            </span>
          </button>
        );
      })}
    </section>
  );
}
