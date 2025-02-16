import { auth } from '@/auth';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

export default async function Dashboard() {
  const session = await auth();
  if (!session || !session.user) return 'Unauthorized';

  if (session.user.role == 'public') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-12">
        <div className="items-center lg:flex mb-2">
          <h3 className="mr-5 text-lg text-center font-medium">Welcome to IT2305 Memories</h3>
          <h3 className="text-center text-lg font-medium italic">{session.user.name}</h3>
        </div>

        <div className="items-center text-xs text-gray-400 text-center lg:flex mb-10">
          <p className="">Please contact the admins for access to the platform.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col p-20 py-10">
      <section className="w-full flex justify-center">
        <h1 className="text-2xl text-center font-bold">My Posts</h1>
      </section>
      <section>WIP</section>
    </main>
  );
}
