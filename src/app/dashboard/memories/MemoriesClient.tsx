'use client';

import { Clock, Copy, ExternalLink, Loader2, Plus, Send, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { slides } from '@/lib/slides';
import {
  cancelMemory,
  getTelegramDeepLink,
  scheduleMemory,
  type ScheduledMemoryRow,
} from '@/lib/memories/actions';

const STATUS_LABEL: Record<ScheduledMemoryRow['deliveryStatus'], string> = {
  pending: 'Link Telegram',
  linked: 'Scheduled',
  sent: 'Delivered',
  failed: 'Failed',
};

const STATUS_COLOR: Record<ScheduledMemoryRow['deliveryStatus'], string> = {
  pending: 'bg-amber-500/20 text-amber-400',
  linked: 'bg-blue-500/20 text-blue-400',
  sent: 'bg-green-500/20 text-green-400',
  failed: 'bg-red-500/20 text-red-400',
};

function minDateTimeLocal(): string {
  const d = new Date(Date.now() + 60_000);
  d.setSeconds(0, 0);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export default function MemoriesClient({
  memories,
  initialPhoto,
}: {
  memories: ScheduledMemoryRow[];
  initialPhoto: string | null;
}) {
  const router = useRouter();

  const [createOpen, setCreateOpen] = useState(!!initialPhoto);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(initialPhoto);
  const [caption, setCaption] = useState('');
  const [sendAt, setSendAt] = useState('');
  const [submitting, startSubmit] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [deepLink, setDeepLink] = useState<string | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkLoadingId, setLinkLoadingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const photoSlides = useMemo(() => slides.filter((s) => s.type === 'image'), []);

  function resetCreateForm() {
    setSelectedPhoto(null);
    setCaption('');
    setSendAt('');
    setError(null);
  }

  function handleSchedule() {
    if (!selectedPhoto) {
      setError('Pick a photo first.');
      return;
    }
    if (!sendAt) {
      setError('Pick a delivery date.');
      return;
    }
    setError(null);
    startSubmit(async () => {
      try {
        const result = await scheduleMemory(selectedPhoto, caption, new Date(sendAt));
        setCreateOpen(false);
        resetCreateForm();
        setDeepLink(result.telegramDeepLink);
        setLinkOpen(true);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong.');
      }
    });
  }

  async function handleShowLink(id: number) {
    setLinkLoadingId(id);
    try {
      const link = await getTelegramDeepLink(id);
      setDeepLink(link);
      setLinkOpen(true);
    } finally {
      setLinkLoadingId(null);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this scheduled memory? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await cancelMemory(id);
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Future Memories</h1>
          <p className="text-sm text-muted-foreground">
            Schedule a class photo to be delivered to your Telegram at a future date.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" /> Schedule
        </Button>
      </div>

      {memories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-center border border-dashed rounded-2xl">
          <Clock className="w-10 h-10 text-muted-foreground/40" />
          <p className="text-muted-foreground">No memories scheduled yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {memories.map((m) => (
            <div key={m.id} className="border rounded-xl overflow-hidden bg-card">
              <div className="aspect-[3/2] bg-muted relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.photoSrc} alt="" className="w-full h-full object-cover" />
                <span
                  className={`absolute top-2 right-2 text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLOR[m.deliveryStatus]}`}
                >
                  {STATUS_LABEL[m.deliveryStatus]}
                </span>
              </div>
              <div className="p-3 flex flex-col gap-2">
                {m.caption && <p className="text-sm line-clamp-2">{m.caption}</p>}
                <p className="text-xs text-muted-foreground">
                  Delivers{' '}
                  {new Date(m.sendAt).toLocaleString('en-SG', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                {m.deliveryStatus === 'failed' && m.errorMessage && (
                  <p className="text-xs text-red-400 truncate" title={m.errorMessage}>
                    {m.errorMessage}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  {m.deliveryStatus === 'pending' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="gap-1.5"
                      disabled={linkLoadingId === m.id}
                      onClick={() => handleShowLink(m.id)}
                    >
                      {linkLoadingId === m.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Send className="w-3.5 h-3.5" />}
                      Link Telegram
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1.5 text-red-400 hover:text-red-400 ml-auto"
                    disabled={deletingId === m.id}
                    onClick={() => handleDelete(m.id)}
                  >
                    {deletingId === m.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Trash2 className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) resetCreateForm();
        }}
      >
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Schedule a Future Memory</DialogTitle>
            <DialogDescription>
              Pick a photo, write a caption, and choose when it should land in your Telegram.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm font-medium mb-2">Photo</p>
              {selectedPhoto
                ? (
                  <div className="relative aspect-[3/2] w-40 rounded-lg overflow-hidden border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={selectedPhoto} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setSelectedPhoto(null)}
                      className="absolute top-1 right-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded"
                    >
                      Change
                    </button>
                  </div>
                )
                : (
                  <div className="grid grid-cols-5 gap-1.5 max-h-56 overflow-y-auto p-1 border rounded-lg">
                    {photoSlides.map((slide) => (
                      <button
                        type="button"
                        key={slide.src}
                        onClick={() => setSelectedPhoto(slide.src)}
                        className="aspect-square rounded overflow-hidden border border-transparent hover:border-primary transition-colors"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={slide.src} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Caption (optional)</p>
              <Textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={500}
                placeholder="A little note for future you..."
              />
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Delivery date & time</p>
              <Input
                type="datetime-local"
                value={sendAt}
                onChange={(e) => setSendAt(e.target.value)}
                min={minDateTimeLocal()}
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>

          <DialogFooter>
            <Button onClick={handleSchedule} disabled={submitting} className="gap-2">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Schedule Memory
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Telegram link dialog */}
      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Link your Telegram</DialogTitle>
            <DialogDescription>
              Open this link in Telegram and hit Start — that&apos;s how the bot knows where to
              send your memory.
            </DialogDescription>
          </DialogHeader>
          {deepLink && (
            <div className="flex flex-col gap-3">
              <Button asChild className="gap-2">
                <a href={deepLink} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4" /> Open in Telegram
                </a>
              </Button>
              <div className="flex items-center gap-2">
                <Input readOnly value={deepLink} className="text-xs" />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => navigator.clipboard.writeText(deepLink)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
