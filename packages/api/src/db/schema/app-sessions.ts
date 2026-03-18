import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { apps } from './apps';
import { users } from './users';

export const sessionPaymentStatusEnum = pgEnum('session_payment_status', [
  'not_required',
  'pending',
  'completed',
  'failed',
]);

export const appSessions = pgTable(
  'app_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    appId: uuid('app_id')
      .notNull()
      .references(() => apps.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    versionId: uuid('version_id').notNull(),

    // Client info
    ipHash: varchar('ip_hash', { length: 64 }),
    userAgent: text('user_agent'),
    referrer: text('referrer'),
    country: varchar('country', { length: 2 }),

    // AI usage within session
    aiCallCount: integer('ai_call_count').default(0).notNull(),
    aiTokensUsed: integer('ai_tokens_used').default(0).notNull(),
    aiCostCents: integer('ai_cost_cents').default(0).notNull(),

    // Billing
    paymentStatus: sessionPaymentStatusEnum('payment_status').default('not_required').notNull(),
    amountChargedCents: integer('amount_charged_cents').default(0),

    // Lifecycle
    startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
    lastActiveAt: timestamp('last_active_at', { withTimezone: true }).defaultNow().notNull(),
    endedAt: timestamp('ended_at', { withTimezone: true }),
    durationSeconds: integer('duration_seconds'),
  },
  (table) => [
    index('app_sessions_app_id_idx').on(table.appId),
    index('app_sessions_user_id_idx').on(table.userId),
    index('app_sessions_started_at_idx').on(table.startedAt),
  ]
);
