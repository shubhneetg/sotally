import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { tools } from './tools';

// Follows (users follow creators)
export const follows = pgTable(
  'follows',
  {
    followerId: uuid('follower_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    creatorId: uuid('creator_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.followerId, table.creatorId] }),
  ]
);

// Tool collections (curated tool lists)
export const toolCollections = pgTable('tool_collections', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  curatorId: uuid('curator_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  isFeatured: boolean('is_featured').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const collectionTools = pgTable(
  'collection_tools',
  {
    collectionId: uuid('collection_id')
      .references(() => toolCollections.id, { onDelete: 'cascade' })
      .notNull(),
    toolId: uuid('tool_id')
      .references(() => tools.id, { onDelete: 'cascade' })
      .notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.collectionId, table.toolId] }),
  ]
);
