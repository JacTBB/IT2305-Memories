import { count, desc, eq } from 'drizzle-orm';
import Link from 'next/link';
import React from 'react';

import { FeaturedMoments } from '@/components/featured-moments';
import { Hero } from '@/components/hero';
import { slides } from '@/lib/slides';
import { db, posts, reactions, users } from '@/schema';

function parseDateKey(src: string): string | null {
  const filename = decodeURIComponent(src.split('/').pop() ?? '');
  const match = filename.match(/^(\d{2})-(\d{2})-(\d{2})/);
  if (!match) return null;
  return `20${match[1]}-${match[2]}-${match[3]}`;
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="text-2xl font-semibold text-white tabular-nums">{value.toLocaleString()}</p>
      <p className="text-xs text-neutral-500 uppercase tracking-wide mt-1">{label}</p>
    </div>
  );
}

const StatsStrip = async () => {
  const photoCount = slides.length;
  const dayCount = new Set(slides.map((s) => parseDateKey(s.src)).filter(Boolean)).size;
  const locationCount = new Set(slides.filter((s) => s.location).map((s) => s.location)).size;
  const [{ total: reactionTotal }] = await db.select({ total: count() }).from(reactions);

  return (
    <section className="border-y border-white/10 bg-white/[0.02]">
      <div className="max-w-4xl mx-auto px-6 py-6 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
        <Stat value={photoCount} label="Memories" />
        <Stat value={dayCount} label="Days" />
        <Stat value={locationCount} label="Places" />
        <Stat value={Number(reactionTotal)} label="Reactions" />
      </div>
    </section>
  );
};

const Posts = async () => {
  const PostsData = await db
    .select()
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .orderBy(desc(posts.star), desc(posts.createdTimestamp))
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

      <StatsStrip />

      <FeaturedMoments />

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
