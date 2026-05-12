import { CatalogImpact } from "../../domain/types";
import { catalogImpactRepository } from "../../infrastructure/repositories/catalogImpactRepository";

export class CatalogImpactUseCase {
  async getAll(): Promise<CatalogImpact[]> {
    return catalogImpactRepository.findAll();
  }

  async create(data: Partial<CatalogImpact>): Promise<CatalogImpact> {
    return catalogImpactRepository.create(data);
  }

  async update(id: number, data: Partial<CatalogImpact>): Promise<CatalogImpact | null> {
    return catalogImpactRepository.update(id, data);
  }

  async delete(id: number): Promise<void> {
    return catalogImpactRepository.delete(id);
  }
}

export const catalogImpactUseCase = new CatalogImpactUseCase();
