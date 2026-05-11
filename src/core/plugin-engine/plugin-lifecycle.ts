export type PluginLifecycleStatus =
  | "discovered"
  | "validated"
  | "installed"
  | "disabled"
  | "quarantined";

export interface PluginLifecycleRecord {
  pluginId: string;
  status: PluginLifecycleStatus;
  updatedAt: string;
}
