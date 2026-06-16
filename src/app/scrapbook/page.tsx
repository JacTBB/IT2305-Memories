import dynamic from 'next/dynamic';

const ScrapbookEditor = dynamic(() => import('./editor'), { ssr: false });

export default function ScrapbookPage() {
  return <ScrapbookEditor />;
}
