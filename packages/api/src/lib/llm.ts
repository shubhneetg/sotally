/**
 * Multi-model LLM client for Sotally.
 *
 * Supports:
 * - Anthropic (Claude) — native SDK
 * - OpenAI — native SDK format
 * - Moonshot (Kimi) — OpenAI-compatible API
 * - Any OpenAI-compatible provider (DeepSeek, Groq, Together, etc.)
 *
 * Provider is selected via GENERATION_PROVIDER env var.
 * Falls back through available keys automatically.
 */

import { env } from './env';

// ─── Types ──────────────────────────────────────────────────────

export type LLMProvider = 'anthropic' | 'openai' | 'moonshot' | 'openai-compatible';

export interface LLMRequest {
  system: string;
  userMessage: string;
  maxTokens?: number;
  temperature?: number;
}

export interface LLMResponse {
  text: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  model: string;
  provider: LLMProvider;
}

// ─── Provider configs ───────────────────────────────────────────

interface ProviderConfig {
  provider: LLMProvider;
  apiKey: string;
  baseUrl?: string;
  model: string;
}

function resolveProvider(): ProviderConfig {
  const requestedProvider = env.GENERATION_PROVIDER;

  // Explicit provider selection
  if (requestedProvider === 'anthropic' && env.ANTHROPIC_API_KEY) {
    return {
      provider: 'anthropic',
      apiKey: env.ANTHROPIC_API_KEY,
      model: env.GENERATION_MODEL || 'claude-sonnet-4-20250514',
    };
  }

  if (requestedProvider === 'moonshot' && env.MOONSHOT_API_KEY) {
    return {
      provider: 'moonshot',
      apiKey: env.MOONSHOT_API_KEY,
      baseUrl: 'https://api.moonshot.cn/v1',
      model: env.GENERATION_MODEL || 'moonshot-v1-128k',
    };
  }

  if (requestedProvider === 'openai' && env.OPENAI_API_KEY) {
    return {
      provider: 'openai',
      apiKey: env.OPENAI_API_KEY,
      model: env.GENERATION_MODEL || 'gpt-4o',
    };
  }

  if (requestedProvider === 'openai-compatible' && env.OPENAI_COMPATIBLE_API_KEY) {
    return {
      provider: 'openai-compatible',
      apiKey: env.OPENAI_COMPATIBLE_API_KEY,
      baseUrl: env.OPENAI_COMPATIBLE_BASE_URL,
      model: env.GENERATION_MODEL || 'default',
    };
  }

  // Auto-detect: try keys in priority order
  if (env.ANTHROPIC_API_KEY) {
    return {
      provider: 'anthropic',
      apiKey: env.ANTHROPIC_API_KEY,
      model: env.GENERATION_MODEL || 'claude-sonnet-4-20250514',
    };
  }

  if (env.MOONSHOT_API_KEY) {
    return {
      provider: 'moonshot',
      apiKey: env.MOONSHOT_API_KEY,
      baseUrl: 'https://api.moonshot.cn/v1',
      model: env.GENERATION_MODEL || 'moonshot-v1-128k',
    };
  }

  if (env.OPENAI_API_KEY) {
    return {
      provider: 'openai',
      apiKey: env.OPENAI_API_KEY,
      model: env.GENERATION_MODEL || 'gpt-4o',
    };
  }

  if (env.OPENAI_COMPATIBLE_API_KEY) {
    return {
      provider: 'openai-compatible',
      apiKey: env.OPENAI_COMPATIBLE_API_KEY,
      baseUrl: env.OPENAI_COMPATIBLE_BASE_URL,
      model: env.GENERATION_MODEL || 'default',
    };
  }

  throw new Error(
    'No LLM API key configured. Set one of: ANTHROPIC_API_KEY, MOONSHOT_API_KEY, OPENAI_API_KEY, or OPENAI_COMPATIBLE_API_KEY'
  );
}

// ─── Anthropic client ───────────────────────────────────────────

async function callAnthropic(config: ProviderConfig, req: LLMRequest): Promise<LLMResponse> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic({ apiKey: config.apiKey });

  const response = await client.messages.create({
    model: config.model,
    max_tokens: req.maxTokens ?? 8192,
    temperature: req.temperature ?? 0.4,
    system: req.system,
    messages: [{ role: 'user', content: req.userMessage }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  return {
    text,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    totalTokens: response.usage.input_tokens + response.usage.output_tokens,
    model: config.model,
    provider: 'anthropic',
  };
}

// ─── OpenAI-compatible client (works for OpenAI, Moonshot, DeepSeek, etc.) ──

async function callOpenAICompatible(config: ProviderConfig, req: LLMRequest): Promise<LLMResponse> {
  const url = `${config.baseUrl || 'https://api.openai.com/v1'}/chat/completions`;

  const body = {
    model: config.model,
    max_tokens: req.maxTokens ?? 8192,
    temperature: req.temperature ?? 0.4,
    messages: [
      { role: 'system', content: req.system },
      { role: 'user', content: req.userMessage },
    ],
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM API error (${response.status}): ${errorText.slice(0, 500)}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0];
  const text = choice?.message?.content || '';
  const usage = data.usage || {};

  return {
    text,
    inputTokens: usage.prompt_tokens || 0,
    outputTokens: usage.completion_tokens || 0,
    totalTokens: usage.total_tokens || 0,
    model: config.model,
    provider: config.provider,
  };
}

// ─── Public API ─────────────────────────────────────────────────

let _config: ProviderConfig | null = null;

function getConfig(): ProviderConfig {
  if (!_config) {
    _config = resolveProvider();
    console.log(`[LLM] Using provider: ${_config.provider}, model: ${_config.model}`);
  }
  return _config;
}

/**
 * Send a completion request to the configured LLM provider.
 */
export async function complete(req: LLMRequest): Promise<LLMResponse> {
  const config = getConfig();

  if (config.provider === 'anthropic') {
    return callAnthropic(config, req);
  }

  // OpenAI, Moonshot, and any OpenAI-compatible provider use the same chat completions API
  return callOpenAICompatible(config, req);
}

/**
 * Get the currently configured provider and model.
 */
export function getProviderInfo(): { provider: LLMProvider; model: string } {
  const config = getConfig();
  return { provider: config.provider, model: config.model };
}
