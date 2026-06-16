import { and, eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';

import { auth } from '@/auth';
import { db, posts } from '@/schema';

import EditPostForm from './EditPostForm';

export default async function EditPostPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return 'Unauthorized';

  const id = parseInt(params.id, 10);
  const rows = await db
    .select()
    .from(posts)
    .where(and(eq(posts.id, id), eq(posts.authorId, session.user.id!)))
    .limit(1);

  if (!rows[0]) notFound();

  return <EditPostForm postId={id} defaultMessage={rows[0].message} />;
}
