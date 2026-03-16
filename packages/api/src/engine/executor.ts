import { eq, sql } from 'drizzle-orm';
import { db } from '../db/client.js';
import { executions, tools, users, creditTransactions } from '../db/schema/index.js';
import { redis } from '../lib/redis.js';
import { runPipeline } from './nocode/runner.js';
import { resolveCredits, validateBalance, type ToolPricing, type UserContext } from './pricing.js';

export interface ExecutionResult {
  status: 'completed' | 'failed' | 'timeout';
  output?: any;
  error?: string;
  durationMs: number;
  creditsCharged: number;
}

/**
 * Main execution dispatcher. Receives an execution ID, loads context from DB,
 * dispatches to the appropriate runner, and handles credit settlement.
 */
export async function execute(executionId: string): Promise<ExecutionResult> {
  const startTime = Date.now();

  // 1. Load execution record
  const execution = await db.query.executions.findFirst({
    where: eq(executions.id, executionId),
  });

  if (!execution) {
    throw new Error(`Execution not found: ${executionId}`);
  }

  // 2. Load tool config
  const tool = await db.query.tools.findFirst({
    where: eq(tools.id, execution.toolId),
  });

  if (!tool) {
    throw new Error(`Tool not found: ${execution.toolId}`);
  }

  // 3. Load user
  const user = await db.query.users.findFirst({
    where: eq(users.id, execution.userId),
  });

  if (!user) {
    throw new Error(`User not found: ${execution.userId}`);
  }

  // 4. Resolve pricing
  const pricing = resolveCredits(
    tool.pricing as ToolPricing,
    user as UserContext,
    (execution.input as Record<string, any>) ?? {}
  );

  // 5. Validate balance
  validateBalance(user as UserContext, pricing.credits);

  // 6. Update status to running
  await db
    .update(executions)
    .set({
      status: 'running',
      startedAt: new Date(),
      pricingModel: pricing.model as any,
      pricingTier: pricing.tier,
      creditsCharged: pricing.credits,
    })
    .where(eq(executions.id, executionId));

  await publishEvent(executionId, 'running', { creditsCharged: pricing.credits });

  // 7. Debit credits from user (hold)
  if (pricing.credits > 0) {
    await debitCredits(execution.userId, pricing.credits, executionId);
  }

  try {
    // 8. Dispatch to runner based on execution type
    const output = await dispatch(tool, execution);
    const durationMs = Date.now() - startTime;

    // 9. On success: update execution, credit creator
    await db
      .update(executions)
      .set({
        status: 'completed',
        output,
        durationMs,
        completedAt: new Date(),
      })
      .where(eq(executions.id, executionId));

    // Credit the tool creator
    if (pricing.credits > 0) {
      await creditCreator(tool.creatorId, pricing.credits, executionId);
    }

    // Increment total runs
    await db
      .update(tools)
      .set({ totalRuns: sql`${tools.totalRuns} + 1` })
      .where(eq(tools.id, tool.id));

    await publishEvent(executionId, 'completed', { output, durationMs });

    return {
      status: 'completed',
      output,
      durationMs,
      creditsCharged: pricing.credits,
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage = (error as Error).message;
    const isTimeout = errorMessage.includes('timed out') || errorMessage.includes('timeout');

    // 10. On failure: update execution, refund credits
    await db
      .update(executions)
      .set({
        status: isTimeout ? 'timeout' : 'failed',
        error: errorMessage,
        durationMs,
        creditsRefunded: pricing.credits,
        completedAt: new Date(),
      })
      .where(eq(executions.id, executionId));

    // Refund credits
    if (pricing.credits > 0) {
      await refundCredits(execution.userId, pricing.credits, executionId);
    }

    await publishEvent(executionId, isTimeout ? 'timeout' : 'failed', {
      error: errorMessage,
      durationMs,
    });

    return {
      status: isTimeout ? 'timeout' : 'failed',
      error: errorMessage,
      durationMs,
      creditsCharged: 0,
    };
  }
}

/**
 * Dispatches execution to the appropriate runner based on tool execution type.
 */
async function dispatch(tool: any, execution: any): Promise<any> {
  const executionType = tool.executionType;
  const config = tool.config as any;
  const input = (execution.input as Record<string, any>) ?? {};

  switch (executionType) {
    case 'prompt':
    case 'pipeline': {
      if (!config?.steps || !Array.isArray(config.steps)) {
        throw new Error('Tool config missing steps array');
      }
      const result = await runPipeline(
        { steps: config.steps, timeout: config.timeout },
        input,
        buildSafeEnv()
      );
      return result.output;
    }

    case 'docker':
      throw new Error('Docker execution type is not yet supported');

    case 'external_api':
      throw new Error('External API execution type is not yet supported');

    default:
      throw new Error(`Unknown execution type: ${executionType}`);
  }
}

/**
 * Builds a safe environment variables object for pipeline execution.
 * Only exposes explicitly allowed variables.
 */
function buildSafeEnv(): Record<string, string> {
  // Do NOT expose sensitive keys like OPENAI_API_KEY, DATABASE_URL, etc.
  // Only expose variables that tool creators explicitly need.
  return {};
}

/**
 * Debits credits from user balance and records the transaction.
 */
async function debitCredits(
  userId: string,
  amount: number,
  executionId: string
): Promise<void> {
  await db.transaction(async (tx) => {
    // Debit user balance
    await tx
      .update(users)
      .set({ creditBalance: sql`${users.creditBalance} - ${amount}` })
      .where(eq(users.id, userId));

    // Get updated balance
    const updated = await tx.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { creditBalance: true },
    });

    // Record transaction
    await tx.insert(creditTransactions).values({
      userId,
      type: 'debit_execution',
      amount: -amount,
      balanceAfter: updated?.creditBalance ?? 0,
      referenceId: executionId,
      referenceType: 'execution',
      description: `Tool execution ${executionId}`,
    });
  });
}

/**
 * Refunds credits to user balance after a failed execution.
 */
async function refundCredits(
  userId: string,
  amount: number,
  executionId: string
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ creditBalance: sql`${users.creditBalance} + ${amount}` })
      .where(eq(users.id, userId));

    const updated = await tx.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { creditBalance: true },
    });

    await tx.insert(creditTransactions).values({
      userId,
      type: 'refund',
      amount,
      balanceAfter: updated?.creditBalance ?? 0,
      referenceId: executionId,
      referenceType: 'execution',
      description: `Refund for failed execution ${executionId}`,
    });
  });
}

/**
 * Credits the tool creator's earnings balance after a successful execution.
 * Creator gets 70% of the credits charged (platform takes 30%).
 */
async function creditCreator(
  creatorId: string,
  creditsCharged: number,
  executionId: string
): Promise<void> {
  const creatorShare = Math.floor(creditsCharged * 0.7);
  if (creatorShare <= 0) return;

  await db
    .update(users)
    .set({ earningsBalance: sql`${users.earningsBalance} + ${creatorShare}` })
    .where(eq(users.id, creatorId));
}

/**
 * Publishes an execution event to Redis pub/sub for SSE streaming.
 */
async function publishEvent(
  executionId: string,
  status: string,
  data: Record<string, any>
): Promise<void> {
  const channel = `execution:${executionId}`;
  const event = JSON.stringify({
    executionId,
    status,
    timestamp: Date.now(),
    ...data,
  });

  await redis.publish(channel, event).catch((err: Error) => {
    console.error(`[Executor] Failed to publish event to ${channel}:`, err.message);
  });
}
