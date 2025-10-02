// Real-time connection management
export { realtimeManager, RealtimeConnectionManager } from './connection-manager';
export type { ConnectionStatus, RealtimeChannel, RealtimeEvent } from '../supabase';

// Real-time event handlers
export { 
  realtimeEventHandlers, 
  RealtimeEventHandlers,
  type ActivityEvent,
  type LeaderboardUpdate,
  type NotificationEvent,
  type EventHandler,
  type ActivityEventHandler,
  type LeaderboardEventHandler,
  type NotificationEventHandler
} from './event-handlers';

// React hooks for real-time features
export {
  useRealtimeConnection,
  useActivityFeed,
  useLeaderboardUpdates,
  useNotifications,
  useRealtimeBroadcast,
  usePresence,
  useRealtimeChat
} from '../../hooks/useRealtime';

// React components
export { 
  RealtimeProvider, 
  useRealtimeContext, 
  ConnectionStatusIndicator 
} from '../../components/providers/RealtimeProvider';

// Notification system
export { 
  NotificationService,
  type NotificationType,
  type NotificationData,
  type NotificationPreferences,
  type Notification
} from '../services/notification-service';

export { EmailService } from '../services/email-service';

// Notification components
export { default as NotificationCenter } from '../../components/notifications/NotificationCenter';
export { default as NotificationPreferences } from '../../components/notifications/NotificationPreferences';

// API helpers
export { broadcastActivity, broadcastLeaderboardUpdate } from '../../app/api/realtime/broadcast/route';