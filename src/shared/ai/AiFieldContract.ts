import type { KirioxOfficialModuleId } from '@/shared/contracts/modules/module.contract';

export type AiIntent = 'complete' | 'summarize' | 'classify' | 'extract';
export type AiTone = 'juridico' | 'tecnico' | 'ejecutivo' | 'formal';
export type AiOutput = 'text' | 'json';

export interface AiFieldContract {
  module: KirioxOfficialModuleId;
  field: string;
  intent: AiIntent;
  minWords?: number;
  maxWords?: number;
  tone?: AiTone;
  output: AiOutput;
  forbidden?: string[];
  requiredMeaning?: string[];
}

export interface AiTrace {
  module: KirioxOfficialModuleId;
  field: string;
  intent: AiIntent;
  model: 'chrome-built-in-ai';
  local: true;
  timestamp: string;
}

export interface AiResult {
  value: string;
  trace: AiTrace;
}

export interface AiRunInput extends AiFieldContract {
  input: string;
}
