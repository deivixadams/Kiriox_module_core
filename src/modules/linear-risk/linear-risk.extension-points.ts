import type { KirioxExtensionPoint } from "@/shared/contracts/core/core-extension-point.contract";

export const linearRiskExtensionPoints: KirioxExtensionPoint[] = [
  {
    id: "linear-risk:dashboard:widget",
    kind: "dashboard:widget",
    owner: "module",
    ownerId: "linear-risk",
    description: "Widgets extensibles para el dashboard de evaluaciones de riesgo lineal.",
    allowedPluginPermissions: ["register:ui", "read:risk"],
  },
];
