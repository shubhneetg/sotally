import { lookup } from 'node:dns/promises';

export interface HttpStepConfig {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string | Record<string, any>;
}

export interface HttpStepResult {
  status: number;
  headers: Record<string, string>;
  body: string;
}

const MAX_RESPONSE_SIZE = 5 * 1024 * 1024; // 5MB
const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Private/reserved IP ranges that must be blocked to prevent SSRF attacks.
 */
const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
  /^fd/i,
  /^localhost$/i,
];

function isPrivateIp(ip: string): boolean {
  return PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(ip));
}

/**
 * Extracts the hostname from a URL string.
 */
function extractHostname(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    throw new HttpStepError(`Invalid URL: ${url}`);
  }
}

/**
 * Resolves hostname to IP and checks against private ranges.
 * Prevents SSRF by blocking requests to internal network addresses.
 */
async function validateUrl(url: string): Promise<void> {
  const hostname = extractHostname(url);

  // Direct IP check
  if (isPrivateIp(hostname)) {
    throw new HttpStepError(`SSRF blocked: cannot make requests to private IP ${hostname}`);
  }

  // DNS resolution check
  try {
    const result = await lookup(hostname);
    if (isPrivateIp(result.address)) {
      throw new HttpStepError(
        `SSRF blocked: hostname ${hostname} resolves to private IP ${result.address}`
      );
    }
  } catch (error) {
    if (error instanceof HttpStepError) throw error;
    throw new HttpStepError(`DNS resolution failed for ${hostname}: ${(error as Error).message}`);
  }
}

/**
 * Executes an HTTP request with SSRF protection, timeout, and response size limits.
 */
export async function executeHttpStep(config: HttpStepConfig): Promise<HttpStepResult> {
  const { url, method = 'GET', headers = {}, body } = config;

  await validateUrl(url);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const fetchOptions: RequestInit = {
      method: method.toUpperCase(),
      headers,
      signal: controller.signal,
      redirect: 'follow',
    };

    if (body && method.toUpperCase() !== 'GET') {
      fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
      if (!headers['content-type'] && !headers['Content-Type'] && typeof body === 'object') {
        (fetchOptions.headers as Record<string, string>)['Content-Type'] = 'application/json';
      }
    }

    const response = await fetch(url, fetchOptions);

    // Check response size via Content-Length header first
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_RESPONSE_SIZE) {
      throw new HttpStepError(
        `Response too large: ${contentLength} bytes (max ${MAX_RESPONSE_SIZE})`
      );
    }

    // Read response with size limit
    const responseBody = await readResponseWithLimit(response);

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    return {
      status: response.status,
      headers: responseHeaders,
      body: responseBody,
    };
  } catch (error) {
    if (error instanceof HttpStepError) throw error;
    if ((error as Error).name === 'AbortError') {
      throw new HttpStepError(`HTTP request timed out after ${REQUEST_TIMEOUT_MS}ms`);
    }
    throw new HttpStepError(`HTTP request failed: ${(error as Error).message}`);
  } finally {
    clearTimeout(timeout);
  }
}

async function readResponseWithLimit(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) {
    return await response.text();
  }

  const chunks: Uint8Array[] = [];
  let totalSize = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    totalSize += value.length;
    if (totalSize > MAX_RESPONSE_SIZE) {
      reader.cancel();
      throw new HttpStepError(
        `Response exceeded max size of ${MAX_RESPONSE_SIZE} bytes`
      );
    }
    chunks.push(value);
  }

  const decoder = new TextDecoder();
  return chunks.map((chunk) => decoder.decode(chunk, { stream: true })).join('') +
    decoder.decode();
}

export class HttpStepError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HttpStepError';
  }
}
