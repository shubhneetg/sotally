import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Keep V1 enum for migration compatibility — not used in V2 app logic
export const userRoleEnum = pgEnum('user_role', [
  'buyer',
  'creator',
  'affiliate',
  'admin',
]);

export const planTierEnum = pgEnum('plan_tier', [
  'free',
  'pro',
  'business',
]);

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    passwordHash: varchar('password_hash', { length: 255 }),
    avatarUrl: varchar('avatar_url', { length: 500 }),

    // V1 legacy — kept for backward compat, not used in V2 app logic
    role: userRoleEnum('role').default('buyer').notNull(),

    // V2: Storefront identity (every user can be a creator)
    storefrontSlug: varchar('storefront_slug', { length: 50 }).unique(),
    bio: text('bio'),
    bannerUrl: varchar('banner_url', { length: 500 }),
    websiteUrl: varchar('website_url', { length: 500 }),
    socialLinks: jsonb('social_links').$type<Record<string, string>>(),
    niche: varchar('niche', { length: 100 }),
    onboardingComplete: boolean('onboarding_complete').default(false).notNull(),

    // V2: Creator earnings (merged from V1 creator_profiles)
    lifetimeEarningsCents: integer('lifetime_earnings_cents').default(0).notNull(),
    stripeConnectId: varchar('stripe_connect_id', { length: 255 }),

    // V2: Platform subscription
    planTier: planTierEnum('plan_tier').default('free').notNull(),
    planExpiresAt: timestamp('plan_expires_at', { withTimezone: true }),
    stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),

    // V2: Denormalized social counters
    followerCount: integer('follower_count').default(0).notNull(),
    followingCount: integer('following_count').default(0).notNull(),
    appCount: integer('app_count').default(0).notNull(),

    // Credits & payments (V1 carry-over)
    creditBalance: integer('credit_balance').default(0).notNull(),
    earningsBalance: integer('earnings_balance').default(0).notNull(),
    stripeCustomerId: varchar('stripe_customer_id', { length: 255 }).unique(),
    referralCode: varchar('referral_code', { length: 50 }).notNull().unique(),
    referredBy: uuid('referred_by'),
    freeCreditsUsed: integer('free_credits_used').default(0).notNull(),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('users_email_idx').on(table.email),
    uniqueIndex('users_referral_code_idx').on(table.referralCode),
    uniqueIndex('users_storefront_slug_idx').on(table.storefrontSlug),
    check('credit_balance_non_negative', sql`${table.creditBalance} >= 0`),
    check('earnings_balance_non_negative', sql`${table.earningsBalance} >= 0`),
  ]
);
