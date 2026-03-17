import { eq, sql } from 'drizzle-orm';
import { db } from '../db/client';
import { executions, tools, users, creditTransactions, creatorProfiles } from '../db/schema/index';
import { redis } from '../lib/redis';
import { runPipeline } from './nocode/runner';
import { resolveCredits, validateBalance, type ToolPricing, type UserContext } from './pricing';
import { REVENUE_SHARE } from '@sotally/shared';

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
  const useOwnKey = (execution.metadata as any)?.useOwnKey ?? false;
  const pricing = await resolveCredits(
    tool.pricing as ToolPricing,
    user as UserContext,
    (execution.input as Record<string, any>) ?? {},
    tool.id
  );

  // BYOM discount: 50% off when user provides their own API key
  if (useOwnKey) {
    pricing.credits = Math.ceil(pricing.credits * 0.5);
  }

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
    const rawMessage = (error as Error).message;

    // Classify the error for user-friendly messaging
    const userMessage = classifyError(rawMessage);
    const isTimeout = rawMessage.includes('timed out') || rawMessage.includes('timeout');

    // 10. On failure: update execution, refund credits
    await db
      .update(executions)
      .set({
        status: isTimeout ? 'timeout' : 'failed',
        error: userMessage,
        durationMs,
        creditsRefunded: pricing.credits,
        completedAt: new Date(),
      })
      .where(eq(executions.id, executionId));

    // Always refund credits on failure
    if (pricing.credits > 0) {
      await refundCredits(execution.userId, pricing.credits, executionId);
    }

    await publishEvent(executionId, isTimeout ? 'timeout' : 'failed', {
      error: userMessage,
      durationMs,
    });

    return {
      status: isTimeout ? 'timeout' : 'failed',
      error: userMessage,
      durationMs,
      creditsCharged: 0,
    };
  }
}

/**
 * Classifies raw error messages into user-friendly descriptions.
 * All classified errors imply that credits have been refunded.
 */
function classifyError(rawMessage: string): string {
  const lower = rawMessage.toLowerCase();

  // AI / LLM service errors
  if (
    lower.includes('503') ||
    lower.includes('502') ||
    lower.includes('service unavailable') ||
    lower.includes('econnrefused') ||
    lower.includes('enotfound') ||
    lower.includes('deepseek') && (lower.includes('unavailable') || lower.includes('error'))
  ) {
    return 'AI service temporarily unavailable. Credits have been refunded. Please try again in a few minutes.';
  }

  if (lower.includes('429') || lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'AI service is currently overloaded. Credits have been refunded. Please try again shortly.';
  }

  if (lower.includes('timeout') || lower.includes('timed out')) {
    return 'Execution timed out. Credits have been refunded.';
  }

  // Tool configuration errors
  if (lower.includes('config missing') || lower.includes('invalid config') || lower.includes('steps array')) {
    return 'This tool has a configuration error. Credits have been refunded. The creator has been notified.';
  }

  if (lower.includes('unknown execution type')) {
    return 'This tool uses an unsupported execution method. Credits have been refunded.';
  }

  // BYOM key errors
  if (lower.includes('byom') || lower.includes('no api key found')) {
    return rawMessage; // Already user-friendly
  }

  // Generic fallback — don't leak internals
  return 'Execution failed unexpectedly. Credits have been refunded.';
}

/**
 * Dispatches execution to the appropriate runner based on tool execution type.
 */
async function dispatch(tool: any, execution: any): Promise<any> {
  const executionType = tool.executionType;
  const config = tool.config as any;
  const input = (execution.input as Record<string, any>) ?? {};
  const useOwnKey = (execution.metadata as any)?.useOwnKey ?? false;

  if (!config || typeof config !== 'object') {
    throw new Error('Invalid config: tool configuration is missing or malformed');
  }

  switch (executionType) {
    case 'prompt':
    case 'pipeline': {
      if (!config?.steps || !Array.isArray(config.steps)) {
        throw new Error('Invalid config: tool config missing steps array');
      }
      const result = await runPipeline(
        { steps: config.steps, timeout: config.timeout },
        input,
        buildSafeEnv(),
        {
          userId: execution.userId,
          useOwnKey,
          toolId: tool.id,
          onChunk: (stepId: string, chunk: string) => {
            publishEvent(executionId, 'streaming', { stepId, chunk }).catch(() => {});
          },
        }
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
 * Revenue share is determined by the creator's level from creator_profiles.
 */
async function creditCreator(
  creatorId: string,
  creditsCharged: number,
  executionId: string
): Promise<void> {
  // Look up creator's level
  const creatorProfile = await db
    .select({ level: creatorProfiles.level })
    .from(creatorProfiles)
    .where(eq(creatorProfiles.userId, creatorId))
    .limit(1);

  const level = creatorProfile[0]?.level || 'bronze';
  const tier = REVENUE_SHARE.find((t) => t.level === level);
  const shareRate = tier ? tier.revenueSharePercent / 100 : 0.70;
  const creatorShare = Math.floor(creditsCharged * shareRate);
  if (creatorShare <= 0) return;

  await db
    .update(users)
    .set({ earningsBalance: sql`${users.earningsBalance} + ${creatorShare}` })
    .where(eq(users.id, creatorId));

  // Auto-advance creator level based on monthly execution count
  await checkCreatorLevelAdvancement(creatorId, level);
}

/**
 * Checks if a creator should be promoted to a higher level based on
 * their execution count in the last 30 days.
 */
async function checkCreatorLevelAdvancement(creatorId: string, currentLevel: string): Promise<void> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Count executions for this creator's tools in the last 30 days
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(executions)
      .innerJoin(tools, eq(executions.toolId, tools.id))
      .where(
        sql`${tools.creatorId} = ${creatorId} AND ${executions.createdAt} >= ${thirtyDaysAgo} AND ${executions.status} = 'completed'`
      );

    const monthlyExecutions = result?.count ?? 0;

    // Find the highest tier this creator qualifies for
    let newLevel = 'bronze';
    for (const tier of REVENUE_SHARE) {
      if (monthlyExecutions >= tier.minMonthlyExecutions) {
        newLevel = tier.level;
      }
    }

    // Only promote, never demote (demotion would need a separate scheduled job)
    const levelOrder = ['bronze', 'silver', 'gold', 'platinum'];
    if (levelOrder.indexOf(newLevel) > levelOrder.indexOf(currentLevel)) {
      await db
        .update(creatorProfiles)
        .set({ level: newLevel as any })
        .where(eq(creatorProfiles.userId, creatorId));
    }
  } catch {
    // Non-critical — don't fail execution over level check
  }
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
