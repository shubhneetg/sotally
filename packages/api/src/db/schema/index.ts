// ============================================================
// V2 SCHEMA INDEX
// ============================================================

// Users
export { userRoleEnum, planTierEnum, users } from './users';

// Credits (V1 carry-over, unchanged)
export {
  creditTransactionTypeEnum,
  creditPurchaseStatusEnum,
  creditTransactions,
  creditPurchases,
} from './credits';

// Categories (V1 carry-over)
export { categories } from './categories';

// V2 Apps (replaces V1 tools for new creation flow)
export { appStatusEnum, appPricingModelEnum, apps } from './apps';
export { appVersions } from './app-versions';
export { generationTypeEnum, generationStatusEnum, appGenerations } from './app-generations';
export { appData } from './app-data';
export { sessionPaymentStatusEnum, appSessions } from './app-sessions';
export { appLikes } from './app-likes';

// Creator posts (V2 storefront feed)
export { postTypeEnum, creatorPosts } from './creator-posts';

// V1 Tools (kept for backward compat — existing data stays)
export {
  executionTypeEnum,
  toolStatusEnum,
  toolTemplates,
  tools,
  toolVersions,
} from './tools';

// V1 Executions (kept for backward compat)
export {
  executionStatusEnum,
  pricingModelEnum,
  executions,
} from './executions';

// Reviews (V1 carry-over — will also be used for app reviews)
export { reviews } from './reviews';

// Creators (V1 carry-over — earnings data migrated to users table)
export {
  creatorLevelEnum,
  creatorTransactionTypeEnum,
  creatorPayoutStatusEnum,
  creatorProfiles,
  creatorTransactions,
  creatorPayouts,
} from './creators';

// Affiliates (V1 carry-over)
export {
  affiliateTierEnum,
  affiliateTransactionTypeEnum,
  affiliates,
  affiliateReferrals,
  affiliateTransactions,
} from './affiliates';

// API Keys & Tokens (V1 carry-over)
export { apiKeys, apiTokens } from './api-keys';

// Notifications (V1 carry-over)
export { notifications } from './notifications';

// Tool User Data (V1 carry-over)
export { toolUserData } from './tool-data';

// Reports (V1 carry-over)
export { reportReasonEnum, reportStatusEnum, toolReports } from './reports';

// Subscriptions & Licenses (V1 carry-over)
export { toolSubscriptions, toolLicenses } from './subscriptions';

// Social — follows, collections (V1 carry-over)
export { follows, toolCollections, collectionTools } from './social';

// Bounties (V1 carry-over)
export { bounties, bountySubmissions } from './bounties';

// Custom Domains (V1 carry-over)
export { customDomains } from './domains';
