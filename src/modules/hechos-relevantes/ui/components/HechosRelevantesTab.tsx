'use client';

import React, { useState } from 'react';
import { Filter, Globe, Search, Plus, Calendar, Tag, X } from 'lucide-react';
import { BuscarHechosPanel } from './BuscarHechosPanel';

const HECHOS_RELEVANTES = [
  {
    id: 'HR-2026-001',
    titulo: 'Nueva circular SUGEF sobre gestión de riesgo operativo',
    fuente: 'SUGEF',
    impacto: 'Alto',
    tipo: 'Regulatorio',
    fecha: '2026-04-12',
    descripcion: 'SUGEF publicó la circular SUGEF 2-26 que establece nuevos requerimientos de reporte para eventos de pérdida operativa con impacto ≥ USD 50,000.',
    accion: 'Revisión de políticas',
  },
  {
    id: 'HR-2026-002',
    titulo: 'Condena penal a red de lavado vinculada al sector bancario regional',
    fuente: 'Poder Judicial',
    impacto: 'Medio',
    tipo: 'Legal',
    fecha: '2026-04-09',
    descripcion: 'Sentencia condenatoria a organización criminal que utilizó cuentas en entidades bancarias de la región para blanqueo de capitales por USD 3.2M.',
    accion: 'Revisión de vínculos',
  },
  {
    id: 'HR-2026-003',
    titulo: 'Alerta GAFILAT sobre nuevas tipologías de financiamiento del terrorismo',
    fuente: 'GAFILAT',
    impacto: 'Alto',
    tipo: 'Inteligencia',
    fecha: '2026-04-05',
    descripcion: 'GAFILAT emitió alerta regional sobre el uso de criptoactivos y plataformas P2P para financiamiento de actividades terroristas en Latinoamérica.',
    accion: 'Capacitación y alerta',
  },
];

const IMPACTO_COLOR: Record<string, string> = {
  Alto:  '#ef4444',
  Medio: '#f59e0b',
  Bajo:  '#10b981',
};

function Badge({ label, bg, text }: { label: string; bg: string; text: string }) {
  return (
    <span style={{ background: bg, color: text, padding: '3px 10px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
      {label}
    </span>
  );
}

export function HechosRelevantesTab() {
  const [selected, setSelected] = useState<(typeof HECHOS_RELEVANTES)[0] | null>(null);
  const [buscarOpen, setBuscarOpen] = useState(false);

  return (
    <>
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '9px 14px', fontSize: '0.82rem', color: '#94a3b8', cursor: 'pointer' }}>
            <Filter size={14} /> Tipo
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '9px 14px', fontSize: '0.82rem', color: '#94a3b8', cursor: 'pointer' }}>
            <Globe size={14} /> Fuente
          </button>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => setBuscarOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '9px 16px', fontSize: '0.82rem', fontWeight: 700, color: '#94a3b8', cursor: 'pointer' }}>
            <Search size={14} /> Buscar incidentes
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#3b82f6', border: 'none', borderRadius: '10px', padding: '9px 16px', fontSize: '0.82rem', fontWeight: 800, color: '#fff', cursor: 'pointer' }}>
            <Plus size={14} /> Registrar incidente
          </button>
        </div>
      </div>

      {/* Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {HECHOS_RELEVANTES.map((hr) => (
          <div
            key={hr.id}
            onClick={() => setSelected(hr)}
            style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '18px 20px', cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(59,130,246,0.35)';
              (e.currentTarget as HTMLDivElement).style.background = 'rgba(15,23,42,0.9)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)';
              (e.currentTarget as HTMLDivElement).style.background = 'rgba(15,23,42,0.7)';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '10px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>{hr.id}</span>
                  <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#334155' }} />
                  <Badge label={hr.tipo} bg="rgba(59,130,246,0.1)" text="#60a5fa" />
                  <Badge label={`Impacto ${hr.impacto}`} bg={`${IMPACTO_COLOR[hr.impacto]}18`} text={IMPACTO_COLOR[hr.impacto]} />
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f1f5f9', lineHeight: 1.35 }}>{hr.titulo}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: 2 }}>
                  <Calendar size={11} style={{ display: 'inline', marginRight: 4 }} />{hr.fecha}
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>{hr.fuente}</div>
              </div>
            </div>
            <p style={{ margin: '0 0 10px', fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.55 }}>{hr.descripcion}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.77rem', color: '#3b82f6', fontWeight: 700 }}>
              <Tag size={12} /> Acción sugerida: {hr.accion}
            </div>
          </div>
        ))}
      </div>

      {/* Drawer */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: 480, maxWidth: '90vw', height: '100vh', background: '#0b1120', borderLeft: '1px solid rgba(255,255,255,0.08)', boxShadow: '-24px 0 48px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', animation: 'slideIn 0.25s ease-out' }}
          >
            <div style={{ padding: '1.75rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                  <Badge label={selected.tipo} bg="rgba(59,130,246,0.1)" text="#60a5fa" />
                  <Badge label={`Impacto ${selected.impacto}`} bg={`${IMPACTO_COLOR[selected.impacto]}18`} text={IMPACTO_COLOR[selected.impacto]} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#f1f5f9', lineHeight: 1.3 }}>{selected.titulo}</h3>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.75rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                {[
                  { label: 'Fuente', value: selected.fuente },
                  { label: 'Fecha', value: selected.fecha },
                  { label: 'Tipo', value: selected.tipo },
                  { label: 'Impacto', value: selected.impacto },
                ].map((f) => (
                  <div key={f.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '12px 14px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>{f.label}</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#e2e8f0' }}>{f.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '14px 16px' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: 8 }}>Descripción</div>
                <p style={{ margin: 0, fontSize: '0.87rem', color: '#cbd5e1', lineHeight: 1.65 }}>{selected.descripcion}</p>
              </div>
              <div style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.18)', borderRadius: '10px', padding: '14px 16px' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: 8 }}>Acción sugerida</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.88rem', fontWeight: 700, color: '#60a5fa' }}>
                  <Tag size={14} /> {selected.accion}
                </div>
              </div>
            </div>
            <div style={{ padding: '1.25rem 2rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '0.75rem' }}>
              <button style={{ flex: 1, background: '#3b82f6', border: 'none', borderRadius: '10px', padding: '10px', fontSize: '0.82rem', fontWeight: 800, color: '#fff', cursor: 'pointer' }}>
                Vincular a riesgo
              </button>
              <button onClick={() => setSelected(null)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px', fontSize: '0.82rem', fontWeight: 700, color: '#94a3b8', cursor: 'pointer' }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {buscarOpen && <BuscarHechosPanel onClose={() => setBuscarOpen(false)} />}

      <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
    </>
  );
}
