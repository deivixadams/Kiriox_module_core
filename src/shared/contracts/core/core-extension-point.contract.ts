export type KirioxExtensionPointKind =
  | "navigation:item"
  | "dashboard:widget"
  | "entity:panel"
  | "report:exporter"
  | "command";

export interface KirioxExtensionPoint {
  id: string;
  kind: KirioxExtensionPointKind;
  owner: "core" | "module";
  ownerId: string;
  description?: string;
  allowedPluginPermissions?: string[];
}

export interface KirioxCoreExtensionPointContract {
  register(point: KirioxExtensionPoint): void;
  get(pointId: string): KirioxExtensionPoint | undefined;
  list(): KirioxExtensionPoint[];
}
