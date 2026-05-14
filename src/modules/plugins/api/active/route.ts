import { NextResponse } from "next/server";
import { pluginGovernanceService } from "@/core/plugin-engine/plugin-governance";
import type { KirioxPluginExtensionPoint } from "@/shared/contracts/plugins/plugin.contract";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pointId = searchParams.get("pointId") as KirioxPluginExtensionPoint | null;

    if (!pointId) {
      return NextResponse.json(
        { error: "pointId es obligatorio." },
        { status: 400 },
      );
    }

    return NextResponse.json(pluginGovernanceService.listActiveForPoint(pointId));
  } catch (error) {
    console.error("[PluginsModule] Error al listar plugins activos:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
