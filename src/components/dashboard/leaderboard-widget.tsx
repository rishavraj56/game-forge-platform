'use client';

import React, { useState } from 'react';
import { WidgetContainer } from './widget-container';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { User } from '@/lib/types';
import { cn } from '@/lib/utils';

interface LeaderboardWidgetProps {
  allTimeUsers: User[];
  weeklyUsers: User[];
  currentUser?: User;
  className?: string;
}

export function LeaderboardWidget({ 
  allTimeUsers, 
  weeklyUsers, 
  currentUser,
  className 
}: LeaderboardWidgetProps) {
  const [viewMode, setViewMode] = useState<'all-time' | 'weekly'>('all-time');
  
  const displayUsers = viewMode === 'all-time' ? allTimeUsers : weeklyUsers;
  const topUsers = displayUsers.slice(0, 5);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'text-yellow-600 bg-yellow-50';
      case 2:
        return 'text-gray-600 bg-gray-50';
      case 3:
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-500 bg-gray-50';
    }
  };

  const findCurrentUserRank = () => {
    if (!currentUser) return null;
    const rank = displayUsers.findIndex(user => user.id === currentUser.id) + 1;
    return rank > 0 ? rank : null;
  };

  const currentUserRank = findCurrentUserRank();

  return (
    <WidgetContainer 
      title="Forge Masters" 
      size="lg"
      className={className}
      headerAction={
        <div className="flex items-center space-x-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('all-time')}
              className={cn(
                'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                viewMode === 'all-time' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              All Time
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={cn(
                'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                viewMode === 'weekly' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Weekly
            </button>
          </div>
          <Button variant="outline" size="sm" className="text-xs">
            View All
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        {topUsers.map((user, index) => {
          const rank = index + 1;
          const isCurrentUser = currentUser?.id === user.id;
          
          return (
            <div 
              key={user.id}
              className={cn(
                'flex items-center space-x-3 p-3 rounded-lg transition-colors',
                isCurrentUser 
                  ? 'bg-blue-50 border border-blue-200' 
                  : 'hover:bg-gray-50'
              )}
            >
              {/* Rank */}
              <div className={cn(
                'flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold',
                getRankColor(rank)
              )}>
                {typeof getRankIcon(rank) === 'string' && getRankIcon(rank).startsWith('#') 
                  ? getRankIcon(rank) 
                  : <span className="text-lg">{getRankIcon(rank)}</span>
                }
              </div>

              {/* Avatar */}
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.avatarUrl} alt={user.username} />
                <AvatarFallback className="text-xs">
                  {user.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className={cn(
                    'text-sm font-medium truncate',
                    isCurrentUser ? 'text-blue-900' : 'text-gray-900'
                  )}>
                    {user.username}
                    {isCurrentUser && (
                      <span className="ml-1 text-xs text-blue-600">(You)</span>
                    )}
                  </p>
                  {user.role === 'domain_lead' && (
                    <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-purple-100 text-purple-800">
                      Lead
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <p className="text-xs text-gray-500">{user.domain}</p>
                  <span className="text-xs text-gray-400">•</span>
                  <p className="text-xs text-gray-500">Level {user.level}</p>
                </div>
              </div>

              {/* XP */}
              <div className="text-right">
                <p className={cn(
                  'text-sm font-semibold',
                  isCurrentUser ? 'text-blue-700' : 'text-gray-900'
                )}>
                  {user.xp.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">XP</p>
              </div>
            </div>
          );
        })}

        {/* Current User Rank (if not in top 5) */}
        {currentUser && currentUserRank && currentUserRank > 5 && (
          <>
            <div className="border-t border-gray-200 my-3"></div>
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold text-blue-600 bg-blue-100">
                #{currentUserRank}
              </div>
              <Avatar className="h-10 w-10">
                <AvatarImage src={currentUser.avatarUrl} alt={currentUser.username} />
                <AvatarFallback className="text-xs">
                  {currentUser.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-blue-900 truncate">
                  {currentUser.username} (You)
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <p className="text-xs text-blue-600">{currentUser.domain}</p>
                  <span className="text-xs text-blue-400">•</span>
                  <p className="text-xs text-blue-600">Level {currentUser.level}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-blue-700">
                  {currentUser.xp.toLocaleString()}
                </p>
                <p className="text-xs text-blue-600">XP</p>
              </div>
            </div>
          </>
        )}

        {topUsers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🏆</div>
            <p className="text-sm">No rankings yet</p>
            <p className="text-xs text-gray-400 mt-1">Complete quests to climb the leaderboard!</p>
          </div>
        )}
      </div>
    </WidgetContainer>
  );
}