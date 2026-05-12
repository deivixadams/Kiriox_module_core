import { coreModule } from "@/modules/core";
import { kirioxModuleRegistry } from "./module-registry";

export function registerCoreModule(): void {
  kirioxModuleRegistry.register(coreModule);
}
