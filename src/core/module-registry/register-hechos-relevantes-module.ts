import { hechosRelevantesModule } from "@/modules/hechos-relevantes";
import { kirioxModuleRegistry } from "./module-registry";

export function registerHechosRelevantesModule(): void {
  kirioxModuleRegistry.register(hechosRelevantesModule);
}
