import type { KirioxExtensionPoint } from "@/shared/contracts/core/core-extension-point.contract";

export const structuralRiskExtensionPoints: KirioxExtensionPoint[] = [
  {
    id: "structural-risk:dashboard:widget",
    kind: "dashboard:widget",
    owner: "module",
    ownerId: "structural-risk",
    description: "Widgets extensibles para el dashboard de riesgo estructural y su capa de grafo.",
    allowedPluginPermissions: ["register:ui", "read:risk"],
  },
];
