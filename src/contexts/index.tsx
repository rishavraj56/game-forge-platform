'use client';

import React, { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';
import { AuthProvider } from './auth-context';
import { GamificationProvider } from './gamification-context';
import { CommunityProvider } from './community-context';
import { LearningProvider } from './learning-context';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <SessionProvider>
      <AuthProvider>
        <GamificationProvider>
          <CommunityProvider>
            <LearningProvider>
              {children}
            </LearningProvider>
          </CommunityProvider>
        </GamificationProvider>
      </AuthProvider>
    </SessionProvider>
  );
}

// Re-export all hooks for convenience
export { useAuth } from './auth-context';
export { useGamification } from './gamification-context';
export { useCommunity } from './community-context';
export { useLearning } from './learning-context';