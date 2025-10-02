'use client';

import React, { useState, useEffect } from 'react';
import { Switch } from '@headlessui/react';
import { type NotificationType } from '@/lib/services/notification-service';

interface NotificationPreference {
  type: NotificationType;
  label: string;
  description: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
}

interface NotificationPreferencesProps {
  className?: string;
}

export function NotificationPreferences({ className = '' }: NotificationPreferencesProps) {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([
    {
      type: 'achievement',
      label: 'Achievements & Rewards',
      description: 'Quest completions, badges earned, level ups',
      inAppEnabled: true,
      emailEnabled: true,
    },
    {
      type: 'mention',
      label: 'Mentions & Replies',
      description: 'When someone mentions you or replies to your posts',
      inAppEnabled: true,
      emailEnabled: true,
    },
    {
      type: 'event_reminder',
      label: 'Event Reminders',
      description: 'Upcoming events, game jams, and workshops',
      inAppEnabled: true,
      emailEnabled: true,
    },
    {
      type: 'quest_available',
      label: 'New Quests',
      description: 'Daily and weekly quest notifications',
      inAppEnabled: true,
      emailEnabled: false,
    },
    {
      type: 'system',
      label: 'System Announcements',
      description: 'Platform updates and important announcements',
      inAppEnabled: true,
      emailEnabled: false,
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Load user preferences on component mount
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      // Load preferences for each type
      const updatedPreferences = await Promise.all(
        preferences.map(async (pref) => {
          const response = await fetch(`/api/notifications/preferences?type=${pref.type}`);
          if (response.ok) {
            const data = await response.json();
            if (data.preferences) {
              return {
                ...pref,
                inAppEnabled: data.preferences.inAppEnabled,
                emailEnabled: data.preferences.emailEnabled,
              };
            }
          }
          return pref;
        })
      );
      setPreferences(updatedPreferences);
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
  };

  const updatePreference = async (type: NotificationType, field: 'inAppEnabled' | 'emailEnabled', value: boolean) => {
    setIsLoading(true);
    setSaveStatus('saving');

    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          [field]: value,
        }),
      });

      if (response.ok) {
        // Update local state
        setPreferences(prev =>
          prev.map(pref =>
            pref.type === type
              ? { ...pref, [field]: value }
              : pref
          )
        );
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch (error) {
      console.error('Error updating notification preference:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusMessage = () => {
    switch (saveStatus) {
      case 'saving':
        return 'Saving...';
      case 'saved':
        return 'Preferences saved!';
      case 'error':
        return 'Error saving preferences';
      default:
        return '';
    }
  };

  const getStatusColor = () => {
    switch (saveStatus) {
      case 'saving':
        return 'text-blue-600';
      case 'saved':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return '';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Notification Preferences</h3>
        <p className="text-sm text-gray-600 mt-1">
          Choose how you want to be notified about different activities
        </p>
        {saveStatus !== 'idle' && (
          <p className={`text-sm mt-2 ${getStatusColor()}`}>
            {getStatusMessage()}
          </p>
        )}
      </div>

      <div className="px-6 py-4">
        <div className="space-y-6">
          {/* Column Headers */}
          <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700 border-b border-gray-200 pb-3">
            <div className="col-span-6">Notification Type</div>
            <div className="col-span-3 text-center">In-App</div>
            <div className="col-span-3 text-center">Email</div>
          </div>

          {/* Preference Rows */}
          {preferences.map((preference) => (
            <div key={preference.type} className="grid grid-cols-12 gap-4 items-center">
              {/* Notification Type Info */}
              <div className="col-span-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    {preference.label}
                  </h4>
                  <p className="text-sm text-gray-500 mt-1">
                    {preference.description}
                  </p>
                </div>
              </div>

              {/* In-App Toggle */}
              <div className="col-span-3 flex justify-center">
                <Switch
                  checked={preference.inAppEnabled}
                  onChange={(value) => updatePreference(preference.type, 'inAppEnabled', value)}
                  disabled={isLoading}
                  className={`${
                    preference.inAppEnabled ? 'bg-blue-600' : 'bg-gray-200'
                  } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50`}
                >
                  <span
                    className={`${
                      preference.inAppEnabled ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </Switch>
              </div>

              {/* Email Toggle */}
              <div className="col-span-3 flex justify-center">
                <Switch
                  checked={preference.emailEnabled}
                  onChange={(value) => updatePreference(preference.type, 'emailEnabled', value)}
                  disabled={isLoading}
                  className={`${
                    preference.emailEnabled ? 'bg-blue-600' : 'bg-gray-200'
                  } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50`}
                >
                  <span
                    className={`${
                      preference.emailEnabled ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </Switch>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Settings */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-4">Email Delivery</h4>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="radio"
                name="emailFrequency"
                value="immediate"
                defaultChecked
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-3 text-sm text-gray-700">
                Send emails immediately
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="emailFrequency"
                value="daily"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-3 text-sm text-gray-700">
                Daily digest (coming soon)
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="emailFrequency"
                value="weekly"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-3 text-sm text-gray-700">
                Weekly digest (coming soon)
              </span>
            </label>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> You can always change these settings later. In-app notifications 
            appear in your notification center, while email notifications are sent to your registered email address.
          </p>
        </div>
      </div>
    </div>
  );
}

export default NotificationPreferences;