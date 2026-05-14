'use client';

import { useEffect, useRef, useState } from 'react';
import { StepDashboard } from '../components/StepDashboard';
import { EvaluationWizard } from '../components/context-wizard/EvaluationWizard';

const RUN_RA_KEY = 'kiriox_active_run_ra_id';

export default function LinearRiskDashboardPage() {
  const [view, setView] = useState<'dashboard' | 'wizard'>('dashboard');
  const [runRaId, setRunRaId] = useState<string | null>(null);
  const [runRaCode, setRunRaCode] = useState('');
  const [creating, setCreating] = useState(false);
  const hasLaunchedRef = useRef(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('launchWizard') === 'true' && !hasLaunchedRef.current && view === 'dashboard') {
      hasLaunchedRef.current = true;
      void handleNewEvaluation();
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [view]);

  async function handleNewEvaluation() {
    setCreating(true);
    try {
      const res = await fetch('/api/linear-risk/run-ra?forceNew=true', { method: 'POST' });
      const data = (await res.json()) as { id: string; code: string };
      localStorage.setItem(RUN_RA_KEY, data.id);
      setRunRaId(data.id);
      setRunRaCode(data.code);
      setView('wizard');
    } catch {
      const id = crypto.randomUUID();
      localStorage.setItem(RUN_RA_KEY, id);
      setRunRaId(id);
      setRunRaCode('');
      setView('wizard');
    } finally {
      setCreating(false);
    }
  }

  function handleOpenEvaluation(id: string, code: string) {
    localStorage.setItem(RUN_RA_KEY, id);
    setRunRaId(id);
    setRunRaCode(code);
    setView('wizard');
  }

  function handleExit(_action: 'draft' | 'delete') {
    void _action;
    localStorage.removeItem(RUN_RA_KEY);
    setRunRaId(null);
    setRunRaCode('');
    setView('dashboard');
  }

  if (view === 'wizard' && runRaId) {
    return <EvaluationWizard runRaId={runRaId} runRaCode={runRaCode} onExit={handleExit} />;
  }

  return (
    <StepDashboard
      onNewEvaluation={handleNewEvaluation}
      onOpenEvaluation={handleOpenEvaluation}
      creating={creating}
    />
  );
}
