import type { AccessControlRepository } from '../../domain/contracts/AccessControlRepository';

export class CheckPermissionUseCase {
  constructor(private readonly repository: AccessControlRepository) {}

  async execute(userId: string, companyId: string, permission: string): Promise<boolean> {
    return this.repository.hasPermission(userId, companyId, permission);
  }
}
