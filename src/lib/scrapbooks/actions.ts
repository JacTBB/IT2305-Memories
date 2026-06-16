'use server';

import { auth } from '@/auth';
import { db, scrapbooks } from '@/schema';
import { and, desc, eq } from 'drizzle-orm';

export type ScrapbookRow = {
  id: number;
  title: string;
  thumbnail: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ScrapbookDetail = ScrapbookRow & { data: string };

export async function saveScrapbook(
  title: string, data: string, thumbnail: string | null,
): Promise<number> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  if (!title.trim()) throw new Error('Title required');
  const [row] = await db
    .insert(scrapbooks)
    .values({ userId: session.user.id, title: title.trim(), data, thumbnail })
    .returning({ id: scrapbooks.id });
  return row.id;
}

export async function updateScrapbook(
  id: number, title: string, data: string, thumbnail: string | null,
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  await db
    .update(scrapbooks)
    .set({ title: title.trim(), data, thumbnail, updatedAt: new Date() })
    .where(and(eq(scrapbooks.id, id), eq(scrapbooks.userId, session.user.id)));
}

export async function deleteScrapbook(id: number): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  await db
    .delete(scrapbooks)
    .where(and(eq(scrapbooks.id, id), eq(scrapbooks.userId, session.user.id)));
}

export async function listScrapbooks(): Promise<ScrapbookRow[]> {
  const session = await auth();
  if (!session?.user?.id) return [];
  return db
    .select({
      id: scrapbooks.id,
      title: scrapbooks.title,
      thumbnail: scrapbooks.thumbnail,
      createdAt: scrapbooks.createdAt,
      updatedAt: scrapbooks.updatedAt,
    })
    .from(scrapbooks)
    .where(eq(scrapbooks.userId, session.user.id))
    .orderBy(desc(scrapbooks.updatedAt));
}

export async function getScrapbook(id: number): Promise<ScrapbookDetail | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const rows = await db
    .select()
    .from(scrapbooks)
    .where(and(eq(scrapbooks.id, id), eq(scrapbooks.userId, session.user.id)))
    .limit(1);
  return rows[0] ?? null;
}
