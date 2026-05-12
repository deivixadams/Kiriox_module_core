// ─── Company Domain Types ──────────────────────────────────

export type CompanyRecord = {
  id: string;
  code: string;
  name: string;
  legal_name: string | null;
  description: string | null;
  status: boolean;
  created_at: Date;
  updated_at: Date;
};

export type CompanyTopSummary = {
  elements_count: number;
  activities_count: number;
  risks_count: number;
  controls_count: number;
  tests_count: number;
  users_count: number;
};

export type CompanyDTO = {
  id: string;
  code: string;
  name: string;
  legalName: string;
  description: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CompanySummaryDTO = {
  elements: number;
  keyActivities: number;
  risks: number;
  controls: number;
  tests: number;
  users: number;
};

export interface ObjectiveRecord {
  objective_id: string;
  company_id: string;
  objective_code: string;
  objective_name: string;
  objective_description: string | null;
  rationale: any;
  sequence_order: number | null;
  is_active: boolean | null;
  created_at: Date | null;
  updated_at: Date | null;
  kpi: string | null;
  id_appetite: string | null;
}

export interface ObjectiveDTO {
  objective_id: string;
  company_id: string;
  objective_code: string;
  objective_name: string;
  objective_description: string | null;
  rationale: any;
  sequence_order: number | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  kpi: string | null;
  id_appetite: string | null;
  company_objective_appetite?: {
    id: string;
    appetite_level: string | null;
    tolerance_min: number | null;
    tolerance_max: number | null;
    metric_name: string | null;
    metric_unit: string | null;
    status: string | null;
  } | null;
}
