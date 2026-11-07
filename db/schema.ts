import { pgTable, uuid, text, integer, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
// Reference schema only. Apply supabase/migrations SQL for all constraints,
// RLS, grants, and transactional functions; do not push this partial schema.
export const shops = pgTable('shops', {
  owner: uuid('owner').primaryKey(), name: text('name').notNull(),
  reward: text('reward').notNull(), goal: integer('goal').notNull(),
});
export const members = pgTable('members', {
  id: uuid('id').primaryKey().defaultRandom(), owner: uuid('owner').notNull().references(() => shops.owner, { onDelete: 'cascade' }),
  name: text('name').notNull(), phone: text('phone').notNull(),
  stamps: integer('stamps').notNull().default(0), visits: integer('visits').notNull().default(0),
  last: timestamp('last', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex('members_owner_phone_idx').on(table.owner, table.phone)]);
export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(), owner: uuid('owner').notNull(),
  member: uuid('member').notNull().references(() => members.id, { onDelete: 'cascade' }),
  kind: text('kind').notNull(), at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
});
