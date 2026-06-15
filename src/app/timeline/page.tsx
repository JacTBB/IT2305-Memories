'use client';

import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useState } from 'react';

import { Lightbox } from '@/components/ui/lightbox';
import { slides } from '@/lib/slides';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function parseDateKey(src: string): string | null {
  const filename = decodeURIComponent(src.split('/').pop() ?? '');
  const match = filename.match(/^(\d{2})-(\d{2})-(\d{2})/);
  if (!match) return null;
  return `20${match[1]}-${match[2]}-${match[3]}`;
}

function formatDateKey(key: string): string {
  const [year, month, day] = key.split('-');
  return `${parseInt(day)} ${MONTHS[parseInt(month) - 1]} ${year}`;
}

// Build ordered groups: only dated photos, sorted by date then by original order
const datedSlides = slides.filter((s) => parseDateKey(s.src) !== null);

const grouped: Record<string, string[]> = {};
for (const slide of datedSlides) {
  const key = parseDateKey(slide.src)!;
  if (!grouped[key]) grouped[key] = [];
  grouped[key].push(slide.src);
}
const sortedDates = Object.keys(grouped).sort();
const allDatedSrcs = sortedDates.flatMap((d) => grouped[d]);

export default function TimelinePage() {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const onPrev = useCallback(() => {
    setLightboxIdx((i) => i === null ? null : (i - 1 + allDatedSrcs.length) % allDatedSrcs.length);
  }, []);

  const onNext = useCallback(() => {
    setLightboxIdx((i) => i === null ? null : (i + 1) % allDatedSrcs.length);
  }, []);

  let globalIdx = 0;

  return (
    <main className="bg-black min-h-screen text-white">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-black/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center gap-4">
        <Link href="/" className="text-white/60 hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Timeline</h1>
          <p className="text-xs text-white/40">{datedSlides.length} photos across {sortedDates.length} days</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-14">
        {sortedDates.map((dateKey) => {
          const srcs = grouped[dateKey];
          const startIdx = globalIdx;
          globalIdx += srcs.length;

          return (
            <section key={dateKey}>
              {/* Date header */}
              <div className="flex items-center gap-4 mb-4">
                <div className="h-px flex-1 bg-white/10" />
                <h2 className="text-sm font-medium text-white/60 whitespace-nowrap">
                  {formatDateKey(dateKey)}
                </h2>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              {/* Photo grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {srcs.map((src, i) => {
                  const idx = startIdx + i;
                  return (
                    <button
                      key={src}
                      onClick={() => setLightboxIdx(idx)}
                      className="aspect-square overflow-hidden rounded-lg cursor-zoom-in group relative"
                    >
                      <img
                        src={src}
                        alt=""
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {lightboxIdx !== null && (
        <Lightbox
          srcs={allDatedSrcs}
          index={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onPrev={onPrev}
          onNext={onNext}
        />
      )}
    </main>
  );
}
