import { registerCoreModule } from "@/core/module-registry";
import { registerCatalogModule } from "@/core/module-registry/register-catalog-module";
import { registerCompanyModule } from "@/core/module-registry/register-company-module";
import { registerLinearRiskModule } from "@/core/module-registry/register-linear-risk-module";
import { registerSimulationModule } from "@/core/module-registry/register-simulation-module";
import { registerStructuralRiskModule } from "@/core/module-registry/register-structural-risk-module";
import { registerMonitoringModule } from "@/core/module-registry/register-monitoring-module";
import { registerHechosRelevantesModule } from "@/core/module-registry/register-hechos-relevantes-module";

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
  registerMonitoringModule();
  registerHechosRelevantesModule();

  bootstrapped = true;
}
