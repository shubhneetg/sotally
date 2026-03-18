import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  jsonb,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { apps } from './apps';

export const appVersions = pgTable(
  'app_versions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    appId: uuid('app_id')
      .notNull()
      .references(() => apps.id, { onDelete: 'cascade' }),

    // Version identity
    versionNumber: integer('version_number').notNull(),
    label: text('label'),

    // Bundle storage
    bundleUrl: text('bundle_url').notNull(),
    bundleHash: varchar('bundle_hash', { length: 64 }).notNull(),
    bundleSizeBytes: integer('bundle_size_bytes').notNull(),

    // Source snapshot (for re-generation context)
    sourceSnapshot: jsonb('source_snapshot').$type<{
      files: Record<string, string>;
      entryPoint: string;
      dependencies: Record<string, string>;
    }>(),

    // Generation linkage
    generationId: uuid('generation_id'),
    prompt: text('prompt'),
    changelog: text('changelog'),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('app_versions_app_id_idx').on(table.appId),
    index('app_versions_app_version_idx').on(table.appId, table.versionNumber),
  ]
);
