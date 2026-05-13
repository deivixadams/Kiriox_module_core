export interface HardgateRow {
  id: string;
  run_id: string;
  risk_cascade_id: string;
  control_id: string;
  is_hard_gate: boolean;
  hardgate_reason: string | null;
  answered_yes_question: string | null;
}

export interface UpsertHardgateInput {
  runSaId: string;
  controlId: string;
  riskCascadeId: string;
  isHardGate: boolean;
  answeredYesQuestion: string | null;
  hardgateReason: string | null;
}

export interface IHardgateRepository {
  getHardgates(runSaId: string, companyId: string): Promise<HardgateRow[]>;
  verifyRun(runSaId: string, companyId: string): Promise<boolean>;
  upsertHardgate(input: UpsertHardgateInput): Promise<void>;
}
