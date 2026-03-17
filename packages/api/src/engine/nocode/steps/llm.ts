import { chatCompletion, chatCompletionWithKey, chatCompletionStream, OpenAIError } from '../../../lib/openai';
import type { ChatMessage } from '../../../lib/openai';
import { eq, and } from 'drizzle-orm';
import { db } from '../../../db/client';
import { apiKeys } from '../../../db/schema/index';
import { decrypt } from '../../../lib/encryption';
import { env } from '../../../lib/env';

export interface LlmStepConfig {
  model: string;
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  useOwnKey?: boolean;
  userId?: string;
  onChunk?: (chunk: string) => void;
}

// Map model names to provider service types for credential lookup
const MODEL_PROVIDER_MAP: Record<string, string> = {
  'gpt-4o-mini': 'openai',
  'gpt-4o': 'openai',
  'deepseek-chat': 'deepseek',
  'deepseek-reasoner': 'deepseek',
};

/**
 * Resolves the user's stored API key for the given model's provider.
 * Returns null if no key is found.
 */
async function resolveUserApiKey(
  userId: string,
  model: string
): Promise<string | null> {
  const provider = MODEL_PROVIDER_MAP[model] || 'openai';

  const [key] = await db
    .select()
    .from(apiKeys)
    .where(
      and(
        eq(apiKeys.userId, userId),
        eq(apiKeys.serviceType, provider)
      )
    )
    .limit(1);

  if (!key) return null;

  try {
    return decrypt(key.encryptedKey, env.API_KEY_ENCRYPTION_KEY);
  } catch {
    return null;
  }
}

/**
 * Executes an LLM step by calling OpenAI chat completions.
 * All template variables in prompt/systemPrompt should already be resolved.
 *
 * When useOwnKey is true and a valid user key exists, uses the user's key
 * instead of the platform key.
 *
 * Retries once on 500/503 errors. Fails immediately on 400/401/429.
 */
export async function executeLlmStep(config: LlmStepConfig): Promise<string> {
  const { model, prompt, systemPrompt, temperature, maxTokens, useOwnKey, userId, onChunk } = config;

  const messages: ChatMessage[] = [];

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }

  messages.push({ role: 'user', content: prompt });

  // Resolve user's own API key if requested
  let userApiKey: string | null = null;
  if (useOwnKey && userId) {
    userApiKey = await resolveUserApiKey(userId, model);
    if (!userApiKey) {
      throw new Error(
        'BYOM enabled but no API key found for this provider. ' +
        'Add your key in Settings > API Keys.'
      );
    }
  }

  // Use streaming when onChunk callback is provided
  if (onChunk) {
    try {
      const stream = chatCompletionStream(
        model,
        messages,
        { temperature, maxTokens },
        userApiKey || undefined,
      );
      let fullText = '';
      for await (const chunk of stream) {
        fullText += chunk;
        onChunk(chunk);
      }
      return fullText || (await stream.return('')).value;
    } catch (error) {
      if (error instanceof OpenAIError && error.isRetryable) {
        await delay(1000);
        // Retry without streaming as fallback
        const fn = userApiKey
          ? (m: string, msgs: ChatMessage[], opts: any) => chatCompletionWithKey(m, msgs, opts, userApiKey!)
          : chatCompletion;
        return await fn(model, messages, { temperature, maxTokens });
      }
      throw error;
    }
  }

  // Non-streaming path
  const completionFn = userApiKey
    ? (m: string, msgs: ChatMessage[], opts: { temperature?: number; maxTokens?: number }) =>
        chatCompletionWithKey(m, msgs, opts, userApiKey!)
    : chatCompletion;

  try {
    return await completionFn(model, messages, { temperature, maxTokens });
  } catch (error) {
    if (error instanceof OpenAIError && error.isRetryable) {
      // Single retry on 500/503
      await delay(1000);
      return await completionFn(model, messages, { temperature, maxTokens });
    }
    throw error;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
