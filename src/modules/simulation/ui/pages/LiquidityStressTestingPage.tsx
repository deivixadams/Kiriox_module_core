'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './StressTestingPage.module.css';

type FundType = 'FICI Interval I' | 'FICD Interval I';
type ProfileName = 'Base' | 'Moderado' | 'Severo' | 'Extremo' | 'Personalizado';
type ParamSource = 'publico' | 'usuario' | 'supuesto_hipotetico' | 'modelo_interno';

type Parameter = {
  key: string;
  technicalName: string;
  label: string;
  description: string;
  unit: string;
  defaultValue: number;
  min: number;
  max: number;
  scenario: string;
  justification: string;
  source: ParamSource;
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

type RunRecord = {
  id: string;
  kingdom: string;
  element: FundType;
  riskType: string;
  scenario: ProfileName;
  profileVersion: number;
  executedAt: string;
  user: string;
  parameterHash: string;
  parameters: Parameter[];
  rules: Rules;
  result: Record<string, unknown>;
  explanation: string;
  limitations: string;
  controlsSuggested: string[];
  evidenceRequired: string[];
};

const STORAGE_KEY = 'kiriox_liquidity_stress_v1';
const USER = 'dev@kiriox.local';
const AUTO_SIMULATION_TARGET = 3000;
const RUN_HISTORY_LIMIT = 10;

const DEFAULT_RULES: Rules = {
  lowMax: 5,
  mediumMax: 10,
  highMax: 20,
  decisionLow: 'aceptar o monitorear',
  decisionMedium: 'monitorear o tratar',
  decisionHigh: 'tratar o escalar',
  decisionCritical: 'escalar, restringir o detener',
};

function hashSnapshot(input: object): string {
  const text = JSON.stringify(input);
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `h${(h >>> 0).toString(16)}`;
}

function buildFiciParams(): Parameter[] {
  return [
    { key: 'valor_base_fondo', technicalName: 'valor_base_fondo', label: 'Valor base fondo', description: 'NAV base para simulación.', unit: 'moneda', defaultValue: 100000000, min: 1, max: 2000000000, scenario: 'base', justification: 'Línea base', source: 'supuesto_hipotetico', value: 100000000 },
    { key: 'cuotas_en_circulacion', technicalName: 'cuotas_en_circulacion', label: 'Cuotas en circulación', description: 'Total de cuotas emitidas.', unit: 'cuotas', defaultValue: 1000000, min: 1, max: 100000000, scenario: 'base', justification: 'Escala de impacto por cuota', source: 'supuesto_hipotetico', value: 1000000 },
    { key: 'caja_inicial', technicalName: 'caja_inicial', label: 'Caja inicial', description: 'Liquidez disponible inicial.', unit: 'moneda', defaultValue: 12000000, min: 0, max: 1000000000, scenario: 'liquidez', justification: 'Cobertura inicial', source: 'supuesto_hipotetico', value: 12000000 },
    { key: 'ingresos_mensuales_base', technicalName: 'ingresos_mensuales_base', label: 'Ingresos mensuales base', description: 'Ingreso mensual esperado.', unit: 'moneda', defaultValue: 1900000, min: 0, max: 100000000, scenario: 'operativo', justification: 'Flujo operativo base', source: 'supuesto_hipotetico', value: 1900000 },
    { key: 'pagos_mensuales_obligatorios', technicalName: 'pagos_mensuales_obligatorios', label: 'Pagos mensuales obligatorios', description: 'Egresos fijos mensuales.', unit: 'moneda', defaultValue: 2200000, min: 0, max: 100000000, scenario: 'liquidez', justification: 'Compromisos de caja', source: 'supuesto_hipotetico', value: 2200000 },
    { key: 'shock_valor_activos_pct', technicalName: 'shock_valor_activos_pct', label: 'Shock valor activos', description: 'Caída del valor de activos inmobiliarios.', unit: '%', defaultValue: 8, min: 0, max: 95, scenario: 'mercado', justification: 'Riesgo de valoración', source: 'modelo_interno', value: 8 },
    { key: 'shock_renta_pct', technicalName: 'shock_renta_pct', label: 'Shock renta', description: 'Reducción de ingresos por alquiler.', unit: '%', defaultValue: 12, min: 0, max: 95, scenario: 'operativo', justification: 'Riesgo de demanda', source: 'modelo_interno', value: 12 },
    { key: 'shock_ocupacion_pct', technicalName: 'shock_ocupacion_pct', label: 'Shock ocupación', description: 'Caída de ocupación.', unit: '%', defaultValue: 10, min: 0, max: 95, scenario: 'operativo', justification: 'Vacancia', source: 'modelo_interno', value: 10 },
    { key: 'aumento_tasa_descuento_pb', technicalName: 'aumento_tasa_descuento_pb', label: 'Aumento tasa descuento', description: 'Incremento en pb.', unit: 'pb', defaultValue: 150, min: 0, max: 3000, scenario: 'mercado', justification: 'Prima de riesgo', source: 'publico', value: 150 },
    { key: 'meses_retraso_venta', technicalName: 'meses_retraso_venta', label: 'Meses retraso venta', description: 'Retraso en salida de activos.', unit: 'meses', defaultValue: 4, min: 0, max: 48, scenario: 'liquidez', justification: 'Liquidez del mercado', source: 'supuesto_hipotetico', value: 4 },
    { key: 'haircut_iliquidez_pct', technicalName: 'haircut_iliquidez_pct', label: 'Haircut iliquidez', description: 'Descuento por iliquidez.', unit: '%', defaultValue: 9, min: 0, max: 90, scenario: 'liquidez', justification: 'Venta forzada', source: 'modelo_interno', value: 9 },
    { key: 'concentracion_activo_principal_pct', technicalName: 'concentracion_activo_principal_pct', label: 'Concentración activo principal', description: 'Peso del principal inmueble.', unit: '%', defaultValue: 28, min: 0, max: 100, scenario: 'concentracion', justification: 'Riesgo idiosincrático', source: 'usuario', value: 28 },
    { key: 'concentracion_arrendatario_principal_pct', technicalName: 'concentracion_arrendatario_principal_pct', label: 'Concentración arrendatario principal', description: 'Peso del principal arrendatario.', unit: '%', defaultValue: 22, min: 0, max: 100, scenario: 'concentracion', justification: 'Dependencia comercial', source: 'usuario', value: 22 },
  ];
}

function buildFicdParams(): Parameter[] {
  return [
    { key: 'valor_base_fondo', technicalName: 'valor_base_fondo', label: 'Valor base fondo', description: 'NAV base para simulación.', unit: 'moneda', defaultValue: 100000000, min: 1, max: 2000000000, scenario: 'base', justification: 'Línea base', source: 'supuesto_hipotetico', value: 100000000 },
    { key: 'cuotas_en_circulacion', technicalName: 'cuotas_en_circulacion', label: 'Cuotas en circulación', description: 'Total de cuotas emitidas.', unit: 'cuotas', defaultValue: 1000000, min: 1, max: 100000000, scenario: 'base', justification: 'Escala de impacto por cuota', source: 'supuesto_hipotetico', value: 1000000 },
    { key: 'caja_inicial', technicalName: 'caja_inicial', label: 'Caja inicial', description: 'Liquidez disponible inicial.', unit: 'moneda', defaultValue: 10000000, min: 0, max: 1000000000, scenario: 'liquidez', justification: 'Cobertura inicial', source: 'supuesto_hipotetico', value: 10000000 },
    { key: 'cobros_mensuales_base', technicalName: 'cobros_mensuales_base', label: 'Cobros mensuales base', description: 'Cobro mensual esperado.', unit: 'moneda', defaultValue: 2500000, min: 0, max: 100000000, scenario: 'credito', justification: 'Flujo de cartera', source: 'supuesto_hipotetico', value: 2500000 },
    { key: 'pagos_mensuales_obligatorios', technicalName: 'pagos_mensuales_obligatorios', label: 'Pagos mensuales obligatorios', description: 'Egresos fijos mensuales.', unit: 'moneda', defaultValue: 2600000, min: 0, max: 100000000, scenario: 'liquidez', justification: 'Compromisos de caja', source: 'supuesto_hipotetico', value: 2600000 },
    { key: 'exposicion_credito_privado', technicalName: 'exposicion_credito_privado', label: 'Exposición crédito privado', description: 'Monto expuesto a crédito privado.', unit: 'moneda', defaultValue: 42000000, min: 0, max: 2000000000, scenario: 'credito', justification: 'Base de pérdida de crédito', source: 'supuesto_hipotetico', value: 42000000 },
    { key: 'tasa_default_pct', technicalName: 'tasa_default_pct', label: 'Tasa default', description: 'Default de emisores/proyectos.', unit: '%', defaultValue: 8, min: 0, max: 100, scenario: 'credito', justification: 'Riesgo de incumplimiento', source: 'modelo_interno', value: 8 },
    { key: 'tasa_recuperacion_pct', technicalName: 'tasa_recuperacion_pct', label: 'Tasa recuperación', description: 'Recuperación sobre default.', unit: '%', defaultValue: 45, min: 0, max: 100, scenario: 'credito', justification: 'Calidad de colaterales', source: 'modelo_interno', value: 45 },
    { key: 'shock_valoracion_pct', technicalName: 'shock_valoracion_pct', label: 'Shock valoración', description: 'Shock de valoración de cartera.', unit: '%', defaultValue: 7, min: 0, max: 95, scenario: 'mercado', justification: 'Ajuste de spreads', source: 'modelo_interno', value: 7 },
    { key: 'meses_atraso_pago', technicalName: 'meses_atraso_pago', label: 'Meses atraso pago', description: 'Retraso promedio de pagos.', unit: 'meses', defaultValue: 3, min: 0, max: 24, scenario: 'liquidez', justification: 'Desfase de cobro', source: 'supuesto_hipotetico', value: 3 },
    { key: 'aumento_tasa_descuento_pb', technicalName: 'aumento_tasa_descuento_pb', label: 'Aumento tasa descuento', description: 'Incremento en pb.', unit: 'pb', defaultValue: 180, min: 0, max: 3000, scenario: 'mercado', justification: 'Prima de riesgo', source: 'publico', value: 180 },
    { key: 'haircut_iliquidez_pct', technicalName: 'haircut_iliquidez_pct', label: 'Haircut iliquidez', description: 'Descuento por iliquidez.', unit: '%', defaultValue: 11, min: 0, max: 90, scenario: 'liquidez', justification: 'Venta forzada', source: 'modelo_interno', value: 11 },
    { key: 'concentracion_emisor_principal_pct', technicalName: 'concentracion_emisor_principal_pct', label: 'Concentración emisor principal', description: 'Peso del principal emisor/proyecto.', unit: '%', defaultValue: 25, min: 0, max: 100, scenario: 'concentracion', justification: 'Riesgo idiosincrático', source: 'usuario', value: 25 },
    { key: 'cartera_deteriorada_pct', technicalName: 'cartera_deteriorada_pct', label: 'Cartera deteriorada', description: 'Porcentaje deteriorado de cartera.', unit: '%', defaultValue: 14, min: 0, max: 100, scenario: 'credito', justification: 'Calidad de cartera', source: 'modelo_interno', value: 14 },
  ];
}

function profileMultiplier(profile: ProfileName) {
  if (profile === 'Base') return 1;
  if (profile === 'Moderado') return 1.2;
  if (profile === 'Severo') return 1.5;
  if (profile === 'Extremo') return 1.9;
  return 1;
}

function applyProfile(base: Parameter[], profile: ProfileName): Parameter[] {
  if (profile === 'Personalizado') return base;
  const m = profileMultiplier(profile);
  return base.map((p) => {
    const nonStressKeys = ['valor_base_fondo', 'cuotas_en_circulacion', 'caja_inicial', 'ingresos_mensuales_base', 'pagos_mensuales_obligatorios', 'cobros_mensuales_base', 'exposicion_credito_privado'];
    if (nonStressKeys.includes(p.key)) return { ...p, value: p.defaultValue };
    const next = Math.min(p.max, Math.max(p.min, p.defaultValue * m));
    return { ...p, value: Number(next.toFixed(4)) };
  });
}

function getParam(params: Parameter[], key: string): number {
  return Number(params.find((p) => p.key === key)?.value ?? 0);
}

function computeResult(fund: FundType, params: Parameter[]) {
  const valorBase = getParam(params, 'valor_base_fondo');
  const cuotas = Math.max(1, getParam(params, 'cuotas_en_circulacion'));
  const caja = getParam(params, 'caja_inicial');
  const pagos = getParam(params, 'pagos_mensuales_obligatorios');
  const h = getParam(params, 'haircut_iliquidez_pct') / 100;

  if (fund === 'FICI Interval I') {
    const shockAct = getParam(params, 'shock_valor_activos_pct') / 100;
    const shockRenta = getParam(params, 'shock_renta_pct') / 100;
    const shockOcup = getParam(params, 'shock_ocupacion_pct') / 100;
    const ingBase = getParam(params, 'ingresos_mensuales_base');

    const valorEstresado = valorBase * (1 - shockAct);
    const ingresoEstresado = ingBase * (1 - shockRenta) * (1 - shockOcup);
    const perdidaValor = valorBase - valorEstresado;
    const perdidaIngreso = ingBase - ingresoEstresado;
    const impactoIliquidez = valorBase * h;
    const perdidaTotal = perdidaValor + perdidaIngreso + impactoIliquidez;
    const impactoPct = valorBase > 0 ? (perdidaTotal / valorBase) * 100 : 0;
    const impactoCuota = perdidaTotal / cuotas;
    const liquidezNeta = caja + ingresoEstresado - pagos;
    const mesesCobertura = pagos > 0 ? caja / pagos : 0;
    const brechaLiquidez = Math.max(0, pagos - caja - ingresoEstresado);
    return { valorBase, valorEstresado, perdidaTotal, impactoPct, impactoCuota, liquidezNeta, mesesCobertura, brechaLiquidez };
  }

  const exposicion = getParam(params, 'exposicion_credito_privado');
  const defaultPct = getParam(params, 'tasa_default_pct') / 100;
  const recPct = getParam(params, 'tasa_recuperacion_pct') / 100;
  const shockVal = getParam(params, 'shock_valoracion_pct') / 100;
  const cobrosBase = getParam(params, 'cobros_mensuales_base');
  const mesesAtraso = getParam(params, 'meses_atraso_pago');
  const ajusteAtraso = Math.max(0, 1 - Math.min(1, mesesAtraso / 12));

  const perdidaCredito = exposicion * defaultPct * (1 - recPct);
  const perdidaValoracion = valorBase * shockVal;
  const impactoIliquidez = valorBase * h;
  const perdidaTotal = perdidaCredito + perdidaValoracion + impactoIliquidez;
  const impactoPct = valorBase > 0 ? (perdidaTotal / valorBase) * 100 : 0;
  const impactoCuota = perdidaTotal / cuotas;
  const cobroEstresado = cobrosBase * ajusteAtraso;
  const liquidezNeta = caja + cobroEstresado - pagos;
  const mesesCobertura = pagos > 0 ? caja / pagos : 0;
  const brechaLiquidez = Math.max(0, pagos - caja - cobroEstresado);
  const valorEstresado = valorBase - perdidaTotal;
  return { valorBase, valorEstresado, perdidaTotal, impactoPct, impactoCuota, liquidezNeta, mesesCobertura, brechaLiquidez };
}

function classify(impactoPct: number, rules: Rules) {
  if (impactoPct < rules.lowMax) return { severity: 'baja', decision: rules.decisionLow };
  if (impactoPct < rules.mediumMax) return { severity: 'media', decision: rules.decisionMedium };
  if (impactoPct < rules.highMax) return { severity: 'alta', decision: rules.decisionHigh };
  return { severity: 'crítica', decision: rules.decisionCritical };
}

function suggestedControls(severity: string): string[] {
  if (severity === 'baja') return ['Monitoreo mensual de caja', 'Revisión trimestral de concentración'];
  if (severity === 'media') return ['Límite temporal de nuevas exposiciones', 'Plan de liquidez de contingencia'];
  if (severity === 'alta') return ['Rebalanceo de cartera', 'Activación de comité de riesgos', 'Trigger de venta ordenada'];
  return ['Escalamiento a comité ejecutivo', 'Restricción de operaciones nuevas', 'Plan de contención y desinversión'];
}

function requiredEvidence(severity: string): string[] {
  if (severity === 'baja') return ['Estado de cuenta de caja', 'Reporte de cobranza'];
  if (severity === 'media') return ['Prueba de stress firmada', 'Acta de comité de seguimiento'];
  if (severity === 'alta') return ['Plan de tratamiento aprobado', 'Evidencia de ejecución de mitigantes'];
  return ['Acta de escalamiento', 'Evidencia de restricciones operativas', 'Plan de recuperación validado'];
}

export default function LiquidityStressTestingPage() {
  const router = useRouter();
  const [fund, setFund] = useState<FundType>('FICI Interval I');
  const [profile, setProfile] = useState<ProfileName>('Base');
  const [version, setVersion] = useState(1);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);
  const [parameters, setParameters] = useState<Parameter[]>(buildFiciParams());
  const [rules, setRules] = useState<Rules>(DEFAULT_RULES);
  const [limitations, setLimitations] = useState('Simulación lineal parametrizada. Datos marcados como hipotéticos cuando fuente != publico/usuario.');
  const [autoSimulation, setAutoSimulation] = useState({ running: false, completed: 0, target: AUTO_SIMULATION_TARGET });
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const autoStopRef = useRef(false);
  const simulationSpeedRef = useRef(6);

  const core = useMemo(() => computeResult(fund, parameters), [fund, parameters]);
  const classification = useMemo(() => classify(core.impactoPct, rules), [core.impactoPct, rules]);
  const controls = useMemo(() => suggestedControls(classification.severity), [classification.severity]);
  const evidences = useMemo(() => requiredEvidence(classification.severity), [classification.severity]);
  const riskType = fund === 'FICI Interval I' ? 'inmobiliario/liquidez/valoración/concentración' : 'crédito privado/liquidez/valoración/concentración';
  const explanation = `Escenario ${profile} en ${fund}: pérdida ${core.impactoPct.toFixed(2)}%, liquidez neta ${core.liquidezNeta.toFixed(2)}. Severidad ${classification.severity}; decisión sugerida: ${classification.decision}.`;

  function handleFundChange(nextFund: FundType) {
    setFund(nextFund);
    const base = nextFund === 'FICI Interval I' ? buildFiciParams() : buildFicdParams();
    setParameters(applyProfile(base, profile));
    if (profile !== 'Personalizado') {
      setVersion((v) => v + 1);
    }
  }

  function handleProfileChange(nextProfile: ProfileName) {
    setProfile(nextProfile);
    const base = fund === 'FICI Interval I' ? buildFiciParams() : buildFicdParams();
    setParameters(applyProfile(base, nextProfile));
    if (nextProfile !== 'Personalizado') {
      setVersion((v) => v + 1);
    }
  }

  function updateParam(i: number, field: keyof Parameter, val: string) {
    setParameters((prev) => prev.map((p, idx) => {
      if (idx !== i) return p;
      if (['value', 'defaultValue', 'min', 'max'].includes(field)) return { ...p, [field]: Number(val) };
      return { ...p, [field]: val };
    }));
    setProfile('Personalizado');
    setVersion((v) => v + 1);
  }

  function updateParamValue(i: number, val: string) {
    updateParam(i, 'value', val);
  }

  function updateParamJustification(i: number, val: string) {
    updateParam(i, 'justification', val);
  }

  function randomizeScenario() {
    setParameters((prev) =>
      prev.map((p) => {
        const rand = p.min + Math.random() * (p.max - p.min);
        return {
          ...p,
          value: Number(rand.toFixed(4)),
          source: 'supuesto_hipotetico',
          justification: p.justification || 'Simulación hipotética aleatoria',
        };
      })
    );
    setProfile('Personalizado');
    setVersion((v) => v + 1);
  }

  function getAutoSimulationDelay(speed: number) {
    const minDelay = 12;
    const maxDelay = 650;
    return Math.round(maxDelay - ((speed - 1) / 9) * (maxDelay - minDelay));
  }

  function getAutoSimulationBatchSize(speed: number) {
    const minBatch = 1;
    const maxBatch = 45;
    return Math.round(minBatch + ((speed - 1) / 9) * (maxBatch - minBatch));
  }

  function buildRandomizedParameters(sourceParams: Parameter[]): Parameter[] {
    return sourceParams.map((p) => ({
      ...p,
      value: Number((p.min + Math.random() * (p.max - p.min)).toFixed(4)),
      source: 'supuesto_hipotetico',
      justification: p.justification || 'Simulación automatizada',
    }));
  }

  function buildRunRecord(nextParams: Parameter[], nextVersion: number): RunRecord {
    const nextCore = computeResult(fund, nextParams);
    const nextClassification = classify(nextCore.impactoPct, rules);
    const nextControls = suggestedControls(nextClassification.severity);
    const nextEvidences = requiredEvidence(nextClassification.severity);
    const nextExplanation = `Escenario Personalizado en ${fund}: pérdida ${nextCore.impactoPct.toFixed(2)}%, liquidez neta ${nextCore.liquidezNeta.toFixed(2)}. Severidad ${nextClassification.severity}; decisión sugerida: ${nextClassification.decision}.`;
    const snapshot = { fund, profile: 'Personalizado', version: nextVersion, parameters: nextParams, rules };

    return {
      id: crypto.randomUUID(),
      kingdom: 'AFI Interval',
      element: fund,
      riskType,
      scenario: 'Personalizado',
      profileVersion: nextVersion,
      executedAt: new Date().toISOString(),
      user: USER,
      parameterHash: hashSnapshot(snapshot),
      parameters: structuredClone(nextParams),
      rules: structuredClone(rules),
      result: {
        ...nextCore,
        severity: nextClassification.severity,
        decisionSuggested: nextClassification.decision,
      },
      explanation: nextExplanation,
      limitations,
      controlsSuggested: nextControls,
      evidenceRequired: nextEvidences,
    };
  }

  function persistRuns(nextRuns: RunRecord[] | ((prev: RunRecord[]) => RunRecord[])) {
    setRuns((prev) => {
      const resolved = (typeof nextRuns === 'function' ? nextRuns(prev) : nextRuns).slice(0, RUN_HISTORY_LIMIT);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ runs: resolved }));
      return resolved;
    });
  }

  function saveRun() {
    const snapshot = { fund, profile, version, parameters, rules };
    const parameterHash = hashSnapshot(snapshot);
    const record: RunRecord = {
      id: crypto.randomUUID(),
      kingdom: 'AFI Interval',
      element: fund,
      riskType,
      scenario: profile,
      profileVersion: version,
      executedAt: new Date().toISOString(),
      user: USER,
      parameterHash,
      parameters: structuredClone(parameters),
      rules: structuredClone(rules),
      result: {
        ...core,
        severity: classification.severity,
        decisionSuggested: classification.decision,
      },
      explanation,
      limitations,
      controlsSuggested: controls,
      evidenceRequired: evidences,
    };
    const next = [record, ...runs].slice(0, RUN_HISTORY_LIMIT);
    setRuns(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ runs: next }));
  }

  function stopAutoSimulation() {
    autoStopRef.current = true;
    setAutoSimulation((prev) => ({ ...prev, running: false }));
  }

  function startAutoSimulation() {
    if (autoSimulation.running) return;

    autoStopRef.current = false;
    setProfile('Personalizado');
    setAutoSimulation({ running: true, completed: 0, target: AUTO_SIMULATION_TARGET });

    let completed = 0;
    let versionCursor = version;
    let currentParamsCursor = parameters;

    const tick = () => {
      if (autoStopRef.current) return;

      const currentSpeed = simulationSpeedRef.current;
      const remaining = AUTO_SIMULATION_TARGET - completed;
      const batchCount = Math.min(getAutoSimulationBatchSize(currentSpeed), remaining);
      let latestParams = currentParamsCursor;
      const batchRecords: RunRecord[] = [];

      for (let i = 0; i < batchCount; i += 1) {
        versionCursor += 1;
        const nextParams = buildRandomizedParameters(latestParams);
        batchRecords.push(buildRunRecord(nextParams, versionCursor));
        latestParams = nextParams;
      }

      completed += batchCount;
      currentParamsCursor = latestParams;
      setParameters(latestParams);
      setVersion(versionCursor);
      setAutoSimulation({ running: completed < AUTO_SIMULATION_TARGET, completed, target: AUTO_SIMULATION_TARGET });
      persistRuns((prev) => [...batchRecords.reverse(), ...prev].slice(0, RUN_HISTORY_LIMIT));

      if (completed < AUTO_SIMULATION_TARGET) {
        setTimeout(tick, getAutoSimulationDelay(simulationSpeedRef.current));
      } else {
        autoStopRef.current = true;
      }
    };

    setTimeout(tick, 0);
  }

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as { runs: RunRecord[] };
      const storedRuns = parsed.runs ?? [];
      const trimmed = storedRuns.slice(0, RUN_HISTORY_LIMIT);
      const timeoutId = window.setTimeout(() => {
        setRuns(trimmed);
      }, 0);
      if (trimmed.length !== storedRuns.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ runs: trimmed }));
      }
      return () => window.clearTimeout(timeoutId);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    return () => {
      autoStopRef.current = true;
    };
  }, []);

  return (
    <main className={styles.page}>
      <div className={styles.wrap}>
        <section className={styles.card}>
          <h1 className={styles.title}>Stress testing de liquidez parametrizable</h1>
          <div className={styles.metaRow}>
            <span className={styles.metaPill}>Perfil v{version}</span>
            <span className={styles.metaPill}>{USER}</span>
            <span className={styles.metaPill}>{parameters.length} supuestos activos</span>
          </div>
          <div className={styles.row}>
            <label className={styles.field}><span className={styles.label}>Fondo</span>
              <select className={styles.select} value={fund} onChange={(e) => handleFundChange(e.target.value as FundType)}>
                <option>FICI Interval I</option><option>FICD Interval I</option>
              </select>
            </label>
            <label className={styles.field}><span className={styles.label}>Perfil</span>
              <select className={styles.select} value={profile} onChange={(e) => handleProfileChange(e.target.value as ProfileName)}>
                <option>Base</option><option>Moderado</option><option>Severo</option><option>Extremo</option><option>Personalizado</option>
              </select>
            </label>
          </div>
          <div className={styles.actions} style={{ marginTop: 10 }}>
            <button className={styles.btn} type="button" onClick={randomizeScenario}>Simular</button>
            <button
              className={`${styles.btn} ${autoSimulation.running ? styles.btnDanger : styles.btnSuccess}`}
              type="button"
              onClick={autoSimulation.running ? stopAutoSimulation : startAutoSimulation}
            >
              {autoSimulation.running ? 'Stop' : 'Auto simular'}
            </button>
            <button className={styles.btn} type="button" onClick={saveRun}>Guardar corrida</button>
            <button className={`${styles.btn} ${styles.btnGhost}`} type="button" onClick={() => setRulesModalOpen(true)}>Reglas</button>
            <button className={`${styles.btn} ${styles.btnGhost}`} type="button" onClick={() => router.push('/gestion/dashboard_simulaciones')}>Cerrar</button>
          </div>
          <div className={styles.liveStatus}>
            {autoSimulation.running
              ? `Auto simulación en curso: ${autoSimulation.completed.toLocaleString()} / ${autoSimulation.target.toLocaleString()} corridas`
              : autoSimulation.completed > 0
                ? `Última auto simulación: ${autoSimulation.completed.toLocaleString()} corridas procesadas`
                : 'Modo manual activo'}
          </div>
        </section>

        <section className={styles.card}>
          <h2 className={styles.title}>Resultado inmediato</h2>
          <div className={styles.kpi}>
            <div className={styles.kpiBox}><div className={styles.kpiLabel}>Valor base</div><div className={styles.kpiValue}>{core.valorBase.toFixed(2)}</div></div>
            <div className={styles.kpiBox}><div className={styles.kpiLabel}>Valor estresado</div><div className={styles.kpiValue}>{core.valorEstresado.toFixed(2)}</div></div>
            <div className={styles.kpiBox}><div className={styles.kpiLabel}>Pérdida estimada</div><div className={styles.kpiValue}>{core.perdidaTotal.toFixed(2)}</div></div>
            <div className={styles.kpiBox}><div className={styles.kpiLabel}>Pérdida %</div><div className={styles.kpiValue}>{core.impactoPct.toFixed(2)}%</div></div>
            <div className={styles.kpiBox}><div className={styles.kpiLabel}>Impacto por cuota</div><div className={styles.kpiValue}>{core.impactoCuota.toFixed(6)}</div></div>
            <div className={styles.kpiBox}><div className={styles.kpiLabel}>Liquidez neta</div><div className={styles.kpiValue}>{core.liquidezNeta.toFixed(2)}</div></div>
            <div className={styles.kpiBox}><div className={styles.kpiLabel}>Meses cobertura</div><div className={styles.kpiValue}>{core.mesesCobertura.toFixed(2)}</div></div>
            <div className={styles.kpiBox}><div className={styles.kpiLabel}>Brecha de liquidez</div><div className={styles.kpiValue}>{core.brechaLiquidez.toFixed(2)}</div></div>
            <div className={styles.kpiBox}><div className={styles.kpiLabel}>Severidad</div><div className={styles.kpiValue}>{classification.severity}</div></div>
            <div className={styles.kpiBox}><div className={styles.kpiLabel}>Decisión sugerida</div><div className={styles.kpiValue}>{classification.decision}</div></div>
          </div>
          <div className={styles.executiveBox}>
            <div className={styles.executiveLabel}>Explicación ejecutiva</div>
            <div className={styles.executiveText}>{explanation}</div>
          </div>
          <div className={styles.row} style={{ marginTop: 10 }}>
            <label className={styles.field}><span className={styles.label}>Controles sugeridos</span><textarea className={styles.textarea} value={controls.join(' | ')} readOnly /></label>
            <label className={styles.field}><span className={styles.label}>Evidencia requerida</span><textarea className={styles.textarea} value={evidences.join(' | ')} readOnly /></label>
            <label className={styles.field}><span className={styles.label}>Supuestos detectados</span><textarea className={styles.textarea} value={parameters.filter((p) => p.source === 'supuesto_hipotetico').map((p) => p.technicalName).join(', ') || 'Ninguno'} readOnly /></label>
            <label className={styles.field}><span className={styles.label}>Regla Kiriox</span><textarea className={styles.textarea} value="Motor lineal de riesgo. No corresponde a análisis estructural por grafos." readOnly /></label>
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.sectionHead}>
            <div>
              <h2 className={styles.title}>Parámetros de escenario</h2>
              <p className={styles.sectionHint}>Se editan sólo los supuestos operativos necesarios para ejecutar la corrida. La metadata técnica del modelo queda gobernada por el sistema.</p>
            </div>
          </div>
          <div className={styles.grid}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Parámetro</th><th>Descripción</th><th>Unidad</th><th>Valor</th><th>Rango</th><th>Justificación</th>
                </tr>
              </thead>
              <tbody>
                {parameters.map((p, i) => (
                  <tr key={p.key}>
                    <td>
                      <div className={styles.paramName}>{p.label}</div>
                      <div className={styles.paramMeta}>{p.technicalName}</div>
                    </td>
                    <td>
                      <div className={styles.paramDescription}>{p.description}</div>
                      <div className={styles.paramMeta}>{p.scenario} · {p.source.replaceAll('_', ' ')}</div>
                    </td>
                    <td>{p.unit}</td>
                    <td>
                      <input className={styles.input} type="number" value={p.value} onChange={(e) => updateParamValue(i, e.target.value)} />
                    </td>
                    <td>
                      <div className={styles.rangeBox}>
                        <span>{p.min}</span>
                        <span className={styles.rangeSeparator}>a</span>
                        <span>{p.max}</span>
                      </div>
                    </td>
                    <td><input className={styles.input} value={p.justification} onChange={(e) => updateParamJustification(i, e.target.value)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className={styles.card}>
          <h2 className={styles.title}>Historial auditable de corridas</h2>
          <div className={styles.grid}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Fecha</th><th>Fondo</th><th>Escenario</th><th>Versión</th><th>Hash</th><th>Pérdida%</th><th>Severidad</th><th>Decisión</th><th>Usuario</th><th>Explicación</th>
                </tr>
              </thead>
              <tbody>
                {runs.slice(0, RUN_HISTORY_LIMIT).map((r) => (
                  <tr key={r.id}>
                    <td>{new Date(r.executedAt).toLocaleString()}</td>
                    <td>{r.element}</td>
                    <td>{r.scenario}</td>
                    <td>{r.profileVersion}</td>
                    <td>{r.parameterHash}</td>
                    <td>{Number(r.result.impactoPct ?? 0).toFixed(2)}%</td>
                    <td>{String(r.result.severity ?? '')}</td>
                    <td>{String(r.result.decisionSuggested ?? '')}</td>
                    <td>{r.user}</td>
                    <td>{r.explanation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {rulesModalOpen ? (
          <div className={styles.modalBackdrop} role="presentation" onClick={() => setRulesModalOpen(false)}>
            <section
              className={styles.modalCard}
              role="dialog"
              aria-modal="true"
              aria-labelledby="liquidity-rules-modal-title"
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <div>
                  <h2 id="liquidity-rules-modal-title" className={styles.title}>Reglas parametrizables</h2>
                  <p className={styles.sectionHint}>Severidad, decisión y limitaciones operativas del motor lineal de liquidez.</p>
                </div>
                <button className={`${styles.btn} ${styles.btnGhost}`} type="button" onClick={() => setRulesModalOpen(false)}>Cerrar</button>
              </div>
              <div className={styles.row}>
                <label className={styles.field}><span className={styles.label}>Baja menor a %</span><input className={styles.input} type="number" value={rules.lowMax} onChange={(e) => setRules((r) => ({ ...r, lowMax: Number(e.target.value) }))} /></label>
                <label className={styles.field}><span className={styles.label}>Media menor a %</span><input className={styles.input} type="number" value={rules.mediumMax} onChange={(e) => setRules((r) => ({ ...r, mediumMax: Number(e.target.value) }))} /></label>
                <label className={styles.field}><span className={styles.label}>Alta menor a %</span><input className={styles.input} type="number" value={rules.highMax} onChange={(e) => setRules((r) => ({ ...r, highMax: Number(e.target.value) }))} /></label>
                <label className={styles.field}><span className={styles.label}>Limitaciones</span><input className={styles.input} value={limitations} onChange={(e) => setLimitations(e.target.value)} /></label>
                <label className={styles.field}><span className={styles.label}>Decisión baja</span><input className={styles.input} value={rules.decisionLow} onChange={(e) => setRules((r) => ({ ...r, decisionLow: e.target.value }))} /></label>
                <label className={styles.field}><span className={styles.label}>Decisión media</span><input className={styles.input} value={rules.decisionMedium} onChange={(e) => setRules((r) => ({ ...r, decisionMedium: e.target.value }))} /></label>
                <label className={styles.field}><span className={styles.label}>Decisión alta</span><input className={styles.input} value={rules.decisionHigh} onChange={(e) => setRules((r) => ({ ...r, decisionHigh: e.target.value }))} /></label>
                <label className={styles.field}><span className={styles.label}>Decisión crítica</span><input className={styles.input} value={rules.decisionCritical} onChange={(e) => setRules((r) => ({ ...r, decisionCritical: e.target.value }))} /></label>
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </main>
  );
}
