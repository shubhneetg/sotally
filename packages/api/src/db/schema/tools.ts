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
import { users } from './users.js';
import { categories } from './categories.js';

export const executionTypeEnum = pgEnum('execution_type', [
  'prompt',
  'pipeline',
  'docker',
  'external_api',
]);

export const toolStatusEnum = pgEnum('tool_status', [
  'draft',
  'pending_review',
  'published',
  'suspended',
  'archived',
]);

export const toolTemplates = pgTable('tool_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  executionType: executionTypeEnum('execution_type').notNull(),
  defaultConfig: jsonb('default_config'),
  inputSchema: jsonb('input_schema'),
  outputSchema: jsonb('output_schema'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const tools = pgTable(
  'tools',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    creatorId: uuid('creator_id')
      .notNull()
      .references(() => users.id),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    description: varchar('description', { length: 500 }).notNull(),
    longDescription: text('long_description'),
    iconUrl: varchar('icon_url', { length: 500 }),
    categoryId: uuid('category_id').references(() => categories.id),
    tags: text('tags').array(),
    executionType: executionTypeEnum('execution_type').notNull(),
    pricing: jsonb('pricing')
      .default({ model: 'per_run', creditsPerRun: 5 })
      .notNull(),
    inputSchema: jsonb('input_schema'),
    outputSchema: jsonb('output_schema'),
    config: jsonb('config'),
    templateId: uuid('template_id').references(() => toolTemplates.id),
    demoOutput: jsonb('demo_output'),
    seoTitle: varchar('seo_title', { length: 70 }),
    seoDescription: varchar('seo_description', { length: 160 }),
    status: toolStatusEnum('status').default('draft').notNull(),
    isFeatured: boolean('is_featured').default(false).notNull(),
    totalRuns: integer('total_runs').default(0).notNull(),
    avgRating: decimal('avg_rating', { precision: 3, scale: 2 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('tools_slug_idx').on(table.slug),
    index('tools_creator_id_idx').on(table.creatorId),
    index('tools_status_idx').on(table.status),
  ]
);

export const toolVersions = pgTable('tool_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  toolId: uuid('tool_id')
    .notNull()
    .references(() => tools.id),
  version: varchar('version', { length: 50 }).notNull(),
  changelog: text('changelog'),
  config: jsonb('config'),
  inputSchema: jsonb('input_schema'),
  outputSchema: jsonb('output_schema'),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
