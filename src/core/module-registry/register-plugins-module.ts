import { kirioxModuleRegistry } from "./module-registry";
import { pluginsModule } from "@/modules/plugins";

export function registerPluginsModule(): void {
  kirioxModuleRegistry.register(pluginsModule);
}
