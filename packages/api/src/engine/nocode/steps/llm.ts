import { chatCompletion, OpenAIError } from '../../../lib/openai';
import type { ChatMessage } from '../../../lib/openai';

export interface LlmStepConfig {
  model: string;
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Executes an LLM step by calling OpenAI chat completions.
 * All template variables in prompt/systemPrompt should already be resolved.
 *
 * Retries once on 500/503 errors. Fails immediately on 400/401/429.
 */
export async function executeLlmStep(config: LlmStepConfig): Promise<string> {
  const { model, prompt, systemPrompt, temperature, maxTokens } = config;

  const messages: ChatMessage[] = [];

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }

  messages.push({ role: 'user', content: prompt });

  try {
    return await chatCompletion(model, messages, { temperature, maxTokens });
  } catch (error) {
    if (error instanceof OpenAIError && error.isRetryable) {
      // Single retry on 500/503
      await delay(1000);
      return await chatCompletion(model, messages, { temperature, maxTokens });
    }
    throw error;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
