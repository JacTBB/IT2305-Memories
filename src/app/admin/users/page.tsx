import { auth } from '@/auth';
import { db, users } from '@/schema';
import { sql } from 'drizzle-orm';
import React from 'react';

import { DataTable } from '@/components/data-table';

import { columns } from './columns';

export default async function Dashboard() {
  const session = await auth();
  if (!session || !session.user) return 'Unauthorized';

  const data = await db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role })
    .from(users)
    .orderBy(
      sql`
        CASE role
          WHEN 'admin' THEN 1
          WHEN 'classmate' THEN 2
          WHEN 'public' THEN 3
          ELSE 4
        END
      `,
      users.name,
    );

  return (
    <main className="flex flex-col p-20 py-10">
      <section className="w-full flex justify-center">
        <h1 className="text-2xl text-center font-bold">Users</h1>
      </section>
      <section>
        <DataTable
          columns={columns}
          data={data}
          searchTitle="Search by name..."
          searchColumn="name"
        />
      </section>
    </main>
  );
}
