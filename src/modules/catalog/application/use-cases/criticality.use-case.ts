import { CatalogActivityCriticalityLevel } from "../../domain/types";
import { catalogCriticalityRepository } from "../../infrastructure/repositories/catalogCriticalityRepository";

export class CatalogCriticalityUseCase {
  async getAll(): Promise<CatalogActivityCriticalityLevel[]> {
    return catalogCriticalityRepository.findAll();
  }

  async create(data: Partial<CatalogActivityCriticalityLevel>): Promise<CatalogActivityCriticalityLevel> {
    return catalogCriticalityRepository.create(data);
  }

  async update(id: string, data: Partial<CatalogActivityCriticalityLevel>): Promise<CatalogActivityCriticalityLevel | null> {
    return catalogCriticalityRepository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    return catalogCriticalityRepository.delete(id);
  }
}

export const catalogCriticalityUseCase = new CatalogCriticalityUseCase();
