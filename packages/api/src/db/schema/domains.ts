import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const customDomains = pgTable('custom_domains', {
  id: uuid('id').defaultRandom().primaryKey(),
  creatorId: uuid('creator_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  domain: varchar('domain', { length: 500 }).notNull().unique(),
  verified: boolean('verified').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
