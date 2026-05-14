import type { AiFieldContract } from '@/shared/ai/AiFieldContract';

export const LinearRiskAiContracts = {
  evaluations: {
    title: {
      module: 'linear-risk',
      field: 'title',
      intent: 'complete',
      minWords: 5,
      maxWords: 20,
      tone: 'tecnico',
      output: 'text',
      requiredMeaning: ['riesgo', 'evaluación'],
    } satisfies AiFieldContract,

    scope: {
      module: 'linear-risk',
      field: 'scope',
      intent: 'complete',
      minWords: 20,
      maxWords: 60,
      tone: 'ejecutivo',
      output: 'text',
      requiredMeaning: ['alcance', 'proceso', 'organización'],
    } satisfies AiFieldContract,
  },

  controls: {
    control_name: {
      module: 'linear-risk',
      field: 'control_name',
      intent: 'complete',
      minWords: 3,
      maxWords: 15,
      tone: 'tecnico',
      output: 'text',
    } satisfies AiFieldContract,

    domain_name: {
      module: 'linear-risk',
      field: 'domain_name',
      intent: 'classify',
      maxWords: 8,
      tone: 'formal',
      output: 'text',
    } satisfies AiFieldContract,
  },
} as const;

export type LinearRiskAiContractKey = keyof typeof LinearRiskAiContracts;
