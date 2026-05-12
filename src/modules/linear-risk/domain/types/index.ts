export interface LinearRiskDashboardRow {
  control_code?: string;
  control_name?: string;
  control_type?: string;
  domain_name?: string;
  obligations_supported?: number;
  risks_mitigated?: number;
  structural_score?: number;
  fragility_score?: number;
  systemic_impact_score?: number;
  final_weighted_rank?: number;
  [key: string]: any;
}

export interface LinearRiskDashboardSummary {
  rows: LinearRiskDashboardRow[];
  source: string;
}

export interface LinearRiskEvaluation {
  id: string;
  code: string;
  title: string;
  scope: string;
  responsible: string;
  initials: string;
  status: string;
  status_color: string;
  lifecycle_code: string;
  lifecycle_name: string;
  lifecycle_terminal: boolean;
  created_at: string;
  updated_at: string;
  progress: number;
}

export interface LinearRiskEvaluationsSummary {
  stats: {
    total: number;
    borrador: number;
    en_proceso: number;
    finalizada: number;
    en_tratamiento: number;
  };
  evaluations: LinearRiskEvaluation[];
}

export interface LinearRiskRepository {
  getDashboardRows(): Promise<LinearRiskDashboardSummary>;
  getEvaluations(companyId: string, elementId?: string, activityId?: string): Promise<LinearRiskEvaluationsSummary>;
  createEvaluation(companyId: string, forceNew?: boolean): Promise<{ id: string; code: string }>;
  deleteEvaluation(id: string): Promise<void>;
}
