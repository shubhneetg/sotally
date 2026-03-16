import { env } from './env.js';

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

const OPENAI_BASE_URL = 'https://api.openai.com/v1';

const SUPPORTED_MODELS = ['gpt-4o-mini', 'gpt-4o'] as const;
type SupportedModel = (typeof SUPPORTED_MODELS)[number];

function isSupportedModel(model: string): model is SupportedModel {
  return SUPPORTED_MODELS.includes(model as SupportedModel);
}

export async function chatCompletion(
  model: string,
  messages: ChatMessage[],
  options: ChatCompletionOptions = {}
): Promise<string> {
  if (!isSupportedModel(model)) {
    throw new Error(`Unsupported model: ${model}. Supported: ${SUPPORTED_MODELS.join(', ')}`);
  }

  const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1024,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'unknown error');
    throw new OpenAIError(
      `OpenAI API error: ${response.status} ${response.statusText}`,
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
