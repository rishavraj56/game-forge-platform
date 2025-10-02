'use client';

import React, { useState, useEffect } from 'react';
import { BellIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid';
import { useNotifications } from '@/hooks/useRealtime';
import { useSession } from 'next-auth/react';
import { formatDistanceToNow } from 'date-fns';

interface NotificationCenterProps {
  className?: string;
}

export function NotificationCenter({ className = '' }: NotificationCenterProps) {
  const { data: session } = useSession();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(session?.user?.id);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleMarkAsRead = async (notificationId: string) => {
    setIsLoading(true);
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
      });
      markAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
      });
      markAllAsRead();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'achievement':
        return '🏆';
      case 'mention':
        return '💬';
      case 'event_reminder':
        return '⏰';
      case 'quest_available':
        return '🎯';
      case 'system':
        return '📢';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'achievement':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'mention':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'event_reminder':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'quest_available':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'system':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg transition-colors"
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        {unreadCount > 0 ? (
          <BellSolidIcon className="h-6 w-6 text-blue-600" />
        ) : (
          <BellIcon className="h-6 w-6" />
        )}
        
        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Panel */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    disabled={isLoading}
                    className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500">
                  <BellIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No notifications yet</p>
                  <p className="text-sm">We'll notify you when something happens!</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`px-4 py-3 hover:bg-gray-50 transition-colors ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Notification Icon */}
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${getNotificationColor(notification.type)}`}>
                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Notification Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                                {notification.title}
                              </p>
                              <p className={`text-sm mt-1 ${!notification.read ? 'text-gray-700' : 'text-gray-500'}`}>
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                              </p>
                            </div>

                            {/* Mark as Read Button */}
                            {!notification.read && (
                              <button
                                onClick={() => handleMarkAsRead(notification.id)}
                                disabled={isLoading}
                                className="flex-shrink-0 ml-2 p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                                title="Mark as read"
                              >
                                <CheckIcon className="h-4 w-4" />
                              </button>
                            )}
                          </div>

                          {/* Unread Indicator */}
                          {!notification.read && (
                            <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    // Navigate to full notifications page
                    window.location.href = '/notifications';
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  View all notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default NotificationCenter;