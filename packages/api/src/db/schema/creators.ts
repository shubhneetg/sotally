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
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const creatorLevelEnum = pgEnum('creator_level', [
  'bronze',
  'silver',
  'gold',
  'platinum',
]);

export const creatorTransactionTypeEnum = pgEnum('creator_transaction_type', [
  'earning',
  'payout',
  'adjustment',
  'refund_deduction',
]);

export const creatorPayoutStatusEnum = pgEnum('creator_payout_status', [
  'pending',
  'processing',
  'completed',
  'failed',
  'cancelled',
]);

export const creatorProfiles = pgTable('creator_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id),
  bio: text('bio'),
  specialization: varchar('specialization', { length: 255 }),
  website: varchar('website', { length: 500 }),
  socialLinks: jsonb('social_links'),
  level: creatorLevelEnum('level').default('bronze').notNull(),
  totalEarnings: integer('total_earnings').default(0).notNull(),
  verified: boolean('verified').default(false).notNull(),
  verifiedAt: timestamp('verified_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const creatorTransactions = pgTable('creator_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  creatorId: uuid('creator_id')
    .notNull()
    .references(() => creatorProfiles.id),
  type: creatorTransactionTypeEnum('type').notNull(),
  amount: integer('amount').notNull(),
  balanceAfter: integer('balance_after').notNull(),
  referenceId: uuid('reference_id'),
  referenceType: varchar('reference_type', { length: 100 }),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const creatorPayouts = pgTable('creator_payouts', {
  id: uuid('id').primaryKey().defaultRandom(),
  creatorId: uuid('creator_id')
    .notNull()
    .references(() => creatorProfiles.id),
  amountCredits: integer('amount_credits').notNull(),
  amountUsd: decimal('amount_usd', { precision: 10, scale: 2 }).notNull(),
  status: creatorPayoutStatusEnum('status').default('pending').notNull(),
  payoutMethod: varchar('payout_method', { length: 50 }),
  stripeTransferId: varchar('stripe_transfer_id', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  processedAt: timestamp('processed_at'),
});
