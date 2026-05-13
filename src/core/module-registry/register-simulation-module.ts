import { simulationModule } from "@/modules/simulation";
import { kirioxModuleRegistry } from "./module-registry";

export function registerSimulationModule(): void {
  kirioxModuleRegistry.register(simulationModule);
}
