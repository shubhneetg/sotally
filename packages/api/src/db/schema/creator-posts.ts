import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  jsonb,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { apps } from './apps';

export const postTypeEnum = pgEnum('post_type', [
  'update',
  'announcement',
  'changelog',
  'milestone',
  'showcase',
]);

export const creatorPosts = pgTable(
  'creator_posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    creatorId: uuid('creator_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    appId: uuid('app_id').references(() => apps.id, { onDelete: 'set null' }),

    // Content
    type: postTypeEnum('type').default('update').notNull(),
    title: varchar('title', { length: 255 }),
    body: text('body').notNull(),
    mediaUrls: jsonb('media_urls').$type<string[]>().default([]),

    // Engagement (denormalized)
    likeCount: integer('like_count').default(0).notNull(),
    commentCount: integer('comment_count').default(0).notNull(),

    // Status
    pinned: boolean('pinned').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('creator_posts_creator_id_idx').on(table.creatorId),
    index('creator_posts_created_at_idx').on(table.createdAt),
  ]
);
