// ─── Credit Packages ─────────────────────────────────────────────────────────

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  priceCents: number;
  popular: boolean;
  savingsPercent: number;
}

export const CREDIT_PACKAGES: readonly CreditPackage[] = [
  {
    id: "starter",
    name: "Starter",
    credits: 100,
    priceCents: 500,
    popular: false,
    savingsPercent: 0,
  },
  {
    id: "basic",
    name: "Basic",
    credits: 500,
    priceCents: 2000,
    popular: false,
    savingsPercent: 20,
  },
  {
    id: "pro",
    name: "Pro",
    credits: 1500,
    priceCents: 4500,
    popular: true,
    savingsPercent: 40,
  },
  {
    id: "power",
    name: "Power User",
    credits: 5000,
    priceCents: 12500,
    popular: false,
    savingsPercent: 50,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    credits: 20000,
    priceCents: 40000,
    popular: false,
    savingsPercent: 60,
  },
] as const;

// ─── Signup Bonus ────────────────────────────────────────────────────────────

export const SIGNUP_BONUS: number = 50;

// ─── Revenue Share Tiers ─────────────────────────────────────────────────────

export interface RevenueShareTier {
  level: string;
  minMonthlyExecutions: number;
  revenueSharePercent: number;
}

export const REVENUE_SHARE: readonly RevenueShareTier[] = [
  { level: "bronze", minMonthlyExecutions: 0, revenueSharePercent: 70 },
  { level: "silver", minMonthlyExecutions: 1000, revenueSharePercent: 75 },
  { level: "gold", minMonthlyExecutions: 10000, revenueSharePercent: 80 },
  { level: "platinum", minMonthlyExecutions: 50000, revenueSharePercent: 85 },
] as const;

// ─── Enums ───────────────────────────────────────────────────────────────────

export const ToolStatusEnum = {
  DRAFT: "draft",
  PENDING_REVIEW: "pending_review",
  PUBLISHED: "published",
  SUSPENDED: "suspended",
  ARCHIVED: "archived",
} as const;

export const ExecutionStatusEnum = {
  QUEUED: "queued",
  RUNNING: "running",
  COMPLETED: "completed",
  FAILED: "failed",
  TIMEOUT: "timeout",
  CANCELLED: "cancelled",
} as const;

export const PricingModelEnum = {
  FREE: "free",
  PER_RUN: "per_run",
  PER_MINUTE: "per_minute",
  TIERED: "tiered",
  SUBSCRIPTION: "subscription",
} as const;

export const CreatorLevelEnum = {
  BRONZE: "bronze",
  SILVER: "silver",
  GOLD: "gold",
  PLATINUM: "platinum",
} as const;

export const UserRoleEnum = {
  BUYER: "buyer",
  CREATOR: "creator",
  AFFILIATE: "affiliate",
  ADMIN: "admin",
} as const;

export const CreditTransactionTypeEnum = {
  PURCHASE: "purchase",
  SIGNUP_BONUS: "signup_bonus",
  REFERRAL_BONUS: "referral_bonus",
  REFUND: "refund",
  DEBIT_EXECUTION: "debit_execution",
  DEBIT_SUBSCRIPTION: "debit_subscription",
  ADMIN_GRANT: "admin_grant",
  ADMIN_DEDUCT: "admin_deduct",
} as const;

export const PurchaseStatusEnum = {
  PENDING: "pending",
  COMPLETED: "completed",
  FAILED: "failed",
  REFUNDED: "refunded",
} as const;

export const AffiliateStatusEnum = {
  ACTIVE: "active",
  SUSPENDED: "suspended",
  PENDING_APPROVAL: "pending_approval",
} as const;

export const AffiliateTierEnum = {
  STARTER: "starter",
  PARTNER: "partner",
  ELITE: "elite",
} as const;

// ─── Limits ──────────────────────────────────────────────────────────────────

/** Maximum time a tool execution can run before being killed (5 minutes) */
export const MAX_EXECUTION_TIMEOUT: number = 300_000;

/** Default execution timeout if not specified by tool (30 seconds) */
export const DEFAULT_EXECUTION_TIMEOUT: number = 30_000;

/** Maximum number of tags per tool */
export const MAX_TAGS_PER_TOOL: number = 10;

/** Maximum number of screenshots per tool */
export const MAX_SCREENSHOTS_PER_TOOL: number = 5;

/** Minimum payout threshold in cents */
export const MIN_PAYOUT_THRESHOLD_CENTS: number = 1000;

/** Affiliate default commission percent */
export const DEFAULT_AFFILIATE_COMMISSION_PERCENT: number = 10;
