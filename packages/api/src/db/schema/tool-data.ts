import {
  pgTable,
  uuid,
  varchar,
  jsonb,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { tools } from './tools.js';

export const toolUserData = pgTable(
  'tool_user_data',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    toolId: uuid('tool_id')
      .notNull()
      .references(() => tools.id),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    key: varchar('key', { length: 255 }).notNull(),
    value: jsonb('value'),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    unique('tool_user_data_unique').on(table.toolId, table.userId, table.key),
  ]
);
