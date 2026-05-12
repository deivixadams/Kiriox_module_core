import { linearRiskModule } from "@/modules/linear-risk";
import { kirioxModuleRegistry } from "./module-registry";

export function registerLinearRiskModule(): void {
  kirioxModuleRegistry.register(linearRiskModule);
}
