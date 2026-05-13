export type CategoriaEvento =
  | 'hecho_relevante'
  | 'calificacion_riesgo'
  | 'fondo_inversion'
  | 'safi_administradora'
  | 'valor_cuota'
  | 'estados_financieros'
  | 'regulacion_cumplimiento'
  | 'sancion_advertencia'
  | 'cambio_reglamento'
  | 'emision_cuotas'
  | 'deterioro_alerta'
  | 'otro';

export type Relevancia = 'bajo' | 'medio' | 'alto' | 'critico';

export interface HechoCapturado {
  id: string;
  titulo: string;
  url: string;
  dominio: string;
  tipo_documento: 'PDF' | 'HTML' | 'otro';
  fecha_detectada: string | null;
  fuente: string;
  fragmento: string;
  hash: string;
  fecha_captura: string;
  categoria: CategoriaEvento;
  entidad: string;
  riesgo_sugerido: string;
  control_afectado: string;
  relevancia: Relevancia;
  estado: 'capturado' | 'sin_acceso' | 'error';
  query_origen: string;
  riesgo_lineal: { impacto: string; probabilidad: string; prioridad: string };
  riesgo_estructural: { descripcion: string };
}

export interface BuscarHechosInput {
  queries?: string[];
  fechaDesde?: string;
  fechaHasta?: string;
}

export interface BuscarHechosResult {
  results: HechoCapturado[];
  total: number;
}
