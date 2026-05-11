export interface ModuleValidationResult {
  ok: boolean;
  issues: string[];
}

export function validateModuleManifest(
  manifest: Record<string, unknown>,
): ModuleValidationResult {
  const issues: string[] = [];

  if (!manifest.id) issues.push("Missing module id.");
  if (!manifest.name) issues.push("Missing module name.");
  if (!manifest.version) issues.push("Missing module version.");

  return {
    ok: issues.length === 0,
    issues,
  };
}
