import type {
  KirioxPluginExtensionPoint,
  KirioxPluginPermission,
  KirioxPluginStatus,
} from "@/shared/contracts/plugins/plugin.contract";

export interface PluginListItem {
  id: string;
  name: string;
  version: string;
  description: string;
  status: KirioxPluginStatus;
  author: string;
  permissions: KirioxPluginPermission[];
  extensionPoints: KirioxPluginExtensionPoint[];
  dependencies: string[];
}

export interface PluginsDashboardSummary {
  total: number;
  active: number;
  disabled: number;
  quarantined: number;
}

export interface PluginsDashboardData {
  plugins: PluginListItem[];
  summary: PluginsDashboardSummary;
}
