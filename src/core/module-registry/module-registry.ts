import type { KirioxModuleContract } from "@/shared/contracts/modules/module.contract";

export class KirioxModuleRegistry {
  private readonly modules = new Map<string, KirioxModuleContract>();

  register(module: KirioxModuleContract): void {
    const moduleId = module.manifest.id;

    if (this.modules.has(moduleId)) {
      throw new Error(`Module already registered: ${moduleId}`);
    }

    this.modules.set(moduleId, module);
  }

  get(moduleId: string): KirioxModuleContract | undefined {
    return this.modules.get(moduleId);
  }

  list(): KirioxModuleContract[] {
    return Array.from(this.modules.values());
  }

  async activate(moduleId: string): Promise<void> {
    const module = this.modules.get(moduleId);

    if (!module) {
      throw new Error(`Module not found: ${moduleId}`);
    }

    await module.activate?.();
  }

  async deactivate(moduleId: string): Promise<void> {
    const module = this.modules.get(moduleId);

    if (!module) {
      throw new Error(`Module not found: ${moduleId}`);
    }

    await module.deactivate?.();
  }
}

export const kirioxModuleRegistry = new KirioxModuleRegistry();
