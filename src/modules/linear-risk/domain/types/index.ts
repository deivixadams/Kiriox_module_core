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

export interface LinearRiskRepository {
  getDashboardRows(): Promise<LinearRiskDashboardSummary>;
}
