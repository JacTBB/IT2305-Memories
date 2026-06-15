'use client';

import confetti from 'canvas-confetti';
import { useEffect, useState } from 'react';

const EMOJIS = ['❤️', '😂', '🔥', '😮', '😢'];
const STORAGE_KEY = 'it2305-reactions';

function getLocalReactions(): Record<string, Record<string, boolean>> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function setLocalReaction(photoId: string, emoji: string, reacted: boolean) {
  const all = getLocalReactions();
  if (!all[photoId]) all[photoId] = {};
  if (reacted) {
    all[photoId][emoji] = true;
  } else {
    delete all[photoId][emoji];
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

interface Props {
  photoId: string;
  compact?: boolean;
  initialCounts?: Record<string, number>;
}

export function Reactions({ photoId, compact, initialCounts }: Props) {
  const [counts, setCounts] = useState<Record<string, number>>(initialCounts ?? {});
  const [myReactions, setMyReactions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMyReactions(getLocalReactions()[photoId] ?? {});
    if (initialCounts === undefined) {
      fetch(`/api/reactions?photo=${encodeURIComponent(photoId)}`)
        .then((r) => r.json())
        .then((data) => setCounts(data))
        .catch(() => {});
    }
  }, [photoId]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = async (emoji: string, e: React.MouseEvent) => {
    if (loading) return;
    setLoading(true);

    // Optimistic update
    const wasReacted = !!myReactions[emoji];
    const delta = wasReacted ? -1 : 1;
    setCounts((c) => ({ ...c, [emoji]: Math.max(0, (c[emoji] ?? 0) + delta) }));
    setMyReactions((m) => ({ ...m, [emoji]: !wasReacted }));

    if (!wasReacted) {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight },
        startVelocity: 22,
        gravity: 1.4,
        scalar: 0.8,
        colors: ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff922b', '#cc5de8'],
      });
    }

    try {
      const res = await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo: photoId, emoji }),
      });

      if (res.ok) {
        const { counts: newCounts, reacted } = await res.json();
        setCounts(newCounts);
        setMyReactions((m) => ({ ...m, [emoji]: reacted }));
        setLocalReaction(photoId, emoji, reacted);
      } else {
        // Revert optimistic update
        setCounts((c) => ({ ...c, [emoji]: Math.max(0, (c[emoji] ?? 0) - delta) }));
        setMyReactions((m) => ({ ...m, [emoji]: wasReacted }));
      }
    } catch {
      setCounts((c) => ({ ...c, [emoji]: Math.max(0, (c[emoji] ?? 0) - delta) }));
      setMyReactions((m) => ({ ...m, [emoji]: wasReacted }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={compact ? 'flex items-center gap-1 flex-wrap justify-center' : 'flex items-center gap-2'}>
      {EMOJIS.map((emoji) => {
        const n = counts[emoji] ?? 0;
        const active = !!myReactions[emoji];
        return (
          <button
            key={emoji}
            onClick={(e) => toggle(emoji, e)}
            className={compact
              ? `flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs transition-all ${active ? 'bg-white/30 text-white scale-105' : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'}`
              : `flex items-center gap-1 px-2.5 py-1 rounded-full text-sm transition-all ${active ? 'bg-white/25 text-white scale-105' : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'}`}
          >
            <span className={compact ? 'text-sm' : ''}>{emoji}</span>
            {n > 0 && <span className="font-medium min-w-[1ch]">{n}</span>}
          </button>
        );
      })}
    </div>
  );
}
