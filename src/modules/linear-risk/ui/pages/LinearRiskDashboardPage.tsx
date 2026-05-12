'use client';

import React from 'react';
import { StepDashboard } from '../components/StepDashboard';
import { EvaluationWizard } from '../components/context-wizard/EvaluationWizard';

export default function LinearRiskDashboardPage() {
  const [view, setView] = React.useState<'dashboard' | 'wizard'>('dashboard');
  const [activeRunRa, setActiveRunRa] = React.useState<{ id: string; code: string } | null>(null);
  const [creating, setCreating] = React.useState(false);

  const handleNewEvaluation = async () => {
    setCreating(true);
    try {
      const res = await fetch('/api/linear-risk/run-ra?forceNew=true', { method: 'POST' });
      if (!res.ok) throw new Error('Error al crear');
      const data = await res.json();
      setActiveRunRa({ id: data.id, code: data.code });
      setView('wizard');
    } catch (err) {
      console.error(err);
      alert('Error: No se pudo iniciar la evaluación.');
    } finally {
      setCreating(false);
    }
  };

  const handleOpenEvaluation = (id: string, code: string) => {
    setActiveRunRa({ id, code });
    setView('wizard');
  };

  const handleExitWizard = () => {
    setView('dashboard');
    setActiveRunRa(null);
  };

  if (view === 'wizard' && activeRunRa) {
    return (
      <EvaluationWizard
        runRaId={activeRunRa.id}
        runRaCode={activeRunRa.code}
        onExit={handleExitWizard}
      />
    );
  }

  return (
    <StepDashboard
      onNewEvaluation={handleNewEvaluation}
      onOpenEvaluation={handleOpenEvaluation}
      creating={creating}
    />
  );
}
