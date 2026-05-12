import { CompanyRecord, CompanyDTO } from "../../domain/types";
import { companyRepository } from "../../infrastructure/repositories/companyRepository";

function mapToDTO(row: CompanyRecord): CompanyDTO {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    legalName: row.legal_name ?? "",
    description: row.description ?? "",
    status: row.status,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export class CompanyUseCase {
  async getAll(): Promise<CompanyDTO[]> {
    const rows = await companyRepository.findAll();
    return rows.map(mapToDTO);
  }

  async create(data: {
    name: string;
    legalName?: string;
    description?: string;
    status?: boolean;
    createdAt?: string;
    updatedAt?: string;
  }): Promise<CompanyDTO> {
    const code = await companyRepository.buildUniqueCode(data.name);
    const row = await companyRepository.create({
      code,
      name: data.name,
      legalName: data.legalName?.trim() || null,
      description: data.description?.trim() || null,
      status: data.status !== false,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
    return mapToDTO(row);
  }

  async update(
    id: string,
    data: {
      name: string;
      legalName?: string;
      description?: string;
      status?: boolean;
      createdAt?: string;
      updatedAt?: string;
    }
  ): Promise<CompanyDTO> {
    const existing = await companyRepository.findById(id);
    if (!existing) throw new Error("Company not found");
    const row = await companyRepository.update(id, {
      name: data.name,
      legalName: data.legalName?.trim() || null,
      description: data.description?.trim() || null,
      status: data.status !== false,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
    return mapToDTO(row);
  }

  async delete(id: string): Promise<void> {
    const existing = await companyRepository.findById(id);
    if (!existing) throw new Error("Company not found");
    await companyRepository.delete(id);
  }
}

export const companyUseCase = new CompanyUseCase();
