import {
  pgTable,
  uuid,
  smallint,
  text,
  timestamp,
  index,
  unique,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';
import { tools } from './tools';

export const reviews = pgTable(
  'reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    toolId: uuid('tool_id')
      .notNull()
      .references(() => tools.id),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    rating: smallint('rating').notNull(),
    comment: text('comment'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('reviews_tool_id_idx').on(table.toolId),
    unique('reviews_tool_user_unique').on(table.toolId, table.userId),
    check('rating_range', sql`${table.rating} >= 1 AND ${table.rating} <= 5`),
  ]
);
