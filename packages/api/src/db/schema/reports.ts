import { pgTable, pgEnum, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';
import { tools } from './tools';

export const reportReasonEnum = pgEnum('report_reason', [
  'spam',
  'misleading',
  'broken',
  'inappropriate',
  'copyright',
  'malicious',
  'other',
]);

export const reportStatusEnum = pgEnum('report_status', [
  'open',
  'investigating',
  'resolved',
  'dismissed',
]);

export const toolReports = pgTable('tool_reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  toolId: uuid('tool_id')
    .references(() => tools.id, { onDelete: 'cascade' })
    .notNull(),
  reporterId: uuid('reporter_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  reason: reportReasonEnum('reason').notNull(),
  description: text('description'),
  status: reportStatusEnum('status').default('open').notNull(),
  reviewedBy: uuid('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
