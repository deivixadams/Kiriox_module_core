import { ReportesRepository } from './reportes.repository';
import { ReportesService } from './reportes.service';

// Initialize instances
const reportesRepository = new ReportesRepository();
const reportesService = new ReportesService(reportesRepository);

// Export instances and types
export { reportesService as ReportesModule };
export * from "./reportes.module";
export * from './reportes.types';
export * from './reportes.contract';
