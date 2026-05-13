import type React from 'react';
import { Link2, Network, Shield, ShieldCheck, TestTubeDiagonal, Workflow } from 'lucide-react';
import type { StructuralStep } from './types';

export const STEPS: StructuralStep[] = [
  { key: 'impacto', label: 'Impacto', icon: Link2 },
  { key: 'dependencias', label: 'Dependencias', icon: Workflow },
  { key: 'compartidos', label: 'Compartidos', icon: Network },
  { key: 'riesgo', label: 'Riesgo', icon: Shield },
  { key: 'control', label: 'Control', icon: ShieldCheck },
  { key: 'evidencia', label: 'Evidencia', icon: TestTubeDiagonal },
];

export function selectedKey(runSaId: string) {
  return `kiriox_sa_selected_activities_${runSaId}`;
}

export const SURFACE: React.CSSProperties = {
  border: '1px solid rgba(129,140,248,0.22)',
  borderRadius: 14,
  background: 'linear-gradient(155deg, rgba(12,22,54,0.95), rgba(7,16,42,0.92))',
  boxShadow: '0 10px 26px rgba(2,8,23,0.35)',
};
