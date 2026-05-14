import type { KirioxExtensionPoint } from "@/shared/contracts/core/core-extension-point.contract";

export const hechosRelevantesExtensionPoints: KirioxExtensionPoint[] = [
  {
    id: "incident:dashboard:widget",
    kind: "dashboard:widget",
    owner: "module",
    ownerId: "hechos-relevantes",
    description: "Widgets extensibles para enriquecer la vista de incidentes y hechos relevantes.",
    allowedPluginPermissions: ["register:ui", "read:activity"],
  },
];
