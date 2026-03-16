import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  integer,
  decimal,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const affiliateTierEnum = pgEnum('affiliate_tier', [
  'starter',
  'partner',
  'elite',
]);

export const affiliateTransactionTypeEnum = pgEnum(
  'affiliate_transaction_type',
  ['commission', 'payout', 'adjustment']
);

export const affiliates = pgTable('affiliates', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id),
  affiliateCode: varchar('affiliate_code', { length: 50 }).notNull().unique(),
  commissionRate: decimal('commission_rate', { precision: 5, scale: 2 })
    .default('0.10')
    .notNull(),
  tier: affiliateTierEnum('tier').default('starter').notNull(),
  cookieDurationDays: integer('cookie_duration_days').default(30).notNull(),
  totalReferrals: integer('total_referrals').default(0).notNull(),
  totalEarnings: decimal('total_earnings', { precision: 12, scale: 2 })
    .default('0')
    .notNull(),
  status: varchar('status', { length: 50 }).default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const affiliateReferrals = pgTable('affiliate_referrals', {
  id: uuid('id').primaryKey().defaultRandom(),
  affiliateId: uuid('affiliate_id')
    .notNull()
    .references(() => affiliates.id),
  referredUserId: uuid('referred_user_id')
    .notNull()
    .unique()
    .references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const affiliateTransactions = pgTable('affiliate_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  affiliateId: uuid('affiliate_id')
    .notNull()
    .references(() => affiliates.id),
  type: affiliateTransactionTypeEnum('type').notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  balanceAfter: decimal('balance_after', { precision: 12, scale: 2 }).notNull(),
  referenceId: uuid('reference_id'),
  referenceType: varchar('reference_type', { length: 100 }),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
