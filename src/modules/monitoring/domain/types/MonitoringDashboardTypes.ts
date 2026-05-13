export type Kpis = {
  total: number;
  vencidos: number;
  proximos: number;
  vigentes: number;
  sin_fecha: number;
  con_fecha: number;
};

export type CatItem = {
  category: string;
  total: number;
  vencidos: number;
  proximos: number;
  vigentes: number;
  sin_fecha: number;
};

export type MonitorItem = {
  id: string;
  title: string;
  category: string;
  due_date: string;
  dias_restantes: number;
  date_status: string;
};

export type AlertaRiesgoResidual = {
  id: string;
  title: string;
  category: string;
  trigger_type: string;
  status: string;
  sev_key: string;
  due_date: string | null;
  event_date: string;
  responsible_name: string | null;
  current_value: number | null;
  threshold_value: number | null;
};

export type SimpleEvento = {
  id: string;
  title: string;
  status: string;
  sev_key: string;
  due_date: string | null;
  event_date: string;
  responsible_name: string | null;
};

export type DashboardData = {
  kpis: Kpis;
  por_categoria: CatItem[];
  proximos_vencimientos: MonitorItem[];
  elementos_vencidos: MonitorItem[];
  alertas_riesgo_residual: AlertaRiesgoResidual[];
  controles_sin_evidencia: SimpleEvento[];
  riesgos_sin_control: SimpleEvento[];
  ultima_actualizacion: string | null;
};
