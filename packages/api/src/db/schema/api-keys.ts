import {
  pgTable,
  uuid,
  varchar,
  integer,
  jsonb,
  timestamp,
  customType,
} from 'drizzle-orm/pg-core';
import { users } from './users';

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return 'bytea';
  },
});

export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  provider: varchar('provider', { length: 100 }).notNull(),
  encryptedKey: bytea('encrypted_key').notNull(),
  label: varchar('label', { length: 255 }),
  serviceType: varchar('service_type', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const apiTokens = pgTable('api_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  name: varchar('name', { length: 255 }).notNull(),
  tokenHash: varchar('token_hash', { length: 255 }).notNull().unique(),
  permissions: jsonb('permissions'),
  rateLimit: integer('rate_limit').default(100).notNull(),
  lastUsedAt: timestamp('last_used_at'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
