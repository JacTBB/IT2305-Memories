import { count } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db, reactions } from '@/schema';

export async function GET() {
  const rows = await db
    .select({ photoId: reactions.photoId, emoji: reactions.emoji, count: count() })
    .from(reactions)
    .groupBy(reactions.photoId, reactions.emoji);

  const result: Record<string, Record<string, number>> = {};
  for (const row of rows) {
    if (!result[row.photoId]) result[row.photoId] = {};
    result[row.photoId][row.emoji] = Number(row.count);
  }

  return NextResponse.json(result);
}
