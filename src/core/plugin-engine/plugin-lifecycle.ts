export type PluginLifecycleStatus =
  | "discovered"
  | "validated"
  | "installed"
  | "disabled"
  | "quarantine";

export interface PluginLifecycleRecord {
  pluginId: string;
  status: PluginLifecycleStatus;
  updatedAt: string;
}
