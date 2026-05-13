export interface EvidenceRow {
  control_id: string;
  evidence_exists: boolean;
  evidence_current: boolean;
  evidence_sufficient: boolean;
  evidence_traceable: boolean;
  evidence_capture_mode: string;
  evidence_strength: number;
  evidence_notes: string | null;
  is_hard_gate: boolean;
}

export interface UpsertEvidenceInput {
  runSaId: string;
  controlId: string;
  riskCascadeId: string;
  evidenceExists: boolean;
  evidenceCurrent: boolean;
  evidenceSufficient: boolean;
  evidenceTraceable: boolean;
  captureMode: string;
  evidenceStrength: number;
  evidenceNotes: string | null;
}

export interface IEvidenceRepository {
  getEvidence(runSaId: string, companyId: string): Promise<EvidenceRow[]>;
  verifyRun(runSaId: string, companyId: string): Promise<boolean>;
  upsertEvidence(input: UpsertEvidenceInput): Promise<void>;
}
