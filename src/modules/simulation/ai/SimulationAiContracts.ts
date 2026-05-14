import type { AiFieldContract } from '@/shared/ai/AiFieldContract';

export const SimulationAiContracts = {
  scenarios: {
    name: {
      module: 'simulation',
      field: 'name',
      intent: 'complete',
      minWords: 4,
      maxWords: 16,
      tone: 'tecnico',
      output: 'text',
      requiredMeaning: ['escenario', 'simulación'],
    } satisfies AiFieldContract,

    description: {
      module: 'simulation',
      field: 'description',
      intent: 'complete',
      minWords: 15,
      maxWords: 60,
      tone: 'ejecutivo',
      output: 'text',
      requiredMeaning: ['hipótesis', 'impacto proyectado'],
    } satisfies AiFieldContract,

    assumptions: {
      module: 'simulation',
      field: 'assumptions',
      intent: 'complete',
      minWords: 20,
      maxWords: 80,
      tone: 'tecnico',
      output: 'text',
      requiredMeaning: ['supuesto', 'condición', 'parámetro'],
    } satisfies AiFieldContract,
  },
} as const;

export type SimulationAiContractKey = keyof typeof SimulationAiContracts;
