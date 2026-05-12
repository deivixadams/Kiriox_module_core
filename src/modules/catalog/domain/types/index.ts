export interface CatalogAppetite {
  id: string;
  code: string;
  scope_type: string;
  scope_id: string;
  appetite_level: string;
  tolerance_min: number | null;
  tolerance_max: number | null;
  metric_name: string;
  metric_unit: string | null;
  effective_from: Date;
  is_active: string;
  approved_by: string | null;
  approved_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CatalogProbability {
  catalog_probability_id: bigint;
  code: string;
  name: string;
  description: string | null;
  ordinal: number;
  numeric_value: number | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CatalogImpact {
  catalog_impact_id: bigint;
  code: string;
  name: string;
  description: string | null;
  ordinal: number;
  numeric_value: number | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CatalogFrequency {
  id: string;
  code: string;
  name: string;
  sort_order: number;
  is_active: boolean;
}

export interface CatalogControlType {
  id: string;
  code: string;
  name: string;
  description: string | null;
  control_nature: string | null;
  mitigates_probability: boolean;
  mitigates_impact: boolean;
  detects_event: boolean;
  enables_response: boolean;
  is_hard_gate: boolean;
  status_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface CatalogActivityCriticalityLevel {
  id: string;
  code: string;
  name: string;
  sort_order: number;
  is_active: boolean;
}
