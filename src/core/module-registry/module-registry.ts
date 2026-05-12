import type {
  KirioxModuleContract,
  KirioxOfficialModuleId,
} from "@/shared/contracts/modules/module.contract";

export class KirioxModuleRegistry {
  private readonly modules = new Map<
    KirioxOfficialModuleId,
    KirioxModuleContract
  >();

  register(registryModule: KirioxModuleContract): void {
    const moduleId = registryModule.manifest.id;

    if (this.modules.has(moduleId)) {
      throw new Error(`Module already registered: ${moduleId}`);
    }

    this.modules.set(moduleId, registryModule);
  }

  get(moduleId: KirioxOfficialModuleId): KirioxModuleContract | undefined {
    return this.modules.get(moduleId);
  }

  list(): KirioxModuleContract[] {
    return Array.from(this.modules.values());
  }

  async activate(moduleId: KirioxOfficialModuleId): Promise<void> {
    const registryModule = this.get(moduleId);

    if (!registryModule) {
      throw new Error(`Module not found: ${moduleId}`);
    }

    await registryModule.activate?.();
  }
}

export const kirioxModuleRegistry = new KirioxModuleRegistry();
