import { ReportesModuleContract } from './reportes.contract';
import { 
  Reporte, 
  ReporteFilters, 
  ReporteCategoria, 
  RegistrarRemisionInput, 
  ReporteRemision, 
  MarcarReporteObservadoInput, 
  ReportesKpis 
} from './reportes.types';
import { ReportesRepository } from './reportes.repository';

export class ReportesService implements ReportesModuleContract {
  constructor(private repository: ReportesRepository) {}

  async listReportes(filters?: ReporteFilters): Promise<Reporte[]> {
    let reportes = await this.repository.findAll();
    
    if (filters) {
      if (filters.categoria) {
        reportes = reportes.filter(r => r.categoria === filters.categoria);
      }
      if (filters.estado) {
        reportes = reportes.filter(r => r.estado === filters.estado);
      }
      if (filters.criticidad) {
        reportes = reportes.filter(r => r.criticidad === filters.criticidad);
      }
      if (filters.responsable) {
        reportes = reportes.filter(r => r.responsable === filters.responsable);
      }
    }
    
    return reportes;
  }

  async getReporteById(id: string): Promise<Reporte | null> {
    return this.repository.findById(id);
  }

  async getReportesByCategoria(categoria: ReporteCategoria): Promise<Reporte[]> {
    return this.repository.findByCategoria(categoria);
  }

  async getReportesPendientes(): Promise<Reporte[]> {
    return this.repository.findByEstado('pendiente');
  }

  async getReportesCriticos(): Promise<Reporte[]> {
    return this.repository.findByCriticidad('alta');
  }

  async getReportesPorVencer(): Promise<Reporte[]> {
    // Simplified logic: reports with status 'pendiente' and a close deadline
    const reportes = await this.repository.findAll();
    return reportes.filter(r => r.estado === 'pendiente' && r.fechaLimite);
  }

  async registrarRemision(input: RegistrarRemisionInput): Promise<ReporteRemision> {
    const reporte = await this.repository.findById(input.reporteId);
    if (!reporte) throw new Error('Reporte no encontrado');

    const updatedReporte: Reporte = {
      ...reporte,
      estado: 'remitido',
      ultimaRemision: new Date().toISOString().split('T')[0]
    };

    await this.repository.update(updatedReporte);

    return {
      id: `REM-${Date.now()}`,
      reporteId: input.reporteId,
      fechaRemision: new Date().toISOString(),
      usuarioId: 'SYS-001', // Mock user
      comentarios: input.comentarios,
      archivoUrl: input.archivoUrl
    };
  }

  async marcarComoObservado(input: MarcarReporteObservadoInput): Promise<Reporte> {
    const reporte = await this.repository.findById(input.reporteId);
    if (!reporte) throw new Error('Reporte no encontrado');

    const updatedReporte: Reporte = {
      ...reporte,
      estado: 'observado'
    };

    return this.repository.update(updatedReporte);
  }

  async obtenerKpis(): Promise<ReportesKpis> {
    const reportes = await this.repository.findAll();
    
    return {
      total: reportes.length,
      conPlantilla: reportes.filter(r => r.plantillaOficial).length,
      criticos: reportes.filter(r => r.criticidad === 'alta').length,
      diarios: reportes.filter(r => r.periodicidad === 'Diario').length,
      porVencer: reportes.filter(r => r.estado === 'pendiente' && r.fechaLimite && new Date(r.fechaLimite) < new Date('2026-05-20')).length, // Mock logic
      remitidos: reportes.filter(r => r.estado === 'remitido').length,
      pendientes: reportes.filter(r => r.estado === 'pendiente').length,
      observados: reportes.filter(r => r.estado === 'observado').length
    };
  }
}
