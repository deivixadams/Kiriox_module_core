export type KirioxAuditSeverity = "info" | "warning" | "critical";

export interface KirioxAuditActor {
  id: string;
  type: "user" | "system" | "plugin" | "module";
}

export interface KirioxAuditEvent {
  id?: string;
  actor: KirioxAuditActor;
  action: string;
  targetType: string;
  targetId?: string;
  before?: unknown;
  after?: unknown;
  metadata?: Record<string, unknown>;
  severity: KirioxAuditSeverity;
  occurredAt: Date;
}

export interface KirioxCoreAuditContract {
  record(event: KirioxAuditEvent): Promise<void>;
}
