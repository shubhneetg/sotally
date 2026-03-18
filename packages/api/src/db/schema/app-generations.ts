import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  jsonb,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { apps } from './apps';

export const generationTypeEnum = pgEnum('generation_type', [
  'initial',
  'iterate',
  'fix_bug',
  'add_feature',
  'restyle',
]);

export const generationStatusEnum = pgEnum('generation_status', [
  'queued',
  'parsing',
  'architecting',
  'generating',
  'validating',
  'building',
  'deploying',
  'succeeded',
  'failed',
]);

export const appGenerations = pgTable(
  'app_generations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    appId: uuid('app_id').references(() => apps.id, { onDelete: 'set null' }),
    creatorId: uuid('creator_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Request
    type: generationTypeEnum('type').notNull(),
    prompt: text('prompt').notNull(),
    systemContext: jsonb('system_context'),

    // LLM details
    model: text('model').notNull(),
    inputTokens: integer('input_tokens'),
    outputTokens: integer('output_tokens'),
    totalTokens: integer('total_tokens'),
    llmCostCents: integer('llm_cost_cents'),
    creditsCharged: integer('credits_charged').default(0).notNull(),

    // Result
    status: generationStatusEnum('status').default('queued').notNull(),
    resultVersionId: uuid('result_version_id'),
    errorMessage: text('error_message'),
    errorCode: varchar('error_code', { length: 100 }),

    // Timing
    queuedAt: timestamp('queued_at', { withTimezone: true }).defaultNow().notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    durationMs: integer('duration_ms'),
  },
  (table) => [
    index('app_generations_app_id_idx').on(table.appId),
    index('app_generations_creator_id_idx').on(table.creatorId),
    index('app_generations_status_idx').on(table.status),
  ]
);
