'use client';

import { ChevronLeft, ChevronRight, Shuffle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface SlideData {
  title: string;
  button: string;
  src: string;
}

export function Carousel({ slides }: { slides: SlideData[] }) {
  const [order, setOrder] = useState(() => slides.map((_, i) => i));
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  const goTo = useCallback((idx: number) => {
    setCurrent(idx);
    setAnimKey((k) => k + 1);
  }, []);

  const goNext = useCallback(() => {
    goTo((current + 1) % order.length);
  }, [current, order.length, goTo]);

  const goPrev = useCallback(() => {
    goTo((current - 1 + order.length) % order.length);
  }, [current, order.length, goTo]);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(goNext, 5000);
    return () => clearInterval(id);
  }, [paused, goNext]);

  const shuffle = () => {
    setOrder([...slides.map((_, i) => i)].sort(() => Math.random() - 0.5));
    goTo(0);
  };

  const prevI = (current - 1 + order.length) % order.length;
  const nextI = (current + 1) % order.length;
  const visible = new Set([prevI, current, nextI]);

  return (
    <div
      className="relative w-[76vmin] h-[64vmin] rounded-2xl overflow-hidden shadow-2xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides — only prev/current/next are in the DOM */}
      {order.map((slideIdx, i) => {
        if (!visible.has(i)) return null;
        const isActive = i === current;
        return (
          <div
            key={i}
            className="absolute inset-0"
            style={{
              opacity: isActive ? 1 : 0,
              transition: 'opacity 1.2s ease-in-out',
              zIndex: isActive ? 1 : 0,
            }}
          >
            <img
              key={isActive ? animKey : i}
              src={slides[slideIdx].src}
              alt=""
              className="w-full h-full object-cover ken-burns"
              loading="lazy"
              decoding="async"
            />
          </div>
        );
      })}

      {/* Bottom gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent z-10 pointer-events-none" />

      {/* Progress bar */}
      <div className="absolute top-0 inset-x-0 h-0.5 bg-white/10 z-20">
        <div
          className="h-full bg-white/50"
          style={{
            width: `${((current + 1) / order.length) * 100}%`,
            transition: 'width 0.4s ease',
          }}
        />
      </div>

      {/* Counter */}
      <div className="absolute top-3 right-4 z-20 text-white/50 text-xs font-mono tracking-wide select-none">
        {current + 1} / {order.length}
      </div>

      {/* Left arrow */}
      <button
        onClick={goPrev}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/60 text-white rounded-full p-2 transition-all hover:scale-110"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Right arrow */}
      <button
        onClick={goNext}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/60 text-white rounded-full p-2 transition-all hover:scale-110"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Shuffle */}
      <button
        onClick={shuffle}
        title="Shuffle photos"
        className="absolute bottom-4 right-4 z-20 bg-black/30 hover:bg-black/60 text-white/60 hover:text-white rounded-full p-1.5 transition-all"
      >
        <Shuffle className="w-3.5 h-3.5" />
      </button>

      {/* Paused indicator */}
      {paused && (
        <div className="absolute bottom-4 left-4 z-20 text-white/40 text-xs select-none">
          Paused
        </div>
      )}
    </div>
  );
}
