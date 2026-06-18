import { and, count, eq, gt, sql } from 'drizzle-orm';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { db, reactions } from '@/schema';

const ALLOWED_EMOJIS = new Set(['❤️', '😂', '🔥', '😮', '😢']);
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 15;

function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    '127.0.0.1'
  );
}

export async function GET(req: NextRequest) {
  const photoId = req.nextUrl.searchParams.get('photo');
  if (!photoId) return NextResponse.json({ error: 'Missing photo' }, { status: 400 });

  const rows = await db
    .select({ emoji: reactions.emoji, count: count() })
    .from(reactions)
    .where(eq(reactions.photoId, photoId))
    .groupBy(reactions.emoji);

  const counts: Record<string, number> = {};
  for (const row of rows) counts[row.emoji] = Number(row.count);

  return NextResponse.json(counts);
}

export async function POST(req: NextRequest) {
  const ip = getIp(req);
  const { photo, emoji } = await req.json();

  if (!photo || typeof photo !== 'string') {
    return NextResponse.json({ error: 'Missing photo' }, { status: 400 });
  }
  if (!emoji || !ALLOWED_EMOJIS.has(emoji)) {
    return NextResponse.json({ error: 'Invalid emoji' }, { status: 400 });
  }

  // Rate limit: max RATE_LIMIT_MAX reactions per IP in the last minute
  const [{ value: recentCount }] = await db
    .select({ value: count() })
    .from(reactions)
    .where(
      and(
        eq(reactions.ip, ip),
        gt(reactions.createdAt, new Date(Date.now() - RATE_LIMIT_WINDOW_MS)),
      ),
    );

  if (Number(recentCount) >= RATE_LIMIT_MAX) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  // Toggle: delete if already reacted, insert if not
  const existing = await db
    .select({ id: reactions.id })
    .from(reactions)
    .where(
      and(
        eq(reactions.photoId, photo),
        eq(reactions.emoji, emoji),
        eq(reactions.ip, ip),
      ),
    )
    .limit(1);

  let reacted: boolean;
  if (existing.length > 0) {
    await db.delete(reactions).where(eq(reactions.id, existing[0].id));
    reacted = false;
  } else {
    await db.insert(reactions).values({ photoId: photo, emoji, ip });
    reacted = true;
  }

  // Return updated counts for this photo
  const rows = await db
    .select({ emoji: reactions.emoji, count: count() })
    .from(reactions)
    .where(eq(reactions.photoId, photo))
    .groupBy(reactions.emoji);

  const counts: Record<string, number> = {};
  for (const row of rows) counts[row.emoji] = Number(row.count);

  return NextResponse.json({ counts, reacted });
}
