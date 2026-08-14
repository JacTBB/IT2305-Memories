import { count, desc } from 'drizzle-orm';

import { FeaturedGrid, type Favorite } from '@/components/featured-grid';
import { slides } from '@/lib/slides';
import { db, reactions } from '@/schema';

const TARGET_COUNT = 8;

export async function FeaturedMoments() {
  const rows = await db
    .select({ photoId: reactions.photoId, total: count() })
    .from(reactions)
    .groupBy(reactions.photoId)
    .orderBy(desc(count()))
    .limit(TARGET_COUNT);

  const bySrc = new Map(
    slides.map((s) => [decodeURIComponent(s.src.split('/').pop() ?? ''), s] as const),
  );

  const seen = new Set<string>();
  const favorites: Favorite[] = [];

  for (const row of rows) {
    const slide = bySrc.get(row.photoId);
    if (!slide) continue;
    favorites.push({ slide, total: Number(row.total) });
    seen.add(slide.src);
  }

  // Pad out to a full grid with an evenly-spaced sample when reactions are
  // sparse, so the section always reads as curated rather than empty.
  if (favorites.length < TARGET_COUNT) {
    const pool = slides.filter((s) => !seen.has(s.src));
    const need = TARGET_COUNT - favorites.length;
    const step = Math.max(1, Math.floor(pool.length / Math.max(need, 1)));
    for (let i = 0; i < pool.length && favorites.length < TARGET_COUNT; i += step) {
      favorites.push({ slide: pool[i], total: 0 });
      seen.add(pool[i].src);
    }
  }

  if (favorites.length === 0) return null;

  return (
    <section className="py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-center text-2xl font-semibold tracking-tight text-white mb-2">
          Highlights
        </h2>
        <p className="text-center text-sm text-neutral-500 mb-8">
          The moments the class reacted to most
        </p>
        <FeaturedGrid favorites={favorites} />
      </div>
    </section>
  );
}
