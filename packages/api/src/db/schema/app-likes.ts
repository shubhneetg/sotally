import {
  pgTable,
  uuid,
  timestamp,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { apps } from './apps';

export const appLikes = pgTable(
  'app_likes',
  {
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    appId: uuid('app_id')
      .references(() => apps.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.appId] }),
  ]
);
