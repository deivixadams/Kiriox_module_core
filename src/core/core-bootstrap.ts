import { registerCoreModule } from "@/core/module-registry";
import { registerCatalogModule } from "@/core/module-registry/register-catalog-module";
import { registerCompanyModule } from "@/core/module-registry/register-company-module";
import { registerLinearRiskModule } from "@/core/module-registry/register-linear-risk-module";
import { registerSimulationModule } from "@/core/module-registry/register-simulation-module";
import { registerStructuralRiskModule } from "@/core/module-registry/register-structural-risk-module";

let bootstrapped = false;

export function bootstrapCore(): void {
  if (bootstrapped) {
    return;
  }

  registerCoreModule();
  registerCatalogModule();
  registerCompanyModule();
  registerLinearRiskModule();
  registerStructuralRiskModule();
  registerSimulationModule();

  bootstrapped = true;
}
