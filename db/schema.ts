import {sqliteTable,text,integer} from 'drizzle-orm/sqlite-core';
export const shops=sqliteTable('shops',{owner:text('owner').primaryKey(),name:text('name').notNull(),reward:text('reward').notNull(),goal:integer('goal').notNull()});
export const members=sqliteTable('members',{id:text('id').primaryKey(),owner:text('owner').notNull(),name:text('name').notNull(),phone:text('phone').notNull(),stamps:integer('stamps').notNull().default(0),visits:integer('visits').notNull().default(0),last:text('last').notNull()});
export const events=sqliteTable('events',{id:text('id').primaryKey(),owner:text('owner').notNull(),member:text('member').notNull(),kind:text('kind').notNull(),at:text('at').notNull()});
