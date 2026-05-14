import { readPluginRegistry } from "./plugin-registry-store";
import { loadPluginContractFromSource } from "./plugin-runtime-loader";
import { KirioxPluginContext } from "@/shared/contracts/plugins/plugin.contract";

class PluginEngine {
  private activePlugins = new Map<string, any>();

  async start() {
    console.log("[PluginEngine] Iniciando motor de plugins...");
    const registry = readPluginRegistry();
    const activeRecords = registry.filter(r => r.status === 'active' && r.entryFile);

    for (const record of activeRecords) {
      try {
        console.log(`[PluginEngine] Cargando plugin: ${record.name}`);
        const contract = loadPluginContractFromSource(record.entryFile!);
        
        const context: KirioxPluginContext = {
          sdk: {}, // TODO: Implementar SDK real
          permissions: record.permissions,
          eventBus: {}, // TODO: Conectar con el EventBus del core
          audit: {} // TODO: Inyectar servicio de auditoría
        };

        await contract.activate(context);
        this.activePlugins.set(record.id, contract);
        console.log(`[PluginEngine] Plugin ${record.name} activado con éxito.`);
      } catch (error) {
        console.error(`[PluginEngine] Error al activar plugin ${record.name}:`, error);
      }
    }
  }
}

export const pluginEngine = new PluginEngine();
