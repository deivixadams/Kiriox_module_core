import { ObjectiveDTO, ObjectiveRecord } from "../../domain/types";
import { ObjectiveRepository } from "../../infrastructure/repositories/objectiveRepository";

export class ObjectiveUseCase {
  constructor(private repository: ObjectiveRepository) {}

  async getByCompany(companyId: string): Promise<ObjectiveDTO[]> {
    const rows = await this.repository.findByCompanyId(companyId);
    return rows.map(this.mapToDTO);
  }

  async create(data: {
    company_id: string;
    objective_name: string;
    objective_code?: string;
    objective_description?: string;
    kpi?: string;
    sequence_order?: number;
    is_active?: boolean;
    rationale?: any;
    appetite_id?: string;
  }): Promise<ObjectiveDTO | null> {
    const count = await this.repository.countByCompanyId(data.company_id);
    
    const sequence = data.sequence_order ?? (count + 1);
    const codeSuffix = String(count + 1).padStart(3, '0');
    const objectiveCode = data.objective_code || `OBJ-${codeSuffix}`;

    let appetiteId: string | null = null;
    if (data.appetite_id) {
      const exists = await this.repository.findAppetiteById(data.appetite_id);
      if (exists) appetiteId = data.appetite_id;
    }

    const createdId = await this.repository.create({
      company_id: data.company_id,
      objective_code: objectiveCode,
      objective_name: data.objective_name,
      objective_description: data.objective_description || null,
      kpi: data.kpi || null,
      sequence_order: sequence,
      is_active: data.is_active ?? true,
      rationale: data.rationale || null,
      id_appetite: appetiteId
    });

    const created = await this.repository.findById(createdId);
    return created ? this.mapToDTO(created) : null;
  }

  async update(objectiveId: string, data: any): Promise<ObjectiveDTO | null> {
    const current = await this.repository.findById(objectiveId);
    if (!current) return null;

    let appetiteId = current.id_appetite;
    if (data.appetite_id !== undefined) {
      if (data.appetite_id === null || data.appetite_id === "") {
        appetiteId = null;
      } else {
        const exists = await this.repository.findAppetiteById(data.appetite_id);
        if (exists) appetiteId = data.appetite_id;
      }
    }

    await this.repository.update(objectiveId, {
      objective_name: data.objective_name,
      objective_description: data.objective_description,
      kpi: data.kpi,
      sequence_order: data.sequence_order,
      is_active: data.is_active,
      id_appetite: appetiteId
    });

    const updated = await this.repository.findById(objectiveId);
    return updated ? this.mapToDTO(updated) : null;
  }

  async delete(objectiveId: string): Promise<boolean> {
    const exists = await this.repository.findById(objectiveId);
    if (!exists) return false;
    await this.repository.delete(objectiveId);
    return true;
  }

  private mapToDTO(row: any): ObjectiveDTO {
    return {
      objective_id: row.objective_id,
      company_id: row.company_id,
      objective_code: row.objective_code,
      objective_name: row.objective_name,
      objective_description: row.objective_description,
      rationale: row.rationale,
      sequence_order: row.sequence_order,
      is_active: row.is_active,
      created_at: row.created_at ? new Date(row.created_at).toISOString() : null,
      updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : null,
      kpi: row.kpi,
      id_appetite: row.id_appetite,
      company_objective_appetite: row.appetite_id
        ? {
            id: row.appetite_id,
            appetite_level: row.appetite_level,
            tolerance_min: row.tolerance_min,
            tolerance_max: row.tolerance_max,
            metric_name: row.metric_name,
            metric_unit: row.metric_unit,
            status: row.appetite_status,
          }
        : null,
    };
  }
}
