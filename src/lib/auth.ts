import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { Domain, UserRole } from './types';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        try {
          // Find user by email
          const result = await db`
            SELECT id, username, email, password_hash, domain, role, xp, level, 
                   avatar_url, bio, is_active, email_verified, created_at, updated_at
            FROM users 
            WHERE email = ${credentials.email} AND is_active = true
          `;

          if (result.rows.length === 0) {
            throw new Error('Invalid email or password');
          }

          const user = result.rows[0];

          // Verify password
          const isValidPassword = await bcrypt.compare(credentials.password, user.password_hash);
          
          if (!isValidPassword) {
            throw new Error('Invalid email or password');
          }

          // Return user object (without password)
          return {
            id: user.id,
            username: user.username,
            email: user.email,
            domain: user.domain as Domain,
            role: user.role as UserRole,
            xp: user.xp,
            level: user.level,
            avatar_url: user.avatar_url,
            bio: user.bio,
            is_active: user.is_active,
            email_verified: user.email_verified,
            created_at: user.created_at,
            updated_at: user.updated_at
          };
        } catch (error) {
          console.error('Authentication error:', error);
          throw new Error('Authentication failed');
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      // Include user data in JWT token
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.domain = user.domain;
        token.role = user.role;
        token.xp = user.xp;
        token.level = user.level;
        token.avatar_url = user.avatar_url;
        token.bio = user.bio;
        token.is_active = user.is_active;
        token.email_verified = user.email_verified;
      }
      return token;
    },
    async session({ session, token }) {
      // Include user data in session
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.domain = token.domain as Domain;
        session.user.role = token.role as UserRole;
        session.user.xp = token.xp as number;
        session.user.level = token.level as number;
        session.user.avatar_url = token.avatar_url as string;
        session.user.bio = token.bio as string;
        session.user.is_active = token.is_active as boolean;
        session.user.email_verified = token.email_verified as boolean;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Helper function to hash passwords
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

// Helper function to verify passwords
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}