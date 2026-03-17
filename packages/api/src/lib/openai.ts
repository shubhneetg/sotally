import { env } from './env';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionOptions {
  temperature?: number;
  maxTokens?: number;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// DeepSeek uses OpenAI-compatible API
const LLM_BASE_URL = process.env.LLM_BASE_URL || 'https://api.deepseek.com';

// Model mapping: translate tool configs to actual model names
const MODEL_MAP: Record<string, string> = {
  'gpt-4o-mini': 'deepseek-chat',
  'gpt-4o': 'deepseek-chat',
  'deepseek-chat': 'deepseek-chat',
  'deepseek-reasoner': 'deepseek-reasoner',
};

function resolveModel(model: string): string {
  return MODEL_MAP[model] || 'deepseek-chat';
}

export async function chatCompletion(
  model: string,
  messages: ChatMessage[],
  options: ChatCompletionOptions = {}
): Promise<string> {
  return chatCompletionWithKey(model, messages, options, env.OPENAI_API_KEY);
}

/**
 * Chat completion using a specific API key.
 * Used for BYOM (Bring Your Own Model) where users provide their own keys.
 */
export async function chatCompletionWithKey(
  model: string,
  messages: ChatMessage[],
  options: ChatCompletionOptions = {},
  apiKey: string,
  baseUrl?: string
): Promise<string> {
  const resolvedModel = resolveModel(model);
  const url = baseUrl || LLM_BASE_URL;

  const response = await fetch(`${url}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: resolvedModel,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1024,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'unknown error');
    throw new OpenAIError(
      `LLM API error: ${response.status} ${response.statusText}`,
      response.status,
      errorBody
    );
  }

  const data = (await response.json()) as OpenAIResponse;

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('OpenAI returned empty response');
  }

  return content;
}

export class OpenAIError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly responseBody: string
  ) {
    super(message);
    this.name = 'OpenAIError';
  }

  get isRetryable(): boolean {
    return this.statusCode === 500 || this.statusCode === 503;
  }

  get isRateLimited(): boolean {
    return this.statusCode === 429;
  }
}
