import { registerCoreModule } from "@/core/module-registry";
import { registerCatalogModule } from "@/core/module-registry/register-catalog-module";
import { registerCompanyModule } from "@/core/module-registry/register-company-module";
import { registerLinearRiskModule } from "@/core/module-registry/register-linear-risk-module";

let bootstrapped = false;

export function bootstrapCore(): void {
  if (bootstrapped) {
    return;
  }

  registerCoreModule();
  registerCatalogModule();
  registerCompanyModule();
  registerLinearRiskModule();

  bootstrapped = true;
}
