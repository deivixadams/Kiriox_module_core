export type PluginLoader<TManifest = unknown> = () => Promise<TManifest>;

export interface InstalledPlugin<TManifest = unknown> {
  id: string;
  load: PluginLoader<TManifest>;
}

export function definePlugin<TManifest>(
  plugin: InstalledPlugin<TManifest>,
): InstalledPlugin<TManifest> {
  return plugin;
}
