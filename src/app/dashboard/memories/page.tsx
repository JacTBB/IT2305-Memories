import { auth } from '@/auth';
import { listMyMemories } from '@/lib/memories/actions';
import { listMySubscriptions } from '@/lib/memories/subscriptionActions';
import MemoriesClient from './MemoriesClient';
import SubscriptionsClient from './SubscriptionsClient';

export default async function MemoriesPage({
  searchParams,
}: {
  searchParams: { photo?: string };
}) {
  const session = await auth();
  if (!session || !session.user) return 'Unauthorized';

  if (session.user.role === 'public') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-12">
        <div className="items-center lg:flex mb-2">
          <h3 className="mr-5 text-lg text-center font-medium">Welcome to IT2305 Memories</h3>
          <h3 className="text-center text-lg font-medium italic">{session.user.name}</h3>
        </div>
        <div className="items-center text-xs text-gray-400 text-center lg:flex mb-10">
          <p>Please contact the admins for access to the platform.</p>
        </div>
      </main>
    );
  }

  const [memories, subscriptions] = await Promise.all([
    listMyMemories(),
    listMySubscriptions(),
  ]);

  return (
    <main className="flex flex-col gap-10 p-6 md:p-12 max-w-6xl mx-auto w-full">
      <MemoriesClient memories={memories} initialPhoto={searchParams.photo ?? null} />
      <hr className="border-border" />
      <SubscriptionsClient subscriptions={subscriptions} />
    </main>
  );
}
