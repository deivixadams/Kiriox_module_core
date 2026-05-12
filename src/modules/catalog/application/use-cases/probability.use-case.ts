import { CatalogProbability } from "../../domain/types";
import { catalogProbabilityRepository } from "../../infrastructure/repositories/catalogProbabilityRepository";

export class CatalogProbabilityUseCase {
  async getAll(): Promise<CatalogProbability[]> {
    return catalogProbabilityRepository.findAll();
  }

  async create(data: Partial<CatalogProbability>): Promise<CatalogProbability> {
    return catalogProbabilityRepository.create(data);
  }

  async update(id: number, data: Partial<CatalogProbability>): Promise<CatalogProbability | null> {
    return catalogProbabilityRepository.update(id, data);
  }

  async delete(id: number): Promise<void> {
    return catalogProbabilityRepository.delete(id);
  }
}

export const catalogProbabilityUseCase = new CatalogProbabilityUseCase();
