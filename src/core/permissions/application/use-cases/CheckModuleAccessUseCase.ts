import type { AccessControlRepository } from '../../domain/contracts/AccessControlRepository';
import type { ModuleCode } from '@/shared/types';

export class CheckModuleAccessUseCase {
  constructor(private readonly repository: AccessControlRepository) {}

  async execute(companyId: string, module: ModuleCode): Promise<boolean> {
    return this.repository.isModuleEnabled(companyId, module);
  }
}
