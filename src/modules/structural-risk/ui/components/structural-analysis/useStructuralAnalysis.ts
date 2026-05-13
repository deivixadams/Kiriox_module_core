'use client';

import { useEffect, useTransition, useState } from 'react';
import type { AnalysisData } from './types';

export function useStructuralAnalysis(runSaId: string | null) {
  const [data, setData] = useState<AnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!runSaId) return;
    setError(null);
    // React 19: async startTransition — rule rendering-usetransition-loading
    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/structural-risk/analysis-structural?runSaId=${encodeURIComponent(runSaId)}`,
          { cache: 'no-store' },
        );
        const payload: unknown = await res.json();
        if (!res.ok) throw new Error((payload as { error?: string })?.error ?? 'Error al cargar el análisis.');
        setData(payload as AnalysisData);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error inesperado');
      }
    });
  }, [runSaId]); // primitive dep — rule rerender-dependencies

  return { data, error, isPending };
}
