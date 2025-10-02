'use client';

import React from 'react';
import { User } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';

interface UserRankingCardProps {
  user: User;
  rank: number;
  showDomain?: boolean;
  showBadges?: boolean;
  compact?: boolean;
  onClick?: () => void;
}

export function UserRankingCard({ 
  user, 
  rank, 
  showDomain = true, 
  showBadges = true, 
  compact = false,
  onClick 
}: UserRankingCardProps) {
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
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 2:
        return 'text-gray-600 bg-gray-50 border-gray-200';
      case 3:
        return 'text-amber-600 bg-amber-50 border-amber-200';
      default:
        return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  const getDomainColor = (domain: string) => {
    const colors = {
      'Game Development': 'bg-blue-100 text-blue-700',
      'Game Design': 'bg-green-100 text-green-700',
      'Game Art': 'bg-purple-100 text-purple-700',
      'AI for Game Development': 'bg-red-100 text-red-700',
      'Creative': 'bg-yellow-100 text-yellow-700',
      'Corporate': 'bg-gray-100 text-gray-700'
    };
    return colors[domain as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  return (
    <Card 
      className={`transition-all duration-200 hover:shadow-md cursor-pointer ${
        rank <= 3 ? 'bg-gradient-to-r from-gray-50 to-white' : 'bg-white'
      } ${compact ? 'p-2' : ''}`}
      onClick={onClick}
    >
      <CardContent className={compact ? 'p-3' : 'p-4'}>
        <div className="flex items-center gap-4">
          {/* Rank Badge */}
          <div className={`flex items-center justify-center rounded-full font-bold border-2 ${getRankColor(rank)} ${
            compact ? 'w-8 h-8 text-xs' : 'w-12 h-12 text-sm'
          }`}>
            {getRankIcon(rank)}
          </div>
          
          {/* Avatar */}
          <div className="relative">
            <img
              src={user.avatarUrl || '/avatars/default-avatar.png'}
              alt={`${user.username}'s avatar`}
              className={`rounded-full border-2 border-gray-200 object-cover ${
                compact ? 'w-10 h-10' : 'w-14 h-14'
              }`}
            />
            {user.role === 'domain_lead' && (
              <div className={`absolute -top-1 -right-1 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold ${
                compact ? 'w-4 h-4 text-xs' : 'w-5 h-5 text-xs'
              }`}>
                L
              </div>
            )}
            {user.role === 'admin' && (
              <div className={`absolute -top-1 -right-1 bg-red-500 rounded-full flex items-center justify-center text-white font-bold ${
                compact ? 'w-4 h-4 text-xs' : 'w-5 h-5 text-xs'
              }`}>
                A
              </div>
            )}
          </div>
          
          {/* User Information */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`font-semibold text-gray-900 truncate ${
                compact ? 'text-sm' : 'text-base'
              }`}>
                {user.username}
              </h3>
              {user.titles.find(t => t.isActive) && (
                <span className={`px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium ${
                  compact ? 'text-xs' : 'text-xs'
                }`}>
                  {user.titles.find(t => t.isActive)?.name}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              {showDomain && (
                <span className={`px-2 py-1 rounded-full font-medium ${getDomainColor(user.domain)} ${
                  compact ? 'text-xs' : 'text-xs'
                }`}>
                  {user.domain}
                </span>
              )}
              <span className={`text-gray-600 ${compact ? 'text-xs' : 'text-sm'}`}>
                Level {user.level}
              </span>
              {showBadges && (
                <span className={`text-gray-600 ${compact ? 'text-xs' : 'text-sm'}`}>
                  {user.badges.length} badges
                </span>
              )}
            </div>
            
            {!compact && user.bio && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                {user.bio}
              </p>
            )}
          </div>
          
          {/* XP Display */}
          <div className="text-right">
            <div className={`font-bold text-gray-900 ${
              compact ? 'text-base' : 'text-xl'
            }`}>
              {user.xp.toLocaleString()}
            </div>
            <div className={`text-gray-500 ${compact ? 'text-xs' : 'text-sm'}`}>
              XP
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}