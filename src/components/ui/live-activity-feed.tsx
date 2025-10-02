'use client';

import React, { useState, useEffect } from 'react';
import { Card } from './card';
import { Avatar, AvatarImage, AvatarFallback } from './avatar';
import { mockActivityFeed } from '@/lib/mock-data';
import { ActivityItem } from '@/components/dashboard';
import { formatDistanceToNow } from 'date-fns';

interface LiveActivityFeedProps {
  maxItems?: number;
  showHeader?: boolean;
  className?: string;
}

export function LiveActivityFeed({ maxItems = 10, showHeader = true, className }: LiveActivityFeedProps) {
  const [activities, setActivities] = useState(mockActivityFeed.slice(0, maxItems));
  const [newActivityCount, setNewActivityCount] = useState(0);
  const [isLive, setIsLive] = useState(true);

  // Simulate real-time updates
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      // Simulate new activity (in real app, this would come from WebSocket)
      const shouldAddActivity = Math.random() > 0.7; // 30% chance every 5 seconds
      
      if (shouldAddActivity) {
        const newActivity: ActivityItem = {
          id: `activity-${Date.now()}`,
          type: ['quest_completed', 'badge_earned', 'post_created', 'level_up'][Math.floor(Math.random() * 4)] as any,
          user: {
            id: Math.floor(Math.random() * 10).toString(),
            username: ['CodeCrafter42', 'PixelMaster', 'GameDesignGuru', 'AIWizard'][Math.floor(Math.random() * 4)],
            avatarUrl: `/avatars/avatar-${Math.floor(Math.random() * 10) + 1}.png`,
            domain: ['Game Development', 'Game Art', 'Game Design', 'AI for Game Development'][Math.floor(Math.random() * 4)] as any
          },
          title: 'Just completed a quest!',
          description: 'Earned 50 XP for community participation',
          timestamp: new Date(),
          xpGained: Math.floor(Math.random() * 100) + 25,
          metadata: {}
        };

        setActivities(prev => [newActivity, ...prev.slice(0, maxItems - 1)]);
        setNewActivityCount(prev => prev + 1);
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [isLive, maxItems]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'quest_completed':
        return (
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'badge_earned':
        return (
          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
        );
      case 'level_up':
        return (
          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        );
      case 'post_created':
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        );
    }
  };

  const handleViewNewActivities = () => {
    setNewActivityCount(0);
    // In a real app, this would scroll to top or refresh the feed
  };

  return (
    <Card className={className}>
      {showHeader && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-900">Live Activity</h3>
              <div className={`flex items-center space-x-1 ${isLive ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className="text-xs font-medium">{isLive ? 'LIVE' : 'PAUSED'}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {newActivityCount > 0 && (
                <button
                  onClick={handleViewNewActivities}
                  className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full hover:bg-blue-200 transition-colors"
                >
                  {newActivityCount} new
                </button>
              )}
              
              <button
                onClick={() => setIsLive(!isLive)}
                className={`p-1 rounded transition-colors ${
                  isLive ? 'text-green-600 hover:text-green-700' : 'text-gray-400 hover:text-gray-600'
                }`}
                title={isLive ? 'Pause live updates' : 'Resume live updates'}
              >
                {isLive ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-9-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-h-96 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 mb-2">
              <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">No recent activity</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {activities.map((activity, index) => (
              <div
                key={activity.id}
                className={`p-4 hover:bg-gray-50 transition-colors ${
                  index === 0 && newActivityCount > 0 ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={activity.user.avatarUrl} alt={activity.user.username} />
                    <AvatarFallback>{activity.user.username.charAt(0)}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900 text-sm">
                        {activity.user.username}
                      </span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        {activity.user.domain}
                      </span>
                      {getActivityIcon(activity.type)}
                    </div>
                    
                    <p className="text-sm text-gray-700 mt-1">
                      {activity.title}
                    </p>
                    
                    {activity.description && (
                      <p className="text-xs text-gray-500 mt-1">
                        {activity.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-400">
                        {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                      </span>
                      
                      {activity.xpGained && activity.xpGained > 0 && (
                        <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded">
                          +{activity.xpGained} XP
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}