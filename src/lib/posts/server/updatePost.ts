'use server';

import { auth } from '@/auth';
import { db, posts } from '@/schema';
import { and, eq } from 'drizzle-orm';

import { formSchema } from '../useCreatePostForm';

export default async function updatePost(id: number, postData: any) {
  const session = await auth();
  if (!session || !session.user) throw Error('Unauthorized');

  if (session.user.role === 'public') throw Error('Forbidden');

  try {
    formSchema.parse(postData);
  } catch {
    throw Error('Invalid data');
  }

  await db
    .update(posts)
    .set({ message: postData.message })
    .where(and(eq(posts.id, id), eq(posts.authorId, session.user.id!)));
}
