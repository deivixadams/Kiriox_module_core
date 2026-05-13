'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { useStructuralAnalysis }   from '../components/structural-analysis/useStructuralAnalysis';
import { buildCardConfigs }         from '../components/structural-analysis/cardConfigs';
import { AnalysisHeader }           from '../components/structural-analysis/AnalysisHeader';
import { MetricsRow }               from '../components/structural-analysis/MetricsRow';
import { QuestionCardsGrid }        from '../components/structural-analysis/QuestionCardsGrid';
import { DetailPanel }              from '../components/structural-analysis/DetailPanel';
import { SummaryTable }             from '../components/structural-analysis/SummaryTable';
import { DataQualityWarnings }      from '../components/structural-analysis/DataQualityWarnings';
import { QUESTIONS, QUESTION_KEYS } from '../components/structural-analysis/cardConfigs';
import type { QuestionKey }         from '../components/structural-analysis/types';

// ── Loading / error states (hoisted per rendering-hoist-jsx) ──────────────────
const loadingScreen = (
  <main style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#0d1634 0%,#080f23 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ textAlign: 'center', color: '#60a5fa' }}>
      <div style={{ fontSize: '2.2rem', marginBottom: '1rem' }}>⚙️</div>
      <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Ejecutando análisis estructural...</div>
      <div style={{ fontSize: '0.73rem', color: '#475569', marginTop: '0.4rem' }}>Calculando métricas del grafo</div>
    </div>
  </main>
);

export default function StructuralAnalysisResultPage() {
  const router      = useRouter();
  const searchParams = useSearchParams();
  const runSaId     = searchParams.get('runSaId');

  const { data, error, isPending } = useStructuralAnalysis(runSaId);

  // rule rerender-functional-setstate: functional update → stable toggle callback
  const [activeDetail, setActiveDetail] = useState<QuestionKey | null>(null);
  const handleDetailToggle = useCallback(
    (key: QuestionKey) => setActiveDetail((prev) => (prev === key ? null : key)),
    [],
  );

  // rule rerender-derived-state: build cards during render, memoized on answers
  const cards = useMemo(
    () => buildCardConfigs(data?.answers ?? {}),
    [data?.answers],
  );

  // ── Guards ─────────────────────────────────────────────────────────────────
  if (isPending) return loadingScreen;

  if (error) return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#0d1634 0%,#080f23 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', maxWidth: 460, padding: '2rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
        <div style={{ color: '#f87171', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem' }}>Error al cargar el análisis</div>
        <div style={{ color: '#64748b', fontSize: '0.78rem', marginBottom: '1.5rem' }}>{error}</div>
        <button type="button" onClick={() => router.push('/gestion/dashboard_riesgo_estructural')}
          style={{ borderRadius: 9, border: '1px solid rgba(168,85,247,0.35)', background: 'rgba(88,28,135,0.2)', color: '#e9d5ff', padding: '0.5rem 1.2rem', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
          Ir al dashboard
        </button>
      </div>
    </main>
  );

  if (!data) return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#0d1634 0%,#080f23 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: '#64748b', fontSize: '0.83rem' }}>Sin runSaId — ingresa desde el wizard de captura.</div>
        <button type="button" onClick={() => router.push('/gestion/wizard_captura_estructural')}
          style={{ marginTop: '1rem', borderRadius: 9, border: '1px solid rgba(96,165,250,0.3)', background: 'rgba(30,64,175,0.15)', color: '#bfdbfe', padding: '0.45rem 1rem', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer' }}>
          Ir al wizard
        </button>
      </div>
    </main>
  );

  const rs  = data.run_summary;
  const dq  = data.data_quality;
  const pct = Math.round((dq?.analysis_confidence ?? 0) * 100);

  const activeDetailRows = activeDetail ? (data.details[activeDetail] ?? []) : [];
  const activeQuestion   = activeDetail ? QUESTIONS[activeDetail] : '';

  return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#0d1634 0%,#080f23 100%)', padding: '1.4rem 1.8rem', fontFamily: 'system-ui,sans-serif' }}>

      <AnalysisHeader
        runCode={rs.run_code}
        isComplete={rs.completeness_status === 'complete_data'}
        onClose={() => router.push('/gestion/dashboard_riesgo_estructural')}
      />

      <MetricsRow
        nodesCount={rs.graph_nodes_count}
        edgesCount={rs.graph_edges_count}
        activitiesCount={rs.activities_count ?? 0}
        risksCount={rs.risks_count ?? 0}
        controlsCount={rs.controls_count ?? 0}
        evidencesCount={rs.evidences_count ?? 0}
        resourcesCount={rs.resources_count ?? 0}
        confidencePct={pct}
      />

      <QuestionCardsGrid
        answers={data.answers}
        activeDetail={activeDetail}
        onDetailToggle={handleDetailToggle}
      />

      {activeDetail !== null && activeDetailRows.length > 0 ? (
        <DetailPanel
          rows={activeDetailRows}
          question={activeQuestion}
          onClose={() => setActiveDetail(null)}
        />
      ) : null}

      <SummaryTable
        cards={cards}
        activeDetail={activeDetail}
        onDetailToggle={handleDetailToggle}
      />

      <DataQualityWarnings
        missingData={dq?.missing_data}
        blockedConclusions={dq?.blocked_conclusions}
      />

    </main>
  );
}
