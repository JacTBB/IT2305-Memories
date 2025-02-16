import { auth } from '@/auth';
import { challenges, db, users } from '@/schema';
import { eq } from 'drizzle-orm';
import Image from 'next/image';
import React, { Suspense } from 'react';

export default async function Dashboard() {
  const session = await auth();
  if (!session || !session.user) return 'Unauthorized';

  return (
    <main className="flex min-h-screen flex-col items-center p-12">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <p>Welcome to the Dashboard</p>
        <p>{session.user.id}</p>
        <p>{session.user.name}</p>
        <p>{session.user.email}</p>
        <Image src={session.user.image ?? ''} width={100} height={100} alt="User Avatar" />
      </div>
    </main>
  );
}
