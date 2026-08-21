'use server';

import { auth } from '@/auth';
import { db, memorySubscriptions } from '@/schema';
import { and, desc, eq } from 'drizzle-orm';

export type SubscriptionFrequency = 'daily' | 'weekly' | 'monthly';

export type MemorySubscriptionRow = {
  id: number;
  frequency: SubscriptionFrequency;
  timeOfDay: string;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  telegramLinkToken: string;
  telegramChatId: string | null;
  active: boolean;
  lastSentAt: Date | null;
  createdAt: Date;
};

const TIME_OF_DAY_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function buildTelegramDeepLink(id: number, token: string): string {
  const username = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
  if (!username) throw new Error('Telegram bot is not configured');
  return `https://t.me/${username}?start=sub_${id}_${token}`;
}

export async function createSubscription(
  frequency: SubscriptionFrequency,
  timeOfDay: string,
  dayOfWeek: number | null,
  dayOfMonth: number | null,
): Promise<{ id: number; telegramDeepLink: string }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  if (!TIME_OF_DAY_RE.test(timeOfDay)) throw new Error('Invalid time of day');
  if (frequency === 'weekly' && (dayOfWeek === null || dayOfWeek < 0 || dayOfWeek > 6)) {
    throw new Error('Pick a day of the week');
  }
  if (frequency === 'monthly' && (dayOfMonth === null || dayOfMonth < 1 || dayOfMonth > 28)) {
    throw new Error('Pick a day of the month (1-28)');
  }

  const [row] = await db
    .insert(memorySubscriptions)
    .values({
      userId: session.user.id,
      frequency,
      timeOfDay,
      dayOfWeek: frequency === 'weekly' ? dayOfWeek : null,
      dayOfMonth: frequency === 'monthly' ? dayOfMonth : null,
    })
    .returning({ id: memorySubscriptions.id, telegramLinkToken: memorySubscriptions.telegramLinkToken });

  return { id: row.id, telegramDeepLink: buildTelegramDeepLink(row.id, row.telegramLinkToken) };
}

export async function listMySubscriptions(): Promise<MemorySubscriptionRow[]> {
  const session = await auth();
  if (!session?.user?.id) return [];
  return db
    .select()
    .from(memorySubscriptions)
    .where(eq(memorySubscriptions.userId, session.user.id))
    .orderBy(desc(memorySubscriptions.createdAt));
}

export async function getSubscriptionDeepLink(id: number): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  const rows = await db
    .select({ telegramLinkToken: memorySubscriptions.telegramLinkToken })
    .from(memorySubscriptions)
    .where(and(eq(memorySubscriptions.id, id), eq(memorySubscriptions.userId, session.user.id)))
    .limit(1);
  if (!rows[0]) throw new Error('Not found');
  return buildTelegramDeepLink(id, rows[0].telegramLinkToken);
}

export async function toggleSubscription(id: number, active: boolean): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  await db
    .update(memorySubscriptions)
    .set({ active })
    .where(and(eq(memorySubscriptions.id, id), eq(memorySubscriptions.userId, session.user.id)));
}

export async function deleteSubscription(id: number): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  await db
    .delete(memorySubscriptions)
    .where(and(eq(memorySubscriptions.id, id), eq(memorySubscriptions.userId, session.user.id)));
}
