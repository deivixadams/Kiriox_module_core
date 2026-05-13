'use client';

import React from 'react';
import { SURFACE } from './constants';
import type { ActivityRow, WizardData } from './types';
import { Settings2 } from 'lucide-react';

export function RunConfigPanel({
  wizard,
  title,
  scopeType,
  methodology,
  lifecycleId,
  setTitle,
  setScopeType,
  setMethodology,
  setLifecycleId,
}: {
  wizard: WizardData;
  title: string;
  scopeType: string;
  methodology: string;
  lifecycleId: string;
  setTitle: (v: string) => void;
  setScopeType: (v: string) => void;
  setMethodology: (v: string) => void;
  setLifecycleId: (v: string) => void;
}) {
  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(17,35,77,0.5)', border: '1px solid rgba(120,149,210,0.25)',
    borderRadius: 9, color: '#e2e8f0', padding: '0.52rem 0.65rem', fontSize: '0.78rem',
  };

  return (
    <section style={{ ...SURFACE, padding: '0.9rem' }}>
      <h3 style={{ margin: '0 0 0.6rem', color: '#e2e8f0', fontSize: '1.02rem', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Settings2 size={16} color="#93c5fd" /> Configuración del run
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.55rem' }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.74rem', marginBottom: 5 }}>Nombre del run</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.74rem', marginBottom: 5 }}>Scope</label>
          <select value={scopeType} onChange={(e) => setScopeType(e.target.value)} style={inputStyle}>
            <option value="">Seleccione</option>
            {wizard.catalogs.scopeTypes.map((c) => <option key={c.id} value={c.code}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.74rem', marginBottom: 5 }}>Metodología</label>
          <select value={methodology} onChange={(e) => setMethodology(e.target.value)} style={inputStyle}>
            <option value="">Seleccione</option>
            {wizard.catalogs.methodologies.map((c) => <option key={c.id} value={c.code}>{c.name}</option>)}
          </select>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.74rem', marginBottom: 5 }}>Lifecycle</label>
          <select value={lifecycleId} onChange={(e) => setLifecycleId(e.target.value)} style={inputStyle}>
            <option value="">Seleccione</option>
            {wizard.catalogs.lifecycle.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>
    </section>
  );
}

export function RunLifecyclePanel({
  activities,
  selectedId,
  onSelect,
  horizontal,
}: {
  activities: ActivityRow[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  horizontal?: boolean;
}) {
  const elements = React.useMemo(() => {
    const seen = new Set<string>();
    return activities.filter((a) => {
      if (seen.has(a.element_name)) return false;
      seen.add(a.element_name);
      return true;
    }).map((a) => a.element_name);
  }, [activities]);

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(17,35,77,0.5)', border: '1px solid rgba(120,149,210,0.25)',
    borderRadius: 9, color: '#94a3b8', padding: '0.52rem 0.65rem', fontSize: '0.78rem', outline: 'none',
    cursor: 'default', opacity: 0.9,
  };

  const containerStyle: React.CSSProperties = horizontal 
    ? { ...SURFACE, padding: '0.9rem', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.2rem', alignItems: 'start' }
    : { ...SURFACE, padding: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' };

  return (
    <section style={containerStyle}>
      <div>
        <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.74rem', marginBottom: 5 }}>Elemento (Proceso)</label>
        <div style={inputStyle}>
          {elements.length > 0 ? elements.join(', ') : 'Sin elemento'}
        </div>
      </div>

      <div>
        <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.74rem', marginBottom: 5 }}>
          Actividad {activities.length > 0 && <span style={{ color: '#475569' }}>({activities.length})</span>}
        </label>
        <div style={{ 
          maxHeight: horizontal ? 120 : 260, 
          overflowY: 'auto', 
          display: 'flex', 
          flexDirection: horizontal ? 'row' : 'column', 
          gap: '0.4rem',
          flexWrap: horizontal ? 'wrap' : 'nowrap'
        }}>
          {activities.length === 0 && (
            <div style={{ color: '#475569', fontSize: '0.75rem', padding: '0.5rem 0' }}>Sin actividades.</div>
          )}
          {activities.map((a) => {
            const isSelected = selectedId === a.id;
            return (
              <div
                key={a.id}
                onClick={() => onSelect?.(a.id)}
                style={{
                  padding: '0.55rem 0.75rem',
                  borderRadius: 9,
                  border: isSelected ? '1px solid #3b82f6' : '1px solid rgba(71,85,105,0.35)',
                  background: isSelected ? 'rgba(59,130,246,0.1)' : 'rgba(15,23,42,0.55)',
                  cursor: onSelect ? 'pointer' : 'default',
                  transition: 'all 0.2s',
                  flex: horizontal ? '1 1 250px' : 'none',
                }}
              >
                <div style={{ color: isSelected ? '#ffffff' : '#cbd5e1', fontSize: '0.75rem', fontWeight: 600 }}>{a.name}</div>
                {a.description && <div style={{ color: '#64748b', fontSize: '0.68rem', marginTop: 2, lineHeight: 1.35 }}>{a.description}</div>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 7, paddingTop: 6, borderTop: '1px solid rgba(71,85,105,0.25)' }}>
                  <span style={{ color: '#64748b', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Responsable</span>
                  {(a.owner_name || a.owner_email) ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#60a5fa' }} />
                      <span style={{ color: '#93c5fd', fontSize: '0.72rem', fontWeight: 600 }}>
                        {a.owner_name || a.owner_email}
                      </span>
                    </div>
                  ) : (
                    <span style={{ color: '#475569', fontSize: '0.7rem', fontStyle: 'italic' }}>No definido en evaluación lineal</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
