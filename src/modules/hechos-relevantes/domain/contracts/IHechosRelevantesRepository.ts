import type { BuscarHechosInput, BuscarHechosResult } from "../types/HechosRelevantesTypes";

export interface IHechosRelevantesRepository {
  buscar(input: BuscarHechosInput): Promise<BuscarHechosResult>;
}
