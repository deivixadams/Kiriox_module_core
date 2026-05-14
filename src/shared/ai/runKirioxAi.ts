import type { AiRunInput, AiResult } from './AiFieldContract';
import { buildPromptFromContract, buildSystemPrompt } from './buildPromptFromContract';
import { cleanAiText, enforceWordLimit, validateAgainstContract, createChromePromptSession } from './aiUtils';

export async function runKirioxAi(contract: AiRunInput): Promise<AiResult> {
  const systemPrompt = buildSystemPrompt(contract);
  const userPrompt = buildPromptFromContract(contract);

  const session = await createChromePromptSession(systemPrompt);

  try {
    let result = await session.prompt(userPrompt);
    result = cleanAiText(result);
    result = enforceWordLimit(result, contract.maxWords ?? 60);
    result = validateAgainstContract(result, contract);

    return {
      value: result,
      trace: {
        module: contract.module,
        field: contract.field,
        intent: contract.intent,
        model: 'chrome-built-in-ai',
        local: true,
        timestamp: new Date().toISOString(),
      },
    };
  } finally {
    session.destroy();
  }
}

export async function runKirioxAiStreaming(
  contract: AiRunInput,
  onChunk: (chunk: string) => void,
  signal?: AbortSignal,
): Promise<AiResult> {
  const systemPrompt = buildSystemPrompt(contract);
  const userPrompt = buildPromptFromContract(contract);

  const session = await createChromePromptSession(systemPrompt);

  try {
    const stream = session.promptStreaming(userPrompt, { signal });
    const reader = stream.getReader();
    let accumulated = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      accumulated = value;
      onChunk(cleanAiText(accumulated));
    }

    let result = cleanAiText(accumulated);
    result = enforceWordLimit(result, contract.maxWords ?? 60);
    result = validateAgainstContract(result, contract);

    return {
      value: result,
      trace: {
        module: contract.module,
        field: contract.field,
        intent: contract.intent,
        model: 'chrome-built-in-ai',
        local: true,
        timestamp: new Date().toISOString(),
      },
    };
  } finally {
    session.destroy();
  }
}
