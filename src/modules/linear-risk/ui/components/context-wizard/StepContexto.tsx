'use client';

import React from 'react';
import { Globe, Home, Info, Target } from 'lucide-react';
import { EvaluacionTab, ExternoTab, InternoTab, SectionBlock } from './ContextWizardShared';

export function StepContexto({ runRaId }: { runRaId: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
      <SectionBlock title="Contexto evaluación" color="#f59e0b" Icon={Target}>
        <EvaluacionTab runRaId={runRaId} />
      </SectionBlock>
      <SectionBlock title="Contexto externo" color="#a78bfa" Icon={Globe}>
        <ExternoTab runRaId={runRaId} />
      </SectionBlock>
      <SectionBlock title="Contexto interno" color="#22c55e" Icon={Home}>
        <InternoTab runRaId={runRaId} />
      </SectionBlock>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.65rem',
        borderRadius: 12, border: '1px solid rgba(59,130,246,0.22)',
        background: 'rgba(59,130,246,0.06)', padding: '0.8rem 1rem',
        color: '#93c5fd', fontSize: '0.8rem',
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Info size={14} color="#60a5fa" />
        </div>
        Todos los cambios se guardan automáticamente. Puede continuar con las demás secciones.
      </div>
    </div>
  );
}
