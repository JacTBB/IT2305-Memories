/* eslint-disable camelcase */
import dotenv from 'dotenv';
import {
  boolean,
  integer,
  json,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

dotenv.config();

const connectionString = process.env.AUTH_DRIZZLE_URL || '';
const pool = postgres(connectionString, { max: 1 });

export const db = drizzle(pool);

export const users = pgTable('user', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'),
  role: text('role', { enum: ['public', 'classmate', 'admin'] }).default('public'),
});

export const accounts = pgTable(
  'account',
  {
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  }),
);

export const sessions = pgTable('session', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokens = pgTable(
  'verificationToken',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (verificationToken) => ({
    compositePk: primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  }),
);

export const authenticators = pgTable(
  'authenticator',
  {
    credentialID: text('credentialID').notNull().unique(),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    providerAccountId: text('providerAccountId').notNull(),
    credentialPublicKey: text('credentialPublicKey').notNull(),
    counter: integer('counter').notNull(),
    credentialDeviceType: text('credentialDeviceType').notNull(),
    credentialBackedUp: boolean('credentialBackedUp').notNull(),
    transports: text('transports'),
  },
  (authenticator) => ({
    compositePK: primaryKey({
      columns: [authenticator.userId, authenticator.credentialID],
    }),
  }),
);

export const reactions = pgTable('reaction', {
  id: serial('id').primaryKey(),
  photoId: text('photoId').notNull(),
  emoji: text('emoji').notNull(),
  ip: text('ip').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});

export const posts = pgTable('post', {
  id: serial('id').primaryKey(),
  message: text('message').notNull(),

  authorId: text('authorId').references(() => users.id, { onDelete: 'no action' }),
  createdTimestamp: timestamp('createdTimestamp').notNull(),
  star: boolean('star').default(false),
});

export const scrapbooks = pgTable('scrapbook', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  data: text('data').notNull(),
  thumbnail: text('thumbnail'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

export const scheduledMemories = pgTable('scheduled_memory', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  photoSrc: text('photoSrc').notNull(),
  caption: text('caption'),
  sendAt: timestamp('sendAt').notNull(),
  telegramChatId: text('telegramChatId'),
  telegramLinkToken: text('telegramLinkToken')
    .notNull()
    .unique()
    .$defaultFn(() => crypto.randomUUID()),
  deliveryStatus: text('deliveryStatus', { enum: ['pending', 'linked', 'sent', 'failed'] })
    .notNull()
    .default('pending'),
  errorMessage: text('errorMessage'),
  retryCount: integer('retryCount').notNull().default(0),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  deliveredAt: timestamp('deliveredAt'),
});

export const people = pgTable('person', {
  id: serial('id').primaryKey(),
  name: text('name'),
  coverFaceId: integer('coverFaceId').references(() => faces.id, { onDelete: 'set null' }),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});

export const faces = pgTable('face', {
  id: serial('id').primaryKey(),
  photoSrc: text('photoSrc').notNull(),
  personId: integer('personId').references(() => people.id, { onDelete: 'set null' }),
  descriptor: json('descriptor').notNull(),
  box: json('box').notNull(),
  verified: boolean('verified').notNull().default(false),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});

// Records a face that an admin confirmed does NOT belong to a person, so
// re-clustering never reassigns that exact face back to that same person.
export const faceRejections = pgTable('face_rejection', {
  id: serial('id').primaryKey(),
  faceId: integer('faceId').notNull().references(() => faces.id, { onDelete: 'cascade' }),
  personId: integer('personId').notNull().references(() => people.id, { onDelete: 'cascade' }),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});

export const memorySubscriptions = pgTable('memory_subscription', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  frequency: text('frequency', { enum: ['daily', 'weekly', 'monthly'] }).notNull(),
  // 'HH:MM' in Singapore local time (UTC+8)
  timeOfDay: text('timeOfDay').notNull(),
  // 0 (Sun) - 6 (Sat); weekly only
  dayOfWeek: integer('dayOfWeek'),
  // 1-28; monthly only
  dayOfMonth: integer('dayOfMonth'),
  telegramChatId: text('telegramChatId'),
  telegramLinkToken: text('telegramLinkToken')
    .notNull()
    .unique()
    .$defaultFn(() => crypto.randomUUID()),
  active: boolean('active').notNull().default(true),
  lastSentAt: timestamp('lastSentAt'),
  lastSentPhotoSrc: text('lastSentPhotoSrc'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});
