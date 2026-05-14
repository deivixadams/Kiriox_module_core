import { Reporte, ReporteCategoria, ReporteEstado, ReporteCriticidad, ReportePeriodicidad, ReporteResponsable } from './reportes.types';

export class ReportesRepository {
  private reportes: Reporte[] = [
    {
      id: "REP-001",
      nombre: "Porcentaje de liquidez",
      categoria: "Liquidez",
      descripcion: "Reporte de cumplimiento de límites de liquidez mínima.",
      periodicidad: "Diario",
      responsable: "Riesgo",
      plantillaOficial: true,
      estado: "remitido",
      criticidad: "alta",
      fechaLimite: "2026-05-15",
      ultimaRemision: "2026-05-13"
    },
    {
      id: "REP-014",
      nombre: "Brecha de liquidez por plazo",
      categoria: "Liquidez",
      descripcion: "Análisis de descalces de plazos entre activos y pasivos.",
      periodicidad: "Semanal",
      responsable: "Riesgo",
      plantillaOficial: true,
      estado: "remitido",
      criticidad: "media",
      ultimaRemision: "2026-05-08"
    },
    {
      id: "REP-015",
      nombre: "Concentración por sector económico",
      categoria: "Concentración",
      descripcion: "Exposición del portafolio por sectores industriales.",
      periodicidad: "Trimestral",
      responsable: "Cumplimiento",
      plantillaOficial: false,
      estado: "pendiente",
      criticidad: "baja",
      fechaLimite: "2026-06-30"
    },
    {
      id: "REP-002",
      nombre: "Límites de participación de aportante",
      categoria: "Concentración",
      descripcion: "Análisis de concentración de inversionistas por fondo.",
      periodicidad: "Mensual",
      responsable: "Cumplimiento",
      plantillaOficial: true,
      estado: "pendiente",
      criticidad: "media",
      fechaLimite: "2026-05-30"
    },
    {
      id: "REP-003",
      nombre: "Portafolio de inversiones en renta fija",
      categoria: "Portafolio",
      descripcion: "Detalle de instrumentos de deuda en el portafolio.",
      periodicidad: "Diario",
      responsable: "Operaciones",
      plantillaOficial: true,
      estado: "en_preparacion",
      criticidad: "alta",
      fechaLimite: "2026-05-14"
    },
    {
      id: "REP-004",
      nombre: "Portafolio de inversiones en renta variable",
      categoria: "Portafolio",
      descripcion: "Detalle de acciones y cuotas de fondos.",
      periodicidad: "Diario",
      responsable: "Operaciones",
      plantillaOficial: true,
      estado: "remitido",
      criticidad: "media",
      ultimaRemision: "2026-05-13"
    },
    {
      id: "REP-005",
      nombre: "Portafolio de inversiones otras",
      categoria: "Portafolio",
      descripcion: "Inversiones alternativas y otros activos.",
      periodicidad: "Mensual",
      responsable: "Operaciones",
      plantillaOficial: false,
      estado: "pendiente",
      criticidad: "baja",
      fechaLimite: "2026-06-05"
    },
    {
      id: "REP-006",
      nombre: "Valoración de los valores de fondos abiertos",
      categoria: "Valoración",
      descripcion: "Cálculo del valor cuota diario de fondos abiertos.",
      periodicidad: "Diario",
      responsable: "Contabilidad",
      plantillaOficial: true,
      estado: "observado",
      criticidad: "alta",
      fechaLimite: "2026-05-13"
    },
    {
      id: "REP-007",
      nombre: "Valoración de los valores de fondos cerrados",
      categoria: "Valoración",
      descripcion: "Cálculo del valor cuota de fondos cerrados.",
      periodicidad: "Semanal",
      responsable: "Contabilidad",
      plantillaOficial: true,
      estado: "remitido",
      criticidad: "alta",
      ultimaRemision: "2026-05-10"
    },
    {
      id: "REP-008",
      nombre: "Información diaria a publicar",
      categoria: "Publicación",
      descripcion: "Datos para publicación en el portal web y SMV.",
      periodicidad: "Diario",
      responsable: "Operaciones",
      plantillaOficial: true,
      estado: "pendiente",
      criticidad: "media",
      fechaLimite: "2026-05-14"
    },
    {
      id: "REP-009",
      nombre: "Históricos de portafolio",
      categoria: "Trazabilidad histórica",
      descripcion: "Histórico consolidado de movimientos de portafolio.",
      periodicidad: "Anual",
      responsable: "Riesgo",
      plantillaOficial: false,
      estado: "en_preparacion",
      criticidad: "baja",
      fechaLimite: "2027-01-15"
    },
    {
      id: "REP-010",
      nombre: "Históricos de liquidez",
      categoria: "Trazabilidad histórica",
      descripcion: "Evolución histórica de brechas de liquidez.",
      periodicidad: "Anual",
      responsable: "Riesgo",
      plantillaOficial: false,
      estado: "pendiente",
      criticidad: "media",
      fechaLimite: "2027-01-15"
    },
    {
      id: "REP-011",
      nombre: "Históricos de valoración",
      categoria: "Trazabilidad histórica",
      descripcion: "Serie histórica de valores cuota.",
      periodicidad: "Anual",
      responsable: "Contabilidad",
      plantillaOficial: false,
      estado: "pendiente",
      criticidad: "media",
      fechaLimite: "2027-01-15"
    },
    {
      id: "REP-012",
      nombre: "Históricos de suscripciones y rescates",
      categoria: "Trazabilidad histórica",
      descripcion: "Registro histórico de flujo de caja de aportantes.",
      periodicidad: "Trimestral",
      responsable: "Operaciones",
      plantillaOficial: false,
      estado: "remitido",
      criticidad: "media",
      ultimaRemision: "2026-04-01"
    },
    {
      id: "REP-013",
      nombre: "Históricos de límites",
      categoria: "Trazabilidad histórica",
      descripcion: "Histórico de excesos y cumplimiento de límites.",
      periodicidad: "Trimestral",
      responsable: "Cumplimiento",
      plantillaOficial: false,
      estado: "vencido",
      criticidad: "alta",
      fechaLimite: "2026-05-01"
    }
  ];

  async findAll(): Promise<Reporte[]> {
    return this.reportes;
  }

  async findById(id: string): Promise<Reporte | null> {
    return this.reportes.find(r => r.id === id) || null;
  }

  async findByCategoria(categoria: ReporteCategoria): Promise<Reporte[]> {
    return this.reportes.filter(r => r.categoria === categoria);
  }

  async findByEstado(estado: ReporteEstado): Promise<Reporte[]> {
    return this.reportes.filter(r => r.estado === estado);
  }

  async findByCriticidad(criticidad: ReporteCriticidad): Promise<Reporte[]> {
    return this.reportes.filter(r => r.criticidad === criticidad);
  }

  async update(reporte: Reporte): Promise<Reporte> {
    const index = this.reportes.findIndex(r => r.id === reporte.id);
    if (index !== -1) {
      this.reportes[index] = reporte;
    }
    return reporte;
  }
}
