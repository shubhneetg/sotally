import { eq, and, sql } from 'drizzle-orm';
import { db } from '../db/client';
import { toolSubscriptions, toolLicenses } from '../db/schema/index';

export interface ToolPricing {
  model: string;
  creditsPerRun?: number;
  creditsPerMonth?: number;
  runsLimit?: number;
  licenseCost?: number;
  tiers?: PricingTier[];
  [key: string]: any;
}

export interface PricingTier {
  id: string;
  name: string;
  credits: number;
  description?: string;
}

export interface UserContext {
  id: string;
  creditBalance: number;
  [key: string]: any;
}

export interface PricingResult {
  credits: number;
  model: string;
  tier: string | null;
}

/**
 * Resolves the credit cost for a tool execution based on the tool's pricing model.
 * Supports: free, per_run, tiered, subscription, one_time.
 */
export async function resolveCredits(
  toolPricing: ToolPricing,
  user: UserContext,
  input: Record<string, any>,
  toolId?: string
): Promise<PricingResult> {
  const model = toolPricing.model;

  switch (model) {
    case 'free':
      return { credits: 0, model: 'free', tier: null };

    case 'per_run':
      return resolvePerRun(toolPricing);

    case 'tiered':
      return resolveTiered(toolPricing, input);

    case 'subscription':
      return resolveSubscription(user, toolId);

    case 'one_time':
      return resolveOneTime(user, toolId);

    default:
      throw new PricingError(`Unknown pricing model: "${model}"`, model);
  }
}

/**
 * Subscription model: check for active subscription with runs remaining.
 * Returns 0 credits (already paid via subscription).
 */
async function resolveSubscription(user: UserContext, toolId?: string): Promise<PricingResult> {
  if (!toolId) throw new PricingError('Subscription pricing requires toolId', 'subscription');

  const now = new Date();
  const [sub] = await db
    .select()
    .from(toolSubscriptions)
    .where(
      and(
        eq(toolSubscriptions.userId, user.id),
        eq(toolSubscriptions.toolId, toolId),
        eq(toolSubscriptions.status, 'active'),
        sql`${toolSubscriptions.currentPeriodEnd} > ${now}`
      )
    )
    .limit(1);

  if (!sub) {
    throw new PricingError(
      'Active subscription required. Subscribe to use this tool.',
      'subscription'
    );
  }

  if (sub.runsLimit > 0 && sub.runsUsed >= sub.runsLimit) {
    throw new PricingError(
      `Run limit reached (${sub.runsUsed}/${sub.runsLimit}). Wait for next billing period.`,
      'subscription'
    );
  }

  // Increment runs used
  await db
    .update(toolSubscriptions)
    .set({ runsUsed: sql`${toolSubscriptions.runsUsed} + 1` })
    .where(eq(toolSubscriptions.id, sub.id));

  return { credits: 0, model: 'subscription', tier: null };
}

/**
 * One-time purchase: check for valid license.
 * Returns 0 credits (already paid via license purchase).
 */
async function resolveOneTime(user: UserContext, toolId?: string): Promise<PricingResult> {
  if (!toolId) throw new PricingError('One-time pricing requires toolId', 'one_time');

  const now = new Date();
  const [license] = await db
    .select()
    .from(toolLicenses)
    .where(
      and(
        eq(toolLicenses.userId, user.id),
        eq(toolLicenses.toolId, toolId),
        sql`(${toolLicenses.expiresAt} IS NULL OR ${toolLicenses.expiresAt} > ${now})`
      )
    )
    .limit(1);

  if (!license) {
    throw new PricingError(
      'License required. Purchase a license to use this tool.',
      'one_time'
    );
  }

  return { credits: 0, model: 'one_time', tier: null };
}

function resolvePerRun(pricing: ToolPricing): PricingResult {
  const credits = pricing.creditsPerRun ?? 5;

  if (credits < 0) {
    throw new PricingError('creditsPerRun cannot be negative', 'per_run');
  }

  return {
    credits,
    model: 'per_run',
    tier: null,
  };
}

function resolveTiered(pricing: ToolPricing, input: Record<string, any>): PricingResult {
  const tiers = pricing.tiers;

  if (!tiers || tiers.length === 0) {
    throw new PricingError('Tiered pricing requires at least one tier', 'tiered');
  }

  // User selects a tier via input._tier or input.tier
  const selectedTierId = input._tier ?? input.tier;

  if (!selectedTierId) {
    throw new PricingError(
      'Tiered pricing requires a tier selection (input._tier or input.tier)',
      'tiered'
    );
  }

  const tier = tiers.find((t: PricingTier) => t.id === selectedTierId);

  if (!tier) {
    const available = tiers.map((t: PricingTier) => t.id).join(', ');
    throw new PricingError(
      `Unknown tier "${selectedTierId}". Available: ${available}`,
      'tiered'
    );
  }

  return {
    credits: tier.credits,
    model: 'tiered',
    tier: tier.id,
  };
}

/**
 * Validates that a user has enough credits for the resolved price.
 */
export function validateBalance(user: UserContext, credits: number): void {
  if (credits > 0 && user.creditBalance < credits) {
    throw new InsufficientCreditsError(credits, user.creditBalance);
  }
}

export class PricingError extends Error {
  constructor(
    message: string,
    public readonly pricingModel: string
  ) {
    super(message);
    this.name = 'PricingError';
  }
}

export class InsufficientCreditsError extends Error {
  public readonly required: number;
  public readonly available: number;

  constructor(required: number, available: number) {
    super(`Insufficient credits: need ${required}, have ${available}`);
    this.name = 'InsufficientCreditsError';
    this.required = required;
    this.available = available;
  }
}
