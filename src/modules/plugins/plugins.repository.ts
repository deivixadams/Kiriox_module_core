import { pluginGovernanceService } from "@/core/plugin-engine/plugin-governance";
import type { PluginAuditEntry } from "@/core/plugin-engine/plugin-audit";
import { KirioxPluginManifestSchema } from "@/shared/contracts/plugins/plugin-manifest.schema";
import type { PluginListItem } from "./plugins.types";

export class PluginsRepository {
  async listInstalled(): Promise<PluginListItem[]> {
    return pluginGovernanceService.listInstalled().map((plugin) => {
      KirioxPluginManifestSchema.parse({
        id: plugin.id,
        name: plugin.name,
        version: plugin.version,
        description: plugin.description,
        author: plugin.author,
        status: plugin.status,
        permissions: plugin.permissions,
        extensionPoints: plugin.extensionPoints,
        dependencies: plugin.dependencies,
      });

      return {
        id: plugin.id,
        name: plugin.name,
        version: plugin.version,
        description: plugin.description,
        author: plugin.author,
        status: plugin.status,
        permissions: plugin.permissions,
        extensionPoints: plugin.extensionPoints,
        dependencies: plugin.dependencies,
      };
    });
  }

  async listAuditTrail(limit = 12): Promise<PluginAuditEntry[]> {
    return pluginGovernanceService.listAuditTrail(limit);
  }
}
