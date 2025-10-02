'use client';

import { useState, useEffect, useCallback } from 'react';
import { Notification, NotificationType, NotificationPreferences } from '@/lib/types';
import { 
  mockNotifications,
  mockNotificationPreferences,
  getUnreadNotifications,
  getNotificationsByType
} from '@/lib/mock-data';
import { useAuth } from '@/contexts/auth-context';

interface UseNotificationsOptions {
  type?: NotificationType;
  unreadOnly?: boolean;
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface NotificationsData {
  notifications: Notification[];
  unreadCount: number;
  preferences: NotificationPreferences | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const {
    type,
    unreadOnly = false,
    limit = 20,
    autoRefresh = true,
    refreshInterval = 30000 // 30 seconds
  } = options;

  const { user } = useAuth();

  const [data, setData] = useState<NotificationsData>({
    notifications: [],
    unreadCount: 0,
    preferences: null,
    isLoading: true,
    error: null,
    lastUpdated: null,
  });

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    setData(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 200));

      let notifications = mockNotifications.filter(n => n.userId === user.id);

      // Filter by type if specified
      if (type) {
        notifications = getNotificationsByType(user.id, type);
      }

      // Filter unread only if specified
      if (unreadOnly) {
        notifications = getUnreadNotifications(user.id);
      }

      // Sort by creation date (newest first)
      notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      // Apply limit
      const limitedNotifications = notifications.slice(0, limit);

      // Count unread notifications
      const unreadCount = getUnreadNotifications(user.id).length;

      setData({
        notifications: limitedNotifications,
        unreadCount,
        preferences: mockNotificationPreferences,
        isLoading: false,
        error: null,
        lastUpdated: new Date(),
      });
    } catch (error) {
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load notifications',
      }));
    }
  }, [user, type, unreadOnly, limit]);

  // Initial load
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchNotifications, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchNotifications]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 100));

      setData(prev => ({
        ...prev,
        notifications: prev.notifications.map(notification =>
          notification.id === notificationId
            ? { ...notification, isRead: true, readAt: new Date() }
            : notification
        ),
        unreadCount: Math.max(0, prev.unreadCount - 1),
      }));

      // Save to localStorage
      const savedNotifications = localStorage.getItem('gameforge_notifications');
      let notificationsData = savedNotifications ? JSON.parse(savedNotifications) : [];
      
      const existingIndex = notificationsData.findIndex((n: Notification) => n.id === notificationId);
      if (existingIndex >= 0) {
        notificationsData[existingIndex] = {
          ...notificationsData[existingIndex],
          isRead: true,
          readAt: new Date()
        };
      }
      
      localStorage.setItem('gameforge_notifications', JSON.stringify(notificationsData));
    } catch (error) {
      throw new Error('Failed to mark notification as read');
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));

      setData(prev => ({
        ...prev,
        notifications: prev.notifications.map(notification => ({
          ...notification,
          isRead: true,
          readAt: notification.readAt || new Date()
        })),
        unreadCount: 0,
      }));

      // Save to localStorage
      const savedNotifications = localStorage.getItem('gameforge_notifications');
      let notificationsData = savedNotifications ? JSON.parse(savedNotifications) : [];
      
      notificationsData = notificationsData.map((n: Notification) => ({
        ...n,
        isRead: true,
        readAt: n.readAt || new Date()
      }));
      
      localStorage.setItem('gameforge_notifications', JSON.stringify(notificationsData));
    } catch (error) {
      throw new Error('Failed to mark all notifications as read');
    }
  }, [user]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 200));

      const notification = data.notifications.find(n => n.id === notificationId);
      const wasUnread = notification && !notification.isRead;

      setData(prev => ({
        ...prev,
        notifications: prev.notifications.filter(n => n.id !== notificationId),
        unreadCount: wasUnread ? Math.max(0, prev.unreadCount - 1) : prev.unreadCount,
      }));

      // Remove from localStorage
      const savedNotifications = localStorage.getItem('gameforge_notifications');
      let notificationsData = savedNotifications ? JSON.parse(savedNotifications) : [];
      notificationsData = notificationsData.filter((n: Notification) => n.id !== notificationId);
      localStorage.setItem('gameforge_notifications', JSON.stringify(notificationsData));
    } catch (error) {
      throw new Error('Failed to delete notification');
    }
  }, [data.notifications]);

  const updatePreferences = useCallback(async (preferences: Partial<NotificationPreferences>) => {
    if (!user) return;

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));

      setData(prev => ({
        ...prev,
        preferences: prev.preferences 
          ? { ...prev.preferences, ...preferences, updatedAt: new Date() }
          : null,
      }));

      // Save to localStorage
      const updatedPreferences = {
        ...mockNotificationPreferences,
        ...preferences,
        updatedAt: new Date()
      };
      localStorage.setItem('gameforge_notification_preferences', JSON.stringify(updatedPreferences));
    } catch (error) {
      throw new Error('Failed to update notification preferences');
    }
  }, [user]);

  const refresh = useCallback(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    ...data,
    refresh,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updatePreferences,
  };
}