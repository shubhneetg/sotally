// ─── Base Types ──────────────────────────────────────────────────────────────

export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

// ─── User ────────────────────────────────────────────────────────────────────

export interface User extends Timestamps {
  id: string;
  email: string;
  name: string;
  passwordHash: string | null;
  avatarUrl: string | null;
  role: UserRole;
  creditBalance: number;
  earningsBalance: number;
  stripeCustomerId: string | null;
  referralCode: string;
  referredBy: string | null;
  freeCreditsUsed: number;
}

export type UserRole = "buyer" | "creator" | "affiliate" | "admin";
export type AuthProvider = "google" | "github" | "credentials";

// ─── Tool ────────────────────────────────────────────────────────────────────

export type ExecutionType = "prompt" | "pipeline" | "docker" | "external_api";

export interface Tool extends Timestamps {
  id: string;
  slug: string;
  name: string;
  description: string;
  longDescription: string | null;
  categoryId: string | null;
  category?: Category;
  creatorId: string;
  creator?: CreatorProfile;
  status: ToolStatus;
  iconUrl: string | null;
  tags: string[] | null;
  executionType: ExecutionType;
  pricing: ToolPricing;
  inputSchema: Record<string, unknown> | null;
  outputSchema: Record<string, unknown> | null;
  config: Record<string, unknown> | null;
  demoOutput: Record<string, unknown> | null;
  seoTitle: string | null;
  seoDescription: string | null;
  isFeatured: boolean;
  totalRuns: number;
  avgRating: string | null;
}

export type ToolStatus = "draft" | "pending_review" | "published" | "suspended" | "archived";

// ─── Tool Pricing (Discriminated Union — 6 Models) ──────────────────────────

export type ToolPricing =
  | FreeToolPricing
  | PerRunPricing
  | TieredPricing
  | SubscriptionPricing;

export interface FreeToolPricing {
  model: "free";
}

export interface PerRunPricing {
  model: "per_run";
  creditsPerRun: number;
}

export interface TieredPricing {
  model: "tiered";
  tiers: PricingTier[];
}

export interface PricingTier {
  id: string;
  name: string;
  credits: number;
  description?: string;
}

export interface SubscriptionPricing {
  model: "subscription";
  creditsPerMonth: number;
  includedExecutions: number;
  overageCreditsPerRun: number;
}

// ─── Execution ───────────────────────────────────────────────────────────────

export interface Execution {
  id: string;
  toolId: string;
  tool?: Tool;
  userId: string;
  user?: User;
  toolVersionId: string | null;
  status: ExecutionStatus;
  input: Record<string, unknown> | null;
  output: Record<string, unknown> | null;
  error: string | null;
  creditsCharged: number;
  creditsRefunded: number;
  durationMs: number | null;
  pricingModel: string | null;
  pricingTier: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
}

export type ExecutionStatus = "queued" | "running" | "completed" | "failed" | "timeout" | "cancelled";

// ─── Credits ─────────────────────────────────────────────────────────────────

export interface CreditTransaction {
  id: string;
  userId: string;
  type: CreditTransactionType;
  amount: number; // positive = credit, negative = debit
  balanceAfter: number;
  referenceId: string | null;
  referenceType: string | null;
  description: string | null;
  createdAt: Date;
}

export type CreditTransactionType =
  | "purchase"
  | "signup_bonus"
  | "referral_bonus"
  | "refund"
  | "debit_execution"
  | "debit_subscription"
  | "admin_grant"
  | "admin_deduct";

export interface CreditPurchase {
  id: string;
  userId: string;
  user?: User;
  package: string;
  amountUsd: string;
  creditsGranted: number;
  paymentProvider: string;
  paymentId: string | null;
  status: PurchaseStatus;
  createdAt: Date;
}

export type PurchaseStatus = "pending" | "completed" | "failed" | "refunded";

// ─── Category ────────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  parentId: string | null;
  sortOrder: number;
}

// ─── Review ──────────────────────────────────────────────────────────────────

export interface Review {
  id: string;
  toolId: string;
  tool?: Tool;
  userId: string;
  user?: User;
  rating: number; // 1-5
  comment: string | null;
  createdAt: Date;
}

// ─── Creator Profile ─────────────────────────────────────────────────────────

export interface CreatorProfile {
  id: string;
  userId: string;
  user?: User;
  bio: string | null;
  specialization: string | null;
  website: string | null;
  socialLinks: Record<string, unknown> | null;
  level: CreatorLevel;
  totalEarnings: number;
  verified: boolean;
  verifiedAt: Date | null;
  createdAt: Date;
}

export type CreatorLevel = "bronze" | "silver" | "gold" | "platinum";

// ─── Tool Template ───────────────────────────────────────────────────────────

export interface ToolTemplate extends Timestamps {
  id: string;
  name: string;
  description: string | null;
  executionType: ExecutionType;
  defaultConfig: Record<string, unknown> | null;
  inputSchema: Record<string, unknown> | null;
  outputSchema: Record<string, unknown> | null;
}

// ─── Affiliate ───────────────────────────────────────────────────────────────

export type AffiliateTier = "starter" | "partner" | "elite";

export interface Affiliate {
  id: string;
  userId: string;
  user?: User;
  affiliateCode: string;
  commissionRate: string;
  tier: AffiliateTier;
  cookieDurationDays: number;
  totalReferrals: number;
  totalEarnings: string;
  status: string;
  createdAt: Date;
}

// ─── API Response Types ──────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error: ApiError | null;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
