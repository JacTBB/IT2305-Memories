import { db, posts, users } from '@/schema';
import { eq } from 'drizzle-orm';
import Link from 'next/link';
import React from 'react';

import { Hero } from '@/components/hero';

const Posts = async () => {
  const PostsData = await db
    .select()
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .then((results) => {
      const mappedResults = results.map((row) => ({
        ...row.post,
        author: row.user,
      }));
      return mappedResults;
    });

  return (
    <div className="flex flex-wrap flex-row justify-center items-center p-12">
      {Object.values(PostsData).map((post: any, index) => (
        <React.Fragment key={index}>
          <div className="m-8">
            <p>{post.message}</p>
            <i>~{post.author.name}</i>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};

export default async function Home() {
  return (
    <main>
      <Hero />

      <section>
        <Posts />
      </section>
    </main>
  );
}
