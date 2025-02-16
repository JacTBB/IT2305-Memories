'use server';

import { auth } from '@/auth';
import { db, posts } from '@/schema';
import { eq } from 'drizzle-orm';

import { formSchema } from '../useCreatePostForm';

export default async function createPost(postData: any) {
  const session = await auth();
  if (!session || !session.user) throw Error('Unauthorized');

  if (session.user.role == 'public') throw Error('Forbidden');

  try {
    formSchema.parse(postData);
  } catch (error) {
    throw Error('Invalid data');
  }

  type NewPost = typeof posts.$inferInsert;
  const newPost: NewPost = {
    message: postData.message,
    authorId: session.user.id,
    createdTimestamp: new Date(Date.now()),
  };

  await db.insert(posts).values(newPost);

  return;
}
