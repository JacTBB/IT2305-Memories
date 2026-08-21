'use client';

import { Copy, ExternalLink, Loader2, Pause, Play, Plus, Send, Shuffle, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  createSubscription,
  deleteSubscription,
  getSubscriptionDeepLink,
  toggleSubscription,
  type MemorySubscriptionRow,
  type SubscriptionFrequency,
} from '@/lib/memories/subscriptionActions';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function describeSubscription(sub: MemorySubscriptionRow): string {
  if (sub.frequency === 'daily') return `Daily at ${sub.timeOfDay}`;
  if (sub.frequency === 'weekly') return `Weekly on ${DAY_NAMES[sub.dayOfWeek ?? 0]} at ${sub.timeOfDay}`;
  return `Monthly on day ${sub.dayOfMonth} at ${sub.timeOfDay}`;
}

function ordinalDay(n: number): string {
  if (n % 10 === 1 && n !== 11) return `${n}st`;
  if (n % 10 === 2 && n !== 12) return `${n}nd`;
  if (n % 10 === 3 && n !== 13) return `${n}rd`;
  return `${n}th`;
}

export default function SubscriptionsClient({ subscriptions }: { subscriptions: MemorySubscriptionRow[] }) {
  const router = useRouter();

  const [createOpen, setCreateOpen] = useState(false);
  const [frequency, setFrequency] = useState<SubscriptionFrequency>('daily');
  const [timeOfDay, setTimeOfDay] = useState('09:00');
  const [dayOfWeek, setDayOfWeek] = useState('1');
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [submitting, startSubmit] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [deepLink, setDeepLink] = useState<string | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkLoadingId, setLinkLoadingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  function handleCreate() {
    setError(null);
    startSubmit(async () => {
      try {
        const result = await createSubscription(
          frequency,
          timeOfDay,
          frequency === 'weekly' ? Number(dayOfWeek) : null,
          frequency === 'monthly' ? Number(dayOfMonth) : null,
        );
        setCreateOpen(false);
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
      const link = await getSubscriptionDeepLink(id);
      setDeepLink(link);
      setLinkOpen(true);
    } finally {
      setLinkLoadingId(null);
    }
  }

  async function handleToggle(id: number, active: boolean) {
    setTogglingId(id);
    try {
      await toggleSubscription(id, active);
      router.refresh();
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this subscription? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await deleteSubscription(id);
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Shuffle className="w-5 h-5" /> Random Memory Subscription
          </h2>
          <p className="text-sm text-muted-foreground">
            Get a random class photo sent to your Telegram on a recurring schedule.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} variant="outline" className="gap-2 shrink-0">
          <Plus className="w-4 h-4" /> Subscribe
        </Button>
      </div>

      {subscriptions.length > 0 && (
        <div className="flex flex-col gap-2">
          {subscriptions.map((sub) => (
            <div
              key={sub.id}
              className="flex items-center justify-between gap-3 border rounded-lg px-4 py-3 bg-card"
            >
              <div>
                <p className="text-sm font-medium">{describeSubscription(sub)}</p>
                <p className="text-xs text-muted-foreground">
                  {!sub.telegramChatId
                    ? 'Not linked to Telegram yet'
                    : sub.active
                      ? 'Active'
                      : 'Paused'}
                  {sub.lastSentAt && (
                    <> · Last sent {new Date(sub.lastSentAt).toLocaleDateString('en-SG', { day: 'numeric', month: 'short' })}</>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {!sub.telegramChatId
                  ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="gap-1.5"
                      disabled={linkLoadingId === sub.id}
                      onClick={() => handleShowLink(sub.id)}
                    >
                      {linkLoadingId === sub.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Send className="w-3.5 h-3.5" />}
                      Link Telegram
                    </Button>
                  )
                  : (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1.5"
                      disabled={togglingId === sub.id}
                      onClick={() => handleToggle(sub.id, !sub.active)}
                    >
                      {togglingId === sub.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : sub.active
                          ? <Pause className="w-3.5 h-3.5" />
                          : <Play className="w-3.5 h-3.5" />}
                      {sub.active ? 'Pause' : 'Resume'}
                    </Button>
                  )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-400 hover:text-red-400"
                  disabled={deletingId === sub.id}
                  onClick={() => handleDelete(sub.id)}
                >
                  {deletingId === sub.id
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Trash2 className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New Subscription</DialogTitle>
            <DialogDescription>
              Pick how often you want a surprise random memory on Telegram.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm font-medium mb-2">Frequency</p>
              <Select value={frequency} onValueChange={(v) => setFrequency(v as SubscriptionFrequency)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {frequency === 'weekly' && (
              <div>
                <p className="text-sm font-medium mb-2">Day of week</p>
                <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAY_NAMES.map((name, idx) => (
                      <SelectItem key={name} value={String(idx)}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {frequency === 'monthly' && (
              <div>
                <p className="text-sm font-medium mb-2">Day of month</p>
                <Select value={dayOfMonth} onValueChange={setDayOfMonth}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                      <SelectItem key={day} value={String(day)}>{ordinalDay(day)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <p className="text-sm font-medium mb-2">Time (Singapore time)</p>
              <Input type="time" value={timeOfDay} onChange={(e) => setTimeOfDay(e.target.value)} />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>

          <DialogFooter>
            <Button onClick={handleCreate} disabled={submitting} className="gap-2">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Subscribe
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
              Open this link in Telegram and hit Start to activate the subscription.
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
