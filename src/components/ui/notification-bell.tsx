'use client';

import React, { useState } from 'react';
import { NotificationBadge } from './notification-badge';
import { NotificationCenter } from './notification-center';
import { getUnreadNotifications } from '@/lib/mock-data';

interface NotificationBellProps {
  userId: string;
  className?: string;
}

export function NotificationBell({ userId, className }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const unreadNotifications = getUnreadNotifications(userId);
  const unreadCount = unreadNotifications.length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 text-gray-600 hover:text-gray-900 transition-colors ${className}`}
        aria-label={`Notifications (${unreadCount} unread)`}
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-5 5v-5zM10.5 3.5a6 6 0 0 1 6 6v2l1.5 3h-15l1.5-3v-2a6 6 0 0 1 6-6z"
          />
        </svg>
        <NotificationBadge count={unreadCount} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Notification Center */}
          <div className="absolute right-0 top-full z-50 mt-2">
            <NotificationCenter
              userId={userId}
              onClose={() => setIsOpen(false)}
            />
          </div>
        </>
      )}
    </div>
  );
}