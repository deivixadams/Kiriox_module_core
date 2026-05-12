import { CatalogControlType } from "../../domain/types";
import { catalogControlTypeRepository } from "../../infrastructure/repositories/catalogControlTypeRepository";

export class CatalogControlTypeUseCase {
  async getAll(): Promise<CatalogControlType[]> {
    return catalogControlTypeRepository.findAll();
  }

  async create(data: Partial<CatalogControlType>): Promise<CatalogControlType> {
    return catalogControlTypeRepository.create(data);
  }

  async update(id: string, data: Partial<CatalogControlType>): Promise<CatalogControlType | null> {
    return catalogControlTypeRepository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    return catalogControlTypeRepository.delete(id);
  }
}

export const catalogControlTypeUseCase = new CatalogControlTypeUseCase();
