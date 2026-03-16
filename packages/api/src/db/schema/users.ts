import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  integer,
  timestamp,
  index,
  uniqueIndex,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const userRoleEnum = pgEnum('user_role', [
  'buyer',
  'creator',
  'affiliate',
  'admin',
]);

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    passwordHash: varchar('password_hash', { length: 255 }),
    avatarUrl: varchar('avatar_url', { length: 500 }),
    role: userRoleEnum('role').default('buyer').notNull(),
    creditBalance: integer('credit_balance').default(0).notNull(),
    earningsBalance: integer('earnings_balance').default(0).notNull(),
    stripeCustomerId: varchar('stripe_customer_id', { length: 255 }).unique(),
    referralCode: varchar('referral_code', { length: 50 }).notNull().unique(),
    referredBy: uuid('referred_by'),
    freeCreditsUsed: integer('free_credits_used').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('users_email_idx').on(table.email),
    uniqueIndex('users_referral_code_idx').on(table.referralCode),
    check('credit_balance_non_negative', sql`${table.creditBalance} >= 0`),
    check('earnings_balance_non_negative', sql`${table.earningsBalance} >= 0`),
  ]
);
