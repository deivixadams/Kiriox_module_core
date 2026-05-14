import type { AiFieldContract } from './AiFieldContract';

export function cleanAiText(raw: string): string {
  return raw
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/^\s*[-–—]\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function enforceWordLimit(text: string, maxWords: number): string {
  const words = text.split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ');
}

export function validateAgainstContract(text: string, contract: AiFieldContract): string {
  let result = text;

  if (contract.forbidden && contract.forbidden.length > 0) {
    const lower = result.toLowerCase();
    for (const term of contract.forbidden) {
      if (lower.includes(term.toLowerCase())) {
        result = result.replace(new RegExp(term, 'gi'), '');
        result = result.replace(/\s+/g, ' ').trim();
      }
    }
  }

  return result;
}

// ── Chrome built-in AI — new API surface (Chrome 127+) ───────────────────────
// Global: LanguageModel (not window.ai.languageModel)
// Session: LanguageModel.create({ expectedInputs, expectedOutputs, initialPrompts })
// System prompt: initialPrompts[{ role: "system", content: "..." }]

export interface ChromeAiSession {
  prompt: (input: string, opts?: { signal?: AbortSignal }) => Promise<string>;
  promptStreaming: (input: string, opts?: { signal?: AbortSignal }) => ReadableStream<string>;
  destroy: () => void;
  contextUsage?: number;
  contextWindow?: number;
}

interface LanguageModelGlobal {
  availability?: (opts?: object) => Promise<string>;
  create: (opts?: {
    expectedInputs?: Array<{ type: string; languages?: string[] }>;
    expectedOutputs?: Array<{ type: string; languages?: string[] }>;
    initialPrompts?: Array<{ role: string; content: string }>;
    temperature?: number;
    topK?: number;
  }) => Promise<ChromeAiSession>;
}

declare global {
  // eslint-disable-next-line no-var
  var LanguageModel: LanguageModelGlobal | undefined;
}

function getLanguageModel(): LanguageModelGlobal | null {
  if (typeof window === 'undefined') return null;
  const g = window as unknown as { LanguageModel?: LanguageModelGlobal };
  return g.LanguageModel ?? null;
}

export function isChromAiAvailable(): boolean {
  const lm = getLanguageModel();
  return lm !== null && typeof lm.create === 'function';
}

export async function createChromePromptSession(systemPrompt: string): Promise<ChromeAiSession> {
  const lm = getLanguageModel();

  if (!lm || typeof lm.create !== 'function') {
    throw new Error('Chrome AI no está disponible en este navegador. Requiere Chrome 127+ con Gemini Nano habilitado.');
  }

  if (lm.availability) {
    const status = await lm.availability({
      expectedInputs: [{ type: 'text', languages: ['es'] }],
    });
    if (status === 'unavailable') {
      throw new Error('El modelo de lenguaje local no está disponible. Verifica los requisitos de hardware.');
    }
    if (status === 'downloadable' || status === 'downloading') {
      throw new Error('El modelo se está descargando. Intenta de nuevo en unos minutos.');
    }
  }

  return lm.create({
    expectedInputs: [{ type: 'text', languages: ['es'] }],
    expectedOutputs: [{ type: 'text', languages: ['es'] }],
    initialPrompts: [
      { role: 'system', content: systemPrompt },
    ],
  });
}
