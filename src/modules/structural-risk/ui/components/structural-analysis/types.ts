export type CI = { label: string; color: string; bg: string };

export type BadgeConfig = CI & { label: string };

export type QuestionKey = 'q1' | 'q2' | 'q3' | 'q4' | 'q5';

export type CardConfig = {
  key: QuestionKey;
  accent: string;
  accentBg: string;
  category: string;
  entityName: string;
  badges: BadgeConfig[];
  metricLabel: string;
  metricValue: string;
  metricUnit: string;
  critInfo: CI | null;
  tipo: string;
  efectos: string;
  impacto: string;
};

export type RunSummary = {
  run_sa_id: string;
  run_code: string;
  methodology: string;
  scope_type: string;
  graph_nodes_count: number;
  graph_edges_count: number;
  activities_count: number;
  risks_count: number;
  controls_count: number;
  evidences_count: number;
  resources_count: number;
  completeness_status: string;
  data_quality_score: number;
};

export type Q1A = {
  node_name: string;
  node_break_score: number;
  why: {
    degree: number;
    betweenness_proxy: number;
    criticality_weight: number;
    cascade_exposure: number;
    resource_concentration: number;
  };
};

export type Q2A = {
  from_activity_name: string;
  to_activity_name: string;
  cascade_score: number;
  why: {
    strength_weight: number;
    failure_effect_weight: number;
    alternative_weight: number;
    estimated_reach: number;
  };
};

export type Q3A = {
  control_name: string;
  protection_score: number;
  why: {
    mitigated_risks: number;
    protected_activities: number;
    hardgate_flag: number;
    evidence_health: number;
  };
};

export type Q4A = {
  evidence_name: string;
  confidence_load: number;
  why: {
    linked_controls: number;
    linked_risks: number;
    validity_rate: number;
  };
};

export type Q5A = {
  activity_name: string;
  intervention_type: string;
  benefit_score: number;
  effort_score: number;
  priority_index: number;
};

export type AnalysisData = {
  run_summary: RunSummary;
  answers: { q1?: Q1A; q2?: Q2A; q3?: Q3A; q4?: Q4A; q5?: Q5A };
  details: {
    q1?: Record<string, unknown>[];
    q2?: Record<string, unknown>[];
    q3?: Record<string, unknown>[];
    q4?: Record<string, unknown>[];
    q5?: Record<string, unknown>[];
  };
  data_quality: {
    analysis_confidence: number;
    missing_data: string[];
    blocked_conclusions: string[];
  };
};
