'use client';

import { useMemo, useState } from 'react';
import styles from './MonteCarloSimulationPage.module.css';

type Fund = 'FICI Interval I' | 'FICD Interval I';
type Distribution = 'uniforme' | 'triangular' | 'normal_truncada' | 'beta' | 'discreta_escenarios';
type SourceType = 'publico' | 'usuario' | 'supuesto_hipotetico' | 'modelo_interno';
type Profile = 'Base' | 'Moderado' | 'Severo' | 'Extremo' | 'Personalizado';

type Param = {
  key: string;
  label: string;
  description: string;
  unit: string;
  min: number;
  max: number;
  defaultValue: number;
  distribution: Distribution;
  source: SourceType;
  value: number;
};

type Rules = {
  lowMax: number;
  mediumMax: number;
  highMax: number;
  decisionLow: string;
  decisionMedium: string;
  decisionHigh: string;
  decisionCritical: string;
};

const DEFAULT_RULES: Rules = {
  lowMax: 5,
  mediumMax: 10,
  highMax: 20,
  decisionLow: 'aceptar o monitorear',
  decisionMedium: 'monitorear o tratar',
  decisionHigh: 'tratar o escalar',
  decisionCritical: 'escalar, restringir o detener',
};

function ficiParams(): Param[] {
  return [
    { key: 'valor_base_fondo', label: 'Valor base fondo', description: 'NAV base', unit: 'moneda', min: 1, max: 2e9, defaultValue: 1e8, distribution: 'uniforme', source: 'supuesto_hipotetico', value: 1e8 },
    { key: 'cuotas_en_circulacion', label: 'Cuotas en circulación', description: 'Total cuotas', unit: 'cuotas', min: 1, max: 1e8, defaultValue: 1e6, distribution: 'uniforme', source: 'supuesto_hipotetico', value: 1e6 },
    { key: 'caja_inicial', label: 'Caja inicial', description: 'Caja al inicio', unit: 'moneda', min: 0, max: 1e9, defaultValue: 12000000, distribution: 'uniforme', source: 'supuesto_hipotetico', value: 12000000 },
    { key: 'ingresos_o_cobros_mensuales_base', label: 'Ingresos mensuales base', description: 'Ingreso mensual esperado', unit: 'moneda', min: 0, max: 1e8, defaultValue: 1900000, distribution: 'uniforme', source: 'supuesto_hipotetico', value: 1900000 },
    { key: 'pagos_mensuales_obligatorios', label: 'Pagos mensuales obligatorios', description: 'Egresos fijos mensuales', unit: 'moneda', min: 0, max: 1e8, defaultValue: 2200000, distribution: 'uniforme', source: 'supuesto_hipotetico', value: 2200000 },
    { key: 'shock_valor_activos_pct', label: 'Shock valor activos', description: 'Caída valor activos', unit: '%', min: 0, max: 95, defaultValue: 8, distribution: 'normal_truncada', source: 'modelo_interno', value: 8 },
    { key: 'shock_renta_pct', label: 'Shock renta', description: 'Reducción de renta', unit: '%', min: 0, max: 95, defaultValue: 12, distribution: 'triangular', source: 'modelo_interno', value: 12 },
    { key: 'shock_ocupacion_pct', label: 'Shock ocupación', description: 'Caída ocupación', unit: '%', min: 0, max: 95, defaultValue: 10, distribution: 'triangular', source: 'modelo_interno', value: 10 },
    { key: 'aumento_tasa_descuento_pb', label: 'Aumento tasa descuento', description: 'Incremento en pb', unit: 'pb', min: 0, max: 3000, defaultValue: 150, distribution: 'normal_truncada', source: 'publico', value: 150 },
    { key: 'haircut_iliquidez_pct', label: 'Haircut iliquidez', description: 'Descuento por iliquidez', unit: '%', min: 0, max: 95, defaultValue: 9, distribution: 'beta', source: 'modelo_interno', value: 9 },
    { key: 'meses_retraso_venta', label: 'Meses retraso venta', description: 'Retraso de venta', unit: 'meses', min: 0, max: 48, defaultValue: 4, distribution: 'discreta_escenarios', source: 'supuesto_hipotetico', value: 4 },
    { key: 'concentracion_activo_principal_pct', label: 'Concentración activo principal', description: 'Peso principal activo', unit: '%', min: 0, max: 100, defaultValue: 28, distribution: 'uniforme', source: 'usuario', value: 28 },
    { key: 'concentracion_arrendatario_principal_pct', label: 'Concentración arrendatario principal', description: 'Peso principal arrendatario', unit: '%', min: 0, max: 100, defaultValue: 22, distribution: 'uniforme', source: 'usuario', value: 22 },
  ];
}

function ficdParams(): Param[] {
  return [
    { key: 'valor_base_fondo', label: 'Valor base fondo', description: 'NAV base', unit: 'moneda', min: 1, max: 2e9, defaultValue: 1e8, distribution: 'uniforme', source: 'supuesto_hipotetico', value: 1e8 },
    { key: 'cuotas_en_circulacion', label: 'Cuotas en circulación', description: 'Total cuotas', unit: 'cuotas', min: 1, max: 1e8, defaultValue: 1e6, distribution: 'uniforme', source: 'supuesto_hipotetico', value: 1e6 },
    { key: 'caja_inicial', label: 'Caja inicial', description: 'Caja al inicio', unit: 'moneda', min: 0, max: 1e9, defaultValue: 10000000, distribution: 'uniforme', source: 'supuesto_hipotetico', value: 10000000 },
    { key: 'ingresos_o_cobros_mensuales_base', label: 'Cobros mensuales base', description: 'Cobro mensual esperado', unit: 'moneda', min: 0, max: 1e8, defaultValue: 2500000, distribution: 'uniforme', source: 'supuesto_hipotetico', value: 2500000 },
    { key: 'pagos_mensuales_obligatorios', label: 'Pagos mensuales obligatorios', description: 'Egresos fijos mensuales', unit: 'moneda', min: 0, max: 1e8, defaultValue: 2600000, distribution: 'uniforme', source: 'supuesto_hipotetico', value: 2600000 },
    { key: 'exposicion_credito_privado', label: 'Exposición crédito privado', description: 'Exposición a crédito', unit: 'moneda', min: 0, max: 2e9, defaultValue: 42000000, distribution: 'uniforme', source: 'supuesto_hipotetico', value: 42000000 },
    { key: 'tasa_default_pct', label: 'Tasa default', description: 'Incumplimiento', unit: '%', min: 0, max: 100, defaultValue: 8, distribution: 'beta', source: 'modelo_interno', value: 8 },
    { key: 'tasa_recuperacion_pct', label: 'Tasa recuperación', description: 'Recuperación', unit: '%', min: 0, max: 100, defaultValue: 45, distribution: 'beta', source: 'modelo_interno', value: 45 },
    { key: 'shock_valoracion_pct', label: 'Shock valoración', description: 'Shock valuación', unit: '%', min: 0, max: 95, defaultValue: 7, distribution: 'normal_truncada', source: 'modelo_interno', value: 7 },
    { key: 'haircut_iliquidez_pct', label: 'Haircut iliquidez', description: 'Descuento por iliquidez', unit: '%', min: 0, max: 95, defaultValue: 11, distribution: 'beta', source: 'modelo_interno', value: 11 },
    { key: 'meses_atraso_pago', label: 'Meses atraso pago', description: 'Retraso de pagos', unit: 'meses', min: 0, max: 24, defaultValue: 3, distribution: 'discreta_escenarios', source: 'supuesto_hipotetico', value: 3 },
    { key: 'aumento_tasa_descuento_pb', label: 'Aumento tasa descuento', description: 'Incremento en pb', unit: 'pb', min: 0, max: 3000, defaultValue: 180, distribution: 'normal_truncada', source: 'publico', value: 180 },
    { key: 'concentracion_emisor_principal_pct', label: 'Concentración emisor principal', description: 'Peso principal emisor', unit: '%', min: 0, max: 100, defaultValue: 25, distribution: 'uniforme', source: 'usuario', value: 25 },
    { key: 'cartera_deteriorada_pct', label: 'Cartera deteriorada', description: 'Cartera en deterioro', unit: '%', min: 0, max: 100, defaultValue: 14, distribution: 'uniforme', source: 'modelo_interno', value: 14 },
  ];
}

function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function sampleNormal(rng: () => number) {
  const u1 = Math.max(1e-9, rng());
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function sampleParam(p: Param, rng: () => number) {
  const { min, max, value: d } = p;
  if (p.distribution === 'uniforme') return min + rng() * (max - min);
  if (p.distribution === 'triangular') {
    const mode = d;
    const u = rng();
    const c = (mode - min) / (max - min);
    if (u < c) return min + Math.sqrt(u * (max - min) * (mode - min));
    return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
  }
  if (p.distribution === 'normal_truncada') {
    const sigma = (max - min) / 6;
    const val = d + sampleNormal(rng) * sigma;
    return Math.min(max, Math.max(min, val));
  }
  if (p.distribution === 'beta') {
    const u = rng();
    const v = rng();
    const beta01 = (u * 0.6 + v * 0.4);
    return min + beta01 * (max - min);
  }
  const choices = [min, d, max];
  return choices[Math.floor(rng() * choices.length)];
}

function percentile(values: number[], p: number) {
  if (!values.length) return 0;
  const idx = Math.min(values.length - 1, Math.max(0, Math.floor((p / 100) * values.length)));
  return values[idx];
}

function hashSnapshot(input: object) {
  const t = JSON.stringify(input);
  let h = 2166136261;
  for (let i = 0; i < t.length; i += 1) {
    h ^= t.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `h${(h >>> 0).toString(16)}`;
}

export default function MonteCarloSimulationPage() {
  const [fund, setFund] = useState<Fund>('FICI Interval I');
  const [profile, setProfile] = useState<Profile>('Base');
  const [version, setVersion] = useState(1);
  const [rules, setRules] = useState<Rules>(DEFAULT_RULES);
  const [simCount, setSimCount] = useState(2000);
  const [horizon, setHorizon] = useState(12);
  const [confidence, setConfidence] = useState(95);
  const [seed, setSeed] = useState(12345);
  const [params, setParams] = useState<Param[]>(ficiParams());
  const [limitations, setLimitations] = useState('Modelo lineal Monte Carlo con supuestos; no reemplaza valoración oficial.');
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null);
  const [runs, setRuns] = useState<Array<Record<string, unknown>>>(() => {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem('kiriox_mc_linear_v1');
    if (!raw) return [];
    try {
      return JSON.parse(raw).runs ?? [];
    } catch {
      return [];
    }
  });
  const [runError, setRunError] = useState<string | null>(null);
  const [lastRunAt, setLastRunAt] = useState<string | null>(null);

  function applyProfile(next: Profile) {
    setProfile(next);
    if (next === 'Personalizado') return;
    const m = next === 'Base' ? 1 : next === 'Moderado' ? 1.2 : next === 'Severo' ? 1.5 : 1.9;
    setParams((prev) => prev.map((p) => {
      const staticKeys = ['valor_base_fondo', 'cuotas_en_circulacion', 'caja_inicial', 'ingresos_o_cobros_mensuales_base', 'pagos_mensuales_obligatorios', 'exposicion_credito_privado'];
      if (staticKeys.includes(p.key)) return { ...p, value: p.defaultValue };
      return { ...p, value: Number(Math.min(p.max, Math.max(p.min, p.defaultValue * m)).toFixed(4)) };
    }));
    setVersion((v) => v + 1);
  }

  function updateFund(next: Fund) {
    setFund(next);
    setParams(next === 'FICI Interval I' ? ficiParams() : ficdParams());
    setProfile('Base');
    setVersion((v) => v + 1);
  }

  function computeSimulation(activeParams: Param[]) {
    setRunError(null);
    const safeSimCount = Number.isFinite(simCount) && simCount > 0 ? Math.floor(simCount) : 1000;
    const safeHorizon = Number.isFinite(horizon) && horizon > 0 ? Math.floor(horizon) : 12;
    const safeConfidence = Number.isFinite(confidence) && confidence > 0 && confidence < 100 ? confidence : 95;
    const rng = seeded(Number.isFinite(seed) ? seed : 12345);
    const losses: number[] = [];
    const impacts: number[] = [];
    const gapFlags: number[] = [];
    const perShareImpacts: number[] = [];
    const driverAcc: Record<string, number> = {};

    const get = (k: string) => Number(activeParams.find((p) => p.key === k)?.value ?? 0);
    const base = get('valor_base_fondo');
    const cuotas = Math.max(1, get('cuotas_en_circulacion'));
    const caja = get('caja_inicial');
    const pagos = get('pagos_mensuales_obligatorios');
    const ingresos = get('ingresos_o_cobros_mensuales_base');

    for (let i = 0; i < safeSimCount; i += 1) {
      const sampled: Record<string, number> = {};
      activeParams.forEach((p) => {
        sampled[p.key] = sampleParam(p, rng);
      });

      let perdidaTotal = 0;
      let liquidezNeta = 0;
      let brecha = 0;

      if (fund === 'FICI Interval I') {
        const shockVal = sampled.shock_valor_activos_pct / 100;
        const shockRenta = sampled.shock_renta_pct / 100;
        const shockOcup = sampled.shock_ocupacion_pct / 100;
        const hair = sampled.haircut_iliquidez_pct / 100;
        const valorEstresado = base * (1 - shockVal);
        const ingresoEstresado = ingresos * (1 - shockRenta) * (1 - shockOcup);
        const perdidaValor = base - valorEstresado;
        const perdidaIngreso = (ingresos - ingresoEstresado) * safeHorizon;
        const impactoIliq = base * hair;
        perdidaTotal = perdidaValor + perdidaIngreso + impactoIliq;
        liquidezNeta = caja + ingresoEstresado - pagos;
        brecha = Math.max(0, pagos - caja - ingresoEstresado);
        driverAcc.shock_valor_activos_pct = (driverAcc.shock_valor_activos_pct ?? 0) + perdidaValor;
        driverAcc.shock_renta_pct = (driverAcc.shock_renta_pct ?? 0) + perdidaIngreso;
        driverAcc.haircut_iliquidez_pct = (driverAcc.haircut_iliquidez_pct ?? 0) + impactoIliq;
      } else {
        const def = sampled.tasa_default_pct / 100;
        const rec = sampled.tasa_recuperacion_pct / 100;
        const shockVal = sampled.shock_valoracion_pct / 100;
        const hair = sampled.haircut_iliquidez_pct / 100;
        const atraso = sampled.meses_atraso_pago;
        const expo = get('exposicion_credito_privado');
        const perdidaCredito = expo * def * (1 - rec);
        const perdidaValoracion = base * shockVal;
        const impactoIliq = base * hair;
        perdidaTotal = perdidaCredito + perdidaValoracion + impactoIliq;
        const ajusteAtraso = Math.max(0, 1 - atraso / Math.max(1, safeHorizon));
        const cobroEstresado = ingresos * ajusteAtraso;
        liquidezNeta = caja + cobroEstresado - pagos;
        brecha = Math.max(0, pagos - caja - cobroEstresado);
        driverAcc.tasa_default_pct = (driverAcc.tasa_default_pct ?? 0) + perdidaCredito;
        driverAcc.shock_valoracion_pct = (driverAcc.shock_valoracion_pct ?? 0) + perdidaValoracion;
        driverAcc.haircut_iliquidez_pct = (driverAcc.haircut_iliquidez_pct ?? 0) + impactoIliq;
      }

      const impactoPct = base > 0 ? (perdidaTotal / base) * 100 : 0;
      losses.push(perdidaTotal);
      impacts.push(impactoPct);
      perShareImpacts.push(perdidaTotal / cuotas);
      gapFlags.push(brecha > 0 ? 1 : 0);
      void liquidezNeta;
    }

    losses.sort((a, b) => a - b);
    impacts.sort((a, b) => a - b);
    perShareImpacts.sort((a, b) => a - b);
    const avg = losses.reduce((a, b) => a + b, 0) / Math.max(1, losses.length);
    const avgImpact = impacts.reduce((a, b) => a + b, 0) / Math.max(1, impacts.length);
    const varP = percentile(losses, safeConfidence);
    const tail = losses.filter((v) => v >= varP);
    const es = tail.reduce((a, b) => a + b, 0) / Math.max(1, tail.length);
    const severity = avgImpact < rules.lowMax ? 'baja' : avgImpact < rules.mediumMax ? 'media' : avgImpact < rules.highMax ? 'alta' : 'crítica';
    const decision = severity === 'baja' ? rules.decisionLow : severity === 'media' ? rules.decisionMedium : severity === 'alta' ? rules.decisionHigh : rules.decisionCritical;
    const topDrivers = Object.entries(driverAcc).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);

    const result = {
      fondo_simulado: fund,
      numero_simulaciones: safeSimCount,
      horizonte_meses: safeHorizon,
      nivel_confianza_var: safeConfidence,
      perdida_promedio: avg,
      perdida_mediana: percentile(losses, 50),
      perdida_minima: losses[0] ?? 0,
      perdida_maxima: losses[losses.length - 1] ?? 0,
      percentil_90: percentile(losses, 90),
      percentil_95: percentile(losses, 95),
      percentil_99: percentile(losses, 99),
      var_montecarlo: varP,
      expected_shortfall: es,
      prob_perdida_mayor_5: (impacts.filter((v) => v > 5).length / impacts.length) * 100,
      prob_perdida_mayor_10: (impacts.filter((v) => v > 10).length / impacts.length) * 100,
      prob_perdida_mayor_20: (impacts.filter((v) => v > 20).length / impacts.length) * 100,
      prob_brecha_liquidez: (gapFlags.reduce((a, b) => a + b, 0) / gapFlags.length) * 100,
      impacto_promedio_cuota: perShareImpacts.length ? perShareImpacts.reduce((a, b) => a + b, 0) / perShareImpacts.length : 0,
      peor_impacto_cuota: perShareImpacts[perShareImpacts.length - 1] ?? 0,
      severidad_final: severity,
      decision_sugerida: decision,
      explicacion_ejecutiva: `Monte Carlo ${fund}: pérdida promedio ${avgImpact.toFixed(2)}%. Severidad ${severity}; decisión ${decision}.`,
      principales_variables: topDrivers,
      limitaciones_modelo: limitations,
      controles_sugeridos: severity === 'crítica' ? ['Escalar al comité', 'Restringir operaciones'] : ['Monitorear covenants', 'Reforzar límites'],
      pruebas_sugeridas: ['Backtesting trimestral', 'Sensibilidad de supuestos'],
      evidencia_requerida: ['Snapshot de parámetros', 'Acta de aprobación de escenario'],
    };

    setSummary(result);
    setLastRunAt(new Date().toLocaleString());
  }

  function runSimulation() {
    try {
      computeSimulation(params);
    } catch (error: unknown) {
      setRunError(error instanceof Error ? error.message : 'Error inesperado al ejecutar Monte Carlo.');
    }
  }

  function randomizeVisibleScenario() {
    const next = params.map((p) => ({
      ...p,
      value: Number((p.min + Math.random() * (p.max - p.min)).toFixed(4)),
      source: 'supuesto_hipotetico' as SourceType,
    }));
    setParams(next);
    setProfile('Personalizado');
    setVersion((v) => v + 1);
    try {
      computeSimulation(next);
    } catch (error: unknown) {
      setRunError(error instanceof Error ? error.message : 'Error inesperado al ejecutar Monte Carlo.');
    }
  }

  function saveRun() {
    if (!summary) return;
    const snapshot = { fund, profile, version, params, simCount, horizon, confidence, seed, rules };
    const parameterHash = hashSnapshot(snapshot);
    const run = {
      id: crypto.randomUUID(),
      fecha_ejecucion: new Date().toISOString(),
      usuario: 'dev@kiriox.local',
      semilla_aleatoria: seed,
      version_perfil: version,
      profile,
      parameter_hash: parameterHash,
      snapshot_parametros: snapshot,
      resultado_agregado: summary,
    };
    const next = [run, ...runs].slice(0, 40);
    setRuns(next);
    if (typeof window !== 'undefined') localStorage.setItem('kiriox_mc_linear_v1', JSON.stringify({ runs: next }));
  }

  const distributionRows = useMemo(() => params.map((p) => ({
    nombre_tecnico: p.key,
    etiqueta: p.label,
    distribucion: p.distribution,
    fuente: p.source,
  })), [params]);

  return (
    <main className={styles.page}>
      <div className={styles.wrap}>
        <section className={styles.card}>
          <h1 className={styles.title}>Monte Carlo lineal avanzado (Kiriox)</h1>
          <div className={styles.row}>
            <label className={styles.field}><span className={styles.label}>Fondo</span><select className={styles.select} value={fund} onChange={(e) => updateFund(e.target.value as Fund)}><option>FICI Interval I</option><option>FICD Interval I</option></select></label>
            <label className={styles.field}><span className={styles.label}>Perfil</span><select className={styles.select} value={profile} onChange={(e) => applyProfile(e.target.value as Profile)}><option>Base</option><option>Moderado</option><option>Severo</option><option>Extremo</option><option>Personalizado</option></select></label>
            <label className={styles.field}><span className={styles.label}>N° simulaciones</span><input className={styles.input} type="number" value={simCount} onChange={(e) => setSimCount(Number(e.target.value))} /></label>
            <label className={styles.field}><span className={styles.label}>Horizonte meses</span><input className={styles.input} type="number" value={horizon} onChange={(e) => setHorizon(Number(e.target.value))} /></label>
            <label className={styles.field}><span className={styles.label}>Nivel confianza VaR</span><input className={styles.input} type="number" value={confidence} onChange={(e) => setConfidence(Number(e.target.value))} /></label>
            <label className={styles.field}><span className={styles.label}>Semilla aleatoria</span><input className={styles.input} type="number" value={seed} onChange={(e) => setSeed(Number(e.target.value))} /></label>
            <label className={styles.field}><span className={styles.label}>Versión perfil</span><input className={styles.input} value={version} readOnly /></label>
          </div>
          <div className={styles.actions} style={{ marginTop: 10 }}>
            <button className={styles.btn} type="button" onClick={randomizeVisibleScenario}>Escenario aleatorio</button>
            <button className={styles.btn} type="button" onClick={runSimulation}>Ejecutar Monte Carlo</button>
            <button className={styles.btn} type="button" onClick={saveRun}>Guardar corrida</button>
          </div>
          {lastRunAt && <div style={{ marginTop: 8, fontSize: 12, color: '#9fb7ec' }}>Última ejecución: {lastRunAt}</div>}
          {runError && <div style={{ marginTop: 8, fontSize: 12, color: '#fca5a5' }}>Error en ejecución: {runError}</div>}
        </section>

        {summary && (
          <>
            <section className={styles.card}>
              <h2 className={styles.title}>Resultados estadísticos</h2>
              <div className={styles.kpi}>
                {Object.entries(summary).slice(0, 18).map(([k, v]) => (
                  <div key={k} className={styles.kpiBox}><div className={styles.kpiLabel}>{k}</div><div className={styles.kpiValue}>{Array.isArray(v) ? v.join(', ') : String(typeof v === 'number' ? Number(v).toFixed(4) : v)}</div></div>
                ))}
              </div>
            </section>
            <section className={styles.card}>
              <h2 className={styles.title}>Distribución usada por parámetro</h2>
              <div className={styles.tableWrap}>
                <table className={styles.table}><thead><tr><th>Nombre técnico</th><th>Etiqueta</th><th>Distribución</th><th>Fuente</th></tr></thead><tbody>{distributionRows.map((r) => <tr key={r.nombre_tecnico}><td>{r.nombre_tecnico}</td><td>{r.etiqueta}</td><td>{r.distribucion}</td><td>{r.fuente}</td></tr>)}</tbody></table>
              </div>
            </section>
          </>
        )}

        <section className={styles.card}>
          <h2 className={styles.title}>Parámetros y distribuciones</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>Nombre técnico</th><th>Etiqueta</th><th>Descripción</th><th>Unidad</th><th>Mín</th><th>Máx</th><th>Default</th><th>Valor</th><th>Distribución</th><th>Fuente</th></tr></thead>
              <tbody>
                {params.map((p, i) => (
                  <tr key={p.key}>
                    <td>{p.key}</td><td>{p.label}</td><td>{p.description}</td><td>{p.unit}</td>
                    <td>{p.min}</td><td>{p.max}</td><td>{p.defaultValue}</td>
                    <td><input className={styles.input} type="number" value={p.value} min={p.min} max={p.max} step={p.unit === '%' || p.unit === 'meses' ? 1 : p.unit === 'pb' ? 10 : 'any'} onChange={(e) => { const raw = Number(e.target.value); const v = Number.isFinite(raw) ? Math.min(p.max, Math.max(p.min, raw)) : p.value; setParams((prev) => prev.map((x, idx) => idx === i ? { ...x, value: v } : x)); setProfile('Personalizado'); setVersion((n) => n + 1); }} /></td>
                    <td><select className={styles.select} value={p.distribution} onChange={(e) => setParams((prev) => prev.map((x, idx) => idx === i ? { ...x, distribution: e.target.value as Distribution } : x))}><option value="uniforme">uniforme</option><option value="triangular">triangular</option><option value="normal_truncada">normal truncada</option><option value="beta">beta</option><option value="discreta_escenarios">discreta por escenarios</option></select></td>
                    <td><select className={styles.select} value={p.source} onChange={(e) => setParams((prev) => prev.map((x, idx) => idx === i ? { ...x, source: e.target.value as SourceType } : x))}><option value="publico">publico</option><option value="usuario">usuario</option><option value="supuesto_hipotetico">supuesto hipotético</option><option value="modelo_interno">modelo interno</option></select></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className={styles.card}>
          <h2 className={styles.title}>Reglas parametrizables</h2>
          <div className={styles.row}>
            <label className={styles.field}><span className={styles.label}>Baja menor a %</span><input className={styles.input} type="number" value={rules.lowMax} onChange={(e) => setRules((r) => ({ ...r, lowMax: Number(e.target.value) }))} /></label>
            <label className={styles.field}><span className={styles.label}>Media menor a %</span><input className={styles.input} type="number" value={rules.mediumMax} onChange={(e) => setRules((r) => ({ ...r, mediumMax: Number(e.target.value) }))} /></label>
            <label className={styles.field}><span className={styles.label}>Alta menor a %</span><input className={styles.input} type="number" value={rules.highMax} onChange={(e) => setRules((r) => ({ ...r, highMax: Number(e.target.value) }))} /></label>
            <label className={styles.field}><span className={styles.label}>Limitaciones</span><input className={styles.input} value={limitations} onChange={(e) => setLimitations(e.target.value)} /></label>
          </div>
        </section>

        <section className={styles.card}>
          <h2 className={styles.title}>Historial auditable</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}><thead><tr><th>Fecha</th><th>Perfil</th><th>Versión</th><th>Semilla</th><th>Hash</th><th>Usuario</th></tr></thead><tbody>{runs.map((r: any) => <tr key={r.id}><td>{new Date(r.fecha_ejecucion).toLocaleString()}</td><td>{r.profile}</td><td>{r.version_perfil}</td><td>{r.semilla_aleatoria}</td><td>{r.parameter_hash}</td><td>{r.usuario}</td></tr>)}</tbody></table>
          </div>
        </section>
      </div>
    </main>
  );
}
