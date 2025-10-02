'use client';

import React, { createContext, useContext, useEffect, ReactNode, useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { User, LoginCredentials, RegisterData, ProfileUpdateData } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: ProfileUpdateData) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);

  // Update user state when session changes
  useEffect(() => {
    if (session?.user) {
      setUser(session.user as User);
    } else {
      setUser(null);
    }
  }, [session]);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    const result = await signIn('credentials', {
      email: credentials.email,
      password: credentials.password,
      redirect: false,
    });

    if (result?.error) {
      throw new Error(result.error);
    }
  };

  const register = async (data: RegisterData): Promise<void> => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error?.message || 'Registration failed');
    }

    // After successful registration, automatically log in
    await login({ email: data.email, password: data.password });
  };

  const logout = async (): Promise<void> => {
    await signOut({ redirect: false });
  };

  const updateProfile = async (data: ProfileUpdateData): Promise<void> => {
    if (!user) {
      throw new Error('No user logged in');
    }

    const response = await fetch(`/api/users/${user.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error?.message || 'Profile update failed');
    }

    // Update local user state
    setUser(prev => prev ? { ...prev, ...data } : null);
  };

  const value: AuthContextType = {
    user,
    loading: status === 'loading',
    login,
    register,
    logout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}