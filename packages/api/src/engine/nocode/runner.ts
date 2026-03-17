import { resolveTemplate, resolveValue, type TemplateContext } from './template';
import { executeLlmStep } from './steps/llm';
import { executeHttpStep } from './steps/http';
import { executeTransformStep } from './steps/transform';
import { executeConnectorStep } from './steps/connector';

const MAX_EXECUTION_TIMEOUT_MS = 60_000;

export interface PipelineStep {
  type: 'llm' | 'http' | 'transform' | 'output' | 'connector';
  id: string;
  [key: string]: any;
}

export interface PipelineConfig {
  steps: PipelineStep[];
  timeout?: number;
}

export interface PipelineRunOptions {
  userId?: string;
  useOwnKey?: boolean;
  onChunk?: (stepId: string, chunk: string) => void;
}

export interface PipelineResult {
  output: any;
  stepResults: Record<string, any>;
  durationMs: number;
}

/**
 * Executes a no-code pipeline: runs steps sequentially, resolving variables
 * between each step so later steps can reference earlier step outputs.
 */
export async function runPipeline(
  config: PipelineConfig,
  input: Record<string, any>,
  envVars: Record<string, string> = {},
  options: PipelineRunOptions = {}
): Promise<PipelineResult> {
  const startTime = Date.now();
  const timeout = Math.min(config.timeout ?? MAX_EXECUTION_TIMEOUT_MS, MAX_EXECUTION_TIMEOUT_MS);

  const context: TemplateContext = {
    input,
    steps: {},
    env: envVars,
  };

  let finalOutput: any = null;

  for (const step of config.steps) {
    // Check timeout before each step
    const elapsed = Date.now() - startTime;
    if (elapsed >= timeout) {
      throw new PipelineError(
        `Pipeline timed out after ${elapsed}ms (limit: ${timeout}ms)`,
        step.id,
        'timeout'
      );
    }

    try {
      const result = await executeStep(step, context, timeout - elapsed, options);
      context.steps[step.id] = result;
      finalOutput = result;
    } catch (error) {
      throw new PipelineError(
        `Step "${step.id}" (${step.type}) failed: ${(error as Error).message}`,
        step.id,
        step.type,
        error as Error
      );
    }
  }

  return {
    output: finalOutput,
    stepResults: context.steps,
    durationMs: Date.now() - startTime,
  };
}

async function executeStep(
  step: PipelineStep,
  context: TemplateContext,
  remainingTimeMs: number,
  options: PipelineRunOptions = {}
): Promise<any> {
  switch (step.type) {
    case 'llm':
      return executeLlmStepWithContext(step, context, options);

    case 'http':
      return executeHttpStepWithContext(step, context);

    case 'transform':
      return executeTransformStepWithContext(step, context);

    case 'connector':
      return executeConnectorStepWithContext(step, context, options);

    case 'output':
      return executeOutputStep(step, context);

    default:
      throw new Error(`Unknown step type: ${step.type}`);
  }
}

async function executeLlmStepWithContext(
  step: PipelineStep,
  context: TemplateContext,
  options: PipelineRunOptions = {}
): Promise<string> {
  const prompt = resolveTemplate(step.prompt ?? '', context);
  const systemPrompt = step.systemPrompt
    ? resolveTemplate(step.systemPrompt, context)
    : undefined;

  return executeLlmStep({
    model: step.model ?? 'gpt-4o-mini',
    prompt,
    systemPrompt,
    temperature: step.temperature,
    maxTokens: step.maxTokens,
    useOwnKey: options.useOwnKey,
    userId: options.userId,
    onChunk: options.onChunk ? (chunk: string) => options.onChunk!(step.id, chunk) : undefined,
  });
}

async function executeConnectorStepWithContext(
  step: PipelineStep,
  context: TemplateContext,
  options: PipelineRunOptions = {}
): Promise<any> {
  if (!options.userId) {
    throw new Error('Connector steps require an authenticated user');
  }

  const params = step.params ? resolveValue(step.params, context) : {};

  return executeConnectorStep(
    {
      service: step.service,
      action: step.action,
      params,
      credentialsKey: step.credentialsKey,
    },
    options.userId
  );
}

async function executeHttpStepWithContext(
  step: PipelineStep,
  context: TemplateContext
): Promise<any> {
  const url = resolveTemplate(step.url ?? '', context);
  const method = step.method ?? 'GET';
  const headers = step.headers ? resolveValue(step.headers, context) : undefined;
  const body = step.body ? resolveValue(step.body, context) : undefined;

  return executeHttpStep({ url, method, headers, body });
}

function executeTransformStepWithContext(step: PipelineStep, context: TemplateContext): any {
  const input = resolveTemplate(step.input ?? '', context);
  const templateStr = step.templateStr
    ? resolveTemplate(step.templateStr, context)
    : undefined;

  return executeTransformStep({
    operation: step.operation,
    input,
    pattern: step.pattern,
    group: step.group,
    delimiter: step.delimiter,
    templateStr,
    vars: step.vars ? resolveValue(step.vars, context) : undefined,
    path: step.path,
  });
}

function executeOutputStep(step: PipelineStep, context: TemplateContext): any {
  const template = step.template ?? '';
  const resolved = resolveTemplate(template, context);

  if (step.format === 'json') {
    try {
      return JSON.parse(resolved);
    } catch {
      return resolved;
    }
  }

  return resolved;
}

export class PipelineError extends Error {
  constructor(
    message: string,
    public readonly stepId: string,
    public readonly stepType: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'PipelineError';
  }
}
