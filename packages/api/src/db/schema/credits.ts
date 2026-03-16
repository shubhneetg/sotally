import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  integer,
  text,
  decimal,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const creditTransactionTypeEnum = pgEnum('credit_transaction_type', [
  'purchase',
  'signup_bonus',
  'referral_bonus',
  'refund',
  'debit_execution',
  'debit_subscription',
  'admin_grant',
  'admin_deduct',
]);

export const creditPurchaseStatusEnum = pgEnum('credit_purchase_status', [
  'pending',
  'completed',
  'failed',
  'refunded',
]);

export const creditTransactions = pgTable(
  'credit_transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    type: creditTransactionTypeEnum('type').notNull(),
    amount: integer('amount').notNull(),
    balanceAfter: integer('balance_after').notNull(),
    referenceId: uuid('reference_id'),
    referenceType: varchar('reference_type', { length: 100 }),
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('credit_transactions_user_created_idx').on(
      table.userId,
      table.createdAt
    ),
  ]
);

export const creditPurchases = pgTable('credit_purchases', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  package: varchar('package', { length: 100 }).notNull(),
  amountUsd: decimal('amount_usd', { precision: 10, scale: 2 }).notNull(),
  creditsGranted: integer('credits_granted').notNull(),
  paymentProvider: varchar('payment_provider', { length: 50 }).default('stripe').notNull(),
  paymentId: varchar('payment_id', { length: 255 }),
  status: creditPurchaseStatusEnum('status').default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
