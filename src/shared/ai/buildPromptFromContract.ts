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
  const verb  = INTENT_VERB[contract.intent] ?? 'Completa';
  const max   = contract.maxWords ?? 30;
  const tone  = contract.tone ? ` (${TONE_TAG[contract.tone]})` : '';
  const extra = contract.requiredMeaning?.length
    ? `\nIncluye: ${contract.requiredMeaning.slice(0, 3).join(', ')}.`
    : '';

  // Single instruction + input — no metadata, no module names, no verbose rules
  return `${verb}${tone}, máximo ${max} palabras:\n${contract.input}${extra}`;
}
