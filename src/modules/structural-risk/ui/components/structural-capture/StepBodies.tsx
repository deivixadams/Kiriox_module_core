'use client';

import React from 'react';
import { Pencil, Trash2, X } from 'lucide-react';
import { SURFACE } from './constants';
import type { CatalogOption, DependencyRow, PersonOption, SharedResourceRow, StructuralStep } from './types';
import type { DependencyDraft } from './DependencyCaptureCard';

export function DependenciesStep({ dependencies }: { dependencies: DependencyRow[] }) {
  return (
    <section style={{ ...SURFACE, padding: '0.9rem' }}>
      <h3 style={{ margin: '0 0 0.6rem', color: '#e2e8f0', fontSize: '0.9rem' }}>Dependencias Registradas</h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(71,85,105,0.35)' }}>
              {['Actividad', 'Dep. actividad', 'Recurso', 'Efecto falla', 'Fortaleza', 'Alternativa'].map((h) => (
                <th key={h} style={{ textAlign: 'left', color: '#93c5fd', fontSize: '0.68rem', padding: '0.5rem', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dependencies.length === 0 && (
              <tr><td colSpan={6} style={{ padding: '0.7rem', color: '#64748b', fontSize: '0.75rem' }}>No hay dependencias para las actividades seleccionadas.</td></tr>
            )}
            {dependencies.map((d) => (
              <tr key={d.id} style={{ borderBottom: '1px solid rgba(30,41,59,0.65)' }}>
                <td style={{ padding: '0.5rem', color: '#e2e8f0', fontSize: '0.75rem' }}>{d.activity_name}</td>
                <td style={{ padding: '0.5rem', color: '#cbd5e1', fontSize: '0.73rem' }}>{d.dependency_activity_name || 'N/A'}</td>
                <td style={{ padding: '0.5rem', color: '#cbd5e1', fontSize: '0.73rem' }}>{d.dependency_resource_name}</td>
                <td style={{ padding: '0.5rem', color: '#cbd5e1', fontSize: '0.73rem' }}>{d.failure_effect_name}</td>
                <td style={{ padding: '0.5rem', color: '#cbd5e1', fontSize: '0.73rem' }}>{d.dependency_strength_name}</td>
                <td style={{ padding: '0.5rem', color: '#cbd5e1', fontSize: '0.73rem' }}>{d.alternative_level_name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function DependenciesGridStep({
  dependencies,
  originActivities,
  dependencyResources,
  failureEffects,
  dependencyStrengths,
  alternativeLevels,
  people,
  draft,
  dependencyCompanyId,
  dependencyElementId,
  editingDependencyId,
  saving,
  onDraftChange,
  onSave,
  onEditDependency,
  onCancelEditDependency,
  onRemoveDependency,
}: {
  dependencies: DependencyRow[];
  originActivities: Array<{ id: string; name: string }>;
  dependencyResources: CatalogOption[];
  failureEffects: CatalogOption[];
  dependencyStrengths: CatalogOption[];
  alternativeLevels: CatalogOption[];
  people: PersonOption[];
  draft: DependencyDraft;
  dependencyCompanyId?: string;
  dependencyElementId?: string;
  editingDependencyId: string | null;
  saving: boolean;
  onDraftChange: (next: DependencyDraft) => void;
  onSave: () => void;
  onEditDependency: (dependencyId: string) => void;
  onCancelEditDependency: () => void;
  onRemoveDependency: (dependencyId: string) => void;
}) {
  const shellStyle: React.CSSProperties = {
    border: '1px solid rgba(59,130,246,0.24)',
    borderRadius: 16,
    background: 'linear-gradient(180deg, rgba(8,20,54,0.94) 0%, rgba(6,16,42,0.94) 100%)',
    overflow: 'hidden',
    boxShadow: '0 14px 34px rgba(2,8,23,0.35)',
  };

  const headCellStyle: React.CSSProperties = {
    textAlign: 'left',
    color: '#6f8fbf',
    fontSize: '0.66rem',
    padding: '0.65rem 0.6rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontWeight: 700,
    whiteSpace: 'nowrap',
  };

  const dataCellStyle: React.CSSProperties = {
    padding: '0.5rem 0.45rem',
    borderBottom: '1px solid rgba(30,41,59,0.65)',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(12,29,68,0.82)',
    border: '1px solid rgba(88,124,189,0.35)',
    borderRadius: 10,
    color: '#e2e8f0',
    padding: '0.5rem 0.6rem',
    fontSize: '0.75rem',
    outline: 'none',
  };

  return (
    <section style={{ ...SURFACE, padding: '0.9rem' }}>
      <div style={{ marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: '#3b82f6', display: 'inline-block' }} />
        <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '0.94rem', fontWeight: 700 }}>Dependencias · Registro en grilla</h3>
      </div>
      <div style={shellStyle}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(71,85,105,0.35)', background: 'rgba(10,24,60,0.92)' }}>
              <th style={headCellStyle}>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window === 'undefined') return;
                    const width = 1100;
                    const height = 760;
                    const left = Math.max(0, Math.floor((window.screen.width - width) / 2));
                    const top = Math.max(0, Math.floor((window.screen.height - height) / 2));
                    const params = new URLSearchParams();
                    if (dependencyCompanyId) params.set('company_id', dependencyCompanyId);
                    if (dependencyElementId) params.set('element_id', dependencyElementId);
                    const href = `/gobierno/actividades-clave/nuevo${params.toString() ? `?${params.toString()}` : ''}`;
                    window.open(
                      href,
                      'kiriox-actividad-clave',
                      `popup=yes,width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`,
                    );
                  }}
                  style={{ color: '#93c5fd', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', textDecoration: 'underline', fontSize: '0.66rem', fontWeight: 700 }}
                >
                  Depende de Y
                </button>
              </th>
              {['Recurso', 'Efecto falla', 'Fuerza', 'Alternativa', 'Persona', 'Acción'].map((h) => {
                const extraStyle: React.CSSProperties = {};
                if (h === 'Recurso') extraStyle.minWidth = '300px';
                if (h === 'Persona') extraStyle.width = '120px';
                return <th key={h} style={{ ...headCellStyle, ...extraStyle }}>{h}</th>;
              })}
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid rgba(30,41,59,0.65)', background: 'rgba(9,26,64,0.74)' }}>
              <td style={dataCellStyle}>
                <select value={draft.dependencyActivityId} onChange={(e) => onDraftChange({ ...draft, dependencyActivityId: e.target.value })} style={inputStyle}>
                  <option value="">No aplica</option>
                  {originActivities.filter((a) => a.id !== draft.activityId).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </td>
              <td style={{ ...dataCellStyle, minWidth: '300px' }}>
                <select value={draft.dependencyResourceId} onChange={(e) => onDraftChange({ ...draft, dependencyResourceId: e.target.value })} style={inputStyle}>
                  <option value="">Seleccione</option>
                  {dependencyResources.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </td>
              <td style={dataCellStyle}>
                <select value={draft.failureEffectId} onChange={(e) => onDraftChange({ ...draft, failureEffectId: e.target.value })} style={inputStyle}>
                  <option value="">Seleccione</option>
                  {failureEffects.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </td>
              <td style={dataCellStyle}>
                <select value={draft.dependencyStrengthId} onChange={(e) => onDraftChange({ ...draft, dependencyStrengthId: e.target.value })} style={inputStyle}>
                  <option value="">Seleccione</option>
                  {dependencyStrengths.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </td>
              <td style={dataCellStyle}>
                <select value={draft.alternativeLevelId} onChange={(e) => onDraftChange({ ...draft, alternativeLevelId: e.target.value })} style={inputStyle}>
                  <option value="">Seleccione</option>
                  {alternativeLevels.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </td>
              <td style={{ ...dataCellStyle, width: '120px' }}>
                <select value={draft.dependencyPersonId} onChange={(e) => onDraftChange({ ...draft, dependencyPersonId: e.target.value })} style={inputStyle}>
                  <option value="">No aplica</option>
                  {people.map((p) => <option key={p.id} value={p.id}>{p.full_name || p.email || p.id}</option>)}
                </select>
              </td>
              <td style={dataCellStyle}>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button
                    type="button"
                    onClick={onSave}
                    disabled={saving || !draft.activityId || !draft.dependencyResourceId || !draft.failureEffectId || !draft.dependencyStrengthId || !draft.alternativeLevelId}
                    style={{
                      borderRadius: 10,
                      border: '1px solid rgba(96,165,250,0.45)',
                      background: 'linear-gradient(135deg, rgba(37,99,235,0.28), rgba(59,130,246,0.22))',
                      color: '#dbeafe',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '0.46rem 0.72rem',
                      cursor: 'pointer',
                    }}
                  >
                    {saving ? 'Guardando...' : editingDependencyId ? 'Actualizar' : 'Agregar'}
                  </button>
                  {editingDependencyId && (
                    <button
                      type="button"
                      onClick={onCancelEditDependency}
                      style={{
                        borderRadius: 10,
                        border: '1px solid rgba(148,163,184,0.38)',
                        background: 'rgba(15,23,42,0.5)',
                        color: '#cbd5e1',
                        padding: '0.44rem 0.58rem',
                        cursor: 'pointer',
                      }}
                      aria-label="Cancelar edición"
                      title="Cancelar edición"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      </div>

      <div style={{ marginTop: '0.75rem', ...shellStyle }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(71,85,105,0.35)', background: 'rgba(10,24,60,0.92)' }}>
              {['Actividad X', 'Dep. actividad Y', 'Recurso', 'Efecto falla', 'Fortaleza', 'Alternativa', 'Persona', 'Acciones'].map((h) => {
                const extraStyle: React.CSSProperties = {};
                if (h === 'Recurso') extraStyle.minWidth = '280px';
                if (h === 'Persona') extraStyle.width = '120px';
                return <th key={h} style={{ ...headCellStyle, ...extraStyle }}>{h}</th>;
              })}
            </tr>
          </thead>
          <tbody>
            {dependencies.length === 0 && (
              <tr><td colSpan={8} style={{ padding: '0.7rem', color: '#64748b', fontSize: '0.75rem' }}>No hay dependencias registradas.</td></tr>
            )}
            {dependencies.map((d) => (
              <tr key={d.id} style={{ borderBottom: '1px solid rgba(30,41,59,0.65)' }}>
                <td style={{ padding: '0.5rem', color: '#e2e8f0', fontSize: '0.75rem' }}>{d.activity_name}</td>
                <td style={{ padding: '0.5rem', color: '#cbd5e1', fontSize: '0.73rem' }}>{d.dependency_activity_name || 'N/A'}</td>
                <td style={{ padding: '0.5rem', color: '#cbd5e1', fontSize: '0.73rem' }}>{d.dependency_resource_name}</td>
                <td style={{ padding: '0.5rem', color: '#cbd5e1', fontSize: '0.73rem' }}>{d.failure_effect_name}</td>
                <td style={{ padding: '0.5rem', color: '#cbd5e1', fontSize: '0.73rem' }}>{d.dependency_strength_name}</td>
                <td style={{ padding: '0.5rem', color: '#cbd5e1', fontSize: '0.73rem' }}>{d.alternative_level_name}</td>
                <td style={{ padding: '0.5rem', color: '#cbd5e1', fontSize: '0.73rem' }}>{d.dependency_person_name || 'N/A'}</td>
                <td style={{ padding: '0.42rem 0.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      type="button"
                      onClick={() => onEditDependency(d.id)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        border: '1px solid rgba(96,165,250,0.35)',
                        background: 'rgba(59,130,246,0.14)',
                        color: '#93c5fd',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                      aria-label="Editar dependencia"
                      title="Editar"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveDependency(d.id)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        border: '1px solid rgba(248,113,113,0.35)',
                        background: 'rgba(239,68,68,0.14)',
                        color: '#fca5a5',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                      aria-label="Remover dependencia"
                      title="Remover"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </section>
  );
}

export function SharedResourcesGridStep({
  sharedResources,
  originActivities,
  dependencyResources,
  failureEffects,
  dependencyStrengths,
  alternativeLevels,
  criticalities,
  people,
  draft,
  editingResourceId,
  saving,
  onDraftChange,
  onSave,
  onEdit,
  onCancelEdit,
  onRemove,
}: {
  sharedResources: SharedResourceRow[];
  originActivities: Array<{ id: string; name: string }>;
  dependencyResources: CatalogOption[];
  failureEffects: CatalogOption[];
  dependencyStrengths: CatalogOption[];
  alternativeLevels: CatalogOption[];
  criticalities: Array<{ code: string; label: string }>;
  people: PersonOption[];
  draft: {
    activityId: string;
    resourceName: string;
    resourceTypeId: string;
    ownerId: string;
    failureEffectId: string;
    dependencyStrengthId: string;
    alternativeLevelId: string;
    criticalityCode: string;
  };
  editingResourceId: string | null;
  saving: boolean;
  onDraftChange: (next: {
    activityId: string;
    resourceName: string;
    resourceTypeId: string;
    ownerId: string;
    failureEffectId: string;
    dependencyStrengthId: string;
    alternativeLevelId: string;
    criticalityCode: string;
  }) => void;
  onSave: () => void;
  onEdit: (resourceId: string) => void;
  onCancelEdit: () => void;
  onRemove: (activityId: string, resourceId: string) => void;
}) {
  const shellStyle: React.CSSProperties = {
    border: '1px solid rgba(59,130,246,0.24)',
    borderRadius: 16,
    background: 'linear-gradient(180deg, rgba(8,20,54,0.94) 0%, rgba(6,16,42,0.94) 100%)',
    overflow: 'hidden',
    boxShadow: '0 14px 34px rgba(2,8,23,0.35)',
  };
  const headCellStyle: React.CSSProperties = {
    textAlign: 'left',
    color: '#6f8fbf',
    fontSize: '0.66rem',
    padding: '0.65rem 0.6rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontWeight: 700,
    whiteSpace: 'nowrap',
  };
  const dataCellStyle: React.CSSProperties = { padding: '0.5rem 0.45rem', borderBottom: '1px solid rgba(30,41,59,0.65)' };
  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(12,29,68,0.82)',
    border: '1px solid rgba(88,124,189,0.35)',
    borderRadius: 10,
    color: '#e2e8f0',
    padding: '0.5rem 0.6rem',
    fontSize: '0.75rem',
    outline: 'none',
  };

  return (
    <section style={{ ...SURFACE, padding: '0.9rem' }}>
      <div style={{ marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: '#22c55e', display: 'inline-block' }} />
        <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '0.94rem', fontWeight: 700 }}>Compartidos · Registro en grilla</h3>
      </div>
      <div style={shellStyle}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1250 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(71,85,105,0.35)', background: 'rgba(10,24,60,0.92)' }}>
                {['Recurso', 'Tipo recurso', 'Responsable', 'Efecto falla', 'Fuerza dep.', 'Alternativa', 'Criticidad', 'Acción'].map((h) => (
                  <th key={h} style={headCellStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(30,41,59,0.65)', background: 'rgba(9,26,64,0.74)' }}>
                <td style={{ ...dataCellStyle, minWidth: 320 }}><input value={draft.resourceName} onChange={(e) => onDraftChange({ ...draft, resourceName: e.target.value })} style={inputStyle} /></td>
                <td style={dataCellStyle}>
                  <select value={draft.resourceTypeId} onChange={(e) => onDraftChange({ ...draft, resourceTypeId: e.target.value })} style={inputStyle}>
                    <option value="">Seleccione</option>
                    {dependencyResources.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </td>
                <td style={dataCellStyle}>
                  <select value={draft.ownerId} onChange={(e) => onDraftChange({ ...draft, ownerId: e.target.value })} style={inputStyle}>
                    <option value="">No aplica</option>
                    {people.map((p) => <option key={p.id} value={p.id}>{p.full_name || p.email || p.id}</option>)}
                  </select>
                </td>
                <td style={dataCellStyle}>
                  <select value={draft.failureEffectId} onChange={(e) => onDraftChange({ ...draft, failureEffectId: e.target.value })} style={inputStyle}>
                    <option value="">Seleccione</option>
                    {failureEffects.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </td>
                <td style={dataCellStyle}>
                  <select value={draft.dependencyStrengthId} onChange={(e) => onDraftChange({ ...draft, dependencyStrengthId: e.target.value })} style={inputStyle}>
                    <option value="">Seleccione</option>
                    {dependencyStrengths.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </td>
                <td style={dataCellStyle}>
                  <select value={draft.alternativeLevelId} onChange={(e) => onDraftChange({ ...draft, alternativeLevelId: e.target.value })} style={inputStyle}>
                    <option value="">Seleccione</option>
                    {alternativeLevels.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </td>
                <td style={dataCellStyle}>
                  <select value={draft.criticalityCode} onChange={(e) => onDraftChange({ ...draft, criticalityCode: e.target.value })} style={inputStyle}>
                    <option value="">Seleccione</option>
                    {criticalities.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
                  </select>
                </td>
                <td style={dataCellStyle}>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button type="button" onClick={onSave} disabled={saving || !draft.activityId || !draft.resourceName || !draft.resourceTypeId || !draft.failureEffectId || !draft.dependencyStrengthId || !draft.alternativeLevelId || !draft.criticalityCode} style={{ borderRadius: 10, border: '1px solid rgba(96,165,250,0.45)', background: 'linear-gradient(135deg, rgba(37,99,235,0.28), rgba(59,130,246,0.22))', color: '#dbeafe', fontSize: '0.72rem', fontWeight: 700, padding: '0.46rem 0.72rem', cursor: 'pointer' }}>
                      {saving ? 'Guardando...' : editingResourceId ? 'Actualizar' : 'Agregar'}
                    </button>
                    {editingResourceId && (
                      <button type="button" onClick={onCancelEdit} style={{ borderRadius: 10, border: '1px solid rgba(148,163,184,0.38)', background: 'rgba(15,23,42,0.5)', color: '#cbd5e1', padding: '0.44rem 0.58rem', cursor: 'pointer' }}><X size={14} /></button>
                    )}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: '0.75rem', ...shellStyle }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1100 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(71,85,105,0.35)', background: 'rgba(10,24,60,0.92)' }}>
                {['Actividad', 'Recurso', 'Tipo', 'Responsable', 'Efecto falla', 'Fuerza', 'Alternativa', 'Criticidad', 'Acciones'].map((h) => (
                  <th key={h} style={headCellStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sharedResources.length === 0 && (
                <tr><td colSpan={9} style={{ padding: '0.7rem', color: '#64748b', fontSize: '0.75rem' }}>No hay recursos compartidos registrados.</td></tr>
              )}
              {sharedResources.map((r) => (
                <tr key={`${r.activity_id}-${r.resource_id}`} style={{ borderBottom: '1px solid rgba(30,41,59,0.65)' }}>
                  <td style={{ padding: '0.5rem', color: '#e2e8f0', fontSize: '0.75rem' }}>{r.activity_name}</td>
                  <td style={{ padding: '0.5rem', color: '#cbd5e1', fontSize: '0.73rem' }}>{r.resource_name}</td>
                  <td style={{ padding: '0.5rem', color: '#cbd5e1', fontSize: '0.73rem' }}>{r.resource_type_name || r.resource_type_code}</td>
                  <td style={{ padding: '0.5rem', color: '#cbd5e1', fontSize: '0.73rem' }}>{r.owner_name || 'N/A'}</td>
                  <td style={{ padding: '0.5rem', color: '#cbd5e1', fontSize: '0.73rem' }}>{r.failure_effect_name || r.failure_effect_code}</td>
                  <td style={{ padding: '0.5rem', color: '#cbd5e1', fontSize: '0.73rem' }}>{r.dependency_strength_name || r.dependency_strength_code}</td>
                  <td style={{ padding: '0.5rem', color: '#cbd5e1', fontSize: '0.73rem' }}>{r.alternative_level_name || r.alternative_level_code}</td>
                  <td style={{ padding: '0.5rem', color: '#cbd5e1', fontSize: '0.73rem' }}>{r.criticality_label || r.criticality_code}</td>
                  <td style={{ padding: '0.42rem 0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button type="button" onClick={() => onEdit(r.resource_id)} style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid rgba(96,165,250,0.35)', background: 'rgba(59,130,246,0.14)', color: '#93c5fd', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Pencil size={14} /></button>
                      <button type="button" onClick={() => onRemove(r.activity_id, r.resource_id)} style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid rgba(248,113,113,0.35)', background: 'rgba(239,68,68,0.14)', color: '#fca5a5', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export function PlaceholderStep({ label }: { label: string }) {
  return (
    <section style={{ ...SURFACE, padding: '0.9rem' }}>
      <div style={{ border: '1px dashed rgba(148,163,184,0.35)', borderRadius: 10, padding: '1rem', color: '#94a3b8', fontSize: '0.78rem' }}>
        Base del paso <strong>{label}</strong> preparada.
        En esta fase solo se habilita captura de run + actividades + lectura de dependencias para preparación de grafo.
      </div>
    </section>
  );
}

export function renderStepBody(
  step: StructuralStep['key'],
  stepLabel: string,
  dependencies: DependencyRow[],
) {
  if (step === 'impacto') return null;
  if (step === 'dependencias') return <DependenciesStep dependencies={dependencies} />;
  return <PlaceholderStep label={stepLabel} />;
}
