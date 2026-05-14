'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './StressTestingPage.module.css';

type FundType = 'FICI Interval I' | 'FICD Interval I';
type ProfileName = 'Conservador' | 'Moderado' | 'Severo' | 'Extremo' | 'Personalizado';
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
  lossLowMax: number;
  lossMediumMax: number;
  lossHighMax: number;
  decisionLow: string;
  decisionMedium: string;
  decisionHigh: string;
  decisionCritical: string;
};

type ProfileSnapshot = {
  version: number;
  fund: FundType;
  profile: ProfileName;
  updatedAt: string;
  parameters: Parameter[];
  rules: Rules;
};

type RunRecord = {
  id: string;
  fund: FundType;
  profile: ProfileName;
  profileVersion: number;
  executedAt: string;
  user: string;
  parameterHash: string;
  parameters: Parameter[];
  result: Record<string, unknown>;
  explanation: string;
  limitations: string;
};

const USER = 'dev@kiriox.local';
const STORAGE_KEY = 'kiriox_stress_testing_v1';
const AUTO_SIMULATION_TARGET = 3000;
const RUN_HISTORY_LIMIT = 10;

const BASE_VALUES: Record<FundType, { baseValue: number; cuotaBase: number }> = {
  'FICI Interval I': { baseValue: 100_000_000, cuotaBase: 100 },
  'FICD Interval I': { baseValue: 120_000_000, cuotaBase: 100 },
};

const DEFAULT_RULES: Rules = {
  lossLowMax: 5,
  lossMediumMax: 12,
  lossHighMax: 20,
  decisionLow: 'Aceptar o monitorear',
  decisionMedium: 'Monitorear o tratar',
  decisionHigh: 'Tratar o escalar',
  decisionCritical: 'Escalar, restringir o detener',
};

function createFiciParams(): Parameter[] {
  return [
    { key: 'shock_valor_activos', technicalName: 'shock_valor_activos', label: 'Shock valor activos', description: 'Variación estresada del valor de activos.', unit: '%', defaultValue: -8, min: -80, max: 20, scenario: 'mercado', justification: 'Volatilidad de valuación', source: 'modelo_interno', value: -8 },
    { key: 'shock_renta', technicalName: 'shock_renta', label: 'Shock renta', description: 'Variación estresada de renta esperada.', unit: '%', defaultValue: -12, min: -100, max: 30, scenario: 'ingresos', justification: 'Contracción de demanda', source: 'supuesto_hipotetico', value: -12 },
    { key: 'shock_ocupacion', technicalName: 'shock_ocupacion', label: 'Shock ocupación', description: 'Cambio estresado en ocupación.', unit: 'pp', defaultValue: -10, min: -100, max: 20, scenario: 'operativo', justification: 'Vacancia temporal', source: 'usuario', value: -10 },
    { key: 'aumento_tasa_descuento_pb', technicalName: 'aumento_tasa_descuento_pb', label: 'Aumento tasa descuento', description: 'Incremento de tasa en puntos básicos.', unit: 'pb', defaultValue: 150, min: 0, max: 3000, scenario: 'mercado', justification: 'Prima de riesgo', source: 'publico', value: 150 },
    { key: 'meses_retraso_venta', technicalName: 'meses_retraso_venta', label: 'Meses retraso venta', description: 'Retraso esperado para liquidar activos.', unit: 'meses', defaultValue: 4, min: 0, max: 36, scenario: 'liquidez', justification: 'Profundidad de mercado', source: 'modelo_interno', value: 4 },
    { key: 'haircut_liquidez', technicalName: 'haircut_liquidez', label: 'Haircut liquidez', description: 'Descuento por venta forzada.', unit: '%', defaultValue: 9, min: 0, max: 80, scenario: 'liquidez', justification: 'Stress de caja', source: 'modelo_interno', value: 9 },
    { key: 'concentracion_activo_principal', technicalName: 'concentracion_activo_principal', label: 'Concentración activo principal', description: 'Peso del activo principal.', unit: '%', defaultValue: 28, min: 0, max: 100, scenario: 'concentracion', justification: 'Riesgo idiosincrático', source: 'usuario', value: 28 },
    { key: 'concentracion_arrendatario_principal', technicalName: 'concentracion_arrendatario_principal', label: 'Concentración arrendatario principal', description: 'Peso del principal arrendatario.', unit: '%', defaultValue: 22, min: 0, max: 100, scenario: 'concentracion', justification: 'Dependencia comercial', source: 'usuario', value: 22 },
  ];
}

function createFicdParams(): Parameter[] {
  return [
    { key: 'tasa_default', technicalName: 'tasa_default', label: 'Tasa default', description: 'Default esperado de cartera.', unit: '%', defaultValue: 7, min: 0, max: 100, scenario: 'credito', justification: 'Deterioro de pago', source: 'modelo_interno', value: 7 },
    { key: 'tasa_recuperacion', technicalName: 'tasa_recuperacion', label: 'Tasa recuperación', description: 'Recuperación esperada tras default.', unit: '%', defaultValue: 45, min: 0, max: 100, scenario: 'credito', justification: 'Cobertura de garantías', source: 'modelo_interno', value: 45 },
    { key: 'shock_valoracion', technicalName: 'shock_valoracion', label: 'Shock valoración', description: 'Ajuste de valuación de cartera.', unit: '%', defaultValue: -10, min: -100, max: 30, scenario: 'mercado', justification: 'Ajuste de spread', source: 'publico', value: -10 },
    { key: 'meses_atraso_pago', technicalName: 'meses_atraso_pago', label: 'Meses atraso pago', description: 'Desfase de pagos esperados.', unit: 'meses', defaultValue: 3, min: 0, max: 24, scenario: 'liquidez', justification: 'Cadena de pagos', source: 'usuario', value: 3 },
    { key: 'aumento_tasa_descuento_pb', technicalName: 'aumento_tasa_descuento_pb', label: 'Aumento tasa descuento', description: 'Incremento de tasa en pb.', unit: 'pb', defaultValue: 180, min: 0, max: 3000, scenario: 'mercado', justification: 'Prima sistémica', source: 'publico', value: 180 },
    { key: 'haircut_iliquidez', technicalName: 'haircut_iliquidez', label: 'Haircut iliquidez', description: 'Descuento por iliquidez.', unit: '%', defaultValue: 12, min: 0, max: 80, scenario: 'liquidez', justification: 'Profundidad secundaria', source: 'modelo_interno', value: 12 },
    { key: 'concentracion_emisor_principal', technicalName: 'concentracion_emisor_principal', label: 'Concentración emisor principal', description: 'Peso del emisor principal.', unit: '%', defaultValue: 24, min: 0, max: 100, scenario: 'concentracion', justification: 'Riesgo de emisor', source: 'usuario', value: 24 },
    { key: 'porcentaje_cartera_deteriorada', technicalName: 'porcentaje_cartera_deteriorada', label: 'Porcentaje cartera deteriorada', description: 'Fracción de cartera en deterioro.', unit: '%', defaultValue: 16, min: 0, max: 100, scenario: 'credito', justification: 'Señales de mora', source: 'modelo_interno', value: 16 },
  ];
}

function hashSnapshot(input: object): string {
  const text = JSON.stringify(input);
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `h${(h >>> 0).toString(16)}`;
}

function buildProfile(base: Parameter[], profile: ProfileName): Parameter[] {
  const mult = profile === 'Conservador' ? 0.7 : profile === 'Moderado' ? 1 : profile === 'Severo' ? 1.35 : profile === 'Extremo' ? 1.75 : 1;
  return base.map((p) => {
    const sign = p.defaultValue < 0 ? -1 : 1;
    const raw = profile === 'Personalizado' ? p.value : p.defaultValue * mult;
    const next = sign < 0 ? Math.min(p.max, Math.max(p.min, raw)) : Math.min(p.max, Math.max(p.min, raw));
    return { ...p, value: Number(next.toFixed(2)) };
  });
}

function computeResults(fund: FundType, params: Parameter[], rules: Rules) {
  const base = BASE_VALUES[fund];
  const pressure = params.reduce((acc, p) => {
    const normalized = Math.abs((p.value - p.min) / Math.max(1, p.max - p.min));
    return acc + normalized;
  }, 0) / Math.max(1, params.length);
  const lossPct = Number((pressure * 28).toFixed(2));
  const stressedValue = Number((base.baseValue * (1 - lossPct / 100)).toFixed(2));
  const estimatedLoss = Number((base.baseValue - stressedValue).toFixed(2));
  const impactPerShare = Number((estimatedLoss / 1_000_000).toFixed(4));
  const severity =
    lossPct < rules.lossLowMax ? 'Baja' :
    lossPct < rules.lossMediumMax ? 'Media' :
    lossPct < rules.lossHighMax ? 'Alta' : 'Crítica';
  const suggestedDecision =
    severity === 'Baja' ? rules.decisionLow :
    severity === 'Media' ? rules.decisionMedium :
    severity === 'Alta' ? rules.decisionHigh : rules.decisionCritical;
  const executiveExplanation = `El escenario ${severity.toLowerCase()} proyecta pérdida de ${lossPct}% en ${fund}. La decisión sugerida es: ${suggestedDecision}.`;
  return { stressedValue, estimatedLoss, lossPct, impactPerShare, severity, suggestedDecision, executiveExplanation };
}

export default function StressTestingPage() {
  const router = useRouter();
  const [fund, setFund] = useState<FundType>('FICI Interval I');
  const [profile, setProfile] = useState<ProfileName>('Moderado');
  const [profileVersion, setProfileVersion] = useState(1);
  const [simulationSpeed, setSimulationSpeed] = useState(6);
  const [parameters, setParameters] = useState<Parameter[]>(createFiciParams());
  const [rules, setRules] = useState<Rules>(DEFAULT_RULES);
  const [limitations, setLimitations] = useState('Modelo simplificado para apoyo de decisión; no reemplaza valoración oficial.');
  const [autoSimulation, setAutoSimulation] = useState({ running: false, completed: 0, target: AUTO_SIMULATION_TARGET });
  const [runs, setRuns] = useState<RunRecord[]>(() => {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as { runs: RunRecord[] };
      return (parsed.runs ?? []).slice(0, RUN_HISTORY_LIMIT);
    } catch {
      return [];
    }
  });
  const autoStopRef = useRef(false);
  const simulationSpeedRef = useRef(simulationSpeed);

  const result = useMemo(() => computeResults(fund, parameters, rules), [fund, parameters, rules]);

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

  function handleFundChange(nextFund: FundType) {
    setFund(nextFund);
    const base = nextFund === 'FICI Interval I' ? createFiciParams() : createFicdParams();
    setParameters(buildProfile(base, profile));
    if (profile !== 'Personalizado') {
      setProfileVersion((v) => v + 1);
    }
  }

  function handleProfileChange(nextProfile: ProfileName) {
    setProfile(nextProfile);
    const base = fund === 'FICI Interval I' ? createFiciParams() : createFicdParams();
    setParameters(buildProfile(base, nextProfile));
    if (nextProfile !== 'Personalizado') {
      setProfileVersion((v) => v + 1);
    }
  }

  function updateParam(idx: number, field: keyof Parameter, value: string) {
    setParameters((prev) => prev.map((p, i) => {
      if (i !== idx) return p;
      if (field === 'value' || field === 'min' || field === 'max' || field === 'defaultValue') return { ...p, [field]: Number(value) };
      return { ...p, [field]: value };
    }));
    setProfile('Personalizado');
    setProfileVersion((v) => v + 1);
  }

  function updateParamValue(idx: number, value: string) {
    updateParam(idx, 'value', value);
  }

  function updateParamJustification(idx: number, value: string) {
    updateParam(idx, 'justification', value);
  }

  function saveCurrentRun() {
    const snapshot: ProfileSnapshot = {
      version: profileVersion,
      fund,
      profile,
      updatedAt: new Date().toISOString(),
      parameters,
      rules,
    };
    const parameterHash = hashSnapshot(snapshot);
    const record: RunRecord = {
      id: crypto.randomUUID(),
      fund,
      profile,
      profileVersion,
      executedAt: new Date().toISOString(),
      user: USER,
      parameterHash,
      parameters,
      result,
      explanation: result.executiveExplanation,
      limitations,
    };
    const next = [record, ...runs].slice(0, RUN_HISTORY_LIMIT);
    setRuns(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ runs: next }));
  }

  function persistRuns(nextRuns: RunRecord[] | ((prev: RunRecord[]) => RunRecord[])) {
    setRuns((prev) => {
      const resolved = (typeof nextRuns === 'function' ? nextRuns(prev) : nextRuns).slice(0, RUN_HISTORY_LIMIT);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ runs: resolved }));
      return resolved;
    });
  }

  function randomizeScenario() {
    setParameters((prev) =>
      prev.map((p) => ({
        ...p,
        value: Number((p.min + Math.random() * (p.max - p.min)).toFixed(4)),
        source: 'supuesto_hipotetico',
        justification: p.justification || 'Simulación hipotética aleatoria',
      }))
    );
    setProfile('Personalizado');
    setProfileVersion((v) => v + 1);
  }

  function buildRandomizedParameters(sourceParams: Parameter[]): Parameter[] {
    return sourceParams.map((p) => ({
      ...p,
      value: Number((p.min + Math.random() * (p.max - p.min)).toFixed(4)),
      source: 'supuesto_hipotetico',
      justification: p.justification || 'Simulación automatizada',
    }));
  }

  function buildRunRecord(nextParams: Parameter[], nextResult: ReturnType<typeof computeResults>, nextVersion: number): RunRecord {
    const snapshot: ProfileSnapshot = {
      version: nextVersion,
      fund,
      profile: 'Personalizado',
      updatedAt: new Date().toISOString(),
      parameters: nextParams,
      rules,
    };

    return {
      id: crypto.randomUUID(),
      fund,
      profile: 'Personalizado',
      profileVersion: nextVersion,
      executedAt: new Date().toISOString(),
      user: USER,
      parameterHash: hashSnapshot(snapshot),
      parameters: nextParams,
      result: nextResult,
      explanation: nextResult.executiveExplanation,
      limitations,
    };
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
    let versionCursor = profileVersion;
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
        const nextResult = computeResults(fund, nextParams, rules);
        batchRecords.push(buildRunRecord(nextParams, nextResult, versionCursor));
        latestParams = nextParams;
      }

      completed += batchCount;
      currentParamsCursor = latestParams;
      setParameters(latestParams);
      setProfileVersion(versionCursor);
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
    simulationSpeedRef.current = simulationSpeed;
  }, [simulationSpeed]);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as { runs: RunRecord[] };
      const storedRuns = parsed.runs ?? [];
      const trimmed = storedRuns.slice(0, RUN_HISTORY_LIMIT);
      if (trimmed.length !== storedRuns.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ runs: trimmed }));
      }
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
          <h1 className={styles.title}>Stress testing parametrizable</h1>
          <div className={styles.metaRow}>
            <span className={styles.metaPill}>Perfil v{profileVersion}</span>
            <span className={styles.metaPill}>{USER}</span>
            <span className={styles.metaPill}>{parameters.length} supuestos activos</span>
          </div>
          <div className={styles.row}>
            <label className={styles.field}><span className={styles.label}>Fondo</span>
              <select className={styles.select} value={fund} onChange={(e) => handleFundChange(e.target.value as FundType)}>
                <option>FICI Interval I</option>
                <option>FICD Interval I</option>
              </select>
            </label>
            <label className={styles.field}><span className={styles.label}>Perfil</span>
              <select className={styles.select} value={profile} onChange={(e) => handleProfileChange(e.target.value as ProfileName)}>
                <option>Conservador</option><option>Moderado</option><option>Severo</option><option>Extremo</option><option>Personalizado</option>
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
            <button className={styles.btn} type="button" onClick={saveCurrentRun}>Guardar corrida</button>
            <button className={`${styles.btn} ${styles.btnGhost}`} type="button" onClick={() => router.push('/gestion/dashboard_simulaciones')}>Cerrar</button>
            <label className={styles.speedControl}>
              <span className={styles.speedLabel}>Velocidad</span>
              <input
                className={styles.speedSlider}
                type="range"
                min="1"
                max="10"
                step="1"
                value={simulationSpeed}
                onChange={(e) => setSimulationSpeed(Number(e.target.value))}
              />
              <span className={styles.speedValue}>{simulationSpeed}</span>
            </label>
          </div>
          <div className={styles.liveStatus}>
            {autoSimulation.running
              ? `Auto simulación en curso: ${autoSimulation.completed.toLocaleString()} / ${autoSimulation.target.toLocaleString()} corridas · velocidad ${simulationSpeed}/10`
              : autoSimulation.completed > 0
                ? `Última auto simulación: ${autoSimulation.completed.toLocaleString()} corridas procesadas · velocidad ${simulationSpeed}/10`
                : 'Modo manual activo'}
          </div>
        </section>

        <section className={styles.card}>
          <h2 className={styles.title}>Resultado inmediato</h2>
          <div className={styles.kpi}>
            <div className={styles.kpiBox}><div className={styles.kpiLabel}>Valor estresado</div><div className={styles.kpiValue}>{result.stressedValue.toLocaleString()}</div></div>
            <div className={styles.kpiBox}><div className={styles.kpiLabel}>Pérdida estimada</div><div className={styles.kpiValue}>{result.estimatedLoss.toLocaleString()}</div></div>
            <div className={styles.kpiBox}><div className={styles.kpiLabel}>Pérdida %</div><div className={styles.kpiValue}>{result.lossPct}%</div></div>
            <div className={styles.kpiBox}><div className={styles.kpiLabel}>Impacto por cuota</div><div className={styles.kpiValue}>{result.impactPerShare}</div></div>
            <div className={styles.kpiBox}><div className={styles.kpiLabel}>Severidad</div><div className={styles.kpiValue}>{result.severity}</div></div>
            <div className={styles.kpiBox}><div className={styles.kpiLabel}>Decisión sugerida</div><div className={styles.kpiValue}>{result.suggestedDecision}</div></div>
          </div>
          <div className={styles.executiveBox}>
            <div className={styles.executiveLabel}>Explicación ejecutiva</div>
            <div className={styles.executiveText}>{result.executiveExplanation}</div>
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
                {parameters.map((p, idx) => (
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
                      <input className={styles.input} type="number" value={p.value} onChange={(e) => updateParamValue(idx, e.target.value)} />
                    </td>
                    <td>
                      <div className={styles.rangeBox}>
                        <span>{p.min}</span>
                        <span className={styles.rangeSeparator}>a</span>
                        <span>{p.max}</span>
                      </div>
                    </td>
                    <td>
                      <input className={styles.input} value={p.justification} onChange={(e) => updateParamJustification(idx, e.target.value)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className={styles.card}>
          <h2 className={styles.title}>Reglas editables de clasificación y decisión</h2>
          <div className={styles.row}>
            <label className={styles.field}><span className={styles.label}>Baja menor a (%)</span><input className={styles.input} type="number" value={rules.lossLowMax} onChange={(e) => setRules((r) => ({ ...r, lossLowMax: Number(e.target.value) }))} /></label>
            <label className={styles.field}><span className={styles.label}>Media menor a (%)</span><input className={styles.input} type="number" value={rules.lossMediumMax} onChange={(e) => setRules((r) => ({ ...r, lossMediumMax: Number(e.target.value) }))} /></label>
            <label className={styles.field}><span className={styles.label}>Alta menor a (%)</span><input className={styles.input} type="number" value={rules.lossHighMax} onChange={(e) => setRules((r) => ({ ...r, lossHighMax: Number(e.target.value) }))} /></label>
            <label className={styles.field}><span className={styles.label}>Limitaciones</span><input className={styles.input} value={limitations} onChange={(e) => setLimitations(e.target.value)} /></label>
            <label className={styles.field}><span className={styles.label}>Decisión baja</span><input className={styles.input} value={rules.decisionLow} onChange={(e) => setRules((r) => ({ ...r, decisionLow: e.target.value }))} /></label>
            <label className={styles.field}><span className={styles.label}>Decisión media</span><input className={styles.input} value={rules.decisionMedium} onChange={(e) => setRules((r) => ({ ...r, decisionMedium: e.target.value }))} /></label>
            <label className={styles.field}><span className={styles.label}>Decisión alta</span><input className={styles.input} value={rules.decisionHigh} onChange={(e) => setRules((r) => ({ ...r, decisionHigh: e.target.value }))} /></label>
            <label className={styles.field}><span className={styles.label}>Decisión crítica</span><input className={styles.input} value={rules.decisionCritical} onChange={(e) => setRules((r) => ({ ...r, decisionCritical: e.target.value }))} /></label>
          </div>
        </section>

        <section className={styles.card}>
          <h2 className={styles.title}>Historial auditable de corridas</h2>
          <div className={styles.grid}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Fecha</th><th>Fondo</th><th>Perfil</th><th>Versión</th><th>Usuario</th><th>Hash snapshot</th><th>Severidad</th><th>Pérdida %</th><th>Decisión</th><th>Explicación</th><th>Limitaciones</th>
                </tr>
              </thead>
              <tbody>
                {runs.slice(0, RUN_HISTORY_LIMIT).map((r) => (
                  <tr key={r.id}>
                    <td>{new Date(r.executedAt).toLocaleString()}</td>
                    <td>{r.fund}</td>
                    <td>{r.profile}</td>
                    <td>{r.profileVersion}</td>
                    <td>{r.user}</td>
                    <td>{r.parameterHash}</td>
                    <td><span className={styles.pill}>{String(r.result.severity ?? '')}</span></td>
                    <td>{String(r.result.lossPct ?? '')}%</td>
                    <td>{String(r.result.suggestedDecision ?? '')}</td>
                    <td>{r.explanation}</td>
                    <td>{r.limitations}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
