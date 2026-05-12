import { catalogModule } from "@/modules/catalog";
import { kirioxModuleRegistry } from "./module-registry";

export function registerCatalogModule(): void {
  kirioxModuleRegistry.register(catalogModule);
}
