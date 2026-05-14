import type { AiFieldContract } from '@/shared/ai/AiFieldContract';

export const HechosRelevantesAiContracts = {
  hechos: {
    titulo: {
      module: 'hechos-relevantes',
      field: 'titulo',
      intent: 'complete',
      minWords: 5,
      maxWords: 20,
      tone: 'ejecutivo',
      output: 'text',
      requiredMeaning: ['evento', 'hecho relevante'],
    } satisfies AiFieldContract,

    fragmento: {
      module: 'hechos-relevantes',
      field: 'fragmento',
      intent: 'summarize',
      minWords: 20,
      maxWords: 60,
      tone: 'formal',
      output: 'text',
    } satisfies AiFieldContract,

    riesgo_sugerido: {
      module: 'hechos-relevantes',
      field: 'riesgo_sugerido',
      intent: 'extract',
      minWords: 8,
      maxWords: 30,
      tone: 'tecnico',
      output: 'text',
      requiredMeaning: ['riesgo', 'exposición', 'amenaza'],
      forbidden: ['definitivamente', 'absolutamente', 'seguramente'],
    } satisfies AiFieldContract,

    control_afectado: {
      module: 'hechos-relevantes',
      field: 'control_afectado',
      intent: 'extract',
      minWords: 5,
      maxWords: 25,
      tone: 'tecnico',
      output: 'text',
      requiredMeaning: ['control', 'mitigación'],
      forbidden: ['definitivamente', 'absolutamente'],
    } satisfies AiFieldContract,

    query_origen: {
      module: 'hechos-relevantes',
      field: 'query_origen',
      intent: 'complete',
      minWords: 3,
      maxWords: 12,
      tone: 'tecnico',
      output: 'text',
    } satisfies AiFieldContract,
  },
} as const;

export type HechosRelevantesAiContractKey = keyof typeof HechosRelevantesAiContracts;
