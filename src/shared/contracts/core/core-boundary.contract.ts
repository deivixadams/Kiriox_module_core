export interface CoreAuthContract {
  getActor(): Promise<unknown>;
  requireAuthenticatedActor(): Promise<unknown>;
}

export interface CorePermissionContract {
  hasPermission(input: {
    actorId: string;
    permission: string;
    tenantId?: string;
    moduleId?: string;
  }): Promise<boolean>;
}

export interface CoreNavigationContract {
  getNavigationTree(input: {
    actorId: string;
    tenantId: string;
  }): Promise<unknown>;
}

export interface CoreModuleRegistryContract {
  listModules(): Promise<unknown[]>;
  getModuleById(moduleId: string): Promise<unknown | null>;
}

export interface CorePluginRegistryContract {
  listInstalledPlugins(): Promise<unknown[]>;
  getPluginById(pluginId: string): Promise<unknown | null>;
}

export interface CoreEventBusContract {
  publish(event: unknown): Promise<void>;
  subscribe(topic: string, handler: (event: unknown) => Promise<void> | void): void;
}

export interface CoreSdkContract {
  getSdkContext(): Promise<unknown>;
}

export interface CoreAuditContract {
  recordAuditEntry(entry: unknown): Promise<void>;
}

export interface CoreExtensionPointContract {
  listExtensionPoints(): Promise<unknown[]>;
  resolveExtensionPoint(extensionPointId: string): Promise<unknown | null>;
}

export interface CoreAccessContract {
  assertAccess(input: {
    actorId: string;
    tenantId: string;
    resource: string;
    action: string;
    moduleId?: string;
  }): Promise<void>;
}
