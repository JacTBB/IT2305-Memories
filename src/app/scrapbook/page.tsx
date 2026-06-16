import { auth } from '@/auth';
import dynamic from 'next/dynamic';

import { getScrapbook } from '@/lib/scrapbooks/actions';

const ScrapbookEditor = dynamic(() => import('./editor'), { ssr: false });

export default async function ScrapbookPage({
  searchParams,
}: {
  searchParams: { id?: string };
}) {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  let initialScrapbook: { id: number; title: string; data: string } | null = null;
  const idParam = searchParams?.id;
  if (idParam && userId) {
    const id = parseInt(idParam, 10);
    if (!isNaN(id)) {
      const row = await getScrapbook(id);
      if (row) {
        initialScrapbook = { id: row.id, title: row.title, data: row.data };
      }
    }
  }

  return <ScrapbookEditor userId={userId} initialScrapbook={initialScrapbook} />;
}
