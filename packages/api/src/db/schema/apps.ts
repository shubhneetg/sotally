import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  decimal,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { categories } from './categories';

export const appStatusEnum = pgEnum('app_status', [
  'generating',
  'draft',
  'published',
  'unlisted',
  'suspended',
  'archived',
]);

export const appPricingModelEnum = pgEnum('app_pricing_model', [
  'free',
  'one_time',
  'subscription',
  'credits_per_use',
]);

export const apps = pgTable(
  'apps',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    creatorId: uuid('creator_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Identity
    slug: varchar('slug', { length: 255 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    description: varchar('description', { length: 500 }),
    longDescription: text('long_description'),
    iconUrl: varchar('icon_url', { length: 500 }),
    screenshotUrls: jsonb('screenshot_urls').$type<string[]>().default([]),
    categoryId: uuid('category_id').references(() => categories.id),
    tags: jsonb('tags').$type<string[]>().default([]),
    niche: varchar('niche', { length: 100 }),

    // Generation metadata
    originalPrompt: text('original_prompt').notNull(),
    currentVersionId: uuid('current_version_id'),
    generationCount: integer('generation_count').default(1).notNull(),

    // Pricing
    pricingModel: appPricingModelEnum('pricing_model').default('free').notNull(),
    priceAmountCents: integer('price_amount_cents'),
    subscriptionMonthlyCents: integer('subscription_monthly_cents'),
    creditsPerUse: integer('credits_per_use'),

    // Runtime config
    requiresAuth: boolean('requires_auth').default(false).notNull(),
    hasAiFeatures: boolean('has_ai_features').default(false).notNull(),
    manifest: jsonb('manifest'),

    // Stats (denormalized for fast reads)
    totalSessions: integer('total_sessions').default(0).notNull(),
    totalUsers: integer('total_users').default(0).notNull(),
    totalRevenueCents: integer('total_revenue_cents').default(0).notNull(),
    avgRating: decimal('avg_rating', { precision: 3, scale: 2 }),
    reviewCount: integer('review_count').default(0).notNull(),
    likeCount: integer('like_count').default(0).notNull(),

    // SEO
    seoTitle: varchar('seo_title', { length: 70 }),
    seoDescription: varchar('seo_description', { length: 160 }),

    // Status
    status: appStatusEnum('status').default('draft').notNull(),
    isFeatured: boolean('is_featured').default(false).notNull(),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('apps_creator_slug_idx').on(table.creatorId, table.slug),
    index('apps_creator_id_idx').on(table.creatorId),
    index('apps_status_idx').on(table.status),
    index('apps_niche_idx').on(table.niche),
    index('apps_category_id_idx').on(table.categoryId),
  ]
);
