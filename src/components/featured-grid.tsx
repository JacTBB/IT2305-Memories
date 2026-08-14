'use client';

import { Play } from 'lucide-react';
import { useCallback, useState } from 'react';

import { Lightbox } from '@/components/ui/lightbox';
import type { Slide } from '@/lib/slides';
import { cn } from '@/lib/utils';

export interface Favorite {
  slide: Slide;
  total: number;
}

export function FeaturedGrid({ favorites }: { favorites: Favorite[] }) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const slidesOnly = favorites.map((f) => f.slide);

  const onPrev = useCallback(() => {
    setLightboxIdx((i) => (i === null ? null : (i - 1 + slidesOnly.length) % slidesOnly.length));
  }, [slidesOnly.length]);

  const onNext = useCallback(() => {
    setLightboxIdx((i) => (i === null ? null : (i + 1) % slidesOnly.length));
  }, [slidesOnly.length]);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 auto-rows-[130px] sm:auto-rows-[170px] gap-3 sm:gap-4">
        {favorites.map((f, i) => (
          <button
            key={f.slide.src}
            onClick={() => setLightboxIdx(i)}
            className={cn(
              'relative overflow-hidden rounded-2xl group cursor-zoom-in border border-white/10',
              i === 0 && 'col-span-2 row-span-2',
            )}
          >
            {f.slide.type === 'video' ? (
              <video
                src={f.slide.src}
                muted
                playsInline
                preload="metadata"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <img
                src={f.slide.src}
                alt=""
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                decoding="async"
              />
            )}
            {f.slide.type === 'video' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <Play className="w-6 h-6 text-white/90 fill-white/90" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            {f.total > 0 && (
              <div className="absolute bottom-2 right-2 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs font-medium flex items-center gap-1">
                🔥 {f.total}
              </div>
            )}
          </button>
        ))}
      </div>

      {lightboxIdx !== null && (
        <Lightbox
          slides={slidesOnly}
          index={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onPrev={onPrev}
          onNext={onNext}
        />
      )}
    </>
  );
}
