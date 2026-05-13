'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Shield, ClipboardCheck, FileText, AlertTriangle, Calendar, X } from 'lucide-react';
import {
  RisksSection, ControlsSection, TestsSection, EvidencesSection,
} from './components/MonitoringSection';
import type { RiskRow, ControlRow, TestRow, EvidenceRow } from '@/modules/monitoring/domain/types/MonitoringDateTypes';

interface Props {
  risks:     RiskRow[];
  controls:  ControlRow[];
  tests:     TestRow[];
  evidences: EvidenceRow[];
}

const STAT_CARD_STYLE: React.CSSProperties = {
  background: 'rgba(13,17,38,0.72)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 10,
  backdropFilter: 'blur(12px)',
  padding: '14px 18px',
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  cursor: 'pointer',
  transition: 'border-color 0.15s',
  textDecoration: 'none',
};

type SectionId = 'run_ra_risks' | 'run_ra_controls' | 'run_ra_control_tests' | 'run_ra_evidence';
type SectionFilter = SectionId | 'all';

export function MonitoringDatesClient({ risks, controls, tests, evidences }: Props) {
  const [sectionFilter, setSectionFilter] = useState<SectionFilter>('all');

  const STATS = [
    { id: 'run_ra_risks'         as SectionId, label: 'Riesgos',            count: risks.length,     icon: <AlertTriangle size={20} />, color: '#6366f1' },
    { id: 'run_ra_controls'      as SectionId, label: 'Controles',          count: controls.length,  icon: <Shield size={20} />,        color: '#0891b2' },
    { id: 'run_ra_control_tests' as SectionId, label: 'Pruebas de Control', count: tests.length,     icon: <ClipboardCheck size={20} />,color: '#059669' },
    { id: 'run_ra_evidence'      as SectionId, label: 'Evidencias',         count: evidences.length, icon: <FileText size={20} />,      color: '#b45309' },
  ];

  const show = (id: SectionId) => sectionFilter === 'all' || sectionFilter === id;

  return (
    <div style={{ padding: '2rem', minHeight: '100vh', color: '#f8fafc' }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        gap: 16, marginBottom: '1.5rem', flexWrap: 'wrap',
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: 12, padding: '14px 18px',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 11,
            background: 'rgba(99,102,241,0.15)',
            border: '1px solid rgba(99,102,241,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Calendar size={20} style={{ color: '#818cf8' }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: '#f1f5f9' }}>
              Fechas de Monitoreo
            </h1>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
              Actualiza manualmente las fechas de monitoreo de riesgos, controles, pruebas de control y evidencias.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            background: 'rgba(180,83,9,0.10)',
            border: '1px solid rgba(180,83,9,0.28)',
            borderRadius: 10, padding: '10px 14px',
            maxWidth: 360,
          }}>
            <AlertTriangle size={15} style={{ color: '#ca8a04', flexShrink: 0, marginTop: 1 }} />
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#a16207', lineHeight: 1.5 }}>
              Esta actualización manual será respetada por el sistema y no será recalculada en esta operación.
            </p>
          </div>

          <Link
            href="/gestion/dashboard_monitoreo"
            title="Volver al dashboard"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.09)',
              color: '#64748b',
              textDecoration: 'none',
              transition: 'all 0.15s',
            }}
          >
            <X size={15} />
          </Link>
        </div>
      </div>

      {/* ── Stat cards (section filters) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: '1.5rem' }}>
        {STATS.map((s) => (
          <div
            key={s.id}
            onClick={() => setSectionFilter(sectionFilter === s.id ? 'all' : s.id)}
            style={{
              ...STAT_CARD_STYLE,
              borderColor: sectionFilter === s.id ? `${s.color}60` : 'rgba(255,255,255,0.07)',
              background:   sectionFilter === s.id ? `${s.color}12` : 'rgba(13,17,38,0.72)',
            }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 9, flexShrink: 0,
              background: `${s.color}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: s.color,
            }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#e2e8f0', lineHeight: 1 }}>{s.count}</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>{s.label}</div>
            </div>
            <div style={{ marginLeft: 'auto', fontSize: '0.65rem', color: '#334155' }}>
              {sectionFilter === s.id ? '▲ activo' : '›'}
            </div>
          </div>
        ))}
      </div>

      {/* ── Leyenda ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '8px 14px',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: 8,
        marginBottom: '1.25rem',
        flexWrap: 'wrap',
      }}>
        {[
          { dot: '#ca8a04', label: 'Próximo: fecha dentro de los próximos 30 días' },
          { dot: '#dc2626', label: 'Vencido: fecha menor a hoy' },
          { dot: '#6b7280', label: 'Sin fecha: no hay fecha definida' },
        ].map((l) => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.dot }} />
            <span style={{ fontSize: '0.72rem', color: '#475569' }}>{l.label}</span>
          </div>
        ))}
        <div style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#334155' }}>
          Fecha y hora actual: {new Date().toLocaleString('es-DO', { dateStyle: 'short', timeStyle: 'short' })}
        </div>
      </div>

      {/* ── Sections ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {show('run_ra_risks')         && <RisksSection    rows={risks}     icon={<AlertTriangle size={16} />} />}
        {show('run_ra_controls')      && <ControlsSection rows={controls}  icon={<Shield size={16} />} />}
        {show('run_ra_control_tests') && <TestsSection    rows={tests}     icon={<ClipboardCheck size={16} />} />}
        {show('run_ra_evidence')      && <EvidencesSection rows={evidences} icon={<FileText size={16} />} />}
      </div>

      {sectionFilter !== 'all' && (
        <style>{`div[id^="section-"] { grid-column: 1 / -1 !important; }`}</style>
      )}
    </div>
  );
}
