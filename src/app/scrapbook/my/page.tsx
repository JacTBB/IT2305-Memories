import { ChevronLeft, Plus } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { listScrapbooks } from '@/lib/scrapbooks/actions';
import ScrapbookGrid from './ScrapbookGrid';

export default async function MyScrapbooksPage() {
  const session = await auth();
  if (!session?.user) redirect('/api/auth/signin');

  const scrapbooks = await listScrapbooks();

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center gap-4 sticky top-0 bg-zinc-950/90 backdrop-blur-sm z-10">
        <Link href="/scrapbook" className="text-white/50 hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="font-semibold tracking-tight">My Scrapbooks</h1>
          <p className="text-xs text-white/40 mt-0.5">
            {scrapbooks.length} scrapbook{scrapbooks.length !== 1 ? 's' : ''} saved
          </p>
        </div>
        <Link
          href="/scrapbook"
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black text-sm font-semibold hover:bg-white/90 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" /> New Scrapbook
        </Link>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <ScrapbookGrid scrapbooks={scrapbooks} />
      </div>
    </div>
  );
}
