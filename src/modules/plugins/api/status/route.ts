import { NextResponse } from "next/server";
import { pluginGovernanceService } from "@/core/plugin-engine/plugin-governance";

type PluginStatusAction = "activate" | "deactivate";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      id?: string;
      action?: PluginStatusAction;
    };

    if (!body.id || !body.action) {
      return NextResponse.json(
        { error: "id y action son obligatorios." },
        { status: 400 },
      );
    }

    const plugin =
      body.action === "activate"
        ? await pluginGovernanceService.activatePlugin(body.id)
        : await pluginGovernanceService.disablePlugin(body.id);

    return NextResponse.json({
      success: true,
      status: plugin.status,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 },
    );
  }
}
