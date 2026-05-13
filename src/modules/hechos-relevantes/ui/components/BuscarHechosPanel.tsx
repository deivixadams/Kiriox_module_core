'use client';

import React, { useEffect, useState } from 'react';
import {
  Search,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  LayoutList,
  LayoutGrid,
  Building2,
  Globe,
  Calendar,
  ExternalLink,
  FileText,
  Link2,
  Trash2,
} from 'lucide-react';
import type { HechoCapturado, CategoriaEvento, Relevancia } from '@/modules/hechos-relevantes/domain/types/HechosRelevantesTypes';

const QUERIES_UI = [
  'hecho relevante sociedad administradora fondos inversión República Dominicana',
  'site:simv.gob.do fondos de inversión circular resolución',
  'site:bvrd.com.do hechos relevantes fondos',
  'calificación de riesgo fondo de inversión República Dominicana',
  'SAFI República Dominicana riesgo regulatorio 2025 2026',
  'Superintendencia Mercado Valores República Dominicana sanción advertencia',
];

const RELEVANCIA_STYLE: Record<Relevancia, { bg: string; text: string; label: string }> = {
  critico: { bg: 'rgba(239,68,68,0.15)',  text: '#f87171', label: 'Crítico' },
  alto:    { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24', label: 'Alto'    },
  medio:   { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa', label: 'Medio'   },
  bajo:    { bg: 'rgba(16,185,129,0.15)', text: '#34d399', label: 'Bajo'    },
};

const CATEGORIA_LABEL: Record<CategoriaEvento, string> = {
  hecho_relevante:         'Incidente',
  calificacion_riesgo:     'Calificación de riesgo',
  fondo_inversion:         'Fondo de inversión',
  safi_administradora:     'SAFI / Administradora',
  valor_cuota:             'Valor cuota / desempeño',
  estados_financieros:     'Estados financieros',
  regulacion_cumplimiento: 'Regulación / cumplimiento',
  sancion_advertencia:     'Sanción o advertencia',
  cambio_reglamento:       'Cambio de reglamento',
  emision_cuotas:          'Emisión / colocación',
  deterioro_alerta:        'Deterioro / alerta',
  otro:                    'Otro',
};

const TIPO_DOC_ICON: Record<string, React.ReactNode> = {
  PDF:  <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#f87171', background: 'rgba(239,68,68,0.12)', borderRadius: 4, padding: '1px 5px' }}>PDF</span>,
  HTML: <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#60a5fa', background: 'rgba(59,130,246,0.12)', borderRadius: 4, padding: '1px 5px' }}>HTML</span>,
  otro: <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', background: 'rgba(148,163,184,0.12)', borderRadius: 4, padding: '1px 5px' }}>OTRO</span>,
};

export function BuscarHechosPanel({ onClose }: { onClose: () => void }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [results, setResults] = useState<HechoCapturado[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'grid'>('card');
  const [textoAbierto, setTextoAbierto] = useState<string | null>(null);
  const [descartados, setDescartados] = useState<Set<string>>(new Set());
  const [activeQuery, setActiveQuery] = useState<number>(-1);

  useEffect(() => {
    setStatus('loading');
    let qi = 0;
    const interval = setInterval(() => {
      setActiveQuery((prev) => Math.min(prev + 1, QUERIES_UI.length - 1));
      qi++;
      if (qi >= QUERIES_UI.length) clearInterval(interval);
    }, 600);

    fetch('/api/hechos-relevantes/buscar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queries: QUERIES_UI }),
    })
      .then((r) => r.json())
      .then((d: { ok: boolean; results?: HechoCapturado[]; error?: string }) => {
        clearInterval(interval);
        setActiveQuery(QUERIES_UI.length - 1);
        if (d.ok) { setResults(d.results ?? []); setStatus('done'); }
        else { setErrorMsg(d.error ?? 'Error desconocido'); setStatus('error'); }
      })
      .catch((e: unknown) => { clearInterval(interval); setErrorMsg(String(e)); setStatus('error'); });

    return () => clearInterval(interval);
  }, []);

  const visible = results.filter((r) => !descartados.has(r.id));

  return (
    <>
      {/* Overlay */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000 }} />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 1001,
        width: 'min(92vw, 1100px)',
        background: 'linear-gradient(160deg, #0b1735 0%, #071028 100%)',
        borderLeft: '1px solid rgba(96,165,250,0.18)',
        display: 'flex', flexDirection: 'column',
        fontFamily: 'system-ui, sans-serif',
      }}>

        {/* Header */}
        <div style={{ padding: '1rem 1.4rem', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Search size={15} color="#60a5fa" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#e2e8f0' }}>Captura pública de incidentes de riesgo</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 1 }}>Fuentes: SIMV · BVRD · Buscadores públicos · República Dominicana</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => setViewMode('card')}
              style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${viewMode === 'card' ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.08)'}`, background: viewMode === 'card' ? 'rgba(59,130,246,0.12)' : 'transparent', color: viewMode === 'card' ? '#60a5fa' : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem' }}
            >
              <LayoutList size={13} /> Tarjetas
            </button>
            <button
              onClick={() => setViewMode('grid')}
              style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${viewMode === 'grid' ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.08)'}`, background: viewMode === 'grid' ? 'rgba(59,130,246,0.12)' : 'transparent', color: viewMode === 'grid' ? '#60a5fa' : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem' }}
            >
              <LayoutGrid size={13} /> Grilla
            </button>
            <button onClick={onClose} style={{ marginLeft: 6, padding: 6, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Queries progress */}
        <div style={{ padding: '0.75rem 1.4rem', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)', flexShrink: 0 }}>
          <div style={{ fontSize: '0.7rem', color: '#475569', marginBottom: '0.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {status === 'loading' ? 'Ejecutando consultas públicas…' : status === 'done' ? `${visible.length} resultados capturados` : 'Error en consulta'}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {QUERIES_UI.map((q, i) => {
              const done = i <= activeQuery;
              const active = i === activeQuery && status === 'loading';
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, background: done ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${active ? 'rgba(59,130,246,0.4)' : done ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 6, padding: '3px 8px', fontSize: '0.68rem', color: done ? '#34d399' : '#475569', transition: 'all 0.3s' }}>
                  {active ? <Loader2 size={9} style={{ animation: 'spin 1s linear infinite' }} /> : done ? <CheckCircle size={9} /> : <div style={{ width: 9, height: 9, borderRadius: '50%', background: 'rgba(255,255,255,0.12)' }} />}
                  {q.length > 52 ? q.slice(0, 52) + '…' : q}
                </div>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.4rem' }}>

          {status === 'loading' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: '1rem', color: '#60a5fa' }}>
              <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Buscando en fuentes públicas de República Dominicana…</div>
            </div>
          )}

          {status === 'error' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '1rem 1.2rem', color: '#f87171', fontSize: '0.82rem' }}>
              <AlertCircle size={16} />
              {errorMsg ?? 'No se pudo completar la búsqueda. Verifica la conexión.'}
            </div>
          )}

          {status === 'done' && visible.length === 0 && (
            <div style={{ textAlign: 'center', color: '#475569', fontSize: '0.85rem', padding: '3rem 0' }}>
              No se encontraron resultados para las consultas ejecutadas.
            </div>
          )}

          {/* Vista Tarjetas */}
          {status === 'done' && visible.length > 0 && viewMode === 'card' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {visible.map((r) => {
                const rel = RELEVANCIA_STYLE[r.relevancia];
                return (
                  <div key={r.id} style={{ background: 'rgba(15,23,42,0.75)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '1rem 1.1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.6rem' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                          <span style={{ fontSize: '0.68rem', color: '#475569', fontWeight: 700 }}>{r.id}</span>
                          <span style={{ background: rel.bg, color: rel.text, padding: '2px 8px', borderRadius: 999, fontSize: '0.68rem', fontWeight: 800 }}>{rel.label}</span>
                          <span style={{ background: 'rgba(148,163,184,0.08)', color: '#94a3b8', padding: '2px 8px', borderRadius: 999, fontSize: '0.68rem', fontWeight: 700 }}>{CATEGORIA_LABEL[r.categoria]}</span>
                          {TIPO_DOC_ICON[r.tipo_documento]}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#e2e8f0', lineHeight: 1.4 }}>{r.titulo}</div>
                      </div>
                      <button onClick={() => setDescartados((s) => new Set([...s, r.id]))} style={{ flexShrink: 0, padding: '4px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.07)', background: 'transparent', color: '#475569', cursor: 'pointer', display: 'flex' }} title="Descartar">
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.6rem', fontSize: '0.72rem', color: '#64748b' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Building2 size={11} /> {r.entidad}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Globe size={11} /> {r.fuente}</span>
                      {r.fecha_detectada && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={11} /> {r.fecha_detectada}</span>}
                    </div>

                    {r.fragmento && (
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.55, marginBottom: '0.65rem', background: 'rgba(255,255,255,0.025)', borderRadius: 7, padding: '0.5rem 0.75rem', borderLeft: '2px solid rgba(96,165,250,0.2)' }}>
                        {r.fragmento.length > 220 ? r.fragmento.slice(0, 220) + '…' : r.fragmento}
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.65rem' }}>
                      <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 7, padding: '0.45rem 0.7rem' }}>
                        <div style={{ fontSize: '0.62rem', color: '#92400e', fontWeight: 700, marginBottom: 2 }}>RIESGO SUGERIDO</div>
                        <div style={{ fontSize: '0.75rem', color: '#fbbf24' }}>{r.riesgo_sugerido}</div>
                      </div>
                      <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 7, padding: '0.45rem 0.7rem' }}>
                        <div style={{ fontSize: '0.62rem', color: '#065f46', fontWeight: 700, marginBottom: 2 }}>CONTROL AFECTADO</div>
                        <div style={{ fontSize: '0.75rem', color: '#34d399' }}>{r.control_afectado}</div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.65rem' }}>
                      <div style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.12)', borderRadius: 7, padding: '0.45rem 0.7rem' }}>
                        <div style={{ fontSize: '0.62rem', color: '#1d4ed8', fontWeight: 700, marginBottom: 2 }}>RIESGO LINEAL</div>
                        <div style={{ fontSize: '0.72rem', color: '#93c5fd' }}>Impacto: {r.riesgo_lineal.impacto} · Prioridad: {r.riesgo_lineal.prioridad}</div>
                      </div>
                      <div style={{ background: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.12)', borderRadius: 7, padding: '0.45rem 0.7rem' }}>
                        <div style={{ fontSize: '0.62rem', color: '#6b21a8', fontWeight: 700, marginBottom: 2 }}>RIESGO ESTRUCTURAL</div>
                        <div style={{ fontSize: '0.72rem', color: '#c4b5fd' }}>{r.riesgo_estructural.descripcion}</div>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.62rem', color: '#334155', marginBottom: '0.65rem', fontFamily: 'monospace' }}>
                      SHA-256: {r.hash.slice(0, 32)}…
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 7, padding: '5px 10px', fontSize: '0.73rem', color: '#94a3b8', textDecoration: 'none', cursor: 'pointer' }}>
                        <ExternalLink size={11} /> Ver documento
                      </a>
                      <button onClick={() => setTextoAbierto(r.fragmento || 'Sin texto extraído.')} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 7, padding: '5px 10px', fontSize: '0.73rem', color: '#94a3b8', cursor: 'pointer' }}>
                        <FileText size={11} /> Ver texto extraído
                      </button>
                      <button style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 7, padding: '5px 10px', fontSize: '0.73rem', color: '#60a5fa', cursor: 'pointer' }}>
                        <Link2 size={11} /> Vincular a riesgo
                      </button>
                      <button onClick={() => setDescartados((s) => new Set([...s, r.id]))} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 7, padding: '5px 10px', fontSize: '0.73rem', color: '#f87171', cursor: 'pointer' }}>
                        <Trash2 size={11} /> Descartar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Vista Grilla */}
          {status === 'done' && visible.length > 0 && viewMode === 'grid' && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    {['Fecha', 'Entidad', 'Tipo de evento', 'Título', 'Fuente', 'Riesgo sugerido', 'Relevancia', 'Estado', 'Evidencia', 'Acción'].map((h) => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: '#64748b', fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.map((r) => {
                    const rel = RELEVANCIA_STYLE[r.relevancia];
                    return (
                      <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '8px 10px', color: '#94a3b8', whiteSpace: 'nowrap' }}>{r.fecha_detectada ?? '—'}</td>
                        <td style={{ padding: '8px 10px', color: '#cbd5e1', whiteSpace: 'nowrap' }}>{r.entidad}</td>
                        <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                          <span style={{ background: 'rgba(148,163,184,0.08)', color: '#94a3b8', padding: '2px 7px', borderRadius: 999, fontSize: '0.68rem', fontWeight: 700 }}>{CATEGORIA_LABEL[r.categoria]}</span>
                        </td>
                        <td style={{ padding: '8px 10px', color: '#e2e8f0', maxWidth: 220 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.titulo}>{r.titulo}</div>
                        </td>
                        <td style={{ padding: '8px 10px', color: '#64748b', whiteSpace: 'nowrap' }}>{r.fuente}</td>
                        <td style={{ padding: '8px 10px', color: '#fbbf24', maxWidth: 160 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.riesgo_sugerido}>{r.riesgo_sugerido}</div>
                        </td>
                        <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                          <span style={{ background: rel.bg, color: rel.text, padding: '2px 8px', borderRadius: 999, fontSize: '0.68rem', fontWeight: 800 }}>{rel.label}</span>
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <span style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399', padding: '2px 7px', borderRadius: 999, fontSize: '0.68rem', fontWeight: 700 }}>Capturado</span>
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          {TIPO_DOC_ICON[r.tipo_documento]}
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <div style={{ display: 'flex', gap: '0.3rem' }}>
                            <a href={r.url} target="_blank" rel="noopener noreferrer" title="Ver documento" style={{ padding: 4, borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#64748b', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                              <ExternalLink size={11} />
                            </a>
                            <button title="Vincular a riesgo" style={{ padding: 4, borderRadius: 6, border: '1px solid rgba(59,130,246,0.2)', background: 'rgba(59,130,246,0.08)', color: '#60a5fa', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                              <Link2 size={11} />
                            </button>
                            <button title="Descartar" onClick={() => setDescartados((s) => new Set([...s, r.id]))} style={{ padding: 4, borderRadius: 6, border: '1px solid rgba(239,68,68,0.18)', background: 'rgba(239,68,68,0.07)', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Texto extraído modal */}
      {textoAbierto !== null && (
        <>
          <div onClick={() => setTextoAbierto(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1100 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 1101, background: '#0f172a', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 14, padding: '1.5rem', width: 'min(90vw, 600px)', maxHeight: '70vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#e2e8f0' }}>Texto extraído</span>
              <button onClick={() => setTextoAbierto(null)} style={{ padding: 4, borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#64748b', cursor: 'pointer', display: 'flex' }}>
                <X size={14} />
              </button>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.7, margin: 0 }}>{textoAbierto}</p>
          </div>
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
