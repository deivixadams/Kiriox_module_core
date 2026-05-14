import type {
  KirioxCoreExtensionPointContract,
  KirioxExtensionPoint,
} from "@/shared/contracts/core/core-extension-point.contract";
import { hechosRelevantesExtensionPoints } from "@/modules/hechos-relevantes/hechos-relevantes.extension-points";
import { linearRiskExtensionPoints } from "@/modules/linear-risk/linear-risk.extension-points";
import { monitoringExtensionPoints } from "@/modules/monitoring/monitoring.extension-points";
import { simulationExtensionPoints } from "@/modules/simulation/simulation.extension-points";
import { structuralRiskExtensionPoints } from "@/modules/structural-risk/structural-risk.extension-points";

const declaredExtensionPoints: KirioxExtensionPoint[] = [
  ...hechosRelevantesExtensionPoints,
  ...linearRiskExtensionPoints,
  ...monitoringExtensionPoints,
  ...structuralRiskExtensionPoints,
  ...simulationExtensionPoints,
];

class KirioxExtensionPointRegistry
  implements KirioxCoreExtensionPointContract
{
  private readonly points = new Map<string, KirioxExtensionPoint>();

  constructor(seed: KirioxExtensionPoint[]) {
    seed.forEach((point) => this.register(point));
  }

  register(point: KirioxExtensionPoint): void {
    this.points.set(point.id, point);
  }

  get(pointId: string): KirioxExtensionPoint | undefined {
    return this.points.get(pointId);
  }

  list(): KirioxExtensionPoint[] {
    return [...this.points.values()];
  }
}

export const kirioxExtensionPointRegistry =
  new KirioxExtensionPointRegistry(declaredExtensionPoints);

export const declaredKirioxExtensionPoints = declaredExtensionPoints;
