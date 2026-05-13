import { structuralRiskModule } from "@/modules/structural-risk/structural-risk.module";
import { kirioxModuleRegistry } from "./module-registry";

export function registerStructuralRiskModule(): void {
  kirioxModuleRegistry.register(structuralRiskModule);
}
