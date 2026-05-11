export type ModuleLoader<TManifest = unknown> = () => Promise<TManifest>;

export interface RegisteredModule<TManifest = unknown> {
  id: string;
  load: ModuleLoader<TManifest>;
}

export function defineModule<TManifest>(
  module: RegisteredModule<TManifest>,
): RegisteredModule<TManifest> {
  return module;
}
