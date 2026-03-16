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
  image: string | null;
  emailVerified: Date | null;
  creditBalance: number;
  role: UserRole;
  isCreator: boolean;
  creatorProfile: CreatorProfile | null;
  stripeCustomerId: string | null;
  provider: AuthProvider | null;
  providerId: string | null;
}

export type UserRole = "user" | "creator" | "admin";
export type AuthProvider = "google" | "github" | "credentials";

// ─── Tool ────────────────────────────────────────────────────────────────────

export interface Tool extends Timestamps {
  id: string;
  slug: string;
  name: string;
  description: string;
  longDescription: string;
  categoryId: string;
  category: Category;
  creatorId: string;
  creator: CreatorProfile;
  status: ToolStatus;
  version: string;
  iconUrl: string | null;
  screenshotUrls: string[];
  websiteUrl: string | null;
  sourceUrl: string | null;
  pricing: ToolPricing;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  executionEndpoint: string;
  executionTimeout: number;
  totalExecutions: number;
  avgRating: number;
  reviewCount: number;
  featured: boolean;
  tags: string[];
}

export type ToolStatus = "draft" | "pending_review" | "approved" | "rejected" | "suspended";

// ─── Tool Pricing (Discriminated Union — 6 Models) ──────────────────────────

export type ToolPricing =
  | FreeToolPricing
  | PerExecutionPricing
  | TieredPricing
  | SubscriptionPricing
  | FreemiumPricing
  | BundlePricing;

export interface FreeToolPricing {
  model: "free";
}

export interface PerExecutionPricing {
  model: "per_execution";
  creditsPerRun: number;
}

export interface TieredPricing {
  model: "tiered";
  tiers: PricingTier[];
}

export interface PricingTier {
  upTo: number | null; // null = unlimited
  creditsPerRun: number;
}

export interface SubscriptionPricing {
  model: "subscription";
  creditsPerMonth: number;
  includedExecutions: number;
  overageCreditsPerRun: number;
}

export interface FreemiumPricing {
  model: "freemium";
  freeExecutionsPerMonth: number;
  creditsPerRunAfterFree: number;
}

export interface BundlePricing {
  model: "bundle";
  bundleSize: number;
  creditsPerBundle: number;
}

// ─── Execution ───────────────────────────────────────────────────────────────

export interface Execution extends Timestamps {
  id: string;
  toolId: string;
  tool: Tool;
  userId: string;
  user: User;
  status: ExecutionStatus;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  error: string | null;
  creditsCharged: number;
  durationMs: number | null;
  startedAt: Date;
  completedAt: Date | null;
}

export type ExecutionStatus = "pending" | "running" | "completed" | "failed" | "timed_out" | "cancelled";

// ─── Credits ─────────────────────────────────────────────────────────────────

export interface CreditTransaction extends Timestamps {
  id: string;
  userId: string;
  amount: number; // positive = credit, negative = debit
  balance: number; // balance after transaction
  type: CreditTransactionType;
  description: string;
  referenceId: string | null; // executionId, purchaseId, etc.
  referenceType: CreditReferenceType | null;
}

export type CreditTransactionType =
  | "purchase"
  | "signup_bonus"
  | "execution_charge"
  | "execution_refund"
  | "creator_payout"
  | "referral_bonus"
  | "affiliate_commission"
  | "admin_adjustment";

export type CreditReferenceType = "execution" | "purchase" | "payout" | "referral" | "affiliate";

export interface CreditPurchase extends Timestamps {
  id: string;
  userId: string;
  user: User;
  packageId: string;
  credits: number;
  amountCents: number;
  currency: string;
  stripePaymentIntentId: string;
  stripeInvoiceId: string | null;
  status: PurchaseStatus;
}

export type PurchaseStatus = "pending" | "completed" | "failed" | "refunded";

// ─── Category ────────────────────────────────────────────────────────────────

export interface Category extends Timestamps {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconName: string;
  displayOrder: number;
  toolCount: number;
}

// ─── Review ──────────────────────────────────────────────────────────────────

export interface Review extends Timestamps {
  id: string;
  toolId: string;
  tool: Tool;
  userId: string;
  user: User;
  rating: number; // 1-5
  title: string;
  body: string;
  helpful: number;
  verified: boolean; // user has actually executed the tool
}

// ─── Creator Profile ─────────────────────────────────────────────────────────

export interface CreatorProfile extends Timestamps {
  id: string;
  userId: string;
  user: User;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  websiteUrl: string | null;
  githubUrl: string | null;
  twitterUrl: string | null;
  level: CreatorLevel;
  revenueSharePercent: number;
  totalEarnings: number;
  totalTools: number;
  totalExecutions: number;
  verified: boolean;
  stripeConnectId: string | null;
  payoutEnabled: boolean;
}

export type CreatorLevel = "bronze" | "silver" | "gold" | "platinum";

// ─── Tool Template ───────────────────────────────────────────────────────────

export interface ToolTemplate extends Timestamps {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  category: Category;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  sampleCode: string;
  language: string;
  popularity: number;
}

// ─── Affiliate ───────────────────────────────────────────────────────────────

export interface Affiliate extends Timestamps {
  id: string;
  userId: string;
  user: User;
  code: string;
  commissionPercent: number;
  totalReferrals: number;
  totalEarnings: number;
  status: AffiliateStatus;
  payoutMinimumCents: number;
  lastPayoutAt: Date | null;
}

export type AffiliateStatus = "active" | "suspended" | "pending_approval";

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
