'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';

export interface ActivityItem {
  id: string;
  type: 'quest_completed' | 'badge_earned' | 'level_up' | 'post_created' | 'module_completed' | 'event_joined';
  user: {
    id: string;
    username: string;
    avatarUrl?: string;
    domain: string;
  };
  title: string;
  description: string;
  timestamp: Date;
  xpGained?: number;
  metadata?: {
    questName?: string;
    badgeName?: string;
    levelReached?: number;
    postTitle?: string;
    moduleName?: string;
    eventName?: string;
  };
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  maxItems?: number;
  showTimestamps?: boolean;
  compact?: boolean;
  className?: string;
}

export function ActivityFeed({ 
  activities, 
  maxItems = 10, 
  showTimestamps = true,
  compact = false,
  className 
}: ActivityFeedProps) {
  const displayedActivities = activities.slice(0, maxItems);

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'quest_completed':
        return '🎯';
      case 'badge_earned':
        return '🏆';
      case 'level_up':
        return '⬆️';
      case 'post_created':
        return '💬';
      case 'module_completed':
        return '📚';
      case 'event_joined':
        return '🎉';
      default:
        return '✨';
    }
  };

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'quest_completed':
        return 'bg-green-100 text-green-800';
      case 'badge_earned':
        return 'bg-yellow-100 text-yellow-800';
      case 'level_up':
        return 'bg-purple-100 text-purple-800';
      case 'post_created':
        return 'bg-blue-100 text-blue-800';
      case 'module_completed':
        return 'bg-indigo-100 text-indigo-800';
      case 'event_joined':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return timestamp.toLocaleDateString();
  };

  if (displayedActivities.length === 0) {
    return (
      <div className={cn('text-center py-8 text-gray-500', className)}>
        <div className="text-4xl mb-2">🌟</div>
        <p className="text-sm">No recent activity</p>
        <p className="text-xs text-gray-400 mt-1">Complete quests and engage with the community to see activity here!</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {displayedActivities.map((activity) => (
        <div 
          key={activity.id} 
          className={cn(
            'flex items-start space-x-3 p-3 rounded-lg transition-colors hover:bg-gray-50',
            compact ? 'p-2' : 'p-3'
          )}
        >
          <Avatar className={cn(compact ? 'h-8 w-8' : 'h-10 w-10')}>
            <AvatarImage src={activity.user.avatarUrl} alt={activity.user.username} />
            <AvatarFallback className="text-xs">
              {activity.user.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-sm font-medium text-gray-900 truncate">
                {activity.user.username}
              </span>
              <Badge 
                variant="secondary" 
                className={cn(
                  'text-xs px-2 py-0.5',
                  getActivityColor(activity.type)
                )}
              >
                {getActivityIcon(activity.type)} {activity.type.replace('_', ' ')}
              </Badge>
              {activity.xpGained && (
                <Badge variant="outline" className="text-xs px-2 py-0.5 text-blue-600 border-blue-200">
                  +{activity.xpGained} XP
                </Badge>
              )}
            </div>
            
            <p className={cn(
              'text-gray-700 mb-1',
              compact ? 'text-xs' : 'text-sm'
            )}>
              {activity.title}
            </p>
            
            {!compact && activity.description && (
              <p className="text-xs text-gray-500 mb-2">
                {activity.description}
              </p>
            )}
            
            {showTimestamps && (
              <p className="text-xs text-gray-400">
                {formatTimestamp(activity.timestamp)}
              </p>
            )}
          </div>
        </div>
      ))}
      
      {activities.length > maxItems && (
        <div className="text-center pt-2">
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            View all activity ({activities.length - maxItems} more)
          </button>
        </div>
      )}
    </div>
  );
}