'use client';

import { useMemo, useState } from 'react';
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
  const [fund, setFund] = useState<FundType>('FICI Interval I');
  const [profile, setProfile] = useState<ProfileName>('Moderado');
  const [profileVersion, setProfileVersion] = useState(1);
  const [parameters, setParameters] = useState<Parameter[]>(createFiciParams());
  const [rules, setRules] = useState<Rules>(DEFAULT_RULES);
  const [limitations, setLimitations] = useState('Modelo simplificado para apoyo de decisión; no reemplaza valoración oficial.');
  const [runs, setRuns] = useState<RunRecord[]>(() => {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as { runs: RunRecord[] };
      return parsed.runs ?? [];
    } catch {
      return [];
    }
  });

  const result = useMemo(() => computeResults(fund, parameters, rules), [fund, parameters, rules]);

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
    const next = [record, ...runs].slice(0, 50);
    setRuns(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ runs: next }));
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

  return (
    <main className={styles.page}>
      <div className={styles.wrap}>
        <section className={styles.card}>
          <h1 className={styles.title}>Stress testing parametrizable</h1>
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
            <label className={styles.field}><span className={styles.label}>Versión perfil</span>
              <input className={styles.input} value={profileVersion} readOnly />
            </label>
            <label className={styles.field}><span className={styles.label}>Usuario</span>
              <input className={styles.input} value={USER} readOnly />
            </label>
          </div>
          <div className={styles.actions} style={{ marginTop: 10 }}>
            <button className={styles.btn} type="button" onClick={randomizeScenario}>Simular</button>
            <button className={styles.btn} type="button" onClick={saveCurrentRun}>Guardar corrida</button>
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
            <div className={styles.kpiBox}><div className={styles.kpiLabel}>Explicación ejecutiva</div><div className={styles.kpiValue}>{result.executiveExplanation}</div></div>
          </div>
        </section>

        <section className={styles.card}>
          <h2 className={styles.title}>Parámetros de escenario</h2>
          <div className={styles.grid}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nombre técnico</th><th>Etiqueta</th><th>Descripción</th><th>Unidad</th><th>Valor</th><th>Mín</th><th>Máx</th><th>Escenario</th><th>Justificación</th><th>Fuente</th>
                </tr>
              </thead>
              <tbody>
                {parameters.map((p, idx) => (
                  <tr key={p.key}>
                    <td>{p.technicalName}</td>
                    <td><input className={styles.input} value={p.label} onChange={(e) => updateParam(idx, 'label', e.target.value)} /></td>
                    <td><input className={styles.input} value={p.description} onChange={(e) => updateParam(idx, 'description', e.target.value)} /></td>
                    <td><input className={styles.input} value={p.unit} onChange={(e) => updateParam(idx, 'unit', e.target.value)} /></td>
                    <td><input className={styles.input} type="number" value={p.value} onChange={(e) => updateParam(idx, 'value', e.target.value)} /></td>
                    <td><input className={styles.input} type="number" value={p.min} onChange={(e) => updateParam(idx, 'min', e.target.value)} /></td>
                    <td><input className={styles.input} type="number" value={p.max} onChange={(e) => updateParam(idx, 'max', e.target.value)} /></td>
                    <td><input className={styles.input} value={p.scenario} onChange={(e) => updateParam(idx, 'scenario', e.target.value)} /></td>
                    <td><input className={styles.input} value={p.justification} onChange={(e) => updateParam(idx, 'justification', e.target.value)} /></td>
                    <td>
                      <select className={styles.select} value={p.source} onChange={(e) => updateParam(idx, 'source', e.target.value)}>
                        <option value="publico">publico</option>
                        <option value="usuario">usuario</option>
                        <option value="supuesto_hipotetico">supuesto hipotético</option>
                        <option value="modelo_interno">modelo interno</option>
                      </select>
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
                {runs.map((r) => (
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
