import type {
  KirioxPluginExtensionPoint,
  KirioxPluginPermission,
  KirioxPluginStatus,
} from "@/shared/contracts/plugins/plugin.contract";
import type { PluginAuditEntry } from "@/core/plugin-engine/plugin-audit";

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
  quarantine: number;
}

export interface PluginsDashboardData {
  plugins: PluginListItem[];
  summary: PluginsDashboardSummary;
  auditTrail: PluginAuditEntry[];
}
