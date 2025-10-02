'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card } from './card';
import { Button } from './button';
import { NotificationItem } from './notification-item';
import { getRecentNotifications, getUnreadNotifications } from '@/lib/mock-data';
import { Notification } from '@/lib/types';

interface NotificationCenterProps {
  userId: string;
  onClose: () => void;
}

export function NotificationCenter({ userId, onClose }: NotificationCenterProps) {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [notifications, setNotifications] = useState(() => getRecentNotifications(userId, 20));
  
  const unreadNotifications = getUnreadNotifications(userId);
  const filteredNotifications = filter === 'unread' 
    ? unreadNotifications 
    : notifications;

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, isRead: true, readAt: new Date() }
          : notif
      )
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => 
        !notif.isRead 
          ? { ...notif, isRead: true, readAt: new Date() }
          : notif
      )
    );
  };

  return (
    <Card className="w-96 max-h-96 overflow-hidden shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={unreadNotifications.length === 0}
          >
            Mark all read
          </Button>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            filter === 'unread'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Unread ({unreadNotifications.length})
        </button>
      </div>

      {/* Notifications List */}
      <div className="max-h-64 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 mb-2">
              <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-5 5v-5zM10.5 3.5a6 6 0 0 1 6 6v2l1.5 3h-15l1.5-3v-2a6 6 0 0 1 6-6z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onClick={onClose}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {filteredNotifications.length > 0 && (
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <Link
            href="/notifications"
            onClick={onClose}
            className="block text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View all notifications
          </Link>
        </div>
      )}
    </Card>
  );
}