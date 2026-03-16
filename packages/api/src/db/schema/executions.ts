import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  integer,
  jsonb,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { tools } from './tools.js';
import { toolVersions } from './tools.js';

export const executionStatusEnum = pgEnum('execution_status', [
  'queued',
  'running',
  'completed',
  'failed',
  'timeout',
  'cancelled',
]);

export const pricingModelEnum = pgEnum('pricing_model', [
  'per_run',
  'per_minute',
  'tiered',
  'subscription',
]);

export const executions = pgTable(
  'executions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    toolId: uuid('tool_id')
      .notNull()
      .references(() => tools.id),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    toolVersionId: uuid('tool_version_id').references(() => toolVersions.id),
    status: executionStatusEnum('status').default('queued').notNull(),
    input: jsonb('input'),
    output: jsonb('output'),
    error: text('error'),
    creditsCharged: integer('credits_charged').default(0).notNull(),
    creditsRefunded: integer('credits_refunded').default(0).notNull(),
    durationMs: integer('duration_ms'),
    pricingModel: pricingModelEnum('pricing_model'),
    pricingTier: varchar('pricing_tier', { length: 100 }),
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('executions_user_id_idx').on(table.userId),
    index('executions_tool_id_idx').on(table.toolId),
    index('executions_status_idx').on(table.status),
  ]
);
