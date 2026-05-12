import { registerCoreModule } from "@/core/module-registry";
import { registerCatalogModule } from "@/core/module-registry/register-catalog-module";
import { registerCompanyModule } from "@/core/module-registry/register-company-module";

let bootstrapped = false;

export function bootstrapCore(): void {
  if (bootstrapped) {
    return;
  }

  registerCoreModule();
  registerCatalogModule();
  registerCompanyModule();

  bootstrapped = true;
}
