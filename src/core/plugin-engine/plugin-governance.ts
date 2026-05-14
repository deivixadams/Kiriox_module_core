import { basename } from "path";
import { kirioxExtensionPointRegistry } from "./extension-point-registry";
import { appendPluginAudit, readPluginAuditTrail, type PluginAuditEntry } from "./plugin-audit";
import {
  readPluginRegistry,
  writePluginRegistry,
  type PluginRegistryRecord,
} from "./plugin-registry-store";
import { loadPluginContractFromSource } from "./plugin-runtime-loader";
import { KirioxPluginManifestSchema } from "@/shared/contracts/plugins/plugin-manifest.schema";
import type {
  KirioxPluginContext,
  KirioxPluginExtensionPoint,
  KirioxPluginPermission,
  KirioxPluginStatus,
} from "@/shared/contracts/plugins/plugin.contract";

export interface ActivePluginDescriptor {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  status: KirioxPluginStatus;
  permissions: KirioxPluginPermission[];
  extensionPoints: KirioxPluginExtensionPoint[];
}

export class PluginGovernanceService {
  listInstalled(): PluginRegistryRecord[] {
    return readPluginRegistry();
  }

  listAuditTrail(limit = 12): PluginAuditEntry[] {
    return readPluginAuditTrail(limit);
  }

  listActiveForPoint(pointId: KirioxPluginExtensionPoint): ActivePluginDescriptor[] {
    const point = kirioxExtensionPointRegistry.get(pointId);
    if (!point) {
      return [];
    }

    const plugins = readPluginRegistry()
      .filter((plugin) => plugin.status === "active")
      .filter((plugin) => plugin.extensionPoints.includes(pointId))
      .filter((plugin) => this.supportsPointPermissions(plugin, point.allowedPluginPermissions ?? []))
      .map((plugin) => ({
        id: plugin.id,
        name: plugin.name,
        description: plugin.description,
        version: plugin.version,
        author: plugin.author,
        status: plugin.status,
        permissions: plugin.permissions,
        extensionPoints: plugin.extensionPoints,
      }));

    for (const plugin of plugins) {
      this.audit(plugin.id, "execute", "info", `Plugin resuelto para la zona ${pointId}.`, {
        pointId,
      });
    }

    return plugins;
  }

  async activatePlugin(id: string): Promise<PluginRegistryRecord> {
    const registry = readPluginRegistry();
    const index = registry.findIndex((plugin) => plugin.id === id);
    if (index === -1) {
      throw new Error("Plugin no encontrado.");
    }

    const record = registry[index];
    if (!record.entryFile) {
      this.quarantine(registry, index, "El plugin no tiene entrypoint cargable.");
      throw new Error("El plugin no tiene entrypoint cargable.");
    }

    this.assertExtensionPoints(record);
    this.audit(record.id, "load", "info", `Cargando contrato ${basename(record.entryFile)}.`);

    try {
      const contract = loadPluginContractFromSource(record.entryFile);
      const manifest = KirioxPluginManifestSchema.parse(contract.manifest);

      if (manifest.id !== record.id || manifest.version !== record.version) {
        throw new Error("El contrato exportado no coincide con el registro instalado.");
      }

      this.assertExtensionPoints(record);

      const context = this.buildContext(record);
      await Promise.resolve(contract.activate(context));

      registry[index] = {
        ...record,
        status: "active",
        contractLoaded: true,
        updatedAt: new Date().toISOString(),
      };
      writePluginRegistry(registry);
      this.audit(record.id, "activate", "success", "Plugin activado correctamente.");

      return registry[index];
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido al activar el plugin.";
      this.quarantine(registry, index, message);
      throw new Error(message);
    }
  }

  async disablePlugin(id: string): Promise<PluginRegistryRecord> {
    const registry = readPluginRegistry();
    const index = registry.findIndex((plugin) => plugin.id === id);
    if (index === -1) {
      throw new Error("Plugin no encontrado.");
    }

    const record = registry[index];

    if (record.entryFile) {
      try {
        const contract = loadPluginContractFromSource(record.entryFile);
        if (typeof contract.deactivate === "function") {
          await Promise.resolve(contract.deactivate());
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Error desconocido al desactivar.";
        this.audit(record.id, "error", "failure", message);
      }
    }

    registry[index] = {
      ...record,
      status: "disabled",
      updatedAt: new Date().toISOString(),
    };
    writePluginRegistry(registry);
    this.audit(record.id, "deactivate", "success", "Plugin desactivado manualmente.");

    return registry[index];
  }

  private buildContext(record: PluginRegistryRecord): KirioxPluginContext {
    return {
      sdk: {
        pluginId: record.id,
        extensionPoints: kirioxExtensionPointRegistry.list(),
      },
      permissions: {
        granted: record.permissions,
      },
      eventBus: null,
      audit: {
        record: (message: string, details?: Record<string, unknown>) => {
          this.audit(record.id, "execute", "info", message, { details });
        },
      },
    };
  }

  private assertExtensionPoints(record: PluginRegistryRecord): void {
    for (const pointId of record.extensionPoints) {
      const point = kirioxExtensionPointRegistry.get(pointId);
      if (!point) {
        throw new Error(`La zona ${pointId} no está declarada por ningún módulo oficial.`);
      }
      if (!this.supportsPointPermissions(record, point.allowedPluginPermissions ?? [])) {
        throw new Error(`El plugin no tiene permisos suficientes para la zona ${pointId}.`);
      }
    }
  }

  private supportsPointPermissions(
    record: PluginRegistryRecord,
    requiredPermissions: string[],
  ): boolean {
    return requiredPermissions.every((permission) =>
      record.permissions.includes(permission as KirioxPluginPermission),
    );
  }

  private quarantine(
    registry: PluginRegistryRecord[],
    index: number,
    message: string,
  ): void {
    registry[index] = {
      ...registry[index],
      status: "quarantine",
      updatedAt: new Date().toISOString(),
    };
    writePluginRegistry(registry);
    this.audit(registry[index].id, "error", "failure", message);
  }

  private audit(
    pluginId: string,
    event: PluginAuditEntry["event"],
    status: PluginAuditEntry["status"],
    message: string,
    extra?: Partial<PluginAuditEntry>,
  ): void {
    appendPluginAudit({
      timestamp: new Date().toISOString(),
      pluginId,
      event,
      status,
      message,
      actor: "system",
      ...extra,
    });
  }
}

export const pluginGovernanceService = new PluginGovernanceService();
