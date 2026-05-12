export type KirioxAccessScope =
  | "company"
  | "element"
  | "activity"
  | "risk"
  | "control"
  | "evidence"
  | "test"
  | "audit";

export type KirioxAccessOperation =
  | "read"
  | "write"
  | "delete"
  | "export";

export interface KirioxAccessRequest {
  actorId: string;
  scope: KirioxAccessScope;
  operation: KirioxAccessOperation;
  resourceId?: string;
}

export interface KirioxAccessResult {
  allowed: boolean;
  reason?: string;
}

export interface KirioxCoreAccessContract {
  can(request: KirioxAccessRequest): Promise<KirioxAccessResult>;
}
