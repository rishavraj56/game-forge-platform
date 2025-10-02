'use client';

import React, { useState, useEffect } from 'react';
import { Card } from './card';
import { Avatar, AvatarImage, AvatarFallback } from './avatar';
import { Badge } from './badge';
import { mockLeaderboardUsers, mockWeeklyLeaderboardUsers } from '@/lib/mock-data';
import { User } from '@/lib/types';

interface LiveLeaderboardProps {
  type?: 'weekly' | 'all-time';
  maxUsers?: number;
  showHeader?: boolean;
  className?: string;
}

interface LeaderboardUser extends User {
  previousRank?: number;
  rankChange?: 'up' | 'down' | 'same' | 'new';
  isUpdating?: boolean;
}

export function LiveLeaderboard({ 
  type = 'all-time', 
  maxUsers = 10, 
  showHeader = true, 
  className 
}: LiveLeaderboardProps) {
  const [users, setUsers] = useState<LeaderboardUser[]>(() => {
    const baseUsers = type === 'weekly' ? mockWeeklyLeaderboardUsers : mockLeaderboardUsers;
    return baseUsers.slice(0, maxUsers).map((user, index) => ({
      ...user,
      previousRank: index + 1,
      rankChange: 'same'
    }));
  });
  
  const [isLive, setIsLive] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Simulate real-time leaderboard updates
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      // Simulate XP changes and rank updates
      const shouldUpdate = Math.random() > 0.6; // 40% chance every 8 seconds
      
      if (shouldUpdate) {
        setUsers(prevUsers => {
          const updatedUsers = [...prevUsers];
          
          // Randomly select 1-3 users to update
          const usersToUpdate = Math.floor(Math.random() * 3) + 1;
          const selectedIndices = new Set<number>();
          
          while (selectedIndices.size < usersToUpdate && selectedIndices.size < updatedUsers.length) {
            selectedIndices.add(Math.floor(Math.random() * updatedUsers.length));
          }
          
          selectedIndices.forEach(index => {
            const user = updatedUsers[index];
            const xpGain = Math.floor(Math.random() * 100) + 25; // 25-125 XP gain
            
            updatedUsers[index] = {
              ...user,
              xp: user.xp + xpGain,
              previousRank: index + 1,
              isUpdating: true
            };
          });
          
          // Sort by XP and update ranks
          updatedUsers.sort((a, b) => b.xp - a.xp);
          
          // Calculate rank changes
          const finalUsers = updatedUsers.map((user, newIndex) => {
            const newRank = newIndex + 1;
            const previousRank = user.previousRank || newRank;
            
            let rankChange: 'up' | 'down' | 'same' | 'new' = 'same';
            if (previousRank > newRank) rankChange = 'up';
            else if (previousRank < newRank) rankChange = 'down';
            
            return {
              ...user,
              rankChange,
              level: Math.floor(user.xp / 200) + 1 // Recalculate level
            };
          });
          
          // Clear updating state after animation
          setTimeout(() => {
            setUsers(prev => prev.map(user => ({ ...user, isUpdating: false })));
          }, 2000);
          
          setLastUpdate(new Date());
          return finalUsers;
        });
      }
    }, 8000); // Update every 8 seconds

    return () => clearInterval(interval);
  }, [isLive]);

  const getRankChangeIcon = (change: LeaderboardUser['rankChange']) => {
    switch (change) {
      case 'up':
        return (
          <div className="flex items-center text-green-600">
            <svg className="w-3 h-3 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </div>
        );
      case 'down':
        return (
          <div className="flex items-center text-red-600">
            <svg className="w-3 h-3 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        );
      case 'new':
        return (
          <div className="flex items-center text-blue-600">
            <span className="text-xs font-bold animate-pulse">NEW</span>
          </div>
        );
      default:
        return null;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
      case 3:
        return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Card className={className}>
      {showHeader && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {type === 'weekly' ? 'Weekly' : 'All-Time'} Leaderboard
              </h3>
              <div className={`flex items-center space-x-1 ${isLive ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className="text-xs font-medium">{isLive ? 'LIVE' : 'PAUSED'}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">
                Updated {lastUpdate.toLocaleTimeString()}
              </span>
              
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
        <div className="divide-y divide-gray-100">
          {users.map((user, index) => {
            const rank = index + 1;
            return (
              <div
                key={user.id}
                className={`p-4 transition-all duration-500 ${
                  user.isUpdating 
                    ? 'bg-blue-50 border-l-2 border-blue-500 transform scale-[1.02]' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-4">
                  {/* Rank Badge */}
                  <div className="flex items-center space-x-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getRankBadgeColor(rank)}`}>
                      {rank}
                    </div>
                    {getRankChangeIcon(user.rankChange)}
                  </div>

                  {/* User Info */}
                  <div className="flex items-center space-x-3 flex-1">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatarUrl} alt={user.username} />
                      <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900 truncate">
                          {user.username}
                        </span>
                        {user.role === 'domain_lead' && (
                          <Badge variant="secondary" size="sm">
                            Lead
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500">
                          {user.domain}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">
                          Level {user.level}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* XP Display */}
                  <div className="text-right">
                    <div className={`font-semibold ${user.isUpdating ? 'text-blue-600 animate-pulse' : 'text-gray-900'}`}>
                      {user.xp.toLocaleString()} XP
                    </div>
                    {user.isUpdating && (
                      <div className="text-xs text-green-600 font-medium animate-bounce">
                        +XP
                      </div>
                    )}
                  </div>
                </div>

                {/* Rank 1-3 Special Effects */}
                {rank <= 3 && (
                  <div className="mt-2 flex items-center justify-center">
                    <div className={`h-1 w-full rounded-full ${
                      rank === 1 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                      rank === 2 ? 'bg-gradient-to-r from-gray-300 to-gray-500' :
                      'bg-gradient-to-r from-orange-400 to-orange-600'
                    }`}></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}