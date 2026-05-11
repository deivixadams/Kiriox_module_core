export interface PluginValidationResult {
  ok: boolean;
  issues: string[];
}

export function validatePluginManifest(
  manifest: Record<string, unknown>,
): PluginValidationResult {
  const issues: string[] = [];

  if (!manifest.id) issues.push("Missing plugin id.");
  if (!manifest.name) issues.push("Missing plugin name.");
  if (!manifest.version) issues.push("Missing plugin version.");

  return {
    ok: issues.length === 0,
    issues,
  };
}
