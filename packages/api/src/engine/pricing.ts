export interface ToolPricing {
  model: string;
  creditsPerRun?: number;
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
 *
 * MVP implements: free, per_run, tiered.
 * Future: subscription, one_time, metered.
 */
export function resolveCredits(
  toolPricing: ToolPricing,
  _user: UserContext,
  input: Record<string, any>
): PricingResult {
  const model = toolPricing.model;

  switch (model) {
    case 'free':
      return { credits: 0, model: 'free', tier: null };

    case 'per_run':
      return resolvePerRun(toolPricing);

    case 'tiered':
      return resolveTiered(toolPricing, input);

    case 'subscription':
    case 'one_time':
    case 'metered':
      throw new PricingError(
        `PRICING_MODEL_NOT_SUPPORTED: "${model}" is not yet implemented`,
        model
      );

    default:
      throw new PricingError(`Unknown pricing model: "${model}"`, model);
  }
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
