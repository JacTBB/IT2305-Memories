import { auth, signOut } from '@/auth';
import { redirect } from 'next/navigation';

export default async function SignOut() {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <form
      action={async () => {
        'use server';
        await signOut();
      }}
    >
      <div className="flex justify-center items-center h-screen">
        <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30">
          <button type="submit" className="mb-3 text-2xl font-semibold">
            Logout{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </button>
        </div>
      </div>
    </form>
  );
}
