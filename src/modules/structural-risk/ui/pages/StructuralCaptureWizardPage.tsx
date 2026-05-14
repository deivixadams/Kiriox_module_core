'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { STEPS } from '../components/structural-capture/constants';
import { StepTabs } from '../components/structural-capture/StepTabs';
import { WizardHeader } from '../components/structural-capture/WizardHeader';
import { RunConfigPanel, RunLifecyclePanel } from '../components/structural-capture/RunPanels';
import { DependenciesGridStep, SharedResourcesGridStep, renderStepBody } from '../components/structural-capture/StepBodies';
import { useStructuralCaptureWizard } from '../components/structural-capture/useStructuralCaptureWizard';
import { DependencyCaptureCard } from '../components/structural-capture/DependencyCaptureCard';
import { ControlEvaluationPanel } from '../components/structural-capture/ControlEvaluationPanel';

const EVIDENCE_QUESTIONS = [
  '¿Existe evidencia objetiva de que el control fue ejecutado?',
  '¿La evidencia está vigente para el periodo evaluado o el run actual?',
  '¿La evidencia es suficiente para demostrar que el control operó correctamente?',
  '¿La evidencia es trazable hasta el control, prueba, responsable, fecha y fuente?',
  '¿La evidencia fue generada automáticamente por el sistema o depende de carga/manualidad humana?',
];

export default function StructuralCaptureWizardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRunSaId = searchParams.get('runSaId') ?? undefined;
  const [activeStep, setActiveStep] = useState<(typeof STEPS)[number]['key']>('impacto');
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const vm = useStructuralCaptureWizard(initialRunSaId);
  const stepLabel = STEPS.find((s) => s.key === activeStep)?.label ?? 'Paso';

  const handleSave = () => {
    if (activeStep === 'dependencias') { void vm.saveDependency(); return; }
    if (activeStep === 'compartidos')  { void vm.saveSharedResource(); return; }
    if (activeStep === 'riesgo')       { void vm.saveRiskCascade({ resetDraft: true }); return; }
    void vm.saveRun();
  };

  async function handleSaveAndContinue() {
    setShowAnalysisModal(false);
    void vm.saveRun();
  }

  async function handleSaveAndClose() {
    setShowAnalysisModal(false);
    const ok = await vm.saveRunForStep(activeStep);
    if (ok) router.push('/gestion/dashboard_riesgo_estructural');
  }

  async function handleSaveAndComplete() {
    setShowAnalysisModal(false);
    const ok = await vm.completeRun();
    if (ok) router.push('/gestion/dashboard_riesgo_estructural');
  }

  async function handleSaveCompleteAndAnalysis() {
    setShowAnalysisModal(false);
    const ok = await vm.completeRun();
    if (ok) {
      const params = vm.runId ? `?runSaId=${encodeURIComponent(vm.runId)}` : '';
      router.push(`/gestion/wizard_captura_estructural/analisis_estructural${params}`);
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0d1634 0%, #080f23 100%)', padding: '1.2rem 1.5rem 2rem' }}>
      <WizardHeader
        steps={STEPS}
        activeStep={activeStep}
        onChangeStep={setActiveStep}
        onSave={handleSave}
        onClose={() => void handleSaveAndClose()}
        saving={vm.saving}
        hideSave={activeStep === 'evidencia'}
        currentRun={vm.currentRun}
        extraActions={activeStep === 'evidencia' ? (
          <button
            type="button"
            onClick={() => setShowAnalysisModal(true)}
            style={{
              borderRadius: 10,
              border: '1px solid rgba(168,85,247,0.45)',
              background: 'linear-gradient(135deg, rgba(88,28,135,0.30), rgba(109,40,217,0.22))',
              color: '#e9d5ff',
              padding: '0.5rem 0.9rem',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
              letterSpacing: '0.01em',
            }}
          >
            Ejecutar Análisis Estructural
          </button>
        ) : undefined}
      />

      <StepTabs steps={STEPS} activeStep={activeStep} onChange={setActiveStep} />

      {vm.error && (
        <div style={{ marginBottom: '0.8rem', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)', borderRadius: 10, color: '#fca5a5', padding: '0.6rem 0.8rem', fontSize: '0.78rem' }}>
          {vm.error}
        </div>
      )}
      {vm.loading && <div style={{ color: '#94a3b8', fontSize: '0.82rem' }}>Cargando base del wizard estructural...</div>}

      {!vm.loading && vm.wizard && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: '0.8rem' }}>
          {(() => {
            const chosenActivities = vm.activities.filter(a => vm.selectedActivities.includes(a.id));
            const selectedActivity =
              vm.activities.find((a) => a.id === vm.dependencyDraft.activityId) ||
              chosenActivities[0] ||
              vm.activities[0];
            const showPersistentContext = ['compartidos', 'riesgo', 'control', 'evidencia'].includes(activeStep);
            return (
              <>
          {showPersistentContext && selectedActivity && (
            <div style={{
              gridColumn: '1 / -1',
              border: '1px solid rgba(59,130,246,0.28)',
              borderRadius: 14,
              background: 'linear-gradient(180deg, rgba(8,20,54,0.94) 0%, rgba(6,16,42,0.94) 100%)',
              padding: '0.85rem 0.95rem',
              display: 'grid',
              gridTemplateColumns: '0.33fr 0.67fr',
              gap: '0.8rem',
            }}>
              <div>
                <div style={{ color: '#93c5fd', fontSize: '0.72rem', marginBottom: '0.35rem', fontWeight: 700 }}>Elemento (Proceso)</div>
                <div style={{
                  border: '1px solid rgba(88,124,189,0.35)',
                  borderRadius: 10,
                  background: 'rgba(12,29,68,0.82)',
                  color: '#cbd5e1',
                  padding: '0.58rem 0.7rem',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                }}>
                  {selectedActivity.element_name || 'N/A'}
                </div>
              </div>
              <div>
                <div style={{ color: '#93c5fd', fontSize: '0.72rem', marginBottom: '0.35rem', fontWeight: 700 }}>
                  Actividad ({chosenActivities.length || 1})
                </div>
                <div style={{
                  border: '1px solid rgba(59,130,246,0.5)',
                  borderRadius: 10,
                  background: 'rgba(12,29,68,0.82)',
                  color: '#e2e8f0',
                  padding: '0.55rem 0.75rem',
                }}>
                  <div style={{ fontSize: '0.96rem', fontWeight: 700 }}>{selectedActivity.name}</div>
                  <div style={{ marginTop: '0.2rem', color: '#93a8cc', fontSize: '0.78rem' }}>
                    {selectedActivity.description || 'Sin descripción registrada.'}
                  </div>
                  <div style={{ marginTop: '0.38rem', borderTop: '1px solid rgba(71,85,105,0.35)', paddingTop: '0.38rem', color: '#7ea6de', fontSize: '0.74rem', fontWeight: 700 }}>
                    RESPONSABLE <span style={{ color: '#64748b', margin: '0 0.28rem' }}>•</span> {selectedActivity.owner_name || selectedActivity.owner_email || 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeStep === 'dependencias' && (
            <>
              <div style={{ gridColumn: '1 / -1' }}>
                <RunLifecyclePanel
                  activities={chosenActivities}
                  horizontal
                  selectedId={vm.dependencyDraft.activityId}
                  onSelect={(id) => vm.setDependencyDraft({ ...vm.dependencyDraft, activityId: id })}
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <DependenciesGridStep
                  dependencies={vm.dependencies}
                  originActivities={vm.activities.map((a) => ({ id: a.id, name: a.name }))}
                  dependencyResources={vm.dependencyCatalogs.dependencyResources}
                  failureEffects={vm.dependencyCatalogs.failureEffects}
                  dependencyStrengths={vm.dependencyCatalogs.dependencyStrengths}
                  alternativeLevels={vm.dependencyCatalogs.alternativeLevels}
                  people={vm.people}
                  draft={vm.dependencyDraft}
                  dependencyCompanyId={selectedActivity?.company_id}
                  dependencyElementId={selectedActivity?.element_id}
                  editingDependencyId={vm.editingDependencyId}
                  saving={vm.saving}
                  onDraftChange={vm.setDependencyDraft}
                  onSave={vm.saveDependency}
                  onEditDependency={vm.beginEditDependency}
                  onCancelEditDependency={vm.cancelEditDependency}
                  onRemoveDependency={vm.removeDependency}
                />
              </div>
            </>
          )}

          {activeStep === 'impacto' && (
            <>
              <RunConfigPanel
                wizard={vm.wizard}
                title={vm.title}
                scopeType={vm.scopeType}
                methodology={vm.methodology}
                setTitle={vm.setTitle}
                setScopeType={vm.setScopeType}
                setMethodology={vm.setMethodology}
              />
              <RunLifecyclePanel 
                activities={chosenActivities} 
                selectedId={vm.dependencyDraft.activityId}
                onSelect={(id) => vm.setDependencyDraft({ ...vm.dependencyDraft, activityId: id })}
              />
              <div style={{ gridColumn: '1 / -1' }}>
                <DependencyCaptureCard
                  originActivities={chosenActivities}
                  impacts={vm.dependencyCatalogs.impacts}
                  criticalities={vm.dependencyCatalogs.criticalities}
                  value={vm.dependencyDraft}
                  onChange={vm.setDependencyDraft}
                />
              </div>
            </>
          )}

          {activeStep === 'compartidos' && (
            <div style={{ gridColumn: '1 / -1' }}>
              <SharedResourcesGridStep
                sharedResources={vm.sharedResources}
                originActivities={chosenActivities.map((a) => ({ id: a.id, name: a.name }))}
                dependencyResources={vm.dependencyCatalogs.dependencyResources}
                failureEffects={vm.dependencyCatalogs.failureEffects}
                dependencyStrengths={vm.dependencyCatalogs.dependencyStrengths}
                alternativeLevels={vm.dependencyCatalogs.alternativeLevels}
                criticalities={vm.dependencyCatalogs.criticalities.map((c) => ({ code: c.code, label: c.label }))}
                people={vm.people}
                draft={vm.sharedResourceDraft}
                editingResourceId={vm.editingSharedResourceId}
                saving={vm.saving}
                onDraftChange={vm.setSharedResourceDraft}
                onSave={vm.saveSharedResource}
                onEdit={vm.beginEditSharedResource}
                onCancelEdit={vm.cancelEditSharedResource}
                onRemove={vm.removeSharedResource}
              />
            </div>
          )}

          {activeStep === 'riesgo' && (
            <div style={{ gridColumn: '1 / -1', display: 'grid', gap: '0.8rem' }}>
              <section style={{
                border: '1px solid rgba(59,130,246,0.24)',
                borderRadius: 14,
                background: 'linear-gradient(180deg, rgba(8,20,54,0.94) 0%, rgba(6,16,42,0.94) 100%)',
                padding: '0.95rem',
              }}>
                <div style={{ marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: '#38bdf8', display: 'inline-block' }} />
                  <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '0.94rem', fontWeight: 700 }}>Riesgo lineal</h3>
                </div>
                {(() => {
                  const risks = vm.linearRiskContext.filter((r) => r.activity_id === selectedActivity?.id);
                  if (risks.length === 0) {
                    return <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>No se encontró riesgo lineal asociado a la actividad seleccionada.</div>;
                  }
                  return (
                    <div style={{ overflowX: 'auto', marginBottom: '0.8rem' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980 }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(71,85,105,0.35)', background: 'rgba(10,24,60,0.92)' }}>
                            {['Run lineal', 'Riesgo', 'Descripción', 'Efecto/Consecuencia', 'Impacto', 'Probabilidad', 'Inherente'].map((h) => (
                              <th key={h} style={{ textAlign: 'left', color: '#93c5fd', fontSize: '0.68rem', padding: '0.5rem', textTransform: 'uppercase' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {risks.map((risk) => (
                            <tr key={risk.risk_id} style={{ borderBottom: '1px solid rgba(30,41,59,0.65)' }}>
                              <td style={{ padding: '0.5rem', color: '#cbd5e1', fontSize: '0.73rem', fontWeight: 700 }}>{risk.run_ra_code}</td>
                              <td style={{ padding: '0.5rem', color: '#e2e8f0', fontSize: '0.75rem', fontWeight: 700 }}>{risk.risk_name}</td>
                              <td style={{ padding: '0.5rem', color: '#cbd5e1', fontSize: '0.73rem' }}>{risk.risk_description || 'Sin descripción.'}</td>
                              <td style={{ padding: '0.5rem', color: '#cbd5e1', fontSize: '0.73rem' }}>{risk.consequence || 'N/A'}</td>
                              <td style={{ padding: '0.5rem', color: '#e2e8f0', fontSize: '0.73rem' }}>{risk.impact_score ?? 'N/A'}</td>
                              <td style={{ padding: '0.5rem', color: '#e2e8f0', fontSize: '0.73rem' }}>{risk.probability_score ?? 'N/A'}</td>
                              <td style={{ padding: '0.5rem', color: '#e0f2fe', fontSize: '0.8rem', fontWeight: 800 }}>{risk.inherent_risk_score ?? 'N/A'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </section>

              <section style={{
                border: '1px solid rgba(34,197,94,0.25)',
                borderRadius: 12,
                background: 'rgba(8,30,40,0.45)',
                padding: '0.75rem',
              }}>
                <div style={{ marginBottom: '0.55rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: '#22c55e', display: 'inline-block' }} />
                  <h4 style={{ margin: 0, color: '#dcfce7', fontSize: '0.88rem', fontWeight: 700 }}>Cascada</h4>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 920 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(71,85,105,0.35)', background: 'rgba(10,24,60,0.92)' }}>
                        {['Riesgo', 'Tipo cascada', 'Recurso', 'Nombres', 'Acción'].map((h) => (
                          <th key={h} style={{ textAlign: 'left', color: '#86efac', fontSize: '0.67rem', padding: '0.5rem', textTransform: 'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid rgba(30,41,59,0.65)', background: 'rgba(9,26,64,0.74)' }}>
                        <td style={{ padding: '0.45rem' }}>
                          <select
                            value={vm.riskCascadeDraft.riskId}
                            onChange={(e) => vm.setRiskCascadeDraft({ ...vm.riskCascadeDraft, riskId: e.target.value })}
                            style={{ width: '100%', background: 'rgba(12,29,68,0.82)', border: '1px solid rgba(88,124,189,0.35)', borderRadius: 10, color: '#e2e8f0', padding: '0.48rem 0.56rem', fontSize: '0.74rem' }}
                          >
                            <option value="">Seleccione</option>
                            {vm.linearRiskContext
                              .filter((r) => r.activity_id === selectedActivity?.id)
                              .map((r) => <option key={r.risk_id} value={r.risk_id}>{r.risk_name}</option>)}
                          </select>
                        </td>
                        <td style={{ padding: '0.45rem' }}>
                          <select
                            value={vm.riskCascadeDraft.cascadeCode}
                            onChange={(e) => vm.setRiskCascadeDraft({ ...vm.riskCascadeDraft, cascadeCode: e.target.value })}
                            style={{ width: '100%', background: 'rgba(12,29,68,0.82)', border: '1px solid rgba(88,124,189,0.35)', borderRadius: 10, color: '#e2e8f0', padding: '0.48rem 0.56rem', fontSize: '0.74rem' }}
                          >
                            <option value="">Seleccione</option>
                            {vm.riskCascadeCatalog.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
                          </select>
                        </td>
                        <td style={{ padding: '0.45rem' }}>
                          <select
                            value={vm.riskCascadeDraft.affectedResourceId}
                            onChange={(e) => vm.setRiskCascadeDraft({ ...vm.riskCascadeDraft, affectedResourceId: e.target.value })}
                            style={{ width: '100%', background: 'rgba(12,29,68,0.82)', border: '1px solid rgba(88,124,189,0.35)', borderRadius: 10, color: '#e2e8f0', padding: '0.48rem 0.56rem', fontSize: '0.74rem' }}
                          >
                            <option value="">Seleccione</option>
                            {vm.riskResourceCatalog.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                          </select>
                        </td>
                        <td style={{ padding: '0.45rem' }}>
                          <input
                            value={vm.riskCascadeDraft.notes}
                            onChange={(e) => vm.setRiskCascadeDraft({ ...vm.riskCascadeDraft, notes: e.target.value })}
                            style={{ width: '100%', background: 'rgba(12,29,68,0.82)', border: '1px solid rgba(88,124,189,0.35)', borderRadius: 10, color: '#e2e8f0', padding: '0.48rem 0.56rem', fontSize: '0.74rem' }}
                          />
                        </td>
                        <td style={{ padding: '0.45rem', whiteSpace: 'nowrap' }}>
                          <button
                            type="button"
                            onClick={() => void vm.saveRiskCascade({ resetDraft: true })}
                            disabled={vm.saving || !vm.riskCascadeDraft.riskId || !vm.riskCascadeDraft.cascadeCode}
                            style={{ borderRadius: 10, border: '1px solid rgba(134,239,172,0.4)', background: 'rgba(21,128,61,0.25)', color: '#dcfce7', fontSize: '0.72rem', fontWeight: 700, padding: '0.44rem 0.68rem', cursor: 'pointer' }}
                          >
                            {vm.editingRiskCascadeId ? 'Actualizar' : 'Agregar'}
                          </button>
                          {vm.editingRiskCascadeId && (
                            <button
                              type="button"
                              onClick={vm.cancelEditRiskCascade}
                              style={{ marginLeft: 6, borderRadius: 10, border: '1px solid rgba(148,163,184,0.38)', background: 'rgba(15,23,42,0.5)', color: '#cbd5e1', fontSize: '0.72rem', fontWeight: 700, padding: '0.44rem 0.68rem', cursor: 'pointer' }}
                            >
                              Cancelar
                            </button>
                          )}
                        </td>
                      </tr>
                      {vm.riskCascades
                        .filter((c) => vm.linearRiskContext.some((r) => r.activity_id === selectedActivity?.id && r.risk_id === c.risk_id))
                        .map((row) => (
                          <tr key={row.risk_cascade_id} style={{ borderBottom: '1px solid rgba(30,41,59,0.65)' }}>
                            <td style={{ padding: '0.48rem', color: '#e2e8f0', fontSize: '0.74rem' }}>{row.risk_name}</td>
                            <td style={{ padding: '0.48rem', color: '#cbd5e1', fontSize: '0.73rem' }}>{row.cascade_label || row.cascade_code}</td>
                              <td style={{ padding: '0.48rem', color: '#cbd5e1', fontSize: '0.73rem' }}>{row.resource_name || 'N/A'}</td>
                            <td style={{ padding: '0.48rem', color: '#cbd5e1', fontSize: '0.73rem' }}>{row.notes || 'N/A'}</td>
                            <td style={{ padding: '0.48rem', whiteSpace: 'nowrap' }}>
                              <button type="button" onClick={() => vm.beginEditRiskCascade(row.risk_cascade_id)} style={{ borderRadius: 8, border: '1px solid rgba(96,165,250,0.35)', background: 'rgba(59,130,246,0.14)', color: '#93c5fd', fontSize: '0.7rem', padding: '0.28rem 0.45rem', cursor: 'pointer' }}>Editar</button>
                              <button type="button" onClick={() => vm.removeRiskCascade(row.risk_cascade_id)} style={{ marginLeft: 6, borderRadius: 8, border: '1px solid rgba(248,113,113,0.35)', background: 'rgba(239,68,68,0.14)', color: '#fca5a5', fontSize: '0.7rem', padding: '0.28rem 0.45rem', cursor: 'pointer' }}>Remover</button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {activeStep === 'control' && (
            <div style={{ gridColumn: '1 / -1', display: 'grid', gap: '0.8rem' }}>
              <section style={{
                border: '1px solid rgba(168,85,247,0.24)',
                borderRadius: 14,
                background: 'linear-gradient(180deg, rgba(8,20,54,0.94) 0%, rgba(6,16,42,0.94) 100%)',
                padding: '0.95rem',
              }}>
                <div style={{ marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: '#a855f7', display: 'inline-block' }} />
                  <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '0.94rem', fontWeight: 700 }}>Controles mitigantes (Lineal)</h3>
                </div>
                {(() => {
                  const risks = vm.linearRiskContext.filter((r) => r.activity_id === selectedActivity?.id);
                  const controls = vm.linearControlContext.filter((c) => risks.some((r) => r.risk_id === c.risk_id));
                  
                  if (controls.length === 0) {
                    return <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>No se encontraron controles mitigantes asociados a los riesgos de esta actividad.</div>;
                  }
                  
                  return (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(71,85,105,0.35)', background: 'rgba(10,24,60,0.92)' }}>
                            {['Riesgo', 'Control', 'Tipo', 'Responsable', 'Cobertura', 'Reduce Prob.', 'Reduce Imp.'].map((h) => (
                              <th key={h} style={{ textAlign: 'left', color: '#d8b4fe', fontSize: '0.68rem', padding: '0.5rem', textTransform: 'uppercase' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {controls.map((ctrl) => {
                            const risk = risks.find(r => r.risk_id === ctrl.risk_id);
                            return (
                              <tr key={`${ctrl.risk_id}-${ctrl.control_id}`} style={{ borderBottom: '1px solid rgba(30,41,59,0.65)' }}>
                                <td style={{ padding: '0.5rem', color: '#cbd5e1', fontSize: '0.73rem', fontWeight: 700 }}>{risk?.risk_name || 'N/A'}</td>
                                <td style={{ padding: '0.5rem', color: '#e2e8f0', fontSize: '0.75rem', fontWeight: 700 }}>{ctrl.control_name}</td>
                                <td style={{ padding: '0.5rem', color: '#cbd5e1', fontSize: '0.73rem' }}>{ctrl.control_type_name || 'N/A'}</td>
                                <td style={{ padding: '0.5rem', color: '#cbd5e1', fontSize: '0.73rem' }}>{ctrl.owner_name || 'Sin asignar'}</td>
                                <td style={{ padding: '0.5rem', color: '#e2e8f0', fontSize: '0.73rem' }}>{ctrl.mitigation_strength ? `${(ctrl.mitigation_strength * 100).toFixed(0)}%` : 'N/A'}</td>
                                <td style={{ padding: '0.5rem', color: '#cbd5e1', fontSize: '0.73rem' }}>{ctrl.reduces_probability ? 'Sí' : 'No'}</td>
                                <td style={{ padding: '0.5rem', color: '#cbd5e1', fontSize: '0.73rem' }}>{ctrl.reduces_impact ? 'Sí' : 'No'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </section>

              <section style={{
                border: '1px solid rgba(251,191,36,0.28)',
                borderRadius: 14,
                background: 'linear-gradient(135deg, rgba(30,22,70,0.40) 0%, rgba(10,18,50,0.62) 100%)',
                padding: '0.85rem 1rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.15rem' }}>
                  <span style={{
                    flexShrink: 0, width: 28, height: 28, borderRadius: 8,
                    background: 'rgba(251,191,36,0.13)', border: '1px solid rgba(251,191,36,0.32)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem',
                  }}>⚙️</span>
                  <span style={{ color: '#fde68a', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    Control estructural
                  </span>
                  <span style={{ color: '#92400e', fontSize: '0.72rem', marginLeft: '0.25rem' }}>—</span>
                  <span style={{ color: '#fcd34d', fontSize: '0.74rem', lineHeight: 1.45 }}>
                    Si un control es <span style={{ fontWeight: 700, color: '#fbbf24' }}>hard_gate</span>, su falla no se compensa con promedios.
                  </span>
                </div>
                {(() => {
                  const risks = vm.linearRiskContext.filter((r) => r.activity_id === selectedActivity?.id);
                  const controls = vm.linearControlContext.filter((c) => risks.some((r) => r.risk_id === c.risk_id));
                  return <ControlEvaluationPanel controls={controls} runSaId={vm.runId} riskCascades={vm.riskCascades} />;
                })()}
              </section>
            </div>
          )}

          {activeStep === 'evidencia' && (
            <div style={{ gridColumn: '1 / -1', display: 'grid', gap: '0.8rem' }}>
              <section style={{
                border: '1px solid rgba(168,85,247,0.24)',
                borderRadius: 14,
                background: 'linear-gradient(180deg, rgba(8,20,54,0.94) 0%, rgba(6,16,42,0.94) 100%)',
                padding: '0.95rem',
              }}>
                <div style={{ marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: '#a855f7', display: 'inline-block' }} />
                  <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '0.94rem', fontWeight: 700 }}>Controles mitigantes (Lineal)</h3>
                </div>
                {(() => {
                  const risks = vm.linearRiskContext.filter((r) => r.activity_id === selectedActivity?.id);
                  const controls = vm.linearControlContext.filter((c) => risks.some((r) => r.risk_id === c.risk_id));
                  if (controls.length === 0) {
                    return <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>No se encontraron controles mitigantes asociados a los riesgos de esta actividad.</div>;
                  }
                  return (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(71,85,105,0.35)', background: 'rgba(10,24,60,0.92)' }}>
                            {['Riesgo', 'Control', 'Tipo', 'Responsable', 'Cobertura', 'Reduce Prob.', 'Reduce Imp.'].map((h) => (
                              <th key={h} style={{ textAlign: 'left', color: '#d8b4fe', fontSize: '0.68rem', padding: '0.5rem', textTransform: 'uppercase' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {controls.map((ctrl) => {
                            const risk = risks.find(r => r.risk_id === ctrl.risk_id);
                            return (
                              <tr key={`ev-${ctrl.risk_id}-${ctrl.control_id}`} style={{ borderBottom: '1px solid rgba(30,41,59,0.65)' }}>
                                <td style={{ padding: '0.5rem', color: '#cbd5e1', fontSize: '0.73rem', fontWeight: 700 }}>{risk?.risk_name || 'N/A'}</td>
                                <td style={{ padding: '0.5rem', color: '#e2e8f0', fontSize: '0.75rem', fontWeight: 700 }}>{ctrl.control_name}</td>
                                <td style={{ padding: '0.5rem', color: '#cbd5e1', fontSize: '0.73rem' }}>{ctrl.control_type_name || 'N/A'}</td>
                                <td style={{ padding: '0.5rem', color: '#cbd5e1', fontSize: '0.73rem' }}>{ctrl.owner_name || 'Sin asignar'}</td>
                                <td style={{ padding: '0.5rem', color: '#e2e8f0', fontSize: '0.73rem' }}>{ctrl.mitigation_strength ? `${(ctrl.mitigation_strength * 100).toFixed(0)}%` : 'N/A'}</td>
                                <td style={{ padding: '0.5rem', color: '#cbd5e1', fontSize: '0.73rem' }}>{ctrl.reduces_probability ? 'Sí' : 'No'}</td>
                                <td style={{ padding: '0.5rem', color: '#cbd5e1', fontSize: '0.73rem' }}>{ctrl.reduces_impact ? 'Sí' : 'No'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </section>

              <section style={{
                border: '1px solid rgba(251,191,36,0.28)',
                borderRadius: 14,
                background: 'linear-gradient(135deg, rgba(30,22,70,0.40) 0%, rgba(10,18,50,0.62) 100%)',
                padding: '0.85rem 1rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.15rem' }}>
                  <span style={{
                    flexShrink: 0, width: 28, height: 28, borderRadius: 8,
                    background: 'rgba(251,191,36,0.13)', border: '1px solid rgba(251,191,36,0.32)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem',
                  }}>🧪</span>
                  <span style={{ color: '#fde68a', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    Evidencia de los controles
                  </span>
                  <span style={{ color: '#92400e', fontSize: '0.72rem', marginLeft: '0.25rem' }}>—</span>
                  <span style={{ color: '#fcd34d', fontSize: '0.74rem', lineHeight: 1.45 }}>
                    Evidencia = fuerza probatoria del control.
                  </span>
                </div>
                {(() => {
                  const risks = vm.linearRiskContext.filter((r) => r.activity_id === selectedActivity?.id);
                  const controls = vm.linearControlContext.filter((c) => risks.some((r) => r.risk_id === c.risk_id));
                  return <ControlEvaluationPanel controls={controls} runSaId={vm.runId} riskCascades={vm.riskCascades} questions={EVIDENCE_QUESTIONS} panelTitle="Evaluación de evidencias" lockHardGate defaultAnswer={true} apiEndpoint="/api/structural-risk/wizard-evidence" />;
                })()}
              </section>
            </div>
          )}

          <div style={{ gridColumn: '1 / -1' }}>
            {activeStep !== 'dependencias' && activeStep !== 'compartidos' && activeStep !== 'riesgo' && activeStep !== 'impacto' && activeStep !== 'control' && activeStep !== 'evidencia' && renderStepBody(activeStep, stepLabel, vm.dependencies)}
          </div>
        </>
      );
    })()}
    </div>
  )}

      {/* ── Modal Ejecutar Análisis Estructural ── */}
      {showAnalysisModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999,
          background: 'rgba(4,8,28,0.80)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(5px)',
        }}>
          <div style={{
            background: 'linear-gradient(145deg, rgba(13,18,50,0.98) 0%, rgba(8,12,36,0.98) 100%)',
            border: '1px solid rgba(168,85,247,0.35)',
            borderRadius: 20,
            padding: '1.8rem 2rem',
            maxWidth: 480,
            width: '92%',
            boxShadow: '0 28px 72px rgba(0,0,0,0.65)',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.4rem' }}>
              <span style={{ fontSize: '1.3rem' }}>⚡</span>
              <div>
                <div style={{ color: '#e9d5ff', fontSize: '0.95rem', fontWeight: 800 }}>Ejecutar Análisis Estructural</div>
                <div style={{ color: '#64748b', fontSize: '0.72rem', marginTop: '0.1rem' }}>Selecciona cómo deseas proceder</div>
              </div>
            </div>

            {/* Opciones */}
            {[
              {
                icon: '💾',
                title: 'Grabar y continuar',
                desc: 'Guarda el estado actual y permanece en el paso 6.',
                border: 'rgba(96,165,250,0.30)',
                bg: 'rgba(30,58,138,0.18)',
                color: '#bfdbfe',
                action: () => void handleSaveAndContinue(),
              },
              {
                icon: '🚪',
                title: 'Grabar y cerrar',
                desc: 'Guarda y regresa al panel principal sin marcar como completado.',
                border: 'rgba(100,116,139,0.30)',
                bg: 'rgba(30,41,59,0.22)',
                color: '#cbd5e1',
                action: () => void handleSaveAndClose(),
              },
              {
                icon: '✅',
                title: 'Grabar y completar',
                desc: 'Marca el análisis como Completado y cierra la pantalla.',
                border: 'rgba(52,211,153,0.35)',
                bg: 'rgba(22,101,52,0.18)',
                color: '#86efac',
                action: () => void handleSaveAndComplete(),
              },
              {
                icon: '🧠',
                title: 'Grabar, completar y Análisis Estructural',
                desc: 'Completa el análisis y lanza el motor de análisis estructural.',
                border: 'rgba(168,85,247,0.40)',
                bg: 'rgba(88,28,135,0.22)',
                color: '#d8b4fe',
                action: () => void handleSaveCompleteAndAnalysis(),
              },
            ].map((opt) => (
              <button
                key={opt.title}
                type="button"
                disabled={vm.saving}
                onClick={opt.action}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                  width: '100%', textAlign: 'left', marginBottom: '0.55rem',
                  padding: '0.75rem 0.9rem', borderRadius: 12,
                  border: `1px solid ${opt.border}`,
                  background: opt.bg,
                  cursor: vm.saving ? 'not-allowed' : 'pointer',
                  opacity: vm.saving ? 0.6 : 1,
                }}
              >
                <span style={{ fontSize: '1.1rem', flexShrink: 0, marginTop: '0.05rem' }}>{opt.icon}</span>
                <div>
                  <div style={{ color: opt.color, fontSize: '0.82rem', fontWeight: 700 }}>{opt.title}</div>
                  <div style={{ color: '#64748b', fontSize: '0.72rem', marginTop: '0.18rem', lineHeight: 1.45 }}>{opt.desc}</div>
                </div>
              </button>
            ))}

            {/* Cancelar */}
            <button
              type="button"
              onClick={() => setShowAnalysisModal(false)}
              style={{
                marginTop: '0.3rem', width: '100%', padding: '0.5rem',
                borderRadius: 10, border: '1px solid rgba(71,85,105,0.25)',
                background: 'transparent', color: '#475569',
                fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
</main>
  );
}
