import type { AiFieldContract } from '@/shared/ai/AiFieldContract';

export const MonitoringAiContracts = {
  items: {
    title: {
      module: 'monitoring',
      field: 'title',
      intent: 'complete',
      minWords: 4,
      maxWords: 18,
      tone: 'tecnico',
      output: 'text',
      requiredMeaning: ['monitoreo', 'control'],
    } satisfies AiFieldContract,

    category: {
      module: 'monitoring',
      field: 'category',
      intent: 'classify',
      maxWords: 6,
      tone: 'formal',
      output: 'text',
    } satisfies AiFieldContract,
  },

  alerts: {
    trigger_type: {
      module: 'monitoring',
      field: 'trigger_type',
      intent: 'classify',
      maxWords: 8,
      tone: 'tecnico',
      output: 'text',
      requiredMeaning: ['umbral', 'alerta', 'disparador'],
    } satisfies AiFieldContract,

    status: {
      module: 'monitoring',
      field: 'status',
      intent: 'classify',
      maxWords: 5,
      tone: 'formal',
      output: 'text',
    } satisfies AiFieldContract,
  },

  evidence: {
    evidence_type: {
      module: 'monitoring',
      field: 'evidence_type',
      intent: 'classify',
      maxWords: 6,
      tone: 'formal',
      output: 'text',
      requiredMeaning: ['evidencia', 'tipo'],
    } satisfies AiFieldContract,
  },
} as const;

export type MonitoringAiContractKey = keyof typeof MonitoringAiContracts;
