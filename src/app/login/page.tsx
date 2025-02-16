import { signIn } from '@/auth';

export default function SignIn() {
  return (
    <div className="flex flex-col justify-center items-center h-screen">
      <form
        action={async () => {
          'use server';
          await signIn('discord', { redirectTo: '/home' });
        }}
      >
        <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30">
          <button type="submit" className="mb-3 text-2xl font-semibold">
            Login with Discord{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
