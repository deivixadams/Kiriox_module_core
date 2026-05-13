import type { AnalysisData, BadgeConfig, CardConfig, CI, QuestionKey } from './types';
import { critW, strgW, effS, benS, fragPct, fmtN } from './colorHelpers';

export const QUESTIONS: Record<QuestionKey, string> = {
  q1: '¿Qué nodo puede romper más sistema?',
  q2: '¿Qué dependencia genera mayor cascada?',
  q3: '¿Qué control protege más rutas críticas?',
  q4: '¿Qué evidencia sostiene demasiada confianza?',
  q5: '¿Qué intervención reduce más fragilidad con menor esfuerzo?',
};

export const QUESTION_KEYS: QuestionKey[] = ['q1', 'q2', 'q3', 'q4', 'q5'];

export const CARD_STATIC: Record<QuestionKey, { accent: string; accentBg: string; category: string; tipo: string }> = {
  q1: { accent: '#a855f7', accentBg: 'rgba(168,85,247,0.13)', category: 'ACTIVIDAD CRÍTICA',     tipo: 'Actividad'     },
  q2: { accent: '#f59e0b', accentBg: 'rgba(245,158,11,0.13)', category: 'DEPENDENCIA CRÍTICA',   tipo: 'Dependencia'   },
  q3: { accent: '#10b981', accentBg: 'rgba(16,185,129,0.13)', category: 'CONTROL CLAVE',         tipo: 'Control'       },
  q4: { accent: '#3b82f6', accentBg: 'rgba(59,130,246,0.13)', category: 'EVIDENCIA CLAVE',       tipo: 'Evidencia'     },
  q5: { accent: '#f59e0b', accentBg: 'rgba(245,158,11,0.13)', category: 'INTERVENCIÓN PRIORITARIA', tipo: 'Intervención' },
};

// Legend rows for SummaryTable
export const CRIT_LEGEND = [
  { label: 'Criticidad Muy Alta', color: '#c084fc' },
  { label: 'Alta',                color: '#f87171' },
  { label: 'Media',               color: '#fbbf24' },
  { label: 'Baja',                color: '#4ade80' },
];

function badge(ci: CI, prefix: string): BadgeConfig {
  return { ...ci, label: `${prefix}: ${ci.label}` };
}

export function buildCardConfigs(answers: AnalysisData['answers']): CardConfig[] {
  const { q1, q2, q3, q4, q5 } = answers ?? {};

  // Q1
  const q1ci = q1 ? critW(q1.why.criticality_weight) : null;

  // Q2
  const q2ci = q2 ? strgW(q2.why.strength_weight) : null;

  // Q3
  const q3hg = Boolean(q3 && q3.why.hardgate_flag > 0);
  const q3ci: CI | null = q3
    ? (q3hg ? { label: 'Muy Alta', color: '#4ade80', bg: 'rgba(74,222,128,0.10)' } : critW(q3.why.evidence_health))
    : null;

  // Q5
  const q5eff = q5 ? effS(q5.effort_score) : null;
  const q5ben = q5 ? benS(q5.benefit_score) : null;
  const q5pct = q5 ? fragPct(q5.benefit_score, q5.effort_score) : 0;

  return [
    {
      ...CARD_STATIC.q1, key: 'q1',
      entityName: q1?.node_name ?? '—',
      badges: q1ci ? [badge(q1ci, 'Criticidad')] : [],
      metricLabel: 'Impacta directamente a',
      metricValue: q1 ? fmtN(q1.why.degree) : '—',
      metricUnit: 'nodos',
      critInfo: q1ci,
      tipo: CARD_STATIC.q1.tipo,
      efectos: q1
        ? `Grado: ${Math.round(q1.why.degree)}, Cascada: ${Math.round(q1.why.cascade_exposure)}, Concentración: ${Math.round(q1.why.resource_concentration)}`
        : '',
      impacto: q1 ? `${fmtN(q1.why.degree)} nodos` : '—',
    },
    {
      ...CARD_STATIC.q2, key: 'q2',
      entityName: q2 ? `${q2.from_activity_name} → ${q2.to_activity_name}` : '—',
      badges: q2ci ? [badge(q2ci, 'Fuerza')] : [],
      metricLabel: 'Puede afectar hasta',
      metricValue: q2 ? fmtN(q2.why.estimated_reach) : '—',
      metricUnit: 'nodos',
      critInfo: q2ci,
      tipo: CARD_STATIC.q2.tipo,
      efectos: q2
        ? `Fuerza: ${q2.why.strength_weight.toFixed(2)}, Falla: ${q2.why.failure_effect_weight.toFixed(2)}, Alcance: ${Math.round(q2.why.estimated_reach)}`
        : '',
      impacto: q2 ? `${fmtN(q2.why.estimated_reach)} nodos` : '—',
    },
    {
      ...CARD_STATIC.q3, key: 'q3',
      entityName: q3?.control_name ?? '—',
      badges: q3hg
        ? [{ label: 'Hardgate',   color: '#4ade80', bg: 'rgba(74,222,128,0.10)' }]
        : [{ label: 'Preventivo', color: '#60a5fa', bg: 'rgba(59,130,246,0.12)' }],
      metricLabel: 'Protege',
      metricValue: q3 ? fmtN(q3.why.protected_activities) : '—',
      metricUnit: 'rutas críticas',
      critInfo: q3ci,
      tipo: CARD_STATIC.q3.tipo,
      efectos: q3
        ? `Riesgos: ${Math.round(q3.why.mitigated_risks)}, Actividades: ${Math.round(q3.why.protected_activities)}, Evidencia: ${(q3.why.evidence_health * 100).toFixed(0)}%`
        : '',
      impacto: q3 ? `${fmtN(q3.why.protected_activities)} actividades` : '—',
    },
    {
      ...CARD_STATIC.q4, key: 'q4',
      entityName: q4?.evidence_name ?? '—',
      badges: [{ label: 'Confianza Concentrada', color: '#60a5fa', bg: 'rgba(59,130,246,0.14)' }],
      metricLabel: 'Sostiene',
      metricValue: q4 ? fmtN(q4.why.linked_controls) : '—',
      metricUnit: q4 ? `controles y ${Math.round(q4.why.linked_risks)} riesgos` : 'controles',
      critInfo: q4 ? critW(q4.why.validity_rate) : null,
      tipo: CARD_STATIC.q4.tipo,
      efectos: q4
        ? `Controles: ${Math.round(q4.why.linked_controls)}, Riesgos: ${Math.round(q4.why.linked_risks)}, Validez: ${(q4.why.validity_rate * 100).toFixed(0)}%`
        : '',
      impacto: q4 ? `${fmtN(q4.why.linked_controls)} controles` : '—',
    },
    {
      ...CARD_STATIC.q5, key: 'q5',
      entityName: q5?.activity_name ?? '—',
      badges: [
        ...(q5eff ? [badge(q5eff, 'Esfuerzo')] : []),
        ...(q5ben ? [badge(q5ben, 'Impacto')]   : []),
      ],
      metricLabel: 'Reduce fragilidad en',
      metricValue: q5 ? `${q5pct}%` : '—',
      metricUnit: '',
      critInfo: q5ben,
      tipo: CARD_STATIC.q5.tipo,
      efectos: q5
        ? `Beneficio: ${q5.benefit_score.toFixed(2)}, Esfuerzo: ${q5.effort_score.toFixed(2)}, Índice: ${q5.priority_index.toFixed(2)}`
        : '',
      impacto: q5 ? `${q5pct}% reducción` : '—',
    },
  ];
}
