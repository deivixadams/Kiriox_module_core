import { monitoringModule } from "@/modules/monitoring";
import { kirioxModuleRegistry } from "./module-registry";

export function registerMonitoringModule(): void {
  kirioxModuleRegistry.register(monitoringModule);
}
