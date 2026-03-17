import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { eq, and } from 'drizzle-orm';
import { db } from '../../../db/client';
import { apiKeys } from '../../../db/schema/index';
import { decrypt } from '../../../lib/encryption';
import { env } from '../../../lib/env';
import { executeHttpStep, HttpStepError } from './http';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ConnectorConfig {
  service: string;
  action: string;
  params: Record<string, any>;
  credentialsKey?: string;
}

interface ConnectorAction {
  id: string;
  name: string;
  method: string;
  url: string;
  bodyTemplate?: Record<string, any>;
}

interface ConnectorDefinition {
  service: string;
  name: string;
  authType: 'bearer_token' | 'api_key' | 'basic_auth';
  authHeader: string;
  authPrefix?: string;
  defaultHeaders?: Record<string, string>;
  actions: ConnectorAction[];
}

// ─── Connector Definition Loader ────────────────────────────────────────────

const connectorCache = new Map<string, ConnectorDefinition>();

function loadConnectorDefinition(service: string): ConnectorDefinition {
  const cached = connectorCache.get(service);
  if (cached) return cached;

  const filePath = join(process.cwd(), 'tools', 'connectors', `${service}.json`);

  try {
    const raw = readFileSync(filePath, 'utf-8');
    const definition = JSON.parse(raw) as ConnectorDefinition;
    connectorCache.set(service, definition);
    return definition;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new ConnectorError(`Connector not found: ${service}`);
    }
    throw new ConnectorError(
      `Failed to load connector "${service}": ${(error as Error).message}`
    );
  }
}

/** Returns all available connector definitions for UI/API consumption. */
export function listConnectors(): Array<{
  service: string;
  name: string;
  actions: Array<{ id: string; name: string }>;
}> {
  const connectorDir = join(process.cwd(), 'tools', 'connectors');
  const { readdirSync } = require('node:fs');
  const files: string[] = readdirSync(connectorDir).filter(
    (f: string) => f.endsWith('.json')
  );

  return files.map((file) => {
    const service = file.replace('.json', '');
    const def = loadConnectorDefinition(service);
    return {
      service: def.service,
      name: def.name,
      actions: def.actions.map((a) => ({ id: a.id, name: a.name })),
    };
  });
}

// ─── Template Resolution ────────────────────────────────────────────────────

/**
 * Resolves {{param}} placeholders in a string using provided params.
 */
function resolveParamTemplate(template: string, params: Record<string, any>): string {
  return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_match, key: string) => {
    const value = getNestedParam(params, key);
    if (value === undefined) return `{{${key}}}`;
    return typeof value === 'object' ? JSON.stringify(value) : String(value);
  });
}

function getNestedParam(obj: Record<string, any>, path: string): any {
  const segments = path.split('.');
  let current: any = obj;
  for (const segment of segments) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = current[segment];
  }
  return current;
}

/**
 * Recursively resolves templates in objects, arrays, and strings.
 */
function resolveParamValue(value: any, params: Record<string, any>): any {
  if (typeof value === 'string') {
    return resolveParamTemplate(value, params);
  }
  if (Array.isArray(value)) {
    return value.map((item) => resolveParamValue(item, params));
  }
  if (value !== null && typeof value === 'object') {
    const resolved: Record<string, any> = {};
    for (const [key, val] of Object.entries(value)) {
      resolved[key] = resolveParamValue(val, params);
    }
    return resolved;
  }
  return value;
}

// ─── Credential Loading ─────────────────────────────────────────────────────

async function loadCredential(
  userId: string,
  service: string,
  credentialsKey?: string
): Promise<string> {
  const serviceType = credentialsKey || service;

  const [key] = await db
    .select()
    .from(apiKeys)
    .where(
      and(
        eq(apiKeys.userId, userId),
        eq(apiKeys.serviceType, serviceType)
      )
    )
    .limit(1);

  if (!key) {
    throw new ConnectorError(
      `No credentials found for service "${serviceType}". ` +
      `Add your API key in Settings > API Keys.`
    );
  }

  try {
    return decrypt(key.encryptedKey, env.API_KEY_ENCRYPTION_KEY);
  } catch {
    throw new ConnectorError(
      `Failed to decrypt credentials for "${serviceType}". The key may be corrupted.`
    );
  }
}

// ─── Auth Application ───────────────────────────────────────────────────────

function applyAuth(
  definition: ConnectorDefinition,
  credential: string,
  headers: Record<string, string>
): Record<string, string> {
  const authHeaders = { ...headers };

  switch (definition.authType) {
    case 'bearer_token':
      authHeaders[definition.authHeader] =
        `${definition.authPrefix || 'Bearer '}${credential}`;
      break;

    case 'api_key':
      authHeaders[definition.authHeader] =
        `${definition.authPrefix || ''}${credential}`;
      break;

    case 'basic_auth': {
      const encoded = Buffer.from(credential).toString('base64');
      authHeaders[definition.authHeader] = `Basic ${encoded}`;
      break;
    }
  }

  return authHeaders;
}

// ─── Main Executor ──────────────────────────────────────────────────────────

/**
 * Executes a connector step:
 * 1. Loads the connector JSON definition
 * 2. Finds the requested action
 * 3. Loads and decrypts user credentials
 * 4. Applies auth headers
 * 5. Resolves URL and body templates with params
 * 6. Makes the HTTP request via the existing HTTP step
 */
export async function executeConnectorStep(
  config: ConnectorConfig,
  userId: string
): Promise<any> {
  const { service, action, params, credentialsKey } = config;

  // 1. Load connector definition
  const definition = loadConnectorDefinition(service);

  // 2. Find the action
  const actionDef = definition.actions.find((a) => a.id === action);
  if (!actionDef) {
    const available = definition.actions.map((a) => a.id).join(', ');
    throw new ConnectorError(
      `Action "${action}" not found in connector "${service}". Available: ${available}`
    );
  }

  // 3. Load credentials
  const credential = await loadCredential(userId, service, credentialsKey);

  // 4. Build headers with auth
  let headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(definition.defaultHeaders || {}),
  };
  headers = applyAuth(definition, credential, headers);

  // 5. Resolve URL template
  const url = resolveParamTemplate(actionDef.url, params);

  // 6. Resolve body template
  let body: Record<string, any> | undefined;
  if (actionDef.bodyTemplate && actionDef.method !== 'GET') {
    body = resolveParamValue(actionDef.bodyTemplate, params);
  }

  // 7. Execute via HTTP step (reuses SSRF protection, timeouts, etc.)
  try {
    const result = await executeHttpStep({
      url,
      method: actionDef.method,
      headers,
      body,
    });

    // Parse JSON response if possible
    try {
      return JSON.parse(result.body);
    } catch {
      return result.body;
    }
  } catch (error) {
    if (error instanceof HttpStepError) {
      throw new ConnectorError(
        `Connector "${service}.${action}" HTTP error: ${error.message}`
      );
    }
    throw error;
  }
}

// ─── Error Class ────────────────────────────────────────────────────────────

export class ConnectorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConnectorError';
  }
}
