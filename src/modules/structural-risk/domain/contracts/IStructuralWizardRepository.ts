// ── Catalog ──────────────────────────────────────────────────────────────────

export interface WizardCatalogOption {
  id: string;
  code: string;
  name: string;
  description: string | null;
  sort_order: number;
}

export interface WizardCatalogs {
  lifecycle: WizardCatalogOption[];
  scopeTypes: WizardCatalogOption[];
  methodologies: WizardCatalogOption[];
}

// ── Runs ─────────────────────────────────────────────────────────────────────

export interface WizardRunRow {
  id: string;
  code: string;
  title: string;
  scope_type: string;
  methodology: string;
  status: string;
  version: number;
  assessment_date: string;
  created_at: string;
  updated_at: string;
  lifecycle_id: string | null;
  lifecycle_code: string | null;
  lifecycle_name: string | null;
}

export interface LifecycleHistoryRow {
  id: string;
  changed_at: string;
  progress_percent: number;
  change_reason: string | null;
  completion_reason: string | null;
  from_lifecycle_code: string | null;
  to_lifecycle_code: string | null;
  to_lifecycle_name: string | null;
  changed_by_name: string | null;
}

// ── Create / Update inputs ────────────────────────────────────────────────────

export interface CreateRunInput {
  companyId: string;
  userId: string;
  code: string;
  title: string;
  scopeCode: string;
  methodologyCode: string;
  lifecycleId: string;
  lifecycleCode: string;
  fromLinearActivities: string[];
}

export interface UpdateRunInput {
  runSaId: string;
  companyId: string;
  userId: string;
  title?: string | null;
  scope_type?: string | null;
  methodology?: string | null;
  lifecycleId?: string | null;
  changeReason?: string | null;
}

// ── Activities ────────────────────────────────────────────────────────────────

export interface WizardActivityRow {
  id: string;
  company_id: string;
  element_id: string;
  code: string | null;
  name: string;
  description: string | null;
  element_name: string;
  owner_name: string | null;
  owner_email: string | null;
  impact_code: string | null;
  criticality_code: string | null;
}

export interface WizardPersonRow {
  id: string;
  full_name: string;
  email: string | null;
}

export interface WizardDependencyRow {
  id: string;
  activity_id: string;
  activity_name: string;
  dependency_activity_id: string | null;
  dependency_activity_name: string | null;
  dependency_resource_id: string;
  dependency_resource_name: string;
  failure_effect_id: string;
  failure_effect_name: string;
  dependency_strength_id: string;
  dependency_strength_name: string;
  alternative_level_id: string;
  alternative_level_name: string;
  dependency_person_id: string | null;
  dependency_person_name: string | null;
  is_active: boolean;
}

export interface WizardSharedResourceRow {
  activity_id: string;
  activity_name: string;
  resource_id: string;
  resource_name: string;
  resource_type_code: string;
  resource_type_name: string | null;
  owner_id: string | null;
  owner_name: string | null;
  failure_effect_code: string;
  failure_effect_name: string | null;
  dependency_strength_code: string;
  dependency_strength_name: string | null;
  alternative_level_code: string;
  alternative_level_name: string | null;
  criticality_code: string;
  criticality_label: string | null;
  created_at: string;
}

export interface WizardLinearRiskRow {
  activity_id: string;
  run_ra_id: string;
  run_ra_code: string;
  risk_id: string;
  risk_name: string;
  risk_description: string | null;
  consequence: string | null;
  impact_score: number | null;
  probability_score: number | null;
  inherent_risk_score: number | null;
  created_at: string;
}

export interface WizardLinearControlRow {
  risk_id: string;
  control_id: string;
  control_code: string | null;
  control_name: string;
  control_type_name: string | null;
  owner_name: string | null;
  mitigation_strength: number | null;
  reduces_probability: boolean;
  reduces_impact: boolean;
}

export interface WizardRiskCascadeRow {
  risk_cascade_id: string;
  run_sa_id: string;
  risk_id: string;
  risk_name: string;
  cascade_code: string;
  cascade_label: string | null;
  affected_resource_id: string | null;
  resource_name: string | null;
  notes: string | null;
  created_at: string;
}

export interface WizardCatalogRow {
  id?: string;
  code: string;
  name?: string;
  label?: string;
  operational_definition?: string;
  decision_signal?: string;
  time_to_impact_reference?: string;
  effect_profile?: string;
}

// ── Patch Activities inputs ───────────────────────────────────────────────────

export interface UpsertDependencyInput {
  dependencyId?: string;
  activityId: string;
  companyId: string;
  runSaId: string;
  dependencyActivityId?: string | null;
  dependencyResourceId: string;
  failureEffectId: string;
  dependencyStrengthId: string;
  alternativeLevelId: string;
  dependencyPersonId?: string | null;
  dependencySystemName?: string | null;
  dependencyDataName?: string | null;
  dependencyProviderName?: string | null;
  dependencyDocumentName?: string | null;
}

export interface UpsertSharedResourceInput {
  mode: 'create' | 'update';
  activityId: string;
  resourceId?: string | null;
  resourceName: string;
  resourceTypeCode: string;
  failureEffectCode: string;
  dependencyStrengthCode: string;
  alternativeCode: string;
  criticalityCode: string;
  ownerId?: string | null;
  runSaId: string;
  companyId: string;
  userId: string;
}

export interface UpsertRiskCascadeInput {
  riskCascadeId?: string | null;
  runSaId: string;
  riskId: string;
  cascadeCode: string;
  affectedResourceId?: string | null;
  notes?: string | null;
  companyId: string;
}

// ── Repository contract ───────────────────────────────────────────────────────

export interface IStructuralWizardRepository {
  getCatalogs(): Promise<WizardCatalogs>;
  getRunsByCompany(companyId: string): Promise<WizardRunRow[]>;
  getLifecycleHistory(runSaId: string): Promise<LifecycleHistoryRow[]>;
  verifyRun(runSaId: string, companyId: string): Promise<WizardRunRow | null>;
  getLinearContextFromEval(fromLinearEvalId: string): Promise<Array<{ objective: string | null; scope: string | null; activity_id: string | null }>>;
  createRun(input: CreateRunInput): Promise<{ id: string; code: string }>;
  updateRun(input: UpdateRunInput): Promise<void>;
  deleteRun(runSaId: string, companyId: string, userId: string): Promise<boolean>;
  bridgeTableExists(): Promise<boolean>;
  getSelectedActivities(runSaId: string, companyId: string): Promise<string[]>;
  getActivitiesData(companyId: string, runSaId: string): Promise<{
    activities: WizardActivityRow[];
    people: WizardPersonRow[];
    resources: WizardCatalogRow[];
    effects: WizardCatalogRow[];
    strengths: WizardCatalogRow[];
    alternatives: WizardCatalogRow[];
    dependencies: WizardDependencyRow[];
    sharedResources: WizardSharedResourceRow[];
    linearRiskContext: WizardLinearRiskRow[];
    cascadeCatalog: WizardCatalogRow[];
    resourceCatalog: WizardCatalogRow[];
    riskCascades: WizardRiskCascadeRow[];
    impacts: WizardCatalogRow[];
    criticalities: WizardCatalogRow[];
    linearControlContext: WizardLinearControlRow[];
  }>;
  updateActivitySelection(runSaId: string, companyId: string, userId: string, selectedActivityIds: string[]): Promise<void>;
  updateActivityImpactCriticality(runSaId: string, activityId: string, companyId: string, impactCode?: string | null, criticalityCode?: string | null): Promise<void>;
  deleteDependency(dependencyId: string, companyId: string): Promise<void>;
  deleteSharedResource(activityId: string, resourceId: string): Promise<void>;
  deleteRiskCascade(riskCascadeId: string, runSaId: string): Promise<void>;
  upsertDependency(input: UpsertDependencyInput): Promise<{ id: string; created: boolean }>;
  upsertSharedResource(input: UpsertSharedResourceInput): Promise<{ resourceId: string }>;
  upsertRiskCascade(input: UpsertRiskCascadeInput): Promise<{ riskCascadeId: string; created: boolean }>;
  validateCatalogCodes(input: {
    failureEffectId?: string;
    dependencyStrengthId?: string;
    alternativeLevelId?: string;
    resourceTypeId?: string;
    criticalityCode?: string;
    riskId?: string;
    cascadeCode?: string;
    affectedResourceId?: string | null;
    activityId?: string;
    runSaId?: string;
    companyId?: string;
  }): Promise<{
    failureEffectCode?: string;
    dependencyStrengthCode?: string;
    alternativeCode?: string;
    resourceTypeCode?: string;
    valid: boolean;
    error?: string;
  }>;
  verifyActivityInRun(runSaId: string, companyId: string, activityId: string): Promise<boolean>;
  verifyActivityExists(activityId: string, companyId: string): Promise<boolean>;
}
