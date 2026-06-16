'use client';

import { Canvas, IText, FabricImage, Shadow } from 'fabric';
import { ChevronLeft, Download, Share2, Trash2, Type, X } from 'lucide-react';
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

const BACKGROUNDS = [
  { label: 'Dark',  color: '#111118' },
  { label: 'Paper', color: '#d4b896' },
  { label: 'White', color: '#f5f5f0' },
];

async function makePolaroidUrl(src: string, dateLabel: string): Promise<string> {
  return new Promise((resolve) => {
    const PAD = 14;
    const IMG = 200;
    const DATE_H = 44;
    const W = IMG + PAD * 2;
    const H = IMG + PAD + DATE_H;
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

export default function ScrapbookEditor() {
  const canvasEl = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
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
    if (!fc || adding) return;
    setAdding(src);
    try {
      const polaroidUrl = await makePolaroidUrl(src, parseDateLabel(src));
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
        <Link href="/" className="text-white/50 hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <span className="font-semibold text-sm mr-auto tracking-tight">Scrapbook</span>

        {/* Background colour dots */}
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

        <button
          onClick={addText}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-all text-xs"
        >
          <Type className="w-3.5 h-3.5" /> Text
        </button>
        <button
          onClick={deleteSelected}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-white/70 hover:text-red-400 hover:bg-white/10 transition-all text-xs"
        >
          <Trash2 className="w-3.5 h-3.5" /> Delete
        </button>
        <button
          onClick={clearAll}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-all text-xs"
        >
          <X className="w-3.5 h-3.5" /> Clear
        </button>

        <div className="w-px h-5 bg-white/10 mx-1" />

        <button
          onClick={download}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all"
        >
          <Download className="w-3.5 h-3.5" /> Save PNG
        </button>
        <button
          onClick={share}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white text-black text-xs font-semibold hover:bg-white/90 transition-all"
        >
          <Share2 className="w-3.5 h-3.5" /> Share
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Photo sidebar */}
        <div className="w-40 border-r border-white/10 flex flex-col flex-shrink-0">
          <p className="px-3 py-2 text-xs text-white/40 border-b border-white/10 flex-shrink-0">
            Click a photo to add
          </p>
          <div className="flex-1 overflow-y-auto p-1.5 grid grid-cols-2 gap-1">
            {slides.map((s) => (
              <button
                key={s.src}
                onClick={() => addPhoto(s.src)}
                disabled={!!adding}
                className={`aspect-square overflow-hidden rounded group relative ${adding === s.src ? 'opacity-40' : 'cursor-pointer'}`}
              >
                <img
                  src={s.src}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                  loading="lazy"
                  decoding="async"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-auto flex items-center justify-center bg-zinc-900 p-6">
          <div className="shadow-2xl ring-1 ring-white/10">
            <canvas ref={canvasEl} />
          </div>
        </div>
      </div>
    </div>
  );
}
