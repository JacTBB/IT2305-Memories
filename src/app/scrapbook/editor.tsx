'use client';

import { Canvas, FabricImage, IText, Shadow } from 'fabric';
import { ChevronLeft, Check, Download, Share2, Trash2, Type, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { slides } from '@/lib/slides';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function parseDateLabel(src: string): string {
  const filename = decodeURIComponent(src.split('/').pop() ?? '');
  const match = filename.match(/^(\d{2})-(\d{2})-(\d{2})/);
  if (!match) return '';
  return `${parseInt(match[3])} ${MONTHS[parseInt(match[2]) - 1].slice(0, 3)} 20${match[1]}`;
}

const CANVAS_W = 900;
const CANVAS_H = 620;
const MAX_PICKS = 15;

const BACKGROUNDS = [
  { label: 'Dark',  color: '#111118' },
  { label: 'Paper', color: '#d4b896' },
  { label: 'White', color: '#f5f5f0' },
];

async function makePolaroidUrl(src: string, dateLabel: string): Promise<string> {
  return new Promise((resolve) => {
    const PAD = 14, IMG = 200, DATE_H = 44;
    const W = IMG + PAD * 2, H = IMG + PAD + DATE_H;
    const SCALE = 2;
    const offscreen = document.createElement('canvas');
    offscreen.width = W * SCALE;
    offscreen.height = H * SCALE;
    const ctx = offscreen.getContext('2d')!;
    ctx.scale(SCALE, SCALE);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    const stamp = () => {
      ctx.fillStyle = '#aaaaaa';
      ctx.font = '12px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(dateLabel, W / 2, IMG + PAD + DATE_H / 2 + 5);
      resolve(offscreen.toDataURL('image/png'));
    };

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { ctx.drawImage(img, PAD, PAD, IMG, IMG); stamp(); };
    img.onerror = () => {
      ctx.fillStyle = '#e0e0e0';
      ctx.fillRect(PAD, PAD, IMG, IMG);
      stamp();
    };
    img.src = src;
  });
}

const PAGE_SIZE = 24;

// ─── Step 1: Photo Picker ────────────────────────────────────────────────────

function PhotoPicker({
  selected,
  onToggle,
  onStart,
}: {
  selected: Set<string>;
  onToggle: (src: string) => void;
  onStart: () => void;
}) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(slides.length / PAGE_SIZE);
  const pageSlides = slides.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/10 flex-shrink-0">
        <Link href="/" className="text-white/50 hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="font-semibold tracking-tight">Create a Scrapbook</h1>
          <p className="text-xs text-white/40 mt-0.5">Pick up to {MAX_PICKS} photos, then arrange them your way</p>
        </div>
        {selected.size > 0 && (
          <span className="text-xs text-white/50">{selected.size} / {MAX_PICKS} selected</span>
        )}
      </div>

      {/* Grid — current page only */}
      <div className="flex-1 p-4 overflow-hidden">
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-w-6xl mx-auto">
          {pageSlides.map((s) => {
            const isSel = selected.has(s.src);
            const atMax = selected.size >= MAX_PICKS;
            return (
              <button
                key={s.src}
                onClick={() => onToggle(s.src)}
                disabled={atMax && !isSel}
                className={`aspect-square overflow-hidden rounded-lg relative group transition-all ${
                  isSel
                    ? 'ring-2 ring-white scale-95'
                    : atMax
                      ? 'opacity-30 cursor-not-allowed'
                      : 'hover:ring-2 hover:ring-white/50 hover:scale-95'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.src}
                  alt=""
                  crossOrigin="anonymous"
                  className="w-full h-full object-cover"
                  decoding="async"
                />
                {isSel && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-black" />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 px-6 py-3 flex items-center gap-4 flex-shrink-0 bg-black/80 backdrop-blur-sm">
        {/* Pagination */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 0}
            className="px-3 py-1.5 rounded-md text-sm bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            ← Prev
          </button>
          <span className="text-xs text-white/40 w-20 text-center">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 rounded-md text-sm bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Next →
          </button>
        </div>

        <span className="text-sm text-white/40 flex-1">
          {selected.size === 0
            ? 'Select photos to get started'
            : `${selected.size} photo${selected.size > 1 ? 's' : ''} selected`}
        </span>

        <button
          onClick={onStart}
          disabled={selected.size === 0}
          className="px-5 py-2 rounded-full bg-white text-black text-sm font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/90 transition-all"
        >
          Open in Scrapbook →
        </button>
      </div>
    </div>
  );
}

// ─── Step 2: Canvas Editor ───────────────────────────────────────────────────

function CanvasEditor({
  srcs,
  onBack,
}: {
  srcs: string[];
  onBack: () => void;
}) {
  const canvasEl = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const polaroidCache = useRef<Map<string, string>>(new Map());
  const [bgColor, setBgColor] = useState(BACKGROUNDS[0].color);
  const [adding, setAdding] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasEl.current) return;
    const fc = new Canvas(canvasEl.current, {
      width: CANVAS_W,
      height: CANVAS_H,
      backgroundColor: BACKGROUNDS[0].color,
    });
    fabricRef.current = fc;
    return () => { fc.dispose(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setBackground = (color: string) => {
    setBgColor(color);
    const fc = fabricRef.current;
    if (!fc) return;
    fc.set('backgroundColor', color);
    fc.renderAll();
  };

  const addPhoto = async (src: string) => {
    const fc = fabricRef.current;
    if (!fc || adding === src) return;
    setAdding(src);
    try {
      let polaroidUrl = polaroidCache.current.get(src);
      if (!polaroidUrl) {
        polaroidUrl = await makePolaroidUrl(src, parseDateLabel(src));
        polaroidCache.current.set(src, polaroidUrl);
      }
      const img = await FabricImage.fromURL(polaroidUrl);
      img.scale(0.5);
      img.set({
        left: 80 + Math.random() * (CANVAS_W - 280),
        top: 60 + Math.random() * (CANVAS_H - 220),
        angle: Math.random() * 18 - 9,
        shadow: new Shadow({ blur: 18, color: 'rgba(0,0,0,0.45)', offsetX: 3, offsetY: 4 }),
      });
      fc.add(img);
      fc.setActiveObject(img);
      fc.renderAll();
    } finally {
      setAdding(null);
    }
  };

  const addText = () => {
    const fc = fabricRef.current;
    if (!fc) return;
    const text = new IText('Your text here', {
      left: CANVAS_W / 2 - 80,
      top: CANVAS_H / 2 - 20,
      fontSize: 28,
      fontFamily: 'Georgia, serif',
      fill: '#ffffff',
      fontStyle: 'italic',
    });
    fc.add(text);
    fc.setActiveObject(text);
    fc.renderAll();
  };

  const deleteSelected = () => {
    const fc = fabricRef.current;
    if (!fc) return;
    const active = fc.getActiveObject();
    if (active) { fc.remove(active); fc.renderAll(); }
  };

  const clearAll = () => {
    const fc = fabricRef.current;
    if (!fc) return;
    fc.clear();
    fc.set('backgroundColor', bgColor);
    fc.renderAll();
  };

  const download = () => {
    const fc = fabricRef.current;
    if (!fc) return;
    const dataUrl = fc.toDataURL({ format: 'png', multiplier: 2 });
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'it2305-scrapbook.png';
    a.click();
  };

  const share = async () => {
    const fc = fabricRef.current;
    if (!fc) return;
    const dataUrl = fc.toDataURL({ format: 'png', multiplier: 2 });
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'it2305-memories.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'IT2305 Memories', text: 'Class memories ❤️' });
        return;
      }
    } catch {}
    download();
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white overflow-hidden">
      {/* Top toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10 flex-shrink-0">
        <button onClick={onBack} className="text-white/50 hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-semibold text-sm mr-auto tracking-tight">Scrapbook</span>

        <div className="flex gap-1.5 items-center">
          {BACKGROUNDS.map((bg) => (
            <button
              key={bg.color}
              title={bg.label}
              onClick={() => setBackground(bg.color)}
              className={`w-5 h-5 rounded-full border-2 transition-all ${bgColor === bg.color ? 'border-white scale-110' : 'border-white/30 hover:border-white/60'}`}
              style={{ background: bg.color }}
            />
          ))}
        </div>

        <div className="w-px h-5 bg-white/10 mx-1" />

        <button onClick={addText} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-all text-xs">
          <Type className="w-3.5 h-3.5" /> Text
        </button>
        <button onClick={deleteSelected} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-white/70 hover:text-red-400 hover:bg-white/10 transition-all text-xs">
          <Trash2 className="w-3.5 h-3.5" /> Delete
        </button>
        <button onClick={clearAll} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-all text-xs">
          <X className="w-3.5 h-3.5" /> Clear
        </button>

        <div className="w-px h-5 bg-white/10 mx-1" />

        <button onClick={download} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all">
          <Download className="w-3.5 h-3.5" /> Save PNG
        </button>
        <button onClick={share} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white text-black text-xs font-semibold hover:bg-white/90 transition-all">
          <Share2 className="w-3.5 h-3.5" /> Share
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Photo sidebar — only the chosen photos */}
        <div className="w-40 border-r border-white/10 flex flex-col flex-shrink-0">
          <p className="px-3 py-2 text-xs text-white/40 border-b border-white/10 flex-shrink-0">
            Click to add to canvas
          </p>
          <div className="flex-1 overflow-y-auto p-1.5 grid grid-cols-2 gap-1 content-start">
            {srcs.map((src) => (
              <button
                key={src}
                onClick={() => addPhoto(src)}
                disabled={adding === src}
                className={`aspect-square overflow-hidden rounded group relative cursor-pointer ${adding === src ? 'opacity-40' : ''}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt=""
                  crossOrigin="anonymous"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                />
                {adding === src && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs text-white">
                    Adding…
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div
          className="flex-1 overflow-auto flex items-center justify-center p-6"
          style={{ background: 'repeating-linear-gradient(45deg,#1c1c1c 0px,#1c1c1c 10px,#222 10px,#222 20px)' }}
        >
          <div className="shadow-[0_0_0_2px_rgba(255,255,255,0.25),0_8px_40px_rgba(0,0,0,0.8)]">
            <canvas ref={canvasEl} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Root ────────────────────────────────────────────────────────────────────

export default function ScrapbookEditor() {
  const [view, setView] = useState<'picking' | 'editing'>('picking');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSelect = (src: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(src)) {
        next.delete(src);
      } else if (next.size < MAX_PICKS) {
        next.add(src);
      }
      return next;
    });
  };

  if (view === 'picking') {
    return (
      <PhotoPicker
        selected={selected}
        onToggle={toggleSelect}
        onStart={() => setView('editing')}
      />
    );
  }

  return (
    <CanvasEditor
      srcs={[...selected]}
      onBack={() => setView('picking')}
    />
  );
}
