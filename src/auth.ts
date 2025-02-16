import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { eq } from 'drizzle-orm';
import NextAuth, { type DefaultSession } from 'next-auth';
import Discord from 'next-auth/providers/discord';

import { db, users } from './schema';

declare module 'next-auth' {
  interface Session {
    user: {
      role?: 'public' | 'classmate' | 'admin' | null;
    } & DefaultSession['user'];
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [Discord],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('Sign In');
      console.log(user);
      console.log(account);
      console.log(profile);
      console.log('--------------------');

      return true;
    },
    async session({ session, user }) {
      const dbUsers = await db
        .select()
        .from(users)
        .where(eq(users.id, user.id || ''));

      if (dbUsers.length == 0) return session;

      const dbUser = dbUsers[0];

      session.user = dbUser;
      return session;
    },
  },
});
