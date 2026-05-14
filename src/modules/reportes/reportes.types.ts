export type ReportePeriodicidad = "Diario" | "Semanal" | "Mensual" | "Trimestral" | "Anual" | "Eventual";
export type ReporteResponsable = "Riesgo" | "Operaciones" | "Contabilidad" | "Cumplimiento" | "Compartido";
export type ReporteEstado = "pendiente" | "remitido" | "observado" | "vencido" | "en_preparacion";
export type ReporteCriticidad = "alta" | "media" | "baja";
export type ReporteCategoria = "Liquidez" | "Concentración" | "Portafolio" | "Valoración" | "Publicación" | "Trazabilidad histórica";

export interface Reporte {
  id: string;
  nombre: string;
  categoria: ReporteCategoria;
  descripcion: string;
  periodicidad: ReportePeriodicidad;
  responsable: ReporteResponsable;
  plantillaOficial: boolean;
  urlPlantilla?: string;
  estado: ReporteEstado;
  criticidad: ReporteCriticidad;
  fechaLimite?: string;
  ultimaRemision?: string;
}

export interface ReporteRemision {
  id: string;
  reporteId: string;
  fechaRemision: string;
  usuarioId: string;
  comentarios?: string;
  archivoUrl?: string;
}

export interface ReportesKpis {
  total: number;
  conPlantilla: number;
  criticos: number;
  diarios: number;
  porVencer: number;
  remitidos: number;
  pendientes: number;
  observados: number;
}

export interface ReporteFilters {
  categoria?: ReporteCategoria;
  estado?: ReporteEstado;
  criticidad?: ReporteCriticidad;
  responsable?: ReporteResponsable;
}

export interface RegistrarRemisionInput {
  reporteId: string;
  comentarios?: string;
  archivoUrl?: string;
}

export interface MarcarReporteObservadoInput {
  reporteId: string;
  observacion: string;
}
