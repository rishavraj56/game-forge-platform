'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { NotificationItem } from '@/components/ui/notification-item';
import { NotificationPreferencesComponent } from '@/components/ui/notification-preferences';
import { getRecentNotifications, getUnreadNotifications } from '@/lib/mock-data';
import { Notification } from '@/lib/types';

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<'notifications' | 'preferences'>('notifications');
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [notifications, setNotifications] = useState(() => getRecentNotifications('1', 50));
  
  const unreadNotifications = getUnreadNotifications('1');
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
          <p className="text-gray-600">
            Stay up to date with your Game Forge activity and community updates.
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('notifications')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'notifications'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Notifications
                {unreadNotifications.length > 0 && (
                  <span className="ml-2 bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs font-medium">
                    {unreadNotifications.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('preferences')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'preferences'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Preferences
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'notifications' ? (
          <div className="space-y-6">
            {/* Controls */}
            <Card className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <div className="flex space-x-4">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      filter === 'all'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    All ({notifications.length})
                  </button>
                  <button
                    onClick={() => setFilter('unread')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      filter === 'unread'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Unread ({unreadNotifications.length})
                  </button>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  disabled={unreadNotifications.length === 0}
                >
                  Mark all as read
                </Button>
              </div>
            </Card>

            {/* Notifications List */}
            <Card className="overflow-hidden">
              {filteredNotifications.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="text-gray-400 mb-4">
                    <svg className="h-16 w-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-5 5v-5zM10.5 3.5a6 6 0 0 1 6 6v2l1.5 3h-15l1.5-3v-2a6 6 0 0 1 6-6z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                  </h3>
                  <p className="text-gray-500">
                    {filter === 'unread' 
                      ? 'All caught up! Check back later for new updates.'
                      : 'When you start participating in the community, your notifications will appear here.'
                    }
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={handleMarkAsRead}
                    />
                  ))}
                </div>
              )}
            </Card>
          </div>
        ) : (
          <NotificationPreferencesComponent
            userId="1"
            onSave={(preferences) => {
              console.log('Preferences saved:', preferences);
              // In a real app, this would make an API call
            }}
          />
        )}
      </div>
    </div>
  );
}