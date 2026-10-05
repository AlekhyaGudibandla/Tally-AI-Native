import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import prisma from '@/lib/db';
import bcrypt from 'bcrypt';

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        // For development/demo purposes
        if (credentials.email === 'admin@vahi.com' && credentials.password === 'admin') {
           return { id: '1', name: 'Admin', email: 'admin@vahi.com' };
        }
        
        // TODO: Query Prisma DB to verify real user passwords
        // const user = await prisma.user.findUnique({ where: { email: credentials.email as string } });
        // if (!user) return null;
        // const passwordsMatch = await bcrypt.compare(credentials.password as string, user.password);
        // if (passwordsMatch) return user;

        return null;
      },
    }),
  ],
});
