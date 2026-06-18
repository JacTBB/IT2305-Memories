'use client';

import { ChevronLeft, Frame, Grid3x3 } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { Reactions } from '@/components/reactions';
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

function polaroidTransform(src: string): string {
  let r = 0, o = 5381;
  for (let i = 0; i < src.length; i++) {
    r = (r * 31 + src.charCodeAt(i)) | 0;
    o = (o * 33 ^ src.charCodeAt(i)) | 0;
  }
  const rot = (Math.abs(r) % 13) - 6;      // -6 to +6 deg
  const yOff = (Math.abs(o) % 18) - 9;     // -9 to +8 px
  return `rotate(${rot}deg) translateY(${yOff}px)`;
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
  const [allCounts, setAllCounts] = useState<Record<string, Record<string, number>> | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'polaroid'>('polaroid');
  const [hoveredPolaroid, setHoveredPolaroid] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/reactions/all')
      .then((r) => r.json())
      .then((data) => setAllCounts(data))
      .catch(() => setAllCounts({}));
  }, []);

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
        <div className="flex-1">
          <h1 className="text-lg font-semibold tracking-tight">Timeline</h1>
          <p className="text-xs text-white/40">{datedSlides.length} photos across {sortedDates.length} days</p>
        </div>
        <div className="flex gap-1 bg-white/5 rounded-lg p-1">
          <button
            onClick={() => setViewMode('polaroid')}
            title="Scrapbook view"
            className={`p-1.5 rounded-md transition-all ${viewMode === 'polaroid' ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white/70'}`}
          >
            <Frame className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            title="Grid view"
            className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white/70'}`}
          >
            <Grid3x3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Polaroid / scrapbook view */}
      {viewMode === 'polaroid' && (
        <div className="max-w-6xl mx-auto px-8 py-16">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8 sm:gap-12">
            {allDatedSrcs.map((src, idx) => {
              const dateKey = parseDateKey(src);
              const isHovered = hoveredPolaroid === idx;
              return (
                <div
                  key={src}
                  className="cursor-pointer"
                  style={{
                    transform: polaroidTransform(src),
                    zIndex: isHovered ? 20 : 1,
                    position: 'relative',
                    transition: 'z-index 0s',
                  }}
                  onMouseEnter={() => setHoveredPolaroid(idx)}
                  onMouseLeave={() => setHoveredPolaroid(null)}
                  onClick={() => setLightboxIdx(idx)}
                >
                  <div
                    className="bg-white transition-all duration-200"
                    style={{
                      padding: '10px 10px 40px 10px',
                      boxShadow: isHovered
                        ? '6px 8px 32px rgba(0,0,0,0.8), 0 2px 6px rgba(0,0,0,0.4)'
                        : '3px 4px 18px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.3)',
                      transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                    }}
                  >
                    <img
                      src={src}
                      alt=""
                      className="w-full aspect-square object-cover block"
                      loading="lazy"
                      decoding="async"
                    />
                    <p className="text-center text-gray-400 text-xs mt-2 font-mono leading-none tracking-tight">
                      {dateKey ? formatDateKey(dateKey) : ''}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Grid / timeline view */}
      {viewMode === 'grid' && (
        <div className="max-w-4xl mx-auto px-6 py-10 space-y-14">
          {sortedDates.map((dateKey) => {
            const srcs = grouped[dateKey];
            const startIdx = globalIdx;
            globalIdx += srcs.length;

            return (
              <section key={dateKey}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-px flex-1 bg-white/10" />
                  <h2 className="text-sm font-medium text-white/60 whitespace-nowrap">
                    {formatDateKey(dateKey)}
                  </h2>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {srcs.map((src, i) => {
                    const idx = startIdx + i;
                    const photoId = decodeURIComponent(src.split('/').pop() ?? '');
                    return (
                      <div key={src} className="flex flex-col gap-1">
                        <button
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
                        {allCounts !== null && (
                          <Reactions
                            photoId={photoId}
                            compact
                            initialCounts={allCounts[photoId] ?? {}}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

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
