'use client';

import React, { useState } from 'react';
import { Card } from './card';
import { Button } from './button';
import { NotificationPreferences } from '@/lib/types';
import { mockNotificationPreferences } from '@/lib/mock-data';

interface NotificationPreferencesProps {
  userId: string;
  onSave?: (preferences: NotificationPreferences) => void;
}

export function NotificationPreferencesComponent({ userId, onSave }: NotificationPreferencesProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences>(mockNotificationPreferences);
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = (category: 'inApp' | 'email', type: keyof NotificationPreferences['inApp']) => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [type]: !prev[category][type]
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      onSave?.(preferences);
    } finally {
      setIsSaving(false);
    }
  };

  const notificationTypes = [
    { key: 'questCompleted', label: 'Quest Completed', description: 'When you complete daily or weekly quests' },
    { key: 'badgeEarned', label: 'Badge Earned', description: 'When you unlock new badges or achievements' },
    { key: 'levelUp', label: 'Level Up', description: 'When you reach a new level' },
    { key: 'postReaction', label: 'Post Reactions', description: 'When someone reacts to your posts' },
    { key: 'commentReply', label: 'Comment Replies', description: 'When someone replies to your comments' },
    { key: 'mention', label: 'Mentions', description: 'When someone mentions you in a post' },
    { key: 'eventReminder', label: 'Event Reminders', description: 'Reminders for upcoming events you\'re registered for' },
    { key: 'eventRegistration', label: 'Event Registration', description: 'Confirmations when you register for events' },
    { key: 'moduleCompleted', label: 'Module Completed', description: 'When you complete learning modules' },
    { key: 'systemAnnouncement', label: 'System Announcements', description: 'Important platform updates and news' },
    { key: 'domainAnnouncement', label: 'Domain Announcements', description: 'Updates from your domain leads' }
  ] as const;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Notification Preferences</h2>
        <p className="text-gray-600">
          Choose how you want to be notified about different activities on The Game Forge.
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-3 gap-4">
            <div className="font-medium text-gray-900">Notification Type</div>
            <div className="font-medium text-gray-900 text-center">In-App</div>
            <div className="font-medium text-gray-900 text-center">Email</div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {notificationTypes.map((type) => (
            <div key={type.key} className="px-6 py-4">
              <div className="grid grid-cols-3 gap-4 items-center">
                <div>
                  <h4 className="font-medium text-gray-900">{type.label}</h4>
                  <p className="text-sm text-gray-500 mt-1">{type.description}</p>
                </div>
                
                <div className="flex justify-center">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={preferences.inApp[type.key]}
                      onChange={() => handleToggle('inApp', type.key)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div className="flex justify-center">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={preferences.email[type.key]}
                      onChange={() => handleToggle('email', type.key)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Changes are saved automatically when you toggle settings.
            </div>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="min-w-[100px]"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="space-y-3">
          <Button
            variant="outline"
            onClick={() => {
              setPreferences(prev => ({
                ...prev,
                inApp: Object.keys(prev.inApp).reduce((acc, key) => ({
                  ...acc,
                  [key]: true
                }), {} as NotificationPreferences['inApp'])
              }));
            }}
            className="w-full sm:w-auto"
          >
            Enable All In-App Notifications
          </Button>
          
          <Button
            variant="outline"
            onClick={() => {
              setPreferences(prev => ({
                ...prev,
                email: Object.keys(prev.email).reduce((acc, key) => ({
                  ...acc,
                  [key]: false
                }), {} as NotificationPreferences['email'])
              }));
            }}
            className="w-full sm:w-auto ml-0 sm:ml-3"
          >
            Disable All Email Notifications
          </Button>
        </div>
      </Card>
    </div>
  );
}