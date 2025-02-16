import { auth } from '@/auth';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

export default async function Dashboard() {
  const session = await auth();
  if (!session || !session.user) return 'Unauthorized';

  if (session.user.role == 'public') {
    return (
      <main className="flex min-h-screen flex-col items-center p-24">
        <div className="m-28 relative z-[-1] flex place-items-center before:absolute before:h-[300px] before:w-full before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-full after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-10 after:dark:from-sky-900 after:dark:via-[#0141ff] after:dark:opacity-40 sm:before:w-[480px] sm:after:w-[240px] before:lg:h-[360px]">
          <Image
            className="relative dark:drop-shadow-[0_0_0.3rem_#ffffff70]"
            src="/SIT.png"
            alt="Logo"
            width={240}
            height={240}
            priority
          />
        </div>

        <div className="items-center lg:flex mb-2">
          <h3 className="mr-5 text-lg font-medium">Welcome to IT2305 Memories</h3>
          <h3 className=" text-lg font-medium italic">{session.user.name}</h3>
        </div>

        <div className="items-center text-xs text-gray-400 lg:flex mb-10">
          <p className="">Please contact the admins for access to the platform.</p>
        </div>

        <div className="mb-32 grid text-center lg:mb-0 lg:w-6/12 lg:max-w-4xl lg:grid-cols-3 gap-2 lg:text-left">
          <Link href="https://www.yes-but-no.org/">
            <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30">
              <h2 className="mb-3 text-2xl font-semibold">
                Website{' '}
                <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                  -&gt;
                </span>
              </h2>
              <p className="m-0 max-w-[30ch] text-sm opacity-50">Access the Yes But No website.</p>
            </div>
          </Link>

          <Link href="https://blog.yes-but-no.org/">
            <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30">
              <h2 className="mb-3 text-2xl font-semibold">
                Blog{' '}
                <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                  -&gt;
                </span>
              </h2>
              <p className="m-0 max-w-[30ch] text-sm opacity-50">View the Yes But No blog.</p>
            </div>
          </Link>

          <Link href="/logout">
            <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30">
              <h2 className="mb-3 text-2xl font-semibold">
                Logout{' '}
                <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                  -&gt;
                </span>
              </h2>
              <p className="m-0 max-w-[30ch] text-sm opacity-50">Logout.</p>
            </div>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <div className="m-32 relative z-[-1] flex place-items-center before:absolute before:h-[300px] before:w-full before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-full after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-10 after:dark:from-sky-900 after:dark:via-[#0141ff] after:dark:opacity-40 sm:before:w-[480px] sm:after:w-[240px] before:lg:h-[360px]">
        <Image
          className="relative dark:drop-shadow-[0_0_0.3rem_#ffffff70]"
          src="/SIT.png"
          alt="Logo"
          width={240}
          height={240}
          priority
        />
      </div>

      <div className="items-center lg:flex mb-10">
        <h3 className="mr-5 text-lg font-medium">Welcome to IT2305 Memories</h3>
        <h3 className=" text-lg font-medium italic">{session.user.name}</h3>
      </div>

      <div className="mb-32 grid text-center lg:mb-0 lg:w-6/12 lg:max-w-4xl lg:grid-cols-3 gap-2 lg:text-left">
        <Link href="/creator/dashboard">
          <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30">
            <h2 className="mb-3 text-2xl font-semibold">
              Creator{' '}
              <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                -&gt;
              </span>
            </h2>
          </div>
        </Link>

        {(session.user.role == 'reviewer' || session.user.role == 'admin') && (
          <Link href="/reviewer/dashboard">
            <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30">
              <h2 className="mb-3 text-2xl font-semibold">
                Reviewer{' '}
                <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                  -&gt;
                </span>
              </h2>
            </div>
          </Link>
        )}

        {session.user.role == 'admin' && (
          <Link href="/admin/dashboard">
            <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30">
              <h2 className="mb-3 text-2xl font-semibold">
                Admin{' '}
                <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                  -&gt;
                </span>
              </h2>
            </div>
          </Link>
        )}
      </div>
    </main>
  );
}
