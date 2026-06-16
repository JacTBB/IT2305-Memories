/* eslint-disable max-lines, quotes */
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
const PAGE_SIZE = 24;

const FONTS = [
  { label: 'Typewriter', value: '"Courier New", monospace' },
  { label: 'Classic',    value: 'Georgia, serif' },
  { label: 'Modern',     value: 'system-ui, sans-serif' },
  { label: 'Playful',    value: '"Comic Sans MS", cursive' },
  { label: 'Bold',       value: '"Arial Black", sans-serif' },
  { label: 'Elegant',    value: '"Palatino Linotype", serif' },
];

// 12 background presets: 4 light → 4 medium → 4 dark
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

// ─── Sticker definitions ─────────────────────────────────────────────────────

const svgToUrl = (s: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(s)}`;

const SVG_STICKERS: { id: string; label: string; svg: string; scale: number; wide?: true }[] = [
  {
    id: 'heart', label: 'Heart', scale: 1.2,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="90" viewBox="0 0 100 90"><path d="M50,80 C25,60 5,45 5,28 C5,14 18,4 32,4 C40,4 47,8 50,14 C53,8 60,4 68,4 C82,4 95,14 95,28 C95,45 75,60 50,80Z" fill="#ff6b9d"/></svg>`,
  },
  {
    id: 'camera', label: 'Camera', scale: 1.0,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="90" viewBox="0 0 120 90"><rect x="5" y="22" width="110" height="65" rx="10" fill="#6b9eff"/><polygon points="38,22 46,10 74,10 82,22" fill="#5a8aee"/><circle cx="60" cy="54" r="22" fill="white" opacity="0.2"/><circle cx="60" cy="54" r="14" fill="white" opacity="0.25"/><circle cx="60" cy="54" r="8" fill="#2a4a99"/><circle cx="90" cy="32" r="6" fill="#ffd700"/></svg>`,
  },
  {
    id: 'flower', label: 'Flower', scale: 1.0,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><ellipse cx="50" cy="22" rx="11" ry="19" fill="#ffb3de"/><ellipse cx="50" cy="78" rx="11" ry="19" fill="#ffb3de"/><ellipse cx="22" cy="50" rx="19" ry="11" fill="#ffb3de"/><ellipse cx="78" cy="50" rx="19" ry="11" fill="#ffb3de"/><ellipse cx="29" cy="29" rx="11" ry="19" fill="#ffb3de" transform="rotate(45,29,29)"/><ellipse cx="71" cy="29" rx="11" ry="19" fill="#ffb3de" transform="rotate(-45,71,29)"/><ellipse cx="29" cy="71" rx="11" ry="19" fill="#ffb3de" transform="rotate(-45,29,71)"/><ellipse cx="71" cy="71" rx="11" ry="19" fill="#ffb3de" transform="rotate(45,71,71)"/><circle cx="50" cy="50" r="17" fill="#ffd700"/><circle cx="50" cy="50" r="9" fill="#ffaa00"/></svg>`,
  },
  {
    id: 'bow', label: 'Bow', scale: 1.0,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80"><path d="M60,40 C55,28 28,8 8,18 C-2,24 2,40 16,44 C32,50 57,44 60,40Z" fill="#ff6b9d"/><path d="M60,40 C65,28 92,8 112,18 C122,24 118,40 104,44 C88,50 63,44 60,40Z" fill="#ff6b9d"/><circle cx="60" cy="40" r="11" fill="#cc3377"/><path d="M55,50 C50,60 46,70 44,78" stroke="#ff6b9d" stroke-width="4.5" fill="none" stroke-linecap="round"/><path d="M65,50 C70,60 74,70 76,78" stroke="#ff6b9d" stroke-width="4.5" fill="none" stroke-linecap="round"/></svg>`,
  },
  {
    id: 'cloud', label: 'Cloud', scale: 1.2,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80"><circle cx="38" cy="52" r="24" fill="#bfdbfe"/><circle cx="64" cy="44" r="30" fill="#bfdbfe"/><circle cx="92" cy="55" r="20" fill="#bfdbfe"/><rect x="14" y="56" width="98" height="22" fill="#bfdbfe"/></svg>`,
  },
  {
    id: 'rainbow', label: 'Rainbow', scale: 1.2,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="72" viewBox="0 0 120 72"><path d="M8,70 Q60,-18 112,70" stroke="#ff4444" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M16,70 Q60,-6 104,70" stroke="#ff8c00" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M24,70 Q60,6 96,70" stroke="#ffd700" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M32,70 Q60,18 88,70" stroke="#44cc44" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M40,70 Q60,30 80,70" stroke="#4488ff" stroke-width="9" fill="none" stroke-linecap="round"/></svg>`,
  },
  {
    id: 'arrow', label: 'Arrow', scale: 1.2,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="110" height="80" viewBox="0 0 110 80"><path d="M10,62 Q38,14 84,28" stroke="#ff6b9d" stroke-width="6" fill="none" stroke-linecap="round"/><polygon points="88,16 106,36 72,40" fill="#ff6b9d"/></svg>`,
  },
  {
    id: 'sun', label: 'Sun', scale: 1.0,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="20" fill="#fbbf24"/><line x1="50" y1="8" x2="50" y2="22" stroke="#fbbf24" stroke-width="6" stroke-linecap="round"/><line x1="50" y1="78" x2="50" y2="92" stroke="#fbbf24" stroke-width="6" stroke-linecap="round"/><line x1="8" y1="50" x2="22" y2="50" stroke="#fbbf24" stroke-width="6" stroke-linecap="round"/><line x1="78" y1="50" x2="92" y2="50" stroke="#fbbf24" stroke-width="6" stroke-linecap="round"/><line x1="22" y1="22" x2="31" y2="31" stroke="#fbbf24" stroke-width="6" stroke-linecap="round"/><line x1="69" y1="69" x2="78" y2="78" stroke="#fbbf24" stroke-width="6" stroke-linecap="round"/><line x1="78" y1="22" x2="69" y2="31" stroke="#fbbf24" stroke-width="6" stroke-linecap="round"/><line x1="31" y1="69" x2="22" y2="78" stroke="#fbbf24" stroke-width="6" stroke-linecap="round"/></svg>`,
  },
  // washi tapes — displayed full-width
  {
    id: 'washi-mint', label: 'Mint tape', scale: 1.5, wide: true,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="40" viewBox="0 0 200 40"><rect width="200" height="40" fill="#a5f3fc" opacity="0.88"/><circle cx="20" cy="20" r="7" fill="white" opacity="0.65"/><circle cx="52" cy="20" r="7" fill="white" opacity="0.65"/><circle cx="84" cy="20" r="7" fill="white" opacity="0.65"/><circle cx="116" cy="20" r="7" fill="white" opacity="0.65"/><circle cx="148" cy="20" r="7" fill="white" opacity="0.65"/><circle cx="180" cy="20" r="7" fill="white" opacity="0.65"/></svg>`,
  },
  {
    id: 'washi-pink', label: 'Pink tape', scale: 1.5, wide: true,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="40" viewBox="0 0 200 40"><rect width="200" height="40" fill="#fda4af" opacity="0.88"/><line x1="0" y1="13" x2="200" y2="13" stroke="white" stroke-width="2" opacity="0.55"/><line x1="0" y1="27" x2="200" y2="27" stroke="white" stroke-width="2" opacity="0.55"/></svg>`,
  },
  {
    id: 'washi-yellow', label: 'Yellow tape', scale: 1.5, wide: true,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="40" viewBox="0 0 200 40"><rect width="200" height="40" fill="#fde68a" opacity="0.88"/><circle cx="20" cy="20" r="5" fill="white" opacity="0.6"/><circle cx="48" cy="20" r="5" fill="white" opacity="0.6"/><circle cx="76" cy="20" r="5" fill="white" opacity="0.6"/><circle cx="104" cy="20" r="5" fill="white" opacity="0.6"/><circle cx="132" cy="20" r="5" fill="white" opacity="0.6"/><circle cx="160" cy="20" r="5" fill="white" opacity="0.6"/><circle cx="188" cy="20" r="5" fill="white" opacity="0.6"/></svg>`,
  },
];

const TEXT_STICKERS: {
  id: string; text: string; fill: string;
  fontFamily: string; fontSize: number;
  fontStyle?: 'italic'; fontWeight?: string;
}[] = [
  { id: 'memories', text: 'MEMORIES',    fill: '#cc3366', fontFamily: '"Courier New", monospace', fontSize: 28, fontWeight: 'bold' },
  { id: 'xoxo',     text: 'xoxo',        fill: '#ff6b9d', fontFamily: 'Georgia, serif',            fontSize: 36, fontStyle: 'italic' },
  { id: 'besties',  text: 'besties ♡',   fill: '#ff8c00', fontFamily: 'Georgia, serif',            fontSize: 26, fontStyle: 'italic' },
  { id: 'forever',  text: 'forever',     fill: '#9b59b6', fontFamily: '"Palatino Linotype", serif', fontSize: 30, fontStyle: 'italic' },
  { id: 'it2305',   text: 'IT2305',      fill: '#6b9eff', fontFamily: '"Arial Black", sans-serif',  fontSize: 30, fontWeight: 'bold' },
  { id: 'classof',  text: "class of '26",fill: '#27ae60', fontFamily: 'Georgia, serif',            fontSize: 22, fontStyle: 'italic' },
];

const EMOJI_STICKERS = [
  '❤️', '🌟', '✨', '🎉', '🎊', '🥳', '😍', '🤩',
  '💫', '🌈', '🦋', '🌸', '🌺', '🍀', '☀️', '🌙',
  '🎵', '🎶', '📸', '💌', '🎁', '🏆', '👑', '💎',
  '🔥', '💯', '🌊', '🍭', '🎈', '🎀', '🌻', '🦄',
];

// ─── Polaroid ────────────────────────────────────────────────────────────────

type PolaroidMeta = {
  type: 'polaroid';
  src: string;
  label: string;
  font: string;
  cardColor: string;
};

async function makePolaroidUrl(
  src: string,
  label: string,
  font: string,
  cardColor: string,
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
    img.onerror = () => {
      ctx.fillStyle = '#e0e0e0';
      ctx.fillRect(PAD, PAD, IMG, IMG);
      stamp();
    };
    img.src = src;
  });
}

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
                <img src={s.src} alt="" crossOrigin="anonymous" className="w-full h-full object-cover" decoding="async" />
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

      <div className="border-t border-white/10 px-6 py-3 flex items-center gap-4 flex-shrink-0 bg-black/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 0}
            className="px-3 py-1.5 rounded-md text-sm bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            ← Prev
          </button>
          <span className="text-xs text-white/40 w-20 text-center">Page {page + 1} of {totalPages}</span>
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

function CanvasEditor({ srcs, onBack }: { srcs: string[]; onBack: () => void }) {
  const canvasEl = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const polaroidCache = useRef<Map<string, string>>(new Map());
  const selObjRef = useRef<(FabricImage & { data?: PolaroidMeta }) | null>(null);

  const [bgColor, setBgColor] = useState(BG_PRESETS[0].color);
  const [customBg, setCustomBg] = useState('');
  const [sidebarTab, setSidebarTab] = useState<'photos' | 'stickers'>('photos');
  const [adding, setAdding] = useState<string | null>(null);
  const [rerendering, setRerendering] = useState(false);

  const [selSrc, setSelSrc] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editFont, setEditFont] = useState(FONTS[0].value);
  const [editCardColor, setEditCardColor] = useState('#ffffff');
  const [customCard, setCustomCard] = useState('');

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
    return () => { fc.dispose(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  const addPhoto = async (src: string) => {
    const fc = fabricRef.current;
    if (!fc || adding === src) return;
    setAdding(src);
    const label = parseDateLabel(src);
    const font = FONTS[0].value;
    const cardColor = '#ffffff';
    try {
      const cacheKey = `${src}||${label}||${font}||${cardColor}`;
      let polaroidUrl = polaroidCache.current.get(cacheKey);
      if (!polaroidUrl) {
        polaroidUrl = await makePolaroidUrl(src, label, font, cardColor);
        polaroidCache.current.set(cacheKey, polaroidUrl);
      }
      const img = await FabricImage.fromURL(polaroidUrl) as FabricImage & { data: PolaroidMeta };
      img.scale(0.5);
      img.data = { type: 'polaroid', src, label, font, cardColor };
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

  const rerenderPolaroid = async (label: string, font: string, cardColor: string) => {
    const fc = fabricRef.current;
    const obj = selObjRef.current;
    if (!fc || !obj || !obj.data) return;
    const { src } = obj.data;
    setRerendering(true);
    try {
      const cacheKey = `${src}||${label}||${font}||${cardColor}`;
      let polaroidUrl = polaroidCache.current.get(cacheKey);
      if (!polaroidUrl) {
        polaroidUrl = await makePolaroidUrl(src, label, font, cardColor);
        polaroidCache.current.set(cacheKey, polaroidUrl);
      }
      const newImg = await FabricImage.fromURL(polaroidUrl) as FabricImage & { data: PolaroidMeta };
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

  const addSvgSticker = async (svg: string, scale: number) => {
    const fc = fabricRef.current;
    if (!fc) return;
    const img = await FabricImage.fromURL(svgToUrl(svg));
    img.scale(scale);
    img.set({
      left: 80 + Math.random() * (CANVAS_W - 260),
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
    const sticker = new IText(emoji, {
      left: 80 + Math.random() * (CANVAS_W - 160),
      top: 60 + Math.random() * (CANVAS_H - 120),
      fontSize: 60,
    });
    fc.add(sticker);
    fc.setActiveObject(sticker);
    fc.renderAll();
  };

  const addText = () => {
    const fc = fabricRef.current;
    if (!fc) return;
    const text = new IText('Your text here', {
      left: CANVAS_W / 2 - 80, top: CANVAS_H / 2 - 20,
      fontSize: 28, fontFamily: 'Georgia, serif', fill: '#ffffff', fontStyle: 'italic',
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
    selObjRef.current = null;
    setSelSrc(null);
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

  const applyCustomCard = () => {
    const v = customCard.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(v)) {
      setEditCardColor(v);
      rerenderPolaroid(editLabel, editFont, v);
      setCustomCard('');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white overflow-hidden">
      {/* Top toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10 flex-shrink-0">
        <button onClick={onBack} className="text-white/50 hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-semibold text-sm mr-auto tracking-tight">Scrapbook</span>
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
        {/* Sidebar */}
        <div className="w-52 border-r border-white/10 flex flex-col flex-shrink-0 overflow-hidden">

          {/* Background */}
          <div className="p-3 border-b border-white/10 flex-shrink-0">
            <p className="text-[10px] text-white/40 mb-2 font-medium uppercase tracking-wider">Background</p>
            <div className="grid grid-cols-4 gap-1.5 mb-2">
              {BG_PRESETS.map((bg) => (
                <button
                  key={bg.color}
                  title={bg.label}
                  onClick={() => setBackground(bg.color)}
                  className={`w-8 h-8 rounded-md border-2 transition-all ${bgColor === bg.color ? 'border-white scale-110' : 'border-white/20 hover:border-white/60'}`}
                  style={{ background: bg.color }}
                />
              ))}
            </div>
            <div className="flex gap-1">
              <input
                type="text"
                placeholder="#hex"
                value={customBg}
                onChange={(e) => setCustomBg(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') applyCustomBg(); }}
                className="flex-1 min-w-0 bg-white/10 rounded px-2 py-1 text-xs text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-white/30"
              />
              <button onClick={applyCustomBg} className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-xs text-white/70 transition-all flex-shrink-0">Apply</button>
            </div>
          </div>

          {/* Photos / Stickers tabs */}
          <div className="flex border-b border-white/10 flex-shrink-0">
            <button
              onClick={() => setSidebarTab('photos')}
              className={`flex-1 py-1.5 text-xs font-medium transition-all ${sidebarTab === 'photos' ? 'text-white bg-white/10' : 'text-white/40 hover:text-white/70'}`}
            >
              Photos
            </button>
            <button
              onClick={() => setSidebarTab('stickers')}
              className={`flex-1 py-1.5 text-xs font-medium transition-all ${sidebarTab === 'stickers' ? 'text-white bg-white/10' : 'text-white/40 hover:text-white/70'}`}
            >
              Stickers
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {sidebarTab === 'photos' ? (
              <div className="p-1.5 grid grid-cols-2 gap-1 content-start">
                {srcs.map((src) => (
                  <button
                    key={src}
                    onClick={() => addPhoto(src)}
                    disabled={adding === src}
                    className={`aspect-square overflow-hidden rounded group relative cursor-pointer ${adding === src ? 'opacity-40' : ''}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" crossOrigin="anonymous" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200" />
                    {adding === src && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs text-white">Adding…</div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {/* Creative SVG stickers */}
                <p className="text-[9px] text-white/30 font-medium uppercase tracking-widest">Creative</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {SVG_STICKERS.filter((s) => !s.wide).map((s) => (
                    <button
                      key={s.id}
                      title={s.label}
                      onClick={() => addSvgSticker(s.svg, s.scale)}
                      className="aspect-square flex items-center justify-center bg-white/5 hover:bg-white/15 rounded p-1 transition-all hover:scale-105"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={svgToUrl(s.svg)} alt={s.label} className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
                <div className="space-y-1">
                  {SVG_STICKERS.filter((s) => s.wide).map((s) => (
                    <button
                      key={s.id}
                      title={s.label}
                      onClick={() => addSvgSticker(s.svg, s.scale)}
                      className="w-full h-8 flex items-center justify-center bg-white/5 hover:bg-white/15 rounded overflow-hidden transition-all hover:scale-105"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={svgToUrl(s.svg)} alt={s.label} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>

                {/* Text stickers */}
                <p className="text-[9px] text-white/30 font-medium uppercase tracking-widest pt-1">Text</p>
                <div className="grid grid-cols-2 gap-1">
                  {TEXT_STICKERS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => addTextSticker(s.text, s.fill, s.fontFamily, s.fontSize, s.fontStyle, s.fontWeight)}
                      className="px-1 py-2 rounded bg-white/5 hover:bg-white/15 text-xs text-center transition-all hover:scale-105 truncate"
                      style={{ color: s.fill, fontFamily: s.fontFamily, fontStyle: s.fontStyle, fontWeight: s.fontWeight }}
                    >
                      {s.text}
                    </button>
                  ))}
                </div>

                {/* Emoji stickers */}
                <p className="text-[9px] text-white/30 font-medium uppercase tracking-widest pt-1">Emoji</p>
                <div className="grid grid-cols-4 gap-1">
                  {EMOJI_STICKERS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => addEmojiSticker(emoji)}
                      className="aspect-square flex items-center justify-center text-xl hover:bg-white/10 rounded transition-all hover:scale-110"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Edit polaroid panel — shown when a polaroid is selected */}
          {selSrc !== null && (
            <div className="border-t border-white/10 p-3 flex-shrink-0">
              <p className="text-[10px] text-white/40 mb-2 font-medium uppercase tracking-wider">Edit Polaroid</p>

              <label className="text-xs text-white/50 block mb-1">Caption</label>
              <input
                type="text"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                onBlur={() => rerenderPolaroid(editLabel, editFont, editCardColor)}
                onKeyDown={(e) => { if (e.key === 'Enter') rerenderPolaroid(editLabel, editFont, editCardColor); }}
                className="w-full bg-white/10 rounded px-2 py-1.5 text-xs text-white outline-none focus:ring-1 focus:ring-white/30 mb-2"
              />

              <label className="text-xs text-white/50 block mb-1">Font</label>
              <select
                value={editFont}
                onChange={(e) => { setEditFont(e.target.value); rerenderPolaroid(editLabel, e.target.value, editCardColor); }}
                className="w-full bg-white/10 rounded px-2 py-1.5 text-xs text-white outline-none focus:ring-1 focus:ring-white/30 mb-2"
              >
                {FONTS.map((f) => (
                  <option key={f.value} value={f.value} style={{ background: '#1a1a1a' }}>{f.label}</option>
                ))}
              </select>

              <label className="text-xs text-white/50 block mb-1">Card Color</label>
              <div className="grid grid-cols-4 gap-1 mb-1.5">
                {CARD_PRESETS.map((color) => (
                  <button
                    key={color}
                    onClick={() => { setEditCardColor(color); rerenderPolaroid(editLabel, editFont, color); }}
                    className={`w-8 h-8 rounded border-2 transition-all ${editCardColor === color ? 'border-white scale-110' : 'border-white/20 hover:border-white/50'}`}
                    style={{ background: color }}
                  />
                ))}
              </div>
              <div className="flex gap-1">
                <input
                  type="text"
                  placeholder="#hex"
                  value={customCard}
                  onChange={(e) => setCustomCard(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') applyCustomCard(); }}
                  className="flex-1 min-w-0 bg-white/10 rounded px-2 py-1 text-xs text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-white/30"
                />
                <button onClick={applyCustomCard} className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-xs text-white/70 transition-all flex-shrink-0">Apply</button>
              </div>
              {rerendering && <p className="text-[10px] text-white/30 mt-1.5 text-center">Updating…</p>}
            </div>
          )}
        </div>

        {/* Canvas area */}
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
    return <PhotoPicker selected={selected} onToggle={toggleSelect} onStart={() => setView('editing')} />;
  }

  return <CanvasEditor srcs={Array.from(selected)} onBack={() => setView('picking')} />;
}
