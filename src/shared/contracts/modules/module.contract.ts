export type KirioxModuleStatus = "active" | "disabled" | "experimental";

export type KirioxModuleCapability =
  | "navigation"
  | "routes"
  | "dashboard-widgets"
  | "domain-services"
  | "reports"
  | "extension-points";

export interface KirioxModuleManifest {
  id: string;
  name: string;
  version: string;
  description?: string;
  status: KirioxModuleStatus;
  capabilities: KirioxModuleCapability[];
  requiredPermissions?: string[];
  dependencies?: string[];
}

export interface KirioxModuleContext {
  auth: unknown;
  permissions: unknown;
  eventBus: unknown;
  audit: unknown;
  sdk: unknown;
}

export interface KirioxModuleContract {
  manifest: KirioxModuleManifest;

  register(context: KirioxModuleContext): Promise<void> | void;

  activate?(): Promise<void> | void;

  deactivate?(): Promise<void> | void;
}
