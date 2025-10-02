import { sql } from '@vercel/postgres';
import { supabaseAdmin } from '@/lib/supabase';
import { EmailService } from './email-service';

export type NotificationType = 'mention' | 'quest_available' | 'event_reminder' | 'achievement' | 'system';

export interface NotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface NotificationPreferences {
  type: NotificationType;
  inAppEnabled: boolean;
  emailEnabled: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata: Record<string, any>;
  read: boolean;
  emailSent: boolean;
  createdAt: string;
  updatedAt: string;
}

export class NotificationService {
  /**
   * Create a new notification
   */
  static async createNotification(data: NotificationData): Promise<Notification | null> {
    try {
      // Check user's notification preferences
      const preferences = await this.getUserPreferences(data.userId, data.type);
      
      if (!preferences?.inAppEnabled) {
        console.log(`In-app notifications disabled for user ${data.userId}, type ${data.type}`);
        return null;
      }

      // Insert notification into database
      const result = await sql`
        INSERT INTO notifications (user_id, type, title, message, metadata)
        VALUES (${data.userId}, ${data.type}, ${data.title}, ${data.message}, ${JSON.stringify(data.metadata || {})})
        RETURNING *
      `;

      if (result.rows.length === 0) {
        throw new Error('Failed to create notification');
      }

      const notification = this.mapRowToNotification(result.rows[0]);

      // Send real-time notification
      await this.sendRealtimeNotification(notification);

      // Send email notification if enabled
      if (preferences?.emailEnabled) {
        await this.sendEmailNotification(notification);
      }

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }

  /**
   * Get notifications for a user
   */
  static async getUserNotifications(
    userId: string, 
    options: {
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
    } = {}
  ): Promise<{ notifications: Notification[]; total: number }> {
    try {
      const { limit = 20, offset = 0, unreadOnly = false } = options;

      // Build query conditions
      let whereClause = 'WHERE user_id = $1';
      const params: any[] = [userId];
      
      if (unreadOnly) {
        whereClause += ' AND read = false';
      }

      // Get total count
      const countResult = await sql.query(
        `SELECT COUNT(*) as total FROM notifications ${whereClause}`,
        params
      );
      const total = parseInt(countResult.rows[0].total);

      // Get notifications
      const result = await sql.query(
        `SELECT * FROM notifications 
         ${whereClause}
         ORDER BY created_at DESC 
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      );

      const notifications = result.rows.map(this.mapRowToNotification);

      return { notifications, total };
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      return { notifications: [], total: 0 };
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      const result = await sql`
        UPDATE notifications 
        SET read = true, updated_at = NOW()
        WHERE id = ${notificationId} AND user_id = ${userId}
        RETURNING *
      `;

      if (result.rows.length > 0) {
        // Send real-time update
        const notification = this.mapRowToNotification(result.rows[0]);
        await this.sendRealtimeNotification(notification);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string): Promise<boolean> {
    try {
      await sql`
        UPDATE notifications 
        SET read = true, updated_at = NOW()
        WHERE user_id = ${userId} AND read = false
      `;

      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  /**
   * Get unread notification count for a user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const result = await sql`
        SELECT COUNT(*) as count 
        FROM notifications 
        WHERE user_id = ${userId} AND read = false
      `;

      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Get user notification preferences
   */
  static async getUserPreferences(userId: string, type?: NotificationType): Promise<NotificationPreferences | null> {
    try {
      let query = 'SELECT * FROM notification_preferences WHERE user_id = $1';
      const params: any[] = [userId];

      if (type) {
        query += ' AND type = $2';
        params.push(type);
      }

      const result = await sql.query(query, params);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        type: row.type,
        inAppEnabled: row.in_app_enabled,
        emailEnabled: row.email_enabled
      };
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      return null;
    }
  }

  /**
   * Update user notification preferences
   */
  static async updateUserPreferences(
    userId: string, 
    type: NotificationType, 
    preferences: Partial<NotificationPreferences>
  ): Promise<boolean> {
    try {
      const updates: string[] = [];
      const params: any[] = [userId, type];
      let paramIndex = 3;

      if (preferences.inAppEnabled !== undefined) {
        updates.push(`in_app_enabled = $${paramIndex++}`);
        params.push(preferences.inAppEnabled);
      }

      if (preferences.emailEnabled !== undefined) {
        updates.push(`email_enabled = $${paramIndex++}`);
        params.push(preferences.emailEnabled);
      }

      if (updates.length === 0) {
        return true;
      }

      updates.push(`updated_at = NOW()`);

      await sql.query(
        `UPDATE notification_preferences 
         SET ${updates.join(', ')}
         WHERE user_id = $1 AND type = $2`,
        params
      );

      return true;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      return false;
    }
  }

  /**
   * Send real-time notification via Supabase
   */
  private static async sendRealtimeNotification(notification: Notification): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .channel(`notifications-${notification.userId}`)
        .send({
          type: 'broadcast',
          event: 'notification',
          payload: notification
        });

      if (error) {
        console.error('Failed to send real-time notification:', error);
      }
    } catch (error) {
      console.error('Error sending real-time notification:', error);
    }
  }

  /**
   * Send email notification
   */
  private static async sendEmailNotification(notification: Notification): Promise<void> {
    try {
      // Get user's email and name from the database
      const userResult = await sql`
        SELECT email, username 
        FROM users 
        WHERE id = ${notification.userId}
      `;

      if (userResult.rows.length === 0) {
        console.error('User not found for email notification:', notification.userId);
        return;
      }

      const { email, username } = userResult.rows[0];

      // Send email using EmailService
      const emailSent = await EmailService.sendNotificationEmail(email, username, notification);

      // Mark email as sent if successful
      if (emailSent) {
        await sql`
          UPDATE notifications 
          SET email_sent = true 
          WHERE id = ${notification.id}
        `;
        console.log(`Email notification sent to ${email} for notification ${notification.id}`);
      } else {
        console.error(`Failed to send email notification to ${email} for notification ${notification.id}`);
      }

    } catch (error) {
      console.error('Error sending email notification:', error);
    }
  }

  /**
   * Map database row to Notification object
   */
  private static mapRowToNotification(row: any): Notification {
    return {
      id: row.id,
      userId: row.user_id,
      type: row.type,
      title: row.title,
      message: row.message,
      metadata: row.metadata || {},
      read: row.read,
      emailSent: row.email_sent,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Create notification for quest completion
   */
  static async notifyQuestCompletion(userId: string, questTitle: string, xpEarned: number): Promise<void> {
    await this.createNotification({
      userId,
      type: 'achievement',
      title: 'Quest Completed!',
      message: `You completed "${questTitle}" and earned ${xpEarned} XP!`,
      metadata: {
        questTitle,
        xpEarned,
        type: 'quest_completion'
      }
    });
  }

  /**
   * Create notification for badge earned
   */
  static async notifyBadgeEarned(userId: string, badgeName: string): Promise<void> {
    await this.createNotification({
      userId,
      type: 'achievement',
      title: 'Badge Earned!',
      message: `Congratulations! You earned the "${badgeName}" badge!`,
      metadata: {
        badgeName,
        type: 'badge_earned'
      }
    });
  }

  /**
   * Create notification for level up
   */
  static async notifyLevelUp(userId: string, newLevel: number): Promise<void> {
    await this.createNotification({
      userId,
      type: 'achievement',
      title: 'Level Up!',
      message: `Amazing! You've reached level ${newLevel}!`,
      metadata: {
        newLevel,
        type: 'level_up'
      }
    });
  }

  /**
   * Create notification for event reminder
   */
  static async notifyEventReminder(userId: string, eventTitle: string, startTime: string): Promise<void> {
    await this.createNotification({
      userId,
      type: 'event_reminder',
      title: 'Event Starting Soon',
      message: `"${eventTitle}" starts in 1 hour!`,
      metadata: {
        eventTitle,
        startTime,
        type: 'event_reminder'
      }
    });
  }

  /**
   * Create notification for mention
   */
  static async notifyMention(userId: string, mentionedBy: string, context: string): Promise<void> {
    await this.createNotification({
      userId,
      type: 'mention',
      title: 'You were mentioned',
      message: `${mentionedBy} mentioned you in ${context}`,
      metadata: {
        mentionedBy,
        context,
        type: 'mention'
      }
    });
  }

  /**
   * Create system notification
   */
  static async notifySystem(userId: string, title: string, message: string, metadata?: Record<string, any>): Promise<void> {
    await this.createNotification({
      userId,
      type: 'system',
      title,
      message,
      metadata: {
        ...metadata,
        type: 'system'
      }
    });
  }
}