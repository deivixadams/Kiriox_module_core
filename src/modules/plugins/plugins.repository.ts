import { readPluginRegistry } from "@/core/plugin-engine/plugin-registry-store";
import { KirioxPluginManifestSchema } from "@/shared/contracts/plugins/plugin-manifest.schema";
import type { PluginListItem } from "./plugins.types";

export class PluginsRepository {
  async listInstalled(): Promise<PluginListItem[]> {
    return readPluginRegistry().map((plugin) => {
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
}
