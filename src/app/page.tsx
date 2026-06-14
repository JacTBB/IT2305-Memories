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
    .then((results) =>
      results.map((row) => ({ ...row.post, author: row.user }))
    );

  if (PostsData.length === 0) {
    return (
      <p className="text-center text-neutral-500 text-sm py-16">
        No memories yet. Be the first to share one.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto px-6 py-12">
      {PostsData.map((post: any, index) => (
        <div
          key={index}
          className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 flex flex-col gap-4 hover:border-purple-500/40 hover:bg-white/8 transition-all duration-300"
        >
          <span className="text-4xl text-purple-400/30 font-serif leading-none select-none">&ldquo;</span>
          <p className="text-sm text-neutral-200 leading-relaxed whitespace-pre-wrap flex-1 -mt-4">
            {post.message}
          </p>
          <p className="text-xs text-purple-300/70 font-medium tracking-wide">
            &mdash; {post.author?.name ?? 'Anonymous'}
          </p>
        </div>
      ))}
    </div>
  );
};

export default async function Home() {
  return (
    <main className="bg-black min-h-screen">
      <Hero />

      <section className="py-16">
        <h2 className="text-center text-2xl font-semibold tracking-tight text-white mb-2">
          Memories
        </h2>
        <p className="text-center text-sm text-neutral-500 mb-8">
          Words from the Skibidi Class
        </p>
        <Posts />
      </section>

      <footer className="w-full border-t border-white/10 text-center text-neutral-500 text-xs py-4 flex items-center justify-center gap-3">
        <span>&copy; IT2305 Nanyang Polytechnic 2025</span>
        <span className="text-neutral-700">|</span>
        <Link href="/login" className="hover:text-white transition-colors">
          Login
        </Link>
      </footer>
    </main>
  );
}
