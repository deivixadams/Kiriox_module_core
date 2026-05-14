import type { AiFieldContract } from '@/shared/ai/AiFieldContract';

export const CoreAiContracts = {
  company: {
    description: {
      module: 'core',
      field: 'description',
      intent: 'complete',
      minWords: 20,
      maxWords: 80,
      tone: 'ejecutivo',
      output: 'text',
      requiredMeaning: ['organización', 'misión', 'actividad principal'],
    } satisfies AiFieldContract,

    objective: {
      module: 'core',
      field: 'objective',
      intent: 'complete',
      minWords: 15,
      maxWords: 50,
      tone: 'formal',
      output: 'text',
      requiredMeaning: ['objetivo', 'meta estratégica'],
    } satisfies AiFieldContract,
  },

  audit: {
    observation: {
      module: 'core',
      field: 'observation',
      intent: 'complete',
      minWords: 20,
      maxWords: 80,
      tone: 'juridico',
      output: 'text',
      requiredMeaning: ['observación', 'hallazgo'],
      forbidden: ['creo que', 'me parece', 'quizás'],
    } satisfies AiFieldContract,

    recommendation: {
      module: 'core',
      field: 'recommendation',
      intent: 'complete',
      minWords: 15,
      maxWords: 60,
      tone: 'ejecutivo',
      output: 'text',
      requiredMeaning: ['recomendación', 'acción correctiva'],
    } satisfies AiFieldContract,
  },
} as const;

export type CoreAiContractKey = keyof typeof CoreAiContracts;
