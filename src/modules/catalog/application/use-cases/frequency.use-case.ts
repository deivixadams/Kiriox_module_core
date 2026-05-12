import { CatalogFrequency } from "../../domain/types";
import { catalogFrequencyRepository } from "../../infrastructure/repositories/catalogFrequencyRepository";

export class CatalogFrequencyUseCase {
  async getAll(): Promise<CatalogFrequency[]> {
    return catalogFrequencyRepository.findAll();
  }

  async create(data: Partial<CatalogFrequency>): Promise<CatalogFrequency> {
    return catalogFrequencyRepository.create(data);
  }

  async update(id: string, data: Partial<CatalogFrequency>): Promise<CatalogFrequency | null> {
    return catalogFrequencyRepository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    return catalogFrequencyRepository.delete(id);
  }
}

export const catalogFrequencyUseCase = new CatalogFrequencyUseCase();
