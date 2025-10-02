'use client';

import React from 'react';
import { WidgetContainer } from './widget-container';
import { Button } from '@/components/ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { User, UserStats } from '@/lib/types';
import { cn } from '@/lib/utils';

interface WelcomeWidgetProps {
  user: User;
  userStats: UserStats;
  className?: string;
  onViewProfile?: () => void;
  onViewQuests?: () => void;
}

export function WelcomeWidget({ 
  user, 
  userStats, 
  className,
  onViewProfile,
  onViewQuests
}: WelcomeWidgetProps) {
  const getTimeOfDayGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getMotivationalMessage = () => {
    const messages = [
      "Ready to forge ahead?",
      "Time to level up your skills!",
      "Let's build something amazing today!",
      "Your next breakthrough awaits!",
      "Ready to make your mark?",
      "Time to turn ideas into reality!"
    ];
    
    // Use user ID to get consistent message for the session
    const messageIndex = parseInt(user.id) % messages.length;
    return messages[messageIndex];
  };

  const calculateXPProgress = () => {
    const currentLevelXP = (user.level - 1) * 200; // Assuming 200 XP per level
    const nextLevelXP = user.level * 200;
    const progressXP = user.xp - currentLevelXP;
    const neededXP = nextLevelXP - user.xp;
    const progressPercentage = (progressXP / 200) * 100;
    
    return {
      progressXP,
      neededXP,
      progressPercentage: Math.min(progressPercentage, 100)
    };
  };

  const xpProgress = calculateXPProgress();

  const getRecentAchievement = () => {
    const recentBadge = user.badges
      .filter(badge => badge.earnedAt)
      .sort((a, b) => (b.earnedAt?.getTime() || 0) - (a.earnedAt?.getTime() || 0))[0];
    
    return recentBadge;
  };

  const recentAchievement = getRecentAchievement();

  return (
    <WidgetContainer 
      variant="featured"
      size="md"
      className={className}
    >
      <div className="space-y-6">
        {/* Header with Avatar and Greeting */}
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16 border-2 border-white shadow-lg">
            <AvatarImage src={user.avatarUrl} alt={user.username} />
            <AvatarFallback className="text-lg font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              {user.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">
              {getTimeOfDayGreeting()}, {user.username}!
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              {getMotivationalMessage()}
            </p>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                {user.domain}
              </Badge>
              {user.role === 'domain_lead' && (
                <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                  Domain Lead
                </Badge>
              )}
              {user.role === 'admin' && (
                <Badge variant="secondary" className="text-xs bg-red-100 text-red-800">
                  Admin
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-blue-600">{user.xp.toLocaleString()}</div>
            <div className="text-xs text-gray-500">Total XP</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-green-600">{user.level}</div>
            <div className="text-xs text-gray-500">Level</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-purple-600">{user.badges.filter(b => b.earnedAt).length}</div>
            <div className="text-xs text-gray-500">Badges</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-orange-600">{userStats.questsCompleted}</div>
            <div className="text-xs text-gray-500">Quests Done</div>
          </div>
        </div>

        {/* XP Progress to Next Level */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Progress to Level {user.level + 1}
            </span>
            <span className="text-sm text-gray-500">
              {xpProgress.neededXP} XP needed
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div 
              className="h-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500"
              style={{ width: `${xpProgress.progressPercentage}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 text-center">
            {Math.round(xpProgress.progressPercentage)}% complete
          </div>
        </div>

        {/* Recent Achievement */}
        {recentAchievement && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">🏆</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Recent Achievement
                </p>
                <p className="text-xs text-gray-600">
                  Earned "{recentAchievement.name}" badge
                </p>
              </div>
              <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                +{recentAchievement.xpRequirement} XP
              </Badge>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 text-xs"
            onClick={onViewQuests}
          >
            View Quests
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 text-xs"
            onClick={onViewProfile}
          >
            Edit Profile
          </Button>
        </div>
      </div>
    </WidgetContainer>
  );
}