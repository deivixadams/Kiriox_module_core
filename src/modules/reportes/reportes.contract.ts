import { 
  Reporte, 
  ReporteFilters, 
  ReporteCategoria, 
  RegistrarRemisionInput, 
  ReporteRemision, 
  MarcarReporteObservadoInput, 
  ReportesKpis 
} from './reportes.types';

export interface ReportesModuleContract {
  listReportes(filters?: ReporteFilters): Promise<Reporte[]>;
  getReporteById(id: string): Promise<Reporte | null>;
  getReportesByCategoria(categoria: ReporteCategoria): Promise<Reporte[]>;
  getReportesPendientes(): Promise<Reporte[]>;
  getReportesCriticos(): Promise<Reporte[]>;
  getReportesPorVencer(): Promise<Reporte[]>;
  registrarRemision(input: RegistrarRemisionInput): Promise<ReporteRemision>;
  marcarComoObservado(input: MarcarReporteObservadoInput): Promise<Reporte>;
  obtenerKpis(): Promise<ReportesKpis>;
}

export type ReporteEvento = 
  | 'reporte.creado'
  | 'reporte.actualizado'
  | 'reporte.remitido'
  | 'reporte.observado'
  | 'reporte.vencido'
  | 'reporte.plantilla_descargada';

export interface IntegrationEvent<T = any> {
  type: ReporteEvento;
  payload: T;
  timestamp: Date;
}
