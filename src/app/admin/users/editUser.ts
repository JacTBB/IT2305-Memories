'use server';

import { auth } from '@/auth';
import { db, users } from '@/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const formSchema = z.object({
  role: z.enum(['public', 'classmate', 'admin']),
});

async function editUser(userData: any) {
  const session = await auth();
  if (!session || !session.user) throw Error('Unauthorized');

  try {
    formSchema.parse(userData);
  } catch (error) {
    throw Error('Invalid user data');
  }

  if (!userData.id) throw Error('Bad Request');

  if (session.user.role != 'admin') {
    throw Error('Forbidden');
  }
  if (session.user.id == userData.id) {
    throw Error('Cannot edit yourself!');
  }

  const { role } = userData;

  const user = (await db.select().from(users).where(eq(users.id, userData.id)))[0];

  await db.update(users).set({ role: role }).where(eq(users.id, userData.id));

  return;
}
export default editUser;
