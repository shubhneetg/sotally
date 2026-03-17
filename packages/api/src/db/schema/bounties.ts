import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { tools } from './tools';

export const bounties = pgTable('bounties', {
  id: uuid('id').defaultRandom().primaryKey(),
  requesterId: uuid('requester_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  creditReward: integer('credit_reward').notNull(),
  status: varchar('status', { length: 20 }).default('open').notNull(), // open, claimed, completed, cancelled
  claimedBy: uuid('claimed_by').references(() => users.id),
  fulfilledByToolId: uuid('fulfilled_by_tool_id').references(() => tools.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const bountySubmissions = pgTable('bounty_submissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  bountyId: uuid('bounty_id')
    .references(() => bounties.id, { onDelete: 'cascade' })
    .notNull(),
  creatorId: uuid('creator_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  toolId: uuid('tool_id')
    .references(() => tools.id)
    .notNull(),
  message: text('message'),
  status: varchar('status', { length: 20 }).default('pending').notNull(), // pending, accepted, rejected
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
