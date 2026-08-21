'use server';

import { auth } from '@/auth';
import { db, scheduledMemories } from '@/schema';
import { and, desc, eq } from 'drizzle-orm';

import { slides } from '@/lib/slides';

export type ScheduledMemoryRow = {
  id: number;
  photoSrc: string;
  caption: string | null;
  sendAt: Date;
  deliveryStatus: 'pending' | 'linked' | 'sent' | 'failed';
  errorMessage: string | null;
  telegramLinkToken: string;
  telegramChatId: string | null;
  createdAt: Date;
  deliveredAt: Date | null;
};

const knownSlideSrcs = new Set(slides.map((slide) => slide.src));

function buildTelegramDeepLink(id: number, token: string): string {
  const username = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
  if (!username) throw new Error('Telegram bot is not configured');
  return `https://t.me/${username}?start=snap_${id}_${token}`;
}

export async function scheduleMemory(
  photoSrc: string, caption: string, sendAt: Date,
): Promise<{ id: number; telegramDeepLink: string }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  if (!knownSlideSrcs.has(photoSrc)) throw new Error('Unknown photo');
  if (sendAt.getTime() <= Date.now()) throw new Error('Send time must be in the future');

  const [row] = await db
    .insert(scheduledMemories)
    .values({
      userId: session.user.id,
      photoSrc,
      caption: caption.trim() || null,
      sendAt,
    })
    .returning({ id: scheduledMemories.id, telegramLinkToken: scheduledMemories.telegramLinkToken });

  return { id: row.id, telegramDeepLink: buildTelegramDeepLink(row.id, row.telegramLinkToken) };
}

export async function listMyMemories(): Promise<ScheduledMemoryRow[]> {
  const session = await auth();
  if (!session?.user?.id) return [];
  return db
    .select()
    .from(scheduledMemories)
    .where(eq(scheduledMemories.userId, session.user.id))
    .orderBy(desc(scheduledMemories.sendAt));
}

export async function getTelegramDeepLink(id: number): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  const rows = await db
    .select({ telegramLinkToken: scheduledMemories.telegramLinkToken })
    .from(scheduledMemories)
    .where(and(eq(scheduledMemories.id, id), eq(scheduledMemories.userId, session.user.id)))
    .limit(1);
  if (!rows[0]) throw new Error('Not found');
  return buildTelegramDeepLink(id, rows[0].telegramLinkToken);
}

export async function cancelMemory(id: number): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  await db
    .delete(scheduledMemories)
    .where(
      and(
        eq(scheduledMemories.id, id),
        eq(scheduledMemories.userId, session.user.id),
      ),
    );
}
