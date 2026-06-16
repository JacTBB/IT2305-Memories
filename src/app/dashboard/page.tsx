import { eq } from 'drizzle-orm';
import { BookImage, PencilLine } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

import { auth } from '@/auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { db, posts, users } from '@/schema';

const Posts = async ({ userId }: { userId: string }) => {
  const PostsData = await db
    .select()
    .from(posts)
    .where(eq(posts.authorId, userId))
    .leftJoin(users, eq(posts.authorId, users.id))
    .then((results) =>
      results.map((row) => ({ ...row.post, author: row.user })),
    );

  return (
    <div className="flex flex-wrap">
      {PostsData.map((post: any) => (
        <Card
          key={post.id}
          className={`w-[250px] min-h-[200px] m-1.5 flex flex-col ${
            post.star
              ? 'border-yellow-700 hover:border-yellow-600'
              : 'border-gray-700 hover:border-gray-600'
          } hover:shadow-slate-600`}
        >
          <CardHeader className="text-sm flex-grow pb-6">
            {post.message ? (
              <ScrollArea className="max-h-[95px]" type="auto">
                {post.message.split('\n\n').map((line: string, i: number) => (
                  <React.Fragment key={i}>
                    <p className="text-wrap">{line}</p>
                    <br />
                  </React.Fragment>
                ))}
              </ScrollArea>
            ) : (
              'Description?'
            )}
          </CardHeader>

          <CardFooter className="flex items-center justify-between gap-2">
            <p className="text-xs text-gray-400">Author: {post.author?.name}</p>
            <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1">
              <Link href={`/dashboard/posts/${post.id}/edit`}>
                <PencilLine className="w-3 h-3" />
                Edit
              </Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default async function Dashboard() {
  const session = await auth();
  if (!session || !session.user) return 'Unauthorized';

  if (session.user.role === 'public') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-12">
        <div className="items-center lg:flex mb-2">
          <h3 className="mr-5 text-lg text-center font-medium">Welcome to IT2305 Memories</h3>
          <h3 className="text-center text-lg font-medium italic">{session.user.name}</h3>
        </div>
        <div className="items-center text-xs text-gray-400 text-center lg:flex mb-10">
          <p>Please contact the admins for access to the platform.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col p-20 py-10">
      <section className="w-full flex flex-col justify-center items-center gap-3">
        <h1 className="text-2xl text-center font-bold">My Posts</h1>
        <div className="flex gap-2">
          <Button asChild className="w-24">
            <Link href="/dashboard/posts/new">New Post</Link>
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link href="/scrapbook">
              <BookImage className="w-4 h-4" />
              Scrapbook
            </Link>
          </Button>
        </div>
      </section>
      <section className="mt-10">
        <Posts userId={session.user.id || ''} />
      </section>
    </main>
  );
}
