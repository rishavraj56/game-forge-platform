import { realtimeManager } from './connection-manager';
import { type RealtimeEvent } from '../supabase';

// Event handler types
export type EventHandler<T = any> = (event: RealtimeEvent<T>) => void;
export type ActivityEventHandler = (activity: ActivityEvent) => void;
export type LeaderboardEventHandler = (update: LeaderboardUpdate) => void;
export type NotificationEventHandler = (notification: NotificationEvent) => void;

// Event data types
export interface ActivityEvent {
  id: string;
  userId: string;
  username: string;
  type: 'quest_completed' | 'post_created' | 'badge_earned' | 'level_up' | 'event_joined';
  description: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface LeaderboardUpdate {
  userId: string;
  username: string;
  domain: string;
  oldPosition?: number;
  newPosition: number;
  xp: number;
  type: 'weekly' | 'all_time';
}

export interface NotificationEvent {
  id: string;
  userId: string;
  type: 'mention' | 'quest_available' | 'event_reminder' | 'achievement' | 'system';
  title: string;
  message: string;
  metadata?: Record<string, any>;
  read: boolean;
  createdAt: string;
}

export class RealtimeEventHandlers {
  private activityHandlers: Set<ActivityEventHandler> = new Set();
  private leaderboardHandlers: Set<LeaderboardEventHandler> = new Set();
  private notificationHandlers: Set<NotificationEventHandler> = new Set();
  private isInitialized = false;

  /**
   * Initialize all real-time event subscriptions
   */
  public initialize(userId?: string): void {
    if (this.isInitialized) {
      return;
    }

    this.setupActivityFeed();
    this.setupLeaderboardUpdates();
    
    if (userId) {
      this.setupUserNotifications(userId);
    }

    this.isInitialized = true;
  }

  /**
   * Set up activity feed real-time updates
   */
  private setupActivityFeed(): void {
    const channel = realtimeManager.subscribe('activity-feed');

    // Listen for new activity events
    channel.on('broadcast', { event: 'activity' }, (payload) => {
      const activity = payload.payload as ActivityEvent;
      this.notifyActivityHandlers(activity);
    });

    // Listen for database changes that should trigger activity updates
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'user_quest_progress',
        filter: 'completed=eq.true'
      },
      (payload) => {
        // Handle quest completion activity
        this.handleQuestCompletionActivity(payload);
      }
    );

    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'posts'
      },
      (payload) => {
        // Handle new post activity
        this.handlePostCreationActivity(payload);
      }
    );

    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'user_badges'
      },
      (payload) => {
        // Handle badge earned activity
        this.handleBadgeEarnedActivity(payload);
      }
    );
  }

  /**
   * Set up leaderboard real-time updates
   */
  private setupLeaderboardUpdates(): void {
    const channel = realtimeManager.subscribe('leaderboard-updates');

    // Listen for XP changes that affect leaderboards
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'users',
        filter: 'xp=neq.old.xp'
      },
      (payload) => {
        this.handleLeaderboardUpdate(payload);
      }
    );

    // Listen for broadcast leaderboard updates
    channel.on('broadcast', { event: 'leaderboard_update' }, (payload) => {
      const update = payload.payload as LeaderboardUpdate;
      this.notifyLeaderboardHandlers(update);
    });
  }

  /**
   * Set up user-specific notifications
   */
  private setupUserNotifications(userId: string): void {
    const channel = realtimeManager.subscribe(`notifications-${userId}`);

    // Listen for new notifications for this user
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        this.handleNewNotification(payload);
      }
    );

    // Listen for notification updates (read status changes)
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        this.handleNotificationUpdate(payload);
      }
    );
  }

  /**
   * Handle quest completion activity events
   */
  private handleQuestCompletionActivity(payload: any): void {
    // This would typically fetch additional data about the quest and user
    // For now, we'll create a basic activity event
    const activity: ActivityEvent = {
      id: `quest-${payload.new.id}`,
      userId: payload.new.user_id,
      username: 'Unknown User', // Would be fetched from user data
      type: 'quest_completed',
      description: 'Completed a quest',
      metadata: {
        questId: payload.new.quest_id,
        xpEarned: payload.new.xp_earned
      },
      timestamp: new Date().toISOString()
    };

    this.notifyActivityHandlers(activity);
  }

  /**
   * Handle post creation activity events
   */
  private handlePostCreationActivity(payload: any): void {
    const activity: ActivityEvent = {
      id: `post-${payload.new.id}`,
      userId: payload.new.author_id,
      username: 'Unknown User', // Would be fetched from user data
      type: 'post_created',
      description: 'Created a new post',
      metadata: {
        postId: payload.new.id,
        channelId: payload.new.channel_id
      },
      timestamp: payload.new.created_at
    };

    this.notifyActivityHandlers(activity);
  }

  /**
   * Handle badge earned activity events
   */
  private handleBadgeEarnedActivity(payload: any): void {
    const activity: ActivityEvent = {
      id: `badge-${payload.new.user_id}-${payload.new.badge_id}`,
      userId: payload.new.user_id,
      username: 'Unknown User', // Would be fetched from user data
      type: 'badge_earned',
      description: 'Earned a new badge',
      metadata: {
        badgeId: payload.new.badge_id
      },
      timestamp: payload.new.earned_at
    };

    this.notifyActivityHandlers(activity);
  }

  /**
   * Handle leaderboard updates
   */
  private handleLeaderboardUpdate(payload: any): void {
    const update: LeaderboardUpdate = {
      userId: payload.new.id,
      username: payload.new.username,
      domain: payload.new.domain,
      newPosition: 0, // Would be calculated based on new XP
      xp: payload.new.xp,
      type: 'all_time'
    };

    this.notifyLeaderboardHandlers(update);
  }

  /**
   * Handle new notification events
   */
  private handleNewNotification(payload: any): void {
    const notification: NotificationEvent = {
      id: payload.new.id,
      userId: payload.new.user_id,
      type: payload.new.type,
      title: payload.new.title,
      message: payload.new.message,
      metadata: payload.new.metadata,
      read: payload.new.read,
      createdAt: payload.new.created_at
    };

    this.notifyNotificationHandlers(notification);
  }

  /**
   * Handle notification updates
   */
  private handleNotificationUpdate(payload: any): void {
    const notification: NotificationEvent = {
      id: payload.new.id,
      userId: payload.new.user_id,
      type: payload.new.type,
      title: payload.new.title,
      message: payload.new.message,
      metadata: payload.new.metadata,
      read: payload.new.read,
      createdAt: payload.new.created_at
    };

    this.notifyNotificationHandlers(notification);
  }

  /**
   * Subscribe to activity feed updates
   */
  public onActivity(handler: ActivityEventHandler): () => void {
    this.activityHandlers.add(handler);
    return () => this.activityHandlers.delete(handler);
  }

  /**
   * Subscribe to leaderboard updates
   */
  public onLeaderboardUpdate(handler: LeaderboardEventHandler): () => void {
    this.leaderboardHandlers.add(handler);
    return () => this.leaderboardHandlers.delete(handler);
  }

  /**
   * Subscribe to notification updates
   */
  public onNotification(handler: NotificationEventHandler): () => void {
    this.notificationHandlers.add(handler);
    return () => this.notificationHandlers.delete(handler);
  }

  /**
   * Notify all activity handlers
   */
  private notifyActivityHandlers(activity: ActivityEvent): void {
    this.activityHandlers.forEach(handler => {
      try {
        handler(activity);
      } catch (error) {
        console.error('Error in activity handler:', error);
      }
    });
  }

  /**
   * Notify all leaderboard handlers
   */
  private notifyLeaderboardHandlers(update: LeaderboardUpdate): void {
    this.leaderboardHandlers.forEach(handler => {
      try {
        handler(update);
      } catch (error) {
        console.error('Error in leaderboard handler:', error);
      }
    });
  }

  /**
   * Notify all notification handlers
   */
  private notifyNotificationHandlers(notification: NotificationEvent): void {
    this.notificationHandlers.forEach(handler => {
      try {
        handler(notification);
      } catch (error) {
        console.error('Error in notification handler:', error);
      }
    });
  }

  /**
   * Broadcast an activity event to all connected clients
   */
  public broadcastActivity(activity: ActivityEvent): void {
    const channel = realtimeManager.subscribe('activity-feed');
    channel.send({
      type: 'broadcast',
      event: 'activity',
      payload: activity
    });
  }

  /**
   * Broadcast a leaderboard update to all connected clients
   */
  public broadcastLeaderboardUpdate(update: LeaderboardUpdate): void {
    const channel = realtimeManager.subscribe('leaderboard-updates');
    channel.send({
      type: 'broadcast',
      event: 'leaderboard_update',
      payload: update
    });
  }

  /**
   * Clean up all subscriptions
   */
  public cleanup(): void {
    if (this.isInitialized) {
      realtimeManager.unsubscribe('activity-feed');
      realtimeManager.unsubscribe('leaderboard-updates');
      
      this.activityHandlers.clear();
      this.leaderboardHandlers.clear();
      this.notificationHandlers.clear();
      
      this.isInitialized = false;
    }
  }
}

// Singleton instance
export const realtimeEventHandlers = new RealtimeEventHandlers();