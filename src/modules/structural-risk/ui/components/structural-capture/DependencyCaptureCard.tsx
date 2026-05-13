'use client';

import React from 'react';
import { SURFACE } from './constants';
import type { ActivityRow } from './types';

export type DependencyDraft = {
  activityId: string;
  dependencyActivityId: string;
  dependencyResourceId: string;
  dependencySystemName: string;
  dependencyDataName: string;
  dependencyPersonId: string;
  dependencyProviderName: string;
  dependencyDocumentName: string;
  failureEffectId: string;
  dependencyStrengthId: string;
  alternativeLevelId: string;
  impactCode: string;
  criticalityCode: string;
};

export function DependencyCaptureCard({
  originActivities,
  impacts,
  criticalities,
  value,
  onChange,
}: {
  originActivities: ActivityRow[];
  impacts: Array<{ code: string; label: string; operational_definition: string; time_to_impact_reference: string; effect_profile: string }>;
  criticalities: Array<{ code: string; label: string; operational_definition: string; decision_signal: string }>;
  value: DependencyDraft;
  onChange: (next: DependencyDraft) => void;
}) {
  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(17,35,77,0.5)',
    border: '1px solid rgba(120,149,210,0.25)',
    borderRadius: 9,
    color: '#e2e8f0',
    padding: '0.65rem 0.8rem',
    fontSize: '0.82rem',
    outline: 'none',
  };

  const getImpactColor = (code: string) => {
    switch (code) {
      case 'CRITICAL': return '#f87171';
      case 'HIGH': return '#fb923c';
      case 'MEDIUM': return '#fbbf24';
      case 'LOW': return '#60a5fa';
      default: return '#94a3b8';
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: '1rem', marginTop: '1rem' }}>
      {/* Left Card: Impact Selection */}
      <section style={{ ...SURFACE, padding: '1.25rem', border: '1px solid rgba(148,163,184,0.1)' }}>
        <header style={{ marginBottom: '1.2rem' }}>
          <h3 style={{ margin: '0 0 0.4rem', color: '#f1f5f9', fontSize: '1.05rem', fontWeight: 600 }}>Impacto de Actividad</h3>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.82rem' }}>Seleccione el nivel de criticidad.</p>
        </header>

        <div style={{ marginBottom: '0.8rem' }}>
          <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.85rem', marginBottom: 12, fontWeight: 600, lineHeight: '1.4' }}>
            Si esta actividad se detiene, ¿qué tan rápido empieza a afectar el proceso:{' '}
            <span style={{ color: '#fbbf24' }}>
              {originActivities.find(a => a.id === value.activityId)?.element_name || '...'}
            </span>?
          </label>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '80px 1fr 100px', 
            gap: '0.6rem', 
            padding: '0.7rem 1rem', 
            background: 'rgba(15,23,42,0.8)', 
            borderRadius: '8px 8px 0 0',
            borderBottom: '1px solid rgba(148,163,184,0.2)',
            color: '#94a3b8',
            fontSize: '0.65rem',
            textTransform: 'uppercase',
            fontWeight: 700
          }}>
            <div>Impacto</div>
            <div>Definición</div>
            <div>Ref.</div>
          </div>

          <div style={{ 
            maxHeight: '400px', 
            overflowY: 'auto', 
            background: 'rgba(15,23,42,0.4)',
            borderRadius: '0 0 8px 8px',
            border: '1px solid rgba(148,163,184,0.15)',
            borderTop: 'none'
          }}>
            {impacts.map((imp) => {
              const isSelected = value.impactCode === imp.code;
              return (
                <div 
                  key={imp.code}
                  onClick={() => onChange({ ...value, impactCode: imp.code })}
                  style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '80px 1fr 100px', 
                    gap: '0.6rem', 
                    padding: '0.9rem 1rem', 
                    cursor: 'pointer',
                    borderBottom: '1px solid rgba(148,163,184,0.1)',
                    transition: 'all 0.2s ease',
                    background: isSelected ? 'rgba(59,130,246,0.18)' : 'transparent',
                    position: 'relative'
                  }}
                >
                  {isSelected && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: '#3b82f6', borderRadius: '4px 0 0 4px' }} />}
                  <div style={{ color: getImpactColor(imp.code), fontWeight: 700, fontSize: '0.8rem' }}>{imp.label}</div>
                  <div style={{ color: '#f1f5f9', fontSize: '0.75rem', lineHeight: '1.4' }}>{imp.operational_definition}</div>
                  <div style={{ color: '#cbd5e1', fontSize: '0.72rem' }}>{imp.time_to_impact_reference}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Right Card: Criticality Selection */}
      <section style={{ ...SURFACE, padding: '1.25rem', border: '1px solid rgba(148,163,184,0.1)' }}>
        <header style={{ marginBottom: '1.2rem' }}>
          <h3 style={{ margin: '0 0 0.4rem', color: '#f1f5f9', fontSize: '1.05rem', fontWeight: 600 }}>Criticidad de Actividad</h3>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.82rem' }}>Defina la importancia de la actividad.</p>
        </header>

        <div style={{ marginBottom: '0.8rem' }}>
          <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.85rem', marginBottom: 12, fontWeight: 600, lineHeight: '1.4' }}>
            ¿Qué tan importante es la actividad para el proceso:{' '}
            <span style={{ color: '#fbbf24' }}>
              {originActivities.find(a => a.id === value.activityId)?.element_name || '...'}
            </span>?
          </label>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '80px 1fr 100px', 
            gap: '0.6rem', 
            padding: '0.7rem 1rem', 
            background: 'rgba(15,23,42,0.8)', 
            borderRadius: '8px 8px 0 0',
            borderBottom: '1px solid rgba(148,163,184,0.2)',
            color: '#94a3b8',
            fontSize: '0.65rem',
            textTransform: 'uppercase',
            fontWeight: 700
          }}>
            <div>Criticidad</div>
            <div>Definición Operativa</div>
            <div>Señal</div>
          </div>

          <div style={{ 
            maxHeight: '400px', 
            overflowY: 'auto', 
            background: 'rgba(15,23,42,0.4)',
            borderRadius: '0 0 8px 8px',
            border: '1px solid rgba(148,163,184,0.15)',
            borderTop: 'none'
          }}>
            {criticalities.map((cri) => {
              const isSelected = value.criticalityCode === cri.code;
              return (
                <div 
                  key={cri.code}
                  onClick={() => onChange({ ...value, criticalityCode: cri.code })}
                  style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '80px 1fr 100px', 
                    gap: '0.6rem', 
                    padding: '0.9rem 1rem', 
                    cursor: 'pointer',
                    borderBottom: '1px solid rgba(148,163,184,0.1)',
                    transition: 'all 0.2s ease',
                    background: isSelected ? 'rgba(59,130,246,0.18)' : 'transparent',
                    position: 'relative'
                  }}
                >
                  {isSelected && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: '#3b82f6', borderRadius: '4px 0 0 4px' }} />}
                  <div style={{ color: getImpactColor(cri.code), fontWeight: 700, fontSize: '0.8rem' }}>{cri.label}</div>
                  <div style={{ color: '#f1f5f9', fontSize: '0.75rem', lineHeight: '1.4' }}>{cri.operational_definition}</div>
                  <div style={{ color: '#cbd5e1', fontSize: '0.72rem' }}>{cri.decision_signal}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
