import type { PluginsModuleContract } from "./plugins.contract";
import { PluginsRepository } from "./plugins.repository";
import type { PluginsDashboardData } from "./plugins.types";

export class PluginsService implements PluginsModuleContract {
  constructor(private readonly repository: PluginsRepository) {}

  async listDashboardData(): Promise<PluginsDashboardData> {
    const [plugins, auditTrail] = await Promise.all([
      this.repository.listInstalled(),
      this.repository.listAuditTrail(),
    ]);

    return {
      plugins,
      summary: {
        total: plugins.length,
        active: plugins.filter((plugin) => plugin.status === "active").length,
        disabled: plugins.filter((plugin) => plugin.status === "disabled").length,
        quarantine: plugins.filter((plugin) => plugin.status === "quarantine").length,
      },
      auditTrail,
    };
  }
}
