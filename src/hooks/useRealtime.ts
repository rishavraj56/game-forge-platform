import { useEffect, useState, useCallback, useRef } from 'react';
import { realtimeManager } from '@/lib/realtime/connection-manager';
import { 
  realtimeEventHandlers, 
  type ActivityEvent, 
  type LeaderboardUpdate, 
  type NotificationEvent 
} from '@/lib/realtime/event-handlers';
import { type ConnectionStatus } from '@/lib/supabase';

/**
 * Hook for managing real-time connection status
 */
export function useRealtimeConnection() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('CLOSED');
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // Get initial status
    setConnectionStatus(realtimeManager.getConnectionStatus());

    // Subscribe to status changes
    const unsubscribe = realtimeManager.onStatusChange((status) => {
      setConnectionStatus(status);
      setIsConnecting(status === 'CONNECTING');
    });

    return unsubscribe;
  }, []);

  const connect = useCallback(() => {
    if (connectionStatus === 'CLOSED' || connectionStatus === 'ERROR') {
      setIsConnecting(true);
      // Connection will be established automatically when subscribing to channels
    }
  }, [connectionStatus]);

  const disconnect = useCallback(() => {
    realtimeManager.disconnect();
  }, []);

  return {
    connectionStatus,
    isConnecting,
    isConnected: connectionStatus === 'OPEN',
    connect,
    disconnect
  };
}

/**
 * Hook for subscribing to activity feed updates
 */
export function useActivityFeed() {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize real-time handlers
    realtimeEventHandlers.initialize();

    // Subscribe to activity updates
    const unsubscribe = realtimeEventHandlers.onActivity((activity) => {
      setActivities(prev => [activity, ...prev].slice(0, 50)); // Keep last 50 activities
    });

    // Load initial activities (this would typically fetch from API)
    setIsLoading(false);

    return () => {
      unsubscribe();
    };
  }, []);

  const clearActivities = useCallback(() => {
    setActivities([]);
  }, []);

  return {
    activities,
    isLoading,
    clearActivities
  };
}

/**
 * Hook for subscribing to leaderboard updates
 */
export function useLeaderboardUpdates() {
  const [updates, setUpdates] = useState<LeaderboardUpdate[]>([]);
  const [lastUpdate, setLastUpdate] = useState<LeaderboardUpdate | null>(null);

  useEffect(() => {
    // Initialize real-time handlers
    realtimeEventHandlers.initialize();

    // Subscribe to leaderboard updates
    const unsubscribe = realtimeEventHandlers.onLeaderboardUpdate((update) => {
      setLastUpdate(update);
      setUpdates(prev => [update, ...prev].slice(0, 20)); // Keep last 20 updates
    });

    return unsubscribe;
  }, []);

  return {
    updates,
    lastUpdate
  };
}

/**
 * Hook for user-specific notifications
 */
export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    // Initialize real-time handlers with user ID
    realtimeEventHandlers.initialize(userId);

    // Subscribe to notification updates
    const unsubscribe = realtimeEventHandlers.onNotification((notification) => {
      setNotifications(prev => {
        // Update existing notification or add new one
        const existingIndex = prev.findIndex(n => n.id === notification.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = notification;
          return updated;
        } else {
          return [notification, ...prev];
        }
      });

      // Update unread count
      if (!notification.read) {
        setUnreadCount(prev => prev + 1);
      }
    });

    // Load initial notifications (this would typically fetch from API)
    setIsLoading(false);

    return unsubscribe;
  }, [userId]);

  const markAsRead = useCallback(async (notificationId: string) => {
    // This would typically make an API call to mark as read
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    // This would typically make an API call to mark all as read
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead
  };
}

/**
 * Hook for broadcasting real-time events
 */
export function useRealtimeBroadcast() {
  const broadcastActivity = useCallback((activity: Omit<ActivityEvent, 'id' | 'timestamp'>) => {
    const fullActivity: ActivityEvent = {
      ...activity,
      id: `${activity.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };

    realtimeEventHandlers.broadcastActivity(fullActivity);
  }, []);

  const broadcastLeaderboardUpdate = useCallback((update: LeaderboardUpdate) => {
    realtimeEventHandlers.broadcastLeaderboardUpdate(update);
  }, []);

  return {
    broadcastActivity,
    broadcastLeaderboardUpdate
  };
}

/**
 * Hook for managing real-time presence (who's online)
 */
export function usePresence(channelName: string, userId?: string, userMetadata?: Record<string, any>) {
  const [presenceState, setPresenceState] = useState<Record<string, any>>({});
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!userId) return;

    // Subscribe to presence channel
    const channel = realtimeManager.subscribe(`presence-${channelName}`);
    channelRef.current = channel;

    // Track presence
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      setPresenceState(state);
      setOnlineUsers(Object.keys(state));
    });

    channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
      setOnlineUsers(prev => [...prev, key]);
    });

    channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      setOnlineUsers(prev => prev.filter(id => id !== key));
    });

    // Track current user's presence
    channel.track({
      userId,
      ...userMetadata,
      online_at: new Date().toISOString()
    });

    return () => {
      if (channelRef.current) {
        channelRef.current.untrack();
      }
      realtimeManager.unsubscribe(`presence-${channelName}`);
    };
  }, [channelName, userId, userMetadata]);

  return {
    presenceState,
    onlineUsers,
    isUserOnline: (checkUserId: string) => onlineUsers.includes(checkUserId)
  };
}

/**
 * Hook for real-time chat functionality
 */
export function useRealtimeChat(channelId: string, userId?: string) {
  const [messages, setMessages] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState<string[]>([]);

  useEffect(() => {
    if (!channelId) return;

    const channel = realtimeManager.subscribe(`chat-${channelId}`);

    // Listen for new messages
    channel.on('broadcast', { event: 'message' }, (payload) => {
      setMessages(prev => [...prev, payload.payload]);
    });

    // Listen for typing indicators
    channel.on('broadcast', { event: 'typing' }, (payload) => {
      const { userId: typingUserId, isTyping: typing } = payload.payload;
      
      setIsTyping(prev => {
        if (typing) {
          return prev.includes(typingUserId) ? prev : [...prev, typingUserId];
        } else {
          return prev.filter(id => id !== typingUserId);
        }
      });
    });

    return () => {
      realtimeManager.unsubscribe(`chat-${channelId}`);
    };
  }, [channelId]);

  const sendMessage = useCallback((message: any) => {
    if (!channelId) return;

    const channel = realtimeManager.subscribe(`chat-${channelId}`);
    channel.send({
      type: 'broadcast',
      event: 'message',
      payload: {
        ...message,
        timestamp: new Date().toISOString()
      }
    });
  }, [channelId]);

  const sendTypingIndicator = useCallback((typing: boolean) => {
    if (!channelId || !userId) return;

    const channel = realtimeManager.subscribe(`chat-${channelId}`);
    channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        userId,
        isTyping: typing
      }
    });
  }, [channelId, userId]);

  return {
    messages,
    isTyping,
    sendMessage,
    sendTypingIndicator
  };
}