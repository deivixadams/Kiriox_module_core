import type { PluginsModuleContract } from "./plugins.contract";
import { PluginsRepository } from "./plugins.repository";
import type { PluginsDashboardData } from "./plugins.types";

export class PluginsService implements PluginsModuleContract {
  constructor(private readonly repository: PluginsRepository) {}

  async listDashboardData(): Promise<PluginsDashboardData> {
    const plugins = await this.repository.listInstalled();

    return {
      plugins,
      summary: {
        total: plugins.length,
        active: plugins.filter((plugin) => plugin.status === "active").length,
        disabled: plugins.filter((plugin) => plugin.status === "disabled").length,
        quarantined: plugins.filter((plugin) => plugin.status === "quarantined").length,
      },
    };
  }
}
