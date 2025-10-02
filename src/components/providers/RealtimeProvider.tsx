'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { realtimeEventHandlers } from '@/lib/realtime/event-handlers';
import { realtimeManager } from '@/lib/realtime/connection-manager';
import { type ConnectionStatus } from '@/lib/supabase';

interface RealtimeContextType {
  connectionStatus: ConnectionStatus;
  isConnected: boolean;
  isInitialized: boolean;
  reconnect: () => void;
  disconnect: () => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

interface RealtimeProviderProps {
  children: ReactNode;
  autoConnect?: boolean;
}

export function RealtimeProvider({ children, autoConnect = true }: RealtimeProviderProps) {
  const { data: session, status } = useSession();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('CLOSED');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Subscribe to connection status changes
    const unsubscribe = realtimeManager.onStatusChange(setConnectionStatus);
    
    // Set initial status
    setConnectionStatus(realtimeManager.getConnectionStatus());

    return unsubscribe;
  }, []);

  useEffect(() => {
    // Initialize real-time features when user is authenticated
    if (status === 'authenticated' && session?.user && autoConnect && !isInitialized) {
      console.log('Initializing real-time features for user:', session.user.id);
      
      // Initialize event handlers with user ID
      realtimeEventHandlers.initialize(session.user.id);
      setIsInitialized(true);
    }

    // Cleanup when user logs out
    if (status === 'unauthenticated' && isInitialized) {
      console.log('Cleaning up real-time features');
      realtimeEventHandlers.cleanup();
      realtimeManager.disconnect();
      setIsInitialized(false);
    }
  }, [status, session?.user, autoConnect, isInitialized]);

  const reconnect = () => {
    if (session?.user) {
      realtimeEventHandlers.initialize(session.user.id);
      setIsInitialized(true);
    }
  };

  const disconnect = () => {
    realtimeEventHandlers.cleanup();
    realtimeManager.disconnect();
    setIsInitialized(false);
  };

  const contextValue: RealtimeContextType = {
    connectionStatus,
    isConnected: connectionStatus === 'OPEN',
    isInitialized,
    reconnect,
    disconnect
  };

  return (
    <RealtimeContext.Provider value={contextValue}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtimeContext() {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtimeContext must be used within a RealtimeProvider');
  }
  return context;
}

// Connection status indicator component
export function ConnectionStatusIndicator() {
  const { connectionStatus, isConnected, reconnect } = useRealtimeContext();

  if (isConnected) {
    return (
      <div className="flex items-center gap-2 text-green-600 text-sm">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span>Connected</span>
      </div>
    );
  }

  if (connectionStatus === 'CONNECTING') {
    return (
      <div className="flex items-center gap-2 text-yellow-600 text-sm">
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
        <span>Connecting...</span>
      </div>
    );
  }

  if (connectionStatus === 'ERROR' || connectionStatus === 'CLOSED') {
    return (
      <div className="flex items-center gap-2 text-red-600 text-sm">
        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
        <span>Disconnected</span>
        <button
          onClick={reconnect}
          className="text-xs underline hover:no-underline"
        >
          Reconnect
        </button>
      </div>
    );
  }

  return null;
}