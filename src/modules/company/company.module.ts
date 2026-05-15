import type { KirioxModuleContract } from "@/shared/contracts/modules/module.contract";

export const companyModule: KirioxModuleContract = {
  manifest: {
    id: "company",
    name: "Company",
    version: "0.1.0",
    description: "Módulo de gestión de empresa de Kiriox.",
    status: "active",
    layers: ["domain", "application", "infrastructure", "api", "ui"],
    dependencies: ["core"],
    nav: {
      label: "Empresa",
      href: "/gestion/dashboard_empresa",
      icon: "Building2",
      order: 15,
    },
  },

  register() {
    return;
  },

  activate() {
    return;
  },
};
