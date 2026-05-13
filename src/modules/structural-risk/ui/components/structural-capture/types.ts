import type { LucideIcon } from 'lucide-react';

export type CatalogOption = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  sort_order: number;
};

export type RunRow = {
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
};

export type LifecycleRow = {
  id: string;
  changed_at: string;
  progress_percent: number;
  change_reason: string | null;
  completion_reason: string | null;
  from_lifecycle_code: string | null;
  to_lifecycle_code: string | null;
  to_lifecycle_name: string | null;
  changed_by_name: string | null;
};

export type WizardData = {
  runs: RunRow[];
  currentRun: RunRow | null;
  lifecycleHistory: LifecycleRow[];
  catalogs: {
    lifecycle: CatalogOption[];
    scopeTypes: CatalogOption[];
    methodologies: CatalogOption[];
  };
};

export type ActivityRow = { 
  id: string; 
  company_id: string;
  element_id: string;
  code: string; 
  name: string; 
  element_name: string; 
  description: string | null; 
  owner_name: string | null; 
  owner_email: string | null;
  impact_code?: string | null;
  criticality_code?: string | null;
};
export type PersonOption = { id: string; full_name: string; email: string | null };

export type DependencyRow = {
  id: string;
  activity_id: string;
  activity_name: string;
  dependency_activity_id: string | null;
  dependency_activity_name: string | null;
  dependency_resource_id?: string;
  dependency_resource_name: string;
  failure_effect_id?: string;
  failure_effect_name: string;
  dependency_strength_id?: string;
  dependency_strength_name: string;
  alternative_level_id?: string;
  alternative_level_name: string;
  dependency_person_id?: string | null;
  dependency_person_name?: string | null;
  is_active: boolean;
};

export type SharedResourceRow = {
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
};

export type StructuralStep = {
  key: 'impacto' | 'dependencias' | 'riesgo' | 'control' | 'evidencia' | 'compartidos';
  label: string;
  icon: LucideIcon;
};

export type WizardActivitiesResponse = {
  activities: ActivityRow[];
  people: PersonOption[];
  selected_activity_ids: string[];
  catalogs: {
    dependencyResources: CatalogOption[];
    failureEffects: CatalogOption[];
    dependencyStrengths: CatalogOption[];
    alternativeLevels: CatalogOption[];
    impacts: Array<{ code: string; label: string; operational_definition: string; time_to_impact_reference: string; effect_profile: string }>;
    criticalities: Array<{ code: string; label: string; operational_definition: string; decision_signal: string }>;
  };
  dependencies: DependencyRow[];
  shared_resources: SharedResourceRow[];
  linear_risk_context: Array<{
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
  }>;
  risk_cascade_catalog: Array<{
    code: string;
    label: string;
    operational_definition: string;
    decision_signal: string;
  }>;
  risk_resource_catalog: Array<{
    id: string;
    name: string;
  }>;
  risk_cascades: Array<{
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
  }>;
  linear_control_context: Array<{
    risk_id: string;
    control_id: string;
    control_code: string | null;
    control_name: string;
    control_type_name: string | null;
    owner_name: string | null;
    mitigation_strength: number | null;
    reduces_probability: boolean;
    reduces_impact: boolean;
  }>;
  error?: string;
};
