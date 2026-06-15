'use client';

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
}

export function Reactions({ photoId }: Props) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [myReactions, setMyReactions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMyReactions(getLocalReactions()[photoId] ?? {});
    fetch(`/api/reactions?photo=${encodeURIComponent(photoId)}`)
      .then((r) => r.json())
      .then((data) => setCounts(data))
      .catch(() => {});
  }, [photoId]);

  const toggle = async (emoji: string) => {
    if (loading) return;
    setLoading(true);

    // Optimistic update
    const wasReacted = !!myReactions[emoji];
    const delta = wasReacted ? -1 : 1;
    setCounts((c) => ({ ...c, [emoji]: Math.max(0, (c[emoji] ?? 0) + delta) }));
    setMyReactions((m) => ({ ...m, [emoji]: !wasReacted }));

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
    <div className="flex items-center gap-2">
      {EMOJIS.map((emoji) => {
        const n = counts[emoji] ?? 0;
        const active = !!myReactions[emoji];
        return (
          <button
            key={emoji}
            onClick={() => toggle(emoji)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-sm transition-all ${active ? 'bg-white/25 text-white scale-105' : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'}`}
          >
            <span>{emoji}</span>
            {n > 0 && <span className="text-xs font-medium min-w-[1ch]">{n}</span>}
          </button>
        );
      })}
    </div>
  );
}
