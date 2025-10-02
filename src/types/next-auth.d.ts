import 'next-auth';
import { Domain, UserRole } from '../lib/types';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      username: string;
      email: string;
      domain: Domain;
      role: UserRole;
      xp: number;
      level: number;
      avatar_url?: string;
      bio?: string;
      is_active: boolean;
      email_verified: boolean;
    };
  }

  interface User {
    id: string;
    username: string;
    email: string;
    domain: Domain;
    role: UserRole;
    xp: number;
    level: number;
    avatar_url?: string;
    bio?: string;
    is_active: boolean;
    email_verified: boolean;
    created_at: Date;
    updated_at: Date;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    username: string;
    domain: Domain;
    role: UserRole;
    xp: number;
    level: number;
    avatar_url?: string;
    bio?: string;
    is_active: boolean;
    email_verified: boolean;
  }
}