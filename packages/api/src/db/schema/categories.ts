import {
  pgTable,
  uuid,
  varchar,
  integer,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    icon: varchar('icon', { length: 100 }),
    parentId: uuid('parent_id'),
    sortOrder: integer('sort_order').default(0).notNull(),
  },
  (table) => [
    uniqueIndex('categories_slug_idx').on(table.slug),
  ]
);
