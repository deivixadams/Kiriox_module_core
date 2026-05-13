import type { IHechosRelevantesRepository } from "@/modules/hechos-relevantes/domain/contracts/IHechosRelevantesRepository";
import type { BuscarHechosInput, BuscarHechosResult } from "@/modules/hechos-relevantes/domain/types/HechosRelevantesTypes";

export class BuscarHechosRelevantesUseCase {
  constructor(private readonly repo: IHechosRelevantesRepository) {}

  async execute(input: BuscarHechosInput): Promise<BuscarHechosResult> {
    return this.repo.buscar(input);
  }
}
