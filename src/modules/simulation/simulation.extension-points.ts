import type { KirioxExtensionPoint } from "@/shared/contracts/core/core-extension-point.contract";

export const simulationExtensionPoints: KirioxExtensionPoint[] = [
  {
    id: "simulation:dashboard:widget",
    kind: "dashboard:widget",
    owner: "module",
    ownerId: "simulation",
    description: "Widgets extensibles para el dashboard de simulaciones y escenarios.",
    allowedPluginPermissions: ["register:ui", "read:risk"],
  },
];
