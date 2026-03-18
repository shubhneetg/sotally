// ─── V2 App Types ───────────────────────────────────────────────────────────

export type AppStatus = 'generating' | 'draft' | 'published' | 'unlisted' | 'suspended' | 'archived';
export type AppPricingModel = 'free' | 'one_time' | 'subscription' | 'credits_per_use';
export type AppType = 'tracker' | 'calculator' | 'quiz' | 'generator' | 'planner' | 'diary' | 'dashboard' | 'form';
export type PlanTier = 'free' | 'pro' | 'business';

export interface App {
  id: string;
  creatorId: string;
  slug: string;
  name: string;
  description: string | null;
  longDescription: string | null;
  iconUrl: string | null;
  screenshotUrls: string[];
  categoryId: string | null;
  tags: string[];
  niche: string | null;
  originalPrompt: string;
  currentVersionId: string | null;
  generationCount: number;
  pricingModel: AppPricingModel;
  priceAmountCents: number | null;
  subscriptionMonthlyCents: number | null;
  creditsPerUse: number | null;
  requiresAuth: boolean;
  hasAiFeatures: boolean;
  totalSessions: number;
  totalUsers: number;
  totalRevenueCents: number;
  avgRating: string | null;
  reviewCount: number;
  likeCount: number;
  status: AppStatus;
  isFeatured: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  // Joined fields
  creator?: CreatorPublicProfile;
  currentVersion?: AppVersion;
}

export interface AppVersion {
  id: string;
  appId: string;
  versionNumber: number;
  label: string | null;
  bundleUrl: string;
  bundleHash: string;
  bundleSizeBytes: number;
  sourceSnapshot: AppSourceSnapshot | null;
  generationId: string | null;
  prompt: string | null;
  changelog: string | null;
  createdAt: Date;
}

export interface AppSourceSnapshot {
  files: Record<string, string>;
  entryPoint: string;
  dependencies: Record<string, string>;
}

// ─── V2 Generation Types ────────────────────────────────────────────────────

export type GenerationType = 'initial' | 'iterate' | 'fix_bug' | 'add_feature' | 'restyle';
export type GenerationStatus = 'queued' | 'parsing' | 'architecting' | 'generating' | 'validating' | 'building' | 'deploying' | 'succeeded' | 'failed';

export interface AppGeneration {
  id: string;
  appId: string | null;
  creatorId: string;
  type: GenerationType;
  prompt: string;
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  llmCostCents: number | null;
  creditsCharged: number;
  status: GenerationStatus;
  resultVersionId: string | null;
  errorMessage: string | null;
  errorCode: string | null;
  queuedAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  durationMs: number | null;
}

// ─── V2 Creator Public Profile ──────────────────────────────────────────────

export interface CreatorPublicProfile {
  id: string;
  name: string;
  storefrontSlug: string | null;
  avatarUrl: string | null;
  bio: string | null;
  bannerUrl: string | null;
  websiteUrl: string | null;
  socialLinks: Record<string, string> | null;
  niche: string | null;
  followerCount: number;
  appCount: number;
  createdAt: Date;
}

// ─── V2 Niche Config ────────────────────────────────────────────────────────

export interface NicheConfig {
  slug: string;
  displayName: string;
  shortName: string;
  description: string;
  icon: string;
  color: string;
  examplePrompts: string[];
  creatorNoun: string;
  audienceNoun: string;
}

// ─── V2 App Session ─────────────────────────────────────────────────────────

export interface AppSession {
  id: string;
  appId: string;
  userId: string | null;
  versionId: string;
  startedAt: Date;
  lastActiveAt: Date;
  endedAt: Date | null;
  durationSeconds: number | null;
}

// ─── V2 Creator Post ────────────────────────────────────────────────────────

export type PostType = 'update' | 'announcement' | 'changelog' | 'milestone' | 'showcase';

export interface CreatorPost {
  id: string;
  creatorId: string;
  appId: string | null;
  type: PostType;
  title: string | null;
  body: string;
  mediaUrls: string[];
  likeCount: number;
  commentCount: number;
  pinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}
