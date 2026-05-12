import { CatalogAppetite } from "../../domain/types";
import { catalogAppetiteRepository } from "../../infrastructure/repositories/catalogAppetiteRepository";

export class CatalogAppetiteUseCase {
  async getAll(): Promise<CatalogAppetite[]> {
    return catalogAppetiteRepository.findAll();
  }

  async create(data: Partial<CatalogAppetite>): Promise<CatalogAppetite> {
    return catalogAppetiteRepository.create(data);
  }

  async update(id: string, data: Partial<CatalogAppetite>): Promise<CatalogAppetite | null> {
    return catalogAppetiteRepository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    return catalogAppetiteRepository.delete(id);
  }
}

export const catalogAppetiteUseCase = new CatalogAppetiteUseCase();
