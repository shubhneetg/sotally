import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { apps } from './apps';

export const appData = pgTable(
  'app_data',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    appId: uuid('app_id')
      .notNull()
      .references(() => apps.id, { onDelete: 'cascade' }),
    userId: uuid('user_id'),
    namespace: text('namespace').notNull().default('default'),
    key: text('key').notNull(),
    value: jsonb('value').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('app_data_lookup_idx').on(table.appId, table.userId, table.namespace, table.key),
    unique('app_data_unique').on(table.appId, table.userId, table.namespace, table.key),
  ]
);
