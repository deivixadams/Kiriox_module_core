import type { AiFieldContract } from '@/shared/ai/AiFieldContract';

export const StructuralRiskAiContracts = {
  runs: {
    title: {
      module: 'structural-risk',
      field: 'title',
      intent: 'complete',
      minWords: 5,
      maxWords: 20,
      tone: 'tecnico',
      output: 'text',
      requiredMeaning: ['análisis', 'estructural'],
    } satisfies AiFieldContract,

    change_reason: {
      module: 'structural-risk',
      field: 'change_reason',
      intent: 'complete',
      minWords: 10,
      maxWords: 40,
      tone: 'formal',
      output: 'text',
      requiredMeaning: ['cambio', 'ciclo de vida'],
    } satisfies AiFieldContract,

    completion_reason: {
      module: 'structural-risk',
      field: 'completion_reason',
      intent: 'complete',
      minWords: 10,
      maxWords: 40,
      tone: 'formal',
      output: 'text',
      requiredMeaning: ['finalización', 'resultado'],
    } satisfies AiFieldContract,
  },

  activities: {
    name: {
      module: 'structural-risk',
      field: 'name',
      intent: 'complete',
      minWords: 3,
      maxWords: 12,
      tone: 'tecnico',
      output: 'text',
    } satisfies AiFieldContract,

    description: {
      module: 'structural-risk',
      field: 'description',
      intent: 'complete',
      minWords: 15,
      maxWords: 50,
      tone: 'tecnico',
      output: 'text',
      requiredMeaning: ['actividad', 'proceso'],
    } satisfies AiFieldContract,
  },

  cascades: {
    notes: {
      module: 'structural-risk',
      field: 'notes',
      intent: 'complete',
      minWords: 15,
      maxWords: 60,
      tone: 'tecnico',
      output: 'text',
      requiredMeaning: ['cascada', 'impacto', 'riesgo'],
    } satisfies AiFieldContract,
  },

  evidence: {
    evidence_notes: {
      module: 'structural-risk',
      field: 'evidence_notes',
      intent: 'summarize',
      minWords: 20,
      maxWords: 80,
      tone: 'tecnico',
      output: 'text',
      requiredMeaning: ['evidencia', 'control', 'verificación'],
    } satisfies AiFieldContract,
  },

  analytical: {
    question: {
      module: 'structural-risk',
      field: 'question',
      intent: 'complete',
      minWords: 8,
      maxWords: 30,
      tone: 'tecnico',
      output: 'text',
    } satisfies AiFieldContract,

    operational_definition: {
      module: 'structural-risk',
      field: 'operational_definition',
      intent: 'complete',
      minWords: 20,
      maxWords: 70,
      tone: 'juridico',
      output: 'text',
      requiredMeaning: ['definición', 'concepto operativo'],
    } satisfies AiFieldContract,

    decision_signal: {
      module: 'structural-risk',
      field: 'decision_signal',
      intent: 'complete',
      minWords: 10,
      maxWords: 40,
      tone: 'ejecutivo',
      output: 'text',
      requiredMeaning: ['señal', 'decisión', 'umbral'],
    } satisfies AiFieldContract,

    effect_profile: {
      module: 'structural-risk',
      field: 'effect_profile',
      intent: 'complete',
      minWords: 15,
      maxWords: 50,
      tone: 'tecnico',
      output: 'text',
      requiredMeaning: ['perfil', 'efecto', 'impacto sistémico'],
    } satisfies AiFieldContract,
  },
} as const;

export type StructuralRiskAiContractKey = keyof typeof StructuralRiskAiContracts;
