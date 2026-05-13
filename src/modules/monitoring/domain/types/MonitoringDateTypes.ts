export type DateStatus = 'vencida' | 'proxima' | 'vigente' | 'sin_fecha';

export interface RiskRow {
  id: string;
  code: string;
  name: string;
  next_review_date: string | null;
}

export interface ControlRow {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
  next_execution_date: string | null;
  next_review_date: string | null;
}

export interface TestRow {
  id: string;
  test_name: string;
  status: string;
  expiration_date: string | null;
  control_name: string;
}

export interface EvidenceRow {
  id: string;
  title: string;
  evidence_type: string;
  validity_status: string;
  expiration_date: string | null;
}

export type TableKey =
  | 'run_ra_risks'
  | 'run_ra_controls'
  | 'run_ra_control_tests'
  | 'run_ra_evidence';

export type FieldKey =
  | 'next_review_date'
  | 'next_execution_date'
  | 'expiration_date';

export interface PendingChange {
  id: string;
  field: FieldKey;
  value: string | null;
}
