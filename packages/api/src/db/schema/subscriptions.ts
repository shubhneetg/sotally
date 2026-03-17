import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { tools } from './tools';

// For subscription pricing model
export const toolSubscriptions = pgTable('tool_subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  toolId: uuid('tool_id')
    .references(() => tools.id, { onDelete: 'cascade' })
    .notNull(),
  status: varchar('status', { length: 20 }).default('active').notNull(),
  creditsPerMonth: integer('credits_per_month').notNull(),
  runsUsed: integer('runs_used').default(0).notNull(),
  runsLimit: integer('runs_limit').notNull(),
  currentPeriodStart: timestamp('current_period_start', { withTimezone: true }).defaultNow().notNull(),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }).notNull(),
  nextBillingAt: timestamp('next_billing_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// For one-time purchase pricing model
export const toolLicenses = pgTable('tool_licenses', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  toolId: uuid('tool_id')
    .references(() => tools.id, { onDelete: 'cascade' })
    .notNull(),
  purchasedAt: timestamp('purchased_at', { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  creditsPaid: integer('credits_paid').notNull(),
});
