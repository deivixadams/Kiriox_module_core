import type { AiRunInput } from './AiFieldContract';

// Compact intent verbs — shorter = faster tokenization
const INTENT_VERB: Record<string, string> = {
  complete:  'Completa',
  summarize: 'Resume',
  classify:  'Clasifica',
  extract:   'Extrae',
};

// Tone in 2-3 words max
const TONE_TAG: Record<string, string> = {
  juridico:  'tono jurídico',
  tecnico:   'tono técnico',
  ejecutivo: 'tono ejecutivo',
  formal:    'tono formal',
};

/**
 * Builds a minimal user prompt.
 * Rule: every unnecessary token is latency.
 * System context already lives in the session's initialPrompts.
 */
export function buildPromptFromContract(contract: AiRunInput): string {
  const max   = contract.maxWords ?? 30;
  const tone  = contract.tone ? ` (${TONE_TAG[contract.tone]})` : '';
  const extra = contract.requiredMeaning?.length
    ? `\nIncluye: ${contract.requiredMeaning.slice(0, 3).join(', ')}.`
    : '';

  // When completing and the user has already typed meaningful text (>2 words),
  // instruct the model to extend it and return the full result — not replace it.
  const hasUserText =
    contract.intent === 'complete' &&
    contract.input.trim().split(/\s+/).length > 2;

  const instruction = hasUserText
    ? `Continúa y completa este texto${tone}, devuelve el texto completo, máximo ${max} palabras`
    : `${INTENT_VERB[contract.intent] ?? 'Completa'}${tone}, máximo ${max} palabras`;

  return `${instruction}:\n${contract.input}${extra}`;
}
