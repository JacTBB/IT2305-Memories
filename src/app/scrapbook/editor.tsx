/* eslint-disable max-lines, quotes */
'use client';

import { Canvas, FabricImage, IText, Shadow } from 'fabric';
import { BookMarked, Check, ChevronLeft, Download, Save, Share2, Trash2, Type, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import { saveScrapbook, updateScrapbook } from '@/lib/scrapbooks/actions';
import { slides } from '@/lib/slides';

// ─── Types ────────────────────────────────────────────────────────────────────

type PolaroidMeta = {
  type: 'polaroid';
  src: string;
  label: string;
  font: string;
  cardColor: string;
};

type ScrapbookObjectSaved =
  | { kind: 'polaroid'; src: string; label: string; font: string; cardColor: string; left: number; top: number; scaleX: number; scaleY: number; angle: number }
  | { kind: 'sticker'; src: string; left: number; top: number; scaleX: number; scaleY: number; angle: number }
  | { kind: 'text'; text: string; fill: string; fontFamily: string; fontSize: number; fontStyle?: string; fontWeight?: string; left: number; top: number; angle: number };

type ScrapbookData = {
  bgColor: string;
  objects: ScrapbookObjectSaved[];
};

// ─── Constants ────────────────────────────────────────────────────────────────

const CANVAS_W = 900;
const CANVAS_H = 620;
const MAX_PICKS = 15;
const PAGE_SIZE = 24;

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

const FONTS = [
  { label: 'Typewriter', value: '"Courier New", monospace' },
  { label: 'Classic',    value: 'Georgia, serif' },
  { label: 'Modern',     value: 'system-ui, sans-serif' },
  { label: 'Playful',    value: '"Comic Sans MS", cursive' },
  { label: 'Bold',       value: '"Arial Black", sans-serif' },
  { label: 'Elegant',    value: '"Palatino Linotype", serif' },
];

const BG_PRESETS = [
  { label: 'Blush',  color: '#fce4ec' },
  { label: 'Sky',    color: '#dbeafe' },
  { label: 'Mint',   color: '#dcfce7' },
  { label: 'Lemon',  color: '#fef9c3' },
  { label: 'Paper',  color: '#d4b896' },
  { label: 'Lilac',  color: '#e9d5ff' },
  { label: 'Coral',  color: '#fed7aa' },
  { label: 'Teal',   color: '#99f6e4' },
  { label: 'Navy',   color: '#1e3a5f' },
  { label: 'Forest', color: '#14532d' },
  { label: 'Plum',   color: '#4a044e' },
  { label: 'Dark',   color: '#111118' },
];

const CARD_PRESETS = [
  '#ffffff', '#f5f0e8', '#fff0f0', '#f0f0ff',
  '#f0fff0', '#fffde7', '#fce4ec', '#e3f2fd',
];

const FRIEND_STICKERS = [
  { id: 'camera-blue',  label: 'Camera',       src: '/stickers/camera_blue.svg',  scale: 0.10 },
  { id: 'camera-pink',  label: 'Camera Pink',  src: '/stickers/camera_pink.svg',  scale: 0.10 },
  { id: 'cloud',        label: 'Cloud',        src: '/stickers/cloud.svg',        scale: 0.10 },
  { id: 'dog',          label: 'Dog',          src: '/stickers/dog.svg',          scale: 0.10 },
  { id: 'flower-stamp', label: 'Flower',       src: '/stickers/flower_stamp.svg', scale: 0.15 },
  { id: 'memories',     label: 'Memories',     src: '/stickers/memories.svg',     scale: 0.15 },
];

const svgToUrl = (s: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(s)}`;

const SHAPE_STICKERS: { id: string; label: string; svg: string; scale: number }[] = [
  {
    id: 'heart', label: 'Heart', scale: 1.2,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="90" viewBox="0 0 100 90"><path d="M50,80 C25,60 5,45 5,28 C5,14 18,4 32,4 C40,4 47,8 50,14 C53,8 60,4 68,4 C82,4 95,14 95,28 C95,45 75,60 50,80Z" fill="#ff6b9d"/></svg>`,
  },
  {
    id: 'star', label: 'Star', scale: 1.0,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="95" viewBox="0 0 100 95"><polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35" fill="#fbbf24"/></svg>`,
  },
  {
    id: 'bow', label: 'Bow', scale: 1.0,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80"><path d="M60,40 C55,28 28,8 8,18 C-2,24 2,40 16,44 C32,50 57,44 60,40Z" fill="#ff6b9d"/><path d="M60,40 C65,28 92,8 112,18 C122,24 118,40 104,44 C88,50 63,44 60,40Z" fill="#ff6b9d"/><circle cx="60" cy="40" r="11" fill="#cc3377"/><path d="M55,50 C50,60 46,70 44,78" stroke="#ff6b9d" stroke-width="4.5" fill="none" stroke-linecap="round"/><path d="M65,50 C70,60 74,70 76,78" stroke="#ff6b9d" stroke-width="4.5" fill="none" stroke-linecap="round"/></svg>`,
  },
  {
    id: 'rainbow', label: 'Rainbow', scale: 1.2,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="72" viewBox="0 0 120 72"><path d="M8,70 Q60,-18 112,70" stroke="#ff4444" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M16,70 Q60,-6 104,70" stroke="#ff8c00" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M24,70 Q60,6 96,70" stroke="#ffd700" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M32,70 Q60,18 88,70" stroke="#44cc44" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M40,70 Q60,30 80,70" stroke="#4488ff" stroke-width="9" fill="none" stroke-linecap="round"/></svg>`,
  },
  {
    id: 'sun', label: 'Sun', scale: 1.0,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="20" fill="#fbbf24"/><line x1="50" y1="8" x2="50" y2="22" stroke="#fbbf24" stroke-width="6" stroke-linecap="round"/><line x1="50" y1="78" x2="50" y2="92" stroke="#fbbf24" stroke-width="6" stroke-linecap="round"/><line x1="8" y1="50" x2="22" y2="50" stroke="#fbbf24" stroke-width="6" stroke-linecap="round"/><line x1="78" y1="50" x2="92" y2="50" stroke="#fbbf24" stroke-width="6" stroke-linecap="round"/><line x1="22" y1="22" x2="31" y2="31" stroke="#fbbf24" stroke-width="6" stroke-linecap="round"/><line x1="69" y1="69" x2="78" y2="78" stroke="#fbbf24" stroke-width="6" stroke-linecap="round"/><line x1="78" y1="22" x2="69" y2="31" stroke="#fbbf24" stroke-width="6" stroke-linecap="round"/><line x1="31" y1="69" x2="22" y2="78" stroke="#fbbf24" stroke-width="6" stroke-linecap="round"/></svg>`,
  },
  {
    id: 'arrow', label: 'Arrow', scale: 1.2,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="110" height="80" viewBox="0 0 110 80"><path d="M10,62 Q38,14 84,28" stroke="#ff6b9d" stroke-width="6" fill="none" stroke-linecap="round"/><polygon points="88,16 106,36 72,40" fill="#ff6b9d"/></svg>`,
  },
];

const TAPE_STICKERS: { id: string; label: string; svg: string; scale: number }[] = [
  {
    id: 'washi-mint', label: 'Mint tape', scale: 1.5,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="40" viewBox="0 0 200 40"><rect width="200" height="40" fill="#a5f3fc" opacity="0.88"/><circle cx="20" cy="20" r="7" fill="white" opacity="0.65"/><circle cx="52" cy="20" r="7" fill="white" opacity="0.65"/><circle cx="84" cy="20" r="7" fill="white" opacity="0.65"/><circle cx="116" cy="20" r="7" fill="white" opacity="0.65"/><circle cx="148" cy="20" r="7" fill="white" opacity="0.65"/><circle cx="180" cy="20" r="7" fill="white" opacity="0.65"/></svg>`,
  },
  {
    id: 'washi-pink', label: 'Pink tape', scale: 1.5,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="40" viewBox="0 0 200 40"><rect width="200" height="40" fill="#fda4af" opacity="0.88"/><line x1="0" y1="13" x2="200" y2="13" stroke="white" stroke-width="2" opacity="0.55"/><line x1="0" y1="27" x2="200" y2="27" stroke="white" stroke-width="2" opacity="0.55"/></svg>`,
  },
  {
    id: 'washi-yellow', label: 'Yellow tape', scale: 1.5,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="40" viewBox="0 0 200 40"><rect width="200" height="40" fill="#fde68a" opacity="0.88"/><circle cx="20" cy="20" r="5" fill="white" opacity="0.6"/><circle cx="48" cy="20" r="5" fill="white" opacity="0.6"/><circle cx="76" cy="20" r="5" fill="white" opacity="0.6"/><circle cx="104" cy="20" r="5" fill="white" opacity="0.6"/><circle cx="132" cy="20" r="5" fill="white" opacity="0.6"/><circle cx="160" cy="20" r="5" fill="white" opacity="0.6"/><circle cx="188" cy="20" r="5" fill="white" opacity="0.6"/></svg>`,
  },
];

const TEXT_STICKERS: {
  id: string; text: string; fill: string;
  fontFamily: string; fontSize: number;
  fontStyle?: 'italic'; fontWeight?: string;
}[] = [
  { id: 'memories-txt', text: 'MEMORIES',     fill: '#cc3366', fontFamily: '"Courier New", monospace', fontSize: 28, fontWeight: 'bold' },
  { id: 'xoxo',         text: 'xoxo',         fill: '#ff6b9d', fontFamily: 'Georgia, serif',            fontSize: 36, fontStyle: 'italic' },
  { id: 'besties',      text: 'besties ♡',    fill: '#ff8c00', fontFamily: 'Georgia, serif',            fontSize: 26, fontStyle: 'italic' },
  { id: 'forever',      text: 'forever',      fill: '#9b59b6', fontFamily: '"Palatino Linotype", serif', fontSize: 30, fontStyle: 'italic' },
  { id: 'it2305',       text: 'IT2305',       fill: '#6b9eff', fontFamily: '"Arial Black", sans-serif',  fontSize: 30, fontWeight: 'bold' },
  { id: 'classof',      text: "class of '26", fill: '#27ae60', fontFamily: 'Georgia, serif',            fontSize: 22, fontStyle: 'italic' },
];

const EMOJI_STICKERS = [
  '❤️', '🌟', '✨', '🎉', '🎊', '🥳', '😍', '🤩',
  '💫', '🌈', '🦋', '🌸', '🌺', '🍀', '☀️', '🌙',
  '🎵', '🎶', '📸', '💌', '🎁', '🏆', '👑', '💎',
  '🔥', '💯', '🌊', '🍭', '🎈', '🎀', '🌻', '🦄',
];

// ─── Polaroid render ──────────────────────────────────────────────────────────

async function makePolaroidUrl(
  src: string, label: string, font: string, cardColor: string,
): Promise<string> {
  return new Promise((resolve) => {
    const PAD = 14, IMG = 200, DATE_H = 44;
    const W = IMG + PAD * 2, H = IMG + PAD + DATE_H;
    const SCALE = 2;
    const offscreen = document.createElement('canvas');
    offscreen.width = W * SCALE;
    offscreen.height = H * SCALE;
    const ctx = offscreen.getContext('2d')!;
    ctx.scale(SCALE, SCALE);
    ctx.fillStyle = cardColor;
    ctx.fillRect(0, 0, W, H);
    const stamp = () => {
      ctx.fillStyle = '#666666';
      ctx.font = `13px ${font}`;
      ctx.textAlign = 'center';
      ctx.fillText(label, W / 2, IMG + PAD + DATE_H / 2 + 5);
      resolve(offscreen.toDataURL('image/png'));
    };
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { ctx.drawImage(img, PAD, PAD, IMG, IMG); stamp(); };
    img.onerror = () => { ctx.fillStyle = '#e0e0e0'; ctx.fillRect(PAD, PAD, IMG, IMG); stamp(); };
    img.src = src;
  });
}

// ─── Canvas serialize / deserialize ──────────────────────────────────────────

function serializeCanvas(fc: Canvas, bgColor: string): string {
  const objects: ScrapbookObjectSaved[] = [];
  for (const obj of fc.getObjects()) {
    const base = {
      left: obj.left ?? 0,
      top: obj.top ?? 0,
      scaleX: obj.scaleX ?? 1,
      scaleY: obj.scaleY ?? 1,
      angle: obj.angle ?? 0,
    };
    if (obj instanceof FabricImage) {
      const meta = (obj as FabricImage & { data?: PolaroidMeta }).data;
      if (meta?.type === 'polaroid') {
        objects.push({ kind: 'polaroid', ...base, src: meta.src, label: meta.label, font: meta.font, cardColor: meta.cardColor });
      } else {
        objects.push({ kind: 'sticker', ...base, src: (obj as FabricImage).getSrc() });
      }
    } else if (obj instanceof IText) {
      objects.push({
        kind: 'text', ...base,
        text: obj.text ?? '',
        fontSize: obj.fontSize ?? 24,
        fill: typeof obj.fill === 'string' ? obj.fill : '#ffffff',
        fontFamily: obj.fontFamily ?? 'sans-serif',
        ...(obj.fontStyle ? { fontStyle: obj.fontStyle } : {}),
        ...(obj.fontWeight ? { fontWeight: obj.fontWeight } : {}),
      });
    }
  }
  return JSON.stringify({ bgColor, objects });
}

const SHADOW = new Shadow({ blur: 18, color: 'rgba(0,0,0,0.45)', offsetX: 3, offsetY: 4 });

async function deserializeCanvas(
  fc: Canvas,
  data: ScrapbookData,
  cache: Map<string, string>,
  setBgColor: (c: string) => void,
): Promise<void> {
  fc.clear();
  fc.set('backgroundColor', data.bgColor);
  setBgColor(data.bgColor);

  const fabricObjs = await Promise.all(
    data.objects.map(async (obj) => {
      const base = { left: obj.left, top: obj.top, scaleX: obj.scaleX, scaleY: obj.scaleY, angle: obj.angle };
      if (obj.kind === 'polaroid') {
        const key = `${obj.src}||${obj.label}||${obj.font}||${obj.cardColor}`;
        let url = cache.get(key);
        if (!url) {
          url = await makePolaroidUrl(obj.src, obj.label, obj.font, obj.cardColor);
          cache.set(key, url);
        }
        const img = await FabricImage.fromURL(url) as FabricImage & { data: PolaroidMeta };
        img.set({ ...base, shadow: SHADOW });
        img.data = { type: 'polaroid', src: obj.src, label: obj.label, font: obj.font, cardColor: obj.cardColor };
        return img;
      }
      if (obj.kind === 'sticker') {
        const img = await FabricImage.fromURL(obj.src);
        img.set(base);
        return img;
      }
      // text
      return new IText(obj.text, {
        ...base,
        fontSize: obj.fontSize,
        fill: obj.fill,
        fontFamily: obj.fontFamily,
        ...(obj.fontStyle ? { fontStyle: obj.fontStyle as 'italic' } : {}),
        ...(obj.fontWeight ? { fontWeight: obj.fontWeight } : {}),
      });
    }),
  );

  for (const o of fabricObjs) fc.add(o);
  fc.renderAll();
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 my-2">
      <div className="h-px flex-1 bg-white/10" />
      <span className="text-[9px] font-semibold uppercase tracking-widest text-white/30">{children}</span>
      <div className="h-px flex-1 bg-white/10" />
    </div>
  );
}

// ─── Title dialog ─────────────────────────────────────────────────────────────

function TitleDialog({
  defaultValue,
  onSave,
  onCancel,
}: {
  defaultValue: string;
  onSave: (title: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(defaultValue);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-white/15 rounded-2xl p-6 w-80 shadow-2xl">
        <h2 className="font-semibold text-lg mb-1">Name your scrapbook</h2>
        <p className="text-sm text-white/50 mb-4">Give it a memorable title so you can find it later.</p>
        <input
          autoFocus
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && value.trim()) onSave(value.trim()); if (e.key === 'Escape') onCancel(); }}
          placeholder="e.g. Class Trip 2026"
          className="w-full bg-white/8 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-violet-400/60 transition-colors mb-4"
        />
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-xl border border-white/15 text-sm text-white/60 hover:text-white hover:border-white/30 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => { if (value.trim()) onSave(value.trim()); }}
            disabled={!value.trim()}
            className="flex-1 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-semibold text-white disabled:opacity-30 transition-all"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Photo Picker ─────────────────────────────────────────────────────────────

function PhotoPicker({
  selected,
  onToggle,
  onStart,
  userId,
}: {
  selected: Set<string>;
  onToggle: (src: string) => void;
  onStart: () => void;
  userId: string | null;
}) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(slides.length / PAGE_SIZE);
  const pageSlides = slides.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/10 flex-shrink-0">
        <Link href="/" className="text-white/50 hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="font-semibold tracking-tight">Create a Scrapbook</h1>
          <p className="text-xs text-white/40 mt-0.5">
            Pick up to {MAX_PICKS} photos · page {page + 1} of {totalPages}
          </p>
        </div>
        {userId && (
          <Link
            href="/scrapbook/my"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/15 text-xs text-white/60 hover:text-white hover:border-white/30 transition-all"
          >
            <BookMarked className="w-3.5 h-3.5" /> My Scrapbooks
          </Link>
        )}
        {selected.size > 0 && (
          <span className="text-xs font-medium text-white/60 bg-white/10 px-2.5 py-1 rounded-full">
            {selected.size} / {MAX_PICKS}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-hidden p-4">
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-w-6xl mx-auto">
          {pageSlides.map((s) => {
            const isSel = selected.has(s.src);
            const atMax = selected.size >= MAX_PICKS;
            return (
              <button
                key={s.src}
                onClick={() => onToggle(s.src)}
                disabled={atMax && !isSel}
                className={`aspect-square overflow-hidden rounded-xl relative transition-all ${
                  isSel
                    ? 'ring-2 ring-white scale-95'
                    : atMax
                      ? 'opacity-25 cursor-not-allowed'
                      : 'hover:ring-2 hover:ring-white/40 hover:scale-95 cursor-pointer'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.src} alt="" crossOrigin="anonymous" className="w-full h-full object-cover" decoding="async" />
                {isSel && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                      <Check className="w-3.5 h-3.5 text-black" />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-white/10 px-6 py-3 flex items-center gap-4 flex-shrink-0 bg-zinc-950/90 backdrop-blur-sm">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 0}
            className="px-3 py-1.5 rounded-lg text-sm bg-white/8 hover:bg-white/15 border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            ← Prev
          </button>
          <span className="text-xs text-white/40 w-16 text-center tabular-nums">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 rounded-lg text-sm bg-white/8 hover:bg-white/15 border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
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
          className="px-5 py-2 rounded-full bg-white text-black text-sm font-semibold shadow-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/90 active:scale-95 transition-all"
        >
          Open in Editor →
        </button>
      </div>
    </div>
  );
}

// ─── Canvas Editor ────────────────────────────────────────────────────────────

function CanvasEditor({
  srcs,
  onBack,
  userId,
  initialScrapbook,
}: {
  srcs: string[];
  onBack: () => void;
  userId: string | null;
  initialScrapbook: { id: number; title: string; data: string } | null;
}) {
  const canvasEl = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const polaroidCache = useRef<Map<string, string>>(new Map());
  const selObjRef = useRef<(FabricImage & { data?: PolaroidMeta }) | null>(null);

  const [bgColor, setBgColor] = useState(BG_PRESETS[0].color);
  const [customBg, setCustomBg] = useState('');
  const [sidebarTab, setSidebarTab] = useState<'photos' | 'stickers'>('photos');
  const [adding, setAdding] = useState<string | null>(null);
  const [rerendering, setRerendering] = useState(false);
  const [loadingCanvas, setLoadingCanvas] = useState(!!initialScrapbook);

  // Polaroid edit state
  const [selSrc, setSelSrc] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editFont, setEditFont] = useState(FONTS[0].value);
  const [editCardColor, setEditCardColor] = useState('#ffffff');
  const [customCard, setCustomCard] = useState('');

  // Save state
  const [scrapbookId, setScrapbookId] = useState<number | null>(initialScrapbook?.id ?? null);
  const [scrapbookTitle, setScrapbookTitle] = useState(initialScrapbook?.title ?? '');
  const [titleDialogOpen, setTitleDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  useEffect(() => {
    if (!canvasEl.current) return;
    const fc = new Canvas(canvasEl.current, {
      width: CANVAS_W,
      height: CANVAS_H,
      backgroundColor: BG_PRESETS[0].color,
    });

    const syncSel = () => {
      const obj = fc.getActiveObject() as FabricImage & { data?: PolaroidMeta };
      if (obj?.data?.type === 'polaroid') {
        selObjRef.current = obj;
        setSelSrc(obj.data.src);
        setEditLabel(obj.data.label);
        setEditFont(obj.data.font);
        setEditCardColor(obj.data.cardColor);
      } else {
        selObjRef.current = null;
        setSelSrc(null);
      }
    };
    fc.on('selection:created', syncSel);
    fc.on('selection:updated', syncSel);
    fc.on('selection:cleared', () => { selObjRef.current = null; setSelSrc(null); });
    fabricRef.current = fc;

    if (initialScrapbook) {
      const parsed: ScrapbookData = JSON.parse(initialScrapbook.data);
      deserializeCanvas(fc, parsed, polaroidCache.current, setBgColor).finally(() => {
        setLoadingCanvas(false);
      });
    }

    return () => { fc.dispose(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Background ──

  const setBackground = (color: string) => {
    setBgColor(color);
    const fc = fabricRef.current;
    if (!fc) return;
    fc.set('backgroundColor', color);
    fc.renderAll();
  };

  const applyCustomBg = () => {
    const v = customBg.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(v)) { setBackground(v); setCustomBg(''); }
  };

  // ── Add polaroid ──

  const addPhoto = async (src: string) => {
    const fc = fabricRef.current;
    if (!fc || adding === src) return;
    setAdding(src);
    const label = parseDateLabel(src);
    const font = FONTS[0].value;
    const cardColor = '#ffffff';
    try {
      const key = `${src}||${label}||${font}||${cardColor}`;
      let polaroidUrl = polaroidCache.current.get(key);
      if (!polaroidUrl) {
        polaroidUrl = await makePolaroidUrl(src, label, font, cardColor);
        polaroidCache.current.set(key, polaroidUrl);
      }
      const img = await FabricImage.fromURL(polaroidUrl) as FabricImage & { data: PolaroidMeta };
      img.scale(0.5);
      img.data = { type: 'polaroid', src, label, font, cardColor };
      img.set({
        left: 80 + Math.random() * (CANVAS_W - 280),
        top: 60 + Math.random() * (CANVAS_H - 220),
        angle: Math.random() * 18 - 9,
        shadow: SHADOW,
      });
      fc.add(img);
      fc.setActiveObject(img);
      fc.renderAll();
    } finally {
      setAdding(null);
    }
  };

  // ── Re-render polaroid after edits ──

  const rerenderPolaroid = async (label: string, font: string, cardColor: string) => {
    const fc = fabricRef.current;
    const obj = selObjRef.current;
    if (!fc || !obj?.data) return;
    const { src } = obj.data;
    setRerendering(true);
    try {
      const key = `${src}||${label}||${font}||${cardColor}`;
      let url = polaroidCache.current.get(key);
      if (!url) {
        url = await makePolaroidUrl(src, label, font, cardColor);
        polaroidCache.current.set(key, url);
      }
      const newImg = await FabricImage.fromURL(url) as FabricImage & { data: PolaroidMeta };
      newImg.scaleX = obj.scaleX;
      newImg.scaleY = obj.scaleY;
      newImg.set({ left: obj.left, top: obj.top, angle: obj.angle, shadow: obj.shadow });
      newImg.data = { type: 'polaroid', src, label, font, cardColor };
      selObjRef.current = newImg;
      setEditLabel(label);
      setEditFont(font);
      setEditCardColor(cardColor);
      fc.remove(obj);
      fc.add(newImg);
      fc.setActiveObject(newImg);
      fc.renderAll();
    } finally {
      setRerendering(false);
    }
  };

  // ── Stickers ──

  const addSvgSticker = async (src: string, scale: number) => {
    const fc = fabricRef.current;
    if (!fc) return;
    const img = await FabricImage.fromURL(src);
    img.scale(scale);
    img.set({
      left: 80 + Math.random() * (CANVAS_W - 240),
      top: 60 + Math.random() * (CANVAS_H - 160),
    });
    fc.add(img);
    fc.setActiveObject(img);
    fc.renderAll();
  };

  const addTextSticker = (
    text: string, fill: string, fontFamily: string, fontSize: number,
    fontStyle?: 'italic', fontWeight?: string,
  ) => {
    const fc = fabricRef.current;
    if (!fc) return;
    const t = new IText(text, {
      left: 80 + Math.random() * (CANVAS_W - 200),
      top: 60 + Math.random() * (CANVAS_H - 100),
      fontSize, fill, fontFamily,
      ...(fontStyle ? { fontStyle } : {}),
      ...(fontWeight ? { fontWeight } : {}),
    });
    fc.add(t);
    fc.setActiveObject(t);
    fc.renderAll();
  };

  const addEmojiSticker = (emoji: string) => {
    const fc = fabricRef.current;
    if (!fc) return;
    fc.add(new IText(emoji, {
      left: 80 + Math.random() * (CANVAS_W - 160),
      top: 60 + Math.random() * (CANVAS_H - 120),
      fontSize: 60,
    }));
    fc.renderAll();
  };

  // ── Text / Delete / Clear ──

  const addText = () => {
    const fc = fabricRef.current;
    if (!fc) return;
    const t = new IText('Your text here', {
      left: CANVAS_W / 2 - 80, top: CANVAS_H / 2 - 20,
      fontSize: 28, fontFamily: 'Georgia, serif', fill: '#ffffff', fontStyle: 'italic',
    });
    fc.add(t);
    fc.setActiveObject(t);
    fc.renderAll();
  };

  const deleteSelected = () => {
    const fc = fabricRef.current;
    const active = fc?.getActiveObject();
    if (active) { fc!.remove(active); fc!.renderAll(); }
  };

  const clearAll = () => {
    const fc = fabricRef.current;
    if (!fc) return;
    fc.clear();
    fc.set('backgroundColor', bgColor);
    fc.renderAll();
    selObjRef.current = null;
    setSelSrc(null);
  };

  // ── Export ──

  const download = () => {
    const fc = fabricRef.current;
    if (!fc) return;
    const a = document.createElement('a');
    a.href = fc.toDataURL({ format: 'png', multiplier: 2 });
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
    } catch { /* fall through to download */ }
    download();
  };

  // ── Save ──

  const performSave = async (title: string) => {
    const fc = fabricRef.current;
    if (!fc) return;
    setSaving(true);
    setTitleDialogOpen(false);
    try {
      const data = serializeCanvas(fc, bgColor);
      const thumbnail = fc.toDataURL({ format: 'jpeg', multiplier: 1 / 3, quality: 0.6 });
      if (scrapbookId) {
        await updateScrapbook(scrapbookId, title, data, thumbnail);
      } else {
        const id = await saveScrapbook(title, data, thumbnail);
        setScrapbookId(id);
      }
      setScrapbookTitle(title);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } finally {
      setSaving(false);
    }
  };

  const onSaveClick = () => {
    if (!scrapbookId) {
      setTitleDialogOpen(true);
    } else {
      performSave(scrapbookTitle);
    }
  };

  // ── Card color ──

  const applyCustomCard = () => {
    const v = customCard.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(v)) {
      setEditCardColor(v);
      rerenderPolaroid(editLabel, editFont, v);
      setCustomCard('');
    }
  };

  const tabClass = (active: boolean) =>
    `flex-1 py-2 text-xs font-medium transition-all border-b-2 ${
      active
        ? 'text-white border-white'
        : 'text-white/40 border-transparent hover:text-white/70 hover:border-white/20'
    }`;

  const saveLabel =
    saveStatus === 'saved' ? '✓ Saved'
      : saveStatus === 'error' ? 'Error!'
        : saving ? 'Saving…'
          : scrapbookId ? 'Save'
            : 'Save…';

  return (
    <>
      {titleDialogOpen && (
        <TitleDialog
          defaultValue={scrapbookTitle}
          onSave={performSave}
          onCancel={() => setTitleDialogOpen(false)}
        />
      )}

      <div className="flex flex-col h-screen bg-zinc-950 text-white overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-white/10 flex-shrink-0 bg-zinc-900/60 backdrop-blur-sm">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-white/50 hover:text-white transition-colors mr-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-xs">Back</span>
          </button>
          <div className="w-px h-5 bg-white/10 mx-1" />
          <span className="font-semibold text-sm tracking-tight mr-auto">
            {scrapbookTitle || 'Scrapbook'}
          </span>

          <button onClick={addText} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/8 transition-all text-xs">
            <Type className="w-3.5 h-3.5" /> Text
          </button>
          <button onClick={deleteSelected} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-white/60 hover:text-red-400 hover:bg-white/8 transition-all text-xs">
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
          <button onClick={clearAll} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/8 transition-all text-xs">
            <X className="w-3.5 h-3.5" /> Clear
          </button>

          <div className="w-px h-5 bg-white/10 mx-1" />

          {userId && (
            <>
              <Link href="/scrapbook/my" className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/8 transition-all text-xs">
                <BookMarked className="w-3.5 h-3.5" /> My Scrapbooks
              </Link>
              <button
                onClick={onSaveClick}
                disabled={saving}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                  saveStatus === 'saved'
                    ? 'border-green-500/50 bg-green-500/15 text-green-300'
                    : saveStatus === 'error'
                      ? 'border-red-500/50 bg-red-500/15 text-red-300'
                      : 'border-violet-500/40 bg-violet-600/20 text-violet-200 hover:bg-violet-600/30'
                } disabled:opacity-50`}
              >
                <Save className="w-3.5 h-3.5" /> {saveLabel}
              </button>
            </>
          )}

          <button onClick={download} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/20 bg-white/8 hover:bg-white/15 text-white text-xs font-medium transition-all">
            <Download className="w-3.5 h-3.5" /> PNG
          </button>
          <button onClick={share} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-black text-xs font-semibold hover:bg-white/90 active:scale-95 transition-all">
            <Share2 className="w-3.5 h-3.5" /> Share
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-56 border-r border-white/10 flex flex-col flex-shrink-0 overflow-hidden bg-zinc-900/40">

            {/* Background */}
            <div className="p-3 border-b border-white/10 flex-shrink-0">
              <p className="text-[9px] font-semibold uppercase tracking-widest text-white/30 mb-2">Background</p>
              <div className="grid grid-cols-4 gap-1.5 mb-2.5">
                {BG_PRESETS.map((bg) => (
                  <button
                    key={bg.color}
                    title={bg.label}
                    onClick={() => setBackground(bg.color)}
                    className={`w-9 h-9 rounded-lg transition-all ${
                      bgColor === bg.color
                        ? 'ring-2 ring-white ring-offset-1 ring-offset-zinc-900 scale-110'
                        : 'ring-1 ring-white/10 hover:ring-white/40 hover:scale-105'
                    }`}
                    style={{ background: bg.color }}
                  />
                ))}
              </div>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="#hex"
                  value={customBg}
                  onChange={(e) => setCustomBg(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') applyCustomBg(); }}
                  className="flex-1 min-w-0 bg-white/8 border border-white/10 rounded-lg px-2 py-1 text-xs text-white placeholder-white/25 outline-none focus:border-white/30 transition-colors"
                />
                <button onClick={applyCustomBg} className="px-2 py-1 bg-white/8 border border-white/10 hover:bg-white/15 rounded-lg text-xs text-white/60 hover:text-white transition-all flex-shrink-0">
                  Apply
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10 flex-shrink-0">
              <button onClick={() => setSidebarTab('photos')} className={tabClass(sidebarTab === 'photos')}>Photos</button>
              <button onClick={() => setSidebarTab('stickers')} className={tabClass(sidebarTab === 'stickers')}>Stickers</button>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {sidebarTab === 'photos' ? (
                <div className="p-2 grid grid-cols-2 gap-1.5 content-start">
                  {srcs.map((src) => (
                    <button
                      key={src}
                      onClick={() => addPhoto(src)}
                      disabled={adding === src}
                      className={`aspect-square overflow-hidden rounded-lg group relative transition-all ${
                        adding === src ? 'opacity-40' : 'hover:ring-2 hover:ring-white/50 hover:scale-95'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" crossOrigin="anonymous" className="w-full h-full object-cover group-hover:brightness-110 transition-all" />
                      {adding === src && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </button>
                  ))}
                  {srcs.length === 0 && (
                    <p className="col-span-2 text-center text-xs text-white/30 py-8">
                      No photos selected.<br />Go back to pick some.
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-2">
                  <SectionLabel>Illustrated</SectionLabel>
                  <div className="grid grid-cols-2 gap-1.5">
                    {FRIEND_STICKERS.map((s) => (
                      <button
                        key={s.id}
                        title={s.label}
                        onClick={() => addSvgSticker(s.src, s.scale)}
                        className="aspect-square overflow-hidden rounded-xl bg-white/5 border border-white/10 hover:border-white/30 hover:bg-white/10 p-1.5 transition-all hover:scale-105 active:scale-95"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={s.src} alt={s.label} className="w-full h-full object-contain" />
                      </button>
                    ))}
                  </div>

                  <SectionLabel>Tape</SectionLabel>
                  <div className="space-y-1.5">
                    {TAPE_STICKERS.map((s) => (
                      <button
                        key={s.id}
                        title={s.label}
                        onClick={() => addSvgSticker(svgToUrl(s.svg), s.scale)}
                        className="w-full h-9 overflow-hidden rounded-lg border border-white/10 hover:border-white/30 transition-all hover:scale-[1.02] active:scale-95"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={svgToUrl(s.svg)} alt={s.label} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>

                  <SectionLabel>Shapes</SectionLabel>
                  <div className="grid grid-cols-3 gap-1.5">
                    {SHAPE_STICKERS.map((s) => (
                      <button
                        key={s.id}
                        title={s.label}
                        onClick={() => addSvgSticker(svgToUrl(s.svg), s.scale)}
                        className="aspect-square flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:border-white/30 hover:bg-white/10 p-1.5 transition-all hover:scale-110 active:scale-95"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={svgToUrl(s.svg)} alt={s.label} className="w-full h-full object-contain" />
                      </button>
                    ))}
                  </div>

                  <SectionLabel>Text</SectionLabel>
                  <div className="grid grid-cols-2 gap-1.5">
                    {TEXT_STICKERS.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => addTextSticker(s.text, s.fill, s.fontFamily, s.fontSize, s.fontStyle, s.fontWeight)}
                        className="px-1 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-white/30 hover:bg-white/10 text-xs text-center transition-all hover:scale-105 active:scale-95 truncate"
                        style={{ color: s.fill, fontFamily: s.fontFamily, fontStyle: s.fontStyle, fontWeight: s.fontWeight }}
                      >
                        {s.text}
                      </button>
                    ))}
                  </div>

                  <SectionLabel>Emoji</SectionLabel>
                  <div className="grid grid-cols-4 gap-1">
                    {EMOJI_STICKERS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => addEmojiSticker(emoji)}
                        className="aspect-square flex items-center justify-center text-xl rounded-lg hover:bg-white/10 transition-all hover:scale-110 active:scale-95"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Edit polaroid panel */}
            {selSrc !== null && (
              <div className="border-t-2 border-violet-500/30 bg-violet-950/20 p-3 flex-shrink-0">
                <p className="text-[9px] font-semibold uppercase tracking-widest text-violet-300/60 mb-2.5">Edit Polaroid</p>

                <label className="text-xs text-white/50 block mb-1">Caption</label>
                <input
                  type="text"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  onBlur={() => rerenderPolaroid(editLabel, editFont, editCardColor)}
                  onKeyDown={(e) => { if (e.key === 'Enter') rerenderPolaroid(editLabel, editFont, editCardColor); }}
                  className="w-full bg-white/8 border border-white/15 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-violet-400/50 transition-colors mb-2"
                />

                <label className="text-xs text-white/50 block mb-1">Font</label>
                <select
                  value={editFont}
                  onChange={(e) => { setEditFont(e.target.value); rerenderPolaroid(editLabel, e.target.value, editCardColor); }}
                  className="w-full bg-white/8 border border-white/15 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-violet-400/50 transition-colors mb-2"
                >
                  {FONTS.map((f) => (
                    <option key={f.value} value={f.value} style={{ background: '#1a1a2e' }}>{f.label}</option>
                  ))}
                </select>

                <label className="text-xs text-white/50 block mb-1">Card Color</label>
                <div className="grid grid-cols-4 gap-1.5 mb-2">
                  {CARD_PRESETS.map((color) => (
                    <button
                      key={color}
                      onClick={() => { setEditCardColor(color); rerenderPolaroid(editLabel, editFont, color); }}
                      className={`w-9 h-9 rounded-lg transition-all ${
                        editCardColor === color
                          ? 'ring-2 ring-violet-400 ring-offset-1 ring-offset-zinc-900 scale-110'
                          : 'ring-1 ring-white/10 hover:ring-white/40 hover:scale-105'
                      }`}
                      style={{ background: color }}
                    />
                  ))}
                </div>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="#hex"
                    value={customCard}
                    onChange={(e) => setCustomCard(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') applyCustomCard(); }}
                    className="flex-1 min-w-0 bg-white/8 border border-white/15 rounded-lg px-2 py-1 text-xs text-white placeholder-white/25 outline-none focus:border-violet-400/50 transition-colors"
                  />
                  <button onClick={applyCustomCard} className="px-2 py-1 bg-white/8 border border-white/15 hover:bg-white/15 rounded-lg text-xs text-white/60 hover:text-white transition-all flex-shrink-0">
                    Apply
                  </button>
                </div>
                {rerendering && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <div className="w-3 h-3 border border-violet-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-[10px] text-violet-300/50">Updating…</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Canvas area */}
          <div
            className="flex-1 overflow-auto flex items-center justify-center p-8 relative"
            style={{ background: 'repeating-linear-gradient(45deg,#1a1a1a 0px,#1a1a1a 10px,#1f1f1f 10px,#1f1f1f 20px)' }}
          >
            {loadingCanvas && (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80 z-10">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-white/60">Loading scrapbook…</p>
                </div>
              </div>
            )}
            <div style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.15), 0 12px 60px rgba(0,0,0,0.9), 0 4px 20px rgba(0,0,0,0.6)' }}>
              <canvas ref={canvasEl} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function ScrapbookEditor({
  userId = null,
  initialScrapbook = null,
}: {
  userId?: string | null;
  initialScrapbook?: { id: number; title: string; data: string } | null;
}) {
  const [view, setView] = useState<'picking' | 'editing'>(initialScrapbook ? 'editing' : 'picking');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSelect = (src: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(src)) { next.delete(src); }
      else if (next.size < MAX_PICKS) { next.add(src); }
      return next;
    });
  };

  if (view === 'picking') {
    return (
      <PhotoPicker
        selected={selected}
        onToggle={toggleSelect}
        onStart={() => setView('editing')}
        userId={userId}
      />
    );
  }
  return (
    <CanvasEditor
      srcs={Array.from(selected)}
      onBack={() => setView('picking')}
      userId={userId}
      initialScrapbook={initialScrapbook ?? null}
    />
  );
}
