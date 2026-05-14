import type { KirioxExtensionPoint } from "@/shared/contracts/core/core-extension-point.contract";

export const monitoringExtensionPoints: KirioxExtensionPoint[] = [
  {
    id: "monitoring:dashboard:widget",
    kind: "dashboard:widget",
    owner: "module",
    ownerId: "monitoring",
    description: "Widgets extensibles para el tablero ejecutivo de monitoreo.",
    allowedPluginPermissions: ["register:ui", "read:risk"],
  },
];
