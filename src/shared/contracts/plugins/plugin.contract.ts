export type KirioxPluginStatus =
  | "installed"
  | "active"
  | "disabled"
  | "quarantined";

export type KirioxPluginPermission =
  | "read:company"
  | "write:company"
  | "read:element"
  | "write:element"
  | "read:activity"
  | "write:activity"
  | "read:risk"
  | "write:risk"
  | "read:control"
  | "write:control"
  | "read:evidence"
  | "write:evidence"
  | "read:test"
  | "write:test"
  | "export:data"
  | "register:ui"
  | "register:command"
  | "listen:events";

export type KirioxPluginExtensionPoint =
  | "navigation:item"
  | "dashboard:widget"
  | "risk:panel"
  | "control:panel"
  | "evidence:panel"
  | "report:exporter";

export interface KirioxPluginManifest {
  id: string;
  name: string;
  version: string;
  description?: string;
  status: KirioxPluginStatus;
  permissions: KirioxPluginPermission[];
  extensionPoints: KirioxPluginExtensionPoint[];
  dependencies?: string[];
}

export interface KirioxPluginContext {
  sdk: unknown;
  permissions: unknown;
  eventBus: unknown;
  audit: unknown;
}

export interface KirioxPluginContract {
  manifest: KirioxPluginManifest;

  install?(context: KirioxPluginContext): Promise<void> | void;

  activate(context: KirioxPluginContext): Promise<void> | void;

  deactivate?(): Promise<void> | void;

  uninstall?(): Promise<void> | void;
}
