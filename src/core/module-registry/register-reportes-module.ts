import { reportesModule } from "@/modules/reportes";
import { kirioxModuleRegistry } from "./module-registry";

export function registerReportesModule(): void {
  kirioxModuleRegistry.register(reportesModule);
}
