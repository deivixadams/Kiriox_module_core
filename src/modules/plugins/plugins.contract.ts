import type { PluginsDashboardData } from "./plugins.types";

export interface PluginsModuleContract {
  listDashboardData(): Promise<PluginsDashboardData>;
}
