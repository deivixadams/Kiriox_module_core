import type { AiRunInput, AiResult } from './AiFieldContract';
import { buildPromptFromContract } from './buildPromptFromContract';
import {
  cleanAiText, enforceWordLimit, validateAgainstContract,
  getKirioxSession, invalidateSession,
} from './aiUtils';

// ── Response cache ─────────────────────────────────────────────────────────────
// Keyed by module:field:intent:input — avoids redundant inference for repeated text

const responseCache = new Map<string, string>();
const CACHE_LIMIT = 60;

function cacheKey(c: AiRunInput): string {
  return `${c.module}:${c.field}:${c.intent}:${c.input}`;
}

function cacheGet(key: string): string | undefined {
  return responseCache.get(key);
}

function cacheSet(key: string, value: string): void {
  if (responseCache.size >= CACHE_LIMIT) {
    const oldest = responseCache.keys().next().value;
    if (oldest) responseCache.delete(oldest);
  }
  responseCache.set(key, value);
}

function buildTrace(c: AiRunInput): AiResult['trace'] {
  return {
    module: c.module, field: c.field, intent: c.intent,
    model: 'chrome-built-in-ai', local: true,
    timestamp: new Date().toISOString(),
  };
}

function postProcess(raw: string, c: AiRunInput): string {
  let r = cleanAiText(raw);
  r = enforceWordLimit(r, c.maxWords ?? 30);
  r = validateAgainstContract(r, c);
  return r;
}

// ── One-shot (with cache) ──────────────────────────────────────────────────────

export async function runKirioxAi(contract: AiRunInput): Promise<AiResult> {
  const key = cacheKey(contract);
  const cached = cacheGet(key);
  if (cached) return { value: cached, trace: buildTrace(contract) };

  const prompt = buildPromptFromContract(contract);

  let session = await getKirioxSession(contract.module);
  let raw: string;

  try {
    raw = await session.prompt(prompt);
  } catch {
    // Session may have expired — invalidate and retry once
    invalidateSession(contract.module);
    session = await getKirioxSession(contract.module);
    raw = await session.prompt(prompt);
  }

  const value = postProcess(raw, contract);
  cacheSet(key, value);
  return { value, trace: buildTrace(contract) };
}

// ── Streaming (with cache, live chunks, for-await pattern) ────────────────────

export async function runKirioxAiStreaming(
  contract: AiRunInput,
  onChunk: (text: string) => void,
  signal?: AbortSignal,
): Promise<AiResult> {
  const key = cacheKey(contract);
  const cached = cacheGet(key);
  if (cached) {
    onChunk(cached);
    return { value: cached, trace: buildTrace(contract) };
  }

  const prompt = buildPromptFromContract(contract);
  let session = await getKirioxSession(contract.module);

  let stream: ReadableStream<string>;
  try {
    stream = session.promptStreaming(prompt, { signal });
  } catch {
    invalidateSession(contract.module);
    session = await getKirioxSession(contract.module);
    stream = session.promptStreaming(prompt, { signal });
  }

  // ReadableStream reader — each value is the cumulative text so far.
  // Chrome AI sends an empty final chunk before done:true — skip it to avoid clearing the field.
  const reader = stream.getReader();
  let accumulated = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;          // skip empty delta chunks (Chrome sends one before done:true)
      accumulated += value;          // DELTA mode: append each new token
      onChunk(cleanAiText(accumulated)); // show growing full text in the field
    }
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err;
    invalidateSession(contract.module);
    throw err;
  } finally {
    reader.releaseLock();
  }

  const value = postProcess(accumulated, contract);
  cacheSet(key, value);
  return { value, trace: buildTrace(contract) };
}
