import { auth } from '@/auth';
import { db, posts, users } from '@/schema';
import { eq } from 'drizzle-orm';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const Posts = async ({ userId }: { userId: string }) => {
  const PostsData = await db
    .select()
    .from(posts)
    .where(eq(posts.authorId, userId))
    .leftJoin(users, eq(posts.authorId, users.id))
    .then((results) => {
      const mappedResults = results.map((row) => ({
        ...row.post,
        author: row.user,
      }));
      return mappedResults;
    });

  return (
    <div className="flex flex-wrap">
      {Object.values(PostsData).map((post: any, index) => (
        <React.Fragment key={index}>
          <Card
            className={`w-[250px] min-h-[200px] m-1.5 flex flex-col ${post.star ? 'border-yellow-700 hover:border-yellow-600' : 'border-gray-700 hover:border-gray-600'} hover:shadow-slate-600`}
          >
            <CardHeader className="text-sm flex-grow pb-6">
              {post.message ? (
                <ScrollArea className="max-h-[95px]" type="auto">
                  {post.message.split('\n\n').map((line: any, index: any) => (
                    <React.Fragment key={index}>
                      <p className="text-wrap">{line}</p>
                      <br />
                    </React.Fragment>
                  ))}
                </ScrollArea>
              ) : (
                'Description?'
              )}
            </CardHeader>

            <CardFooter className="flex flex-col justify-start">
              <p className="w-full text-xs">Author: {post.author.name}</p>
            </CardFooter>
          </Card>
        </React.Fragment>
      ))}
    </div>
  );
};

export default async function Dashboard() {
  const session = await auth();
  if (!session || !session.user) return 'Unauthorized';

  if (session.user.role == 'public') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-12">
        <div className="items-center lg:flex mb-2">
          <h3 className="mr-5 text-lg text-center font-medium">Welcome to IT2305 Memories</h3>
          <h3 className="text-center text-lg font-medium italic">{session.user.name}</h3>
        </div>

        <div className="items-center text-xs text-gray-400 text-center lg:flex mb-10">
          <p className="">Please contact the admins for access to the platform.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col p-20 py-10">
      <section className="w-full flex flex-col justify-center items-center">
        <h1 className="text-2xl text-center font-bold">My Posts</h1>

        <br></br>
        <Button asChild className="w-24">
          <Link href="/dashboard/posts/new">New Post</Link>
        </Button>
      </section>
      <section className="mt-10">
        <Posts userId={session.user.id || ''} />
      </section>
    </main>
  );
}
