import { companyModule } from "@/modules/company";
import { kirioxModuleRegistry } from "./module-registry";

export function registerCompanyModule(): void {
  kirioxModuleRegistry.register(companyModule);
}
