'use client';

import { BookOpen, Edit2, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { deleteScrapbook, type ScrapbookRow } from '@/lib/scrapbooks/actions';

export default function ScrapbookGrid({ scrapbooks }: { scrapbooks: ScrapbookRow[] }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<number | null>(null);

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await deleteScrapbook(id);
      router.refresh();
    } finally {
      setDeleting(null);
    }
  };

  if (scrapbooks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
        <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
          <BookOpen className="w-9 h-9 text-white/20" />
        </div>
        <div>
          <p className="text-white/60 text-lg font-medium mb-1">No scrapbooks yet</p>
          <p className="text-white/30 text-sm">Create one and save it to see it here.</p>
        </div>
        <Link
          href="/scrapbook"
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black text-sm font-semibold hover:bg-white/90 active:scale-95 transition-all mt-2"
        >
          <Plus className="w-4 h-4" /> New Scrapbook
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {scrapbooks.map((sb) => (
        <div
          key={sb.id}
          className="group bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all hover:bg-white/8"
        >
          {/* Thumbnail */}
          <Link href={`/scrapbook?id=${sb.id}`} className="block aspect-[3/2] overflow-hidden bg-zinc-900 relative">
            {sb.thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={sb.thumbnail}
                alt={sb.title}
                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen className="w-10 h-10 text-white/15" />
              </div>
            )}
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
              <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black text-sm font-semibold shadow-lg">
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </span>
            </div>
          </Link>

          {/* Card footer */}
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{sb.title}</p>
              <p className="text-xs text-white/35 mt-0.5">
                {new Date(sb.updatedAt).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <button
              onClick={() => handleDelete(sb.id, sb.title)}
              disabled={deleting === sb.id}
              aria-label={`Delete ${sb.title}`}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-all disabled:opacity-40 flex-shrink-0"
            >
              {deleting === sb.id
                ? <div className="w-3.5 h-3.5 border border-red-400 border-t-transparent rounded-full animate-spin" />
                : <Trash2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
