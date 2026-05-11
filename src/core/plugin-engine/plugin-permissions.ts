export interface PluginPermissionGrant {
  pluginId: string;
  permissions: string[];
}

export function definePluginPermissions(
  pluginId: string,
  permissions: string[],
): PluginPermissionGrant {
  return { pluginId, permissions };
}
