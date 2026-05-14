export const KIRIOX_PLUGIN_STATUSES = [
  "installed",
  "active",
  "disabled",
  "quarantine",
] as const;

export type KirioxPluginStatus =
  | "installed"
  | "active"
  | "disabled"
  | "quarantine";

export const KIRIOX_PLUGIN_PERMISSIONS = [
  "read:company",
  "write:company",
  "read:element",
  "write:element",
  "read:activity",
  "write:activity",
  "read:risk",
  "write:risk",
  "read:control",
  "write:control",
  "read:evidence",
  "write:evidence",
  "read:test",
  "write:test",
  "export:data",
  "register:ui",
  "register:command",
  "listen:events",
] as const;

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

export const KIRIOX_PLUGIN_EXTENSION_POINTS = [
  "incident:dashboard:widget",
  "linear-risk:dashboard:widget",
  "monitoring:dashboard:widget",
  "structural-risk:dashboard:widget",
  "simulation:dashboard:widget",
] as const;

export type KirioxPluginExtensionPoint =
  | "incident:dashboard:widget"
  | "linear-risk:dashboard:widget"
  | "monitoring:dashboard:widget"
  | "structural-risk:dashboard:widget"
  | "simulation:dashboard:widget";

export interface KirioxPluginManifest {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
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

  /**
   * Contribuciones de interfaz de usuario.
   * Mapea el ID del punto de extensión a un componente o función que lo retorne.
   */
  uiContributions?: Record<string, any>;
}
