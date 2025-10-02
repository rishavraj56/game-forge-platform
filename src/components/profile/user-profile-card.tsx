'use client';

import { User, UserStats } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { BadgeCollection } from './badge-display';
import { XPProgressBar } from './xp-progress-bar';
import { cn } from '@/lib/utils';
import { calculateXPForNextLevel } from '@/lib/mock-data';

interface UserProfileCardProps {
  user: User;
  stats: UserStats;
  className?: string;
  variant?: 'full' | 'compact';
}

export function UserProfileCard({ 
  user, 
  stats, 
  className,
  variant = 'full' 
}: UserProfileCardProps) {
  const { xpToNext, xpInCurrent } = calculateXPForNextLevel(user.xp);
  const activeTitle = user.titles.find(title => title.isActive);

  if (variant === 'compact') {
    return (
      <Card className={cn('p-4', className)}>
        <div className="flex items-center space-x-4">
          {/* Avatar */}
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              {user.avatarUrl ? (
                <img 
                  src={user.avatarUrl} 
                  alt={user.username}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-white font-bold text-lg">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-600 rounded-full border-2 border-white flex items-center justify-center">
              <span className="text-xs font-bold text-white">{user.level}</span>
            </div>
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-gray-900 truncate">{user.username}</h3>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {user.domain}
              </span>
            </div>
            {activeTitle && (
              <p className="text-sm text-purple-600 font-medium">{activeTitle.name}</p>
            )}
            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
              <span>{stats.totalXP} XP</span>
              <span>{stats.totalBadges} badges</span>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('p-6', className)}>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex items-start space-x-4">
          {/* Avatar */}
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              {user.avatarUrl ? (
                <img 
                  src={user.avatarUrl} 
                  alt={user.username}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-white font-bold text-2xl">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 rounded-full border-3 border-white flex items-center justify-center">
              <span className="text-sm font-bold text-white">{user.level}</span>
            </div>
          </div>

          {/* User Info */}
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h2 className="text-xl font-bold text-gray-900">{user.username}</h2>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {user.domain}
              </span>
              {user.role !== 'member' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 capitalize">
                  {user.role.replace('_', ' ')}
                </span>
              )}
            </div>
            
            {activeTitle && (
              <div className="flex items-center space-x-2 mb-2">
                <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.664 1.319a.75.75 0 01.672 0 41.059 41.059 0 018.198 5.424.75.75 0 01-.254 1.285 31.372 31.372 0 00-7.86 3.83.75.75 0 01-.84 0 31.508 31.508 0 00-2.08-1.287V9.394c0-.244.116-.463.302-.592a35.504 35.504 0 013.305-2.033.75.75 0 00-.714-1.319 37 37 0 00-3.446 2.12A2.216 2.216 0 006 9.393v.38a31.293 31.293 0 00-4.28-1.746.75.75 0 01-.254-1.285 41.059 41.059 0 018.198-5.424zM6 11.459a29.848 29.848 0 00-2.455-1.158 41.029 41.029 0 00-.39 3.114.75.75 0 00.419.74c.528.256 1.046.53 1.554.82-.21-.899-.455-1.746-.754-2.516zm9.909-1.158A29.848 29.848 0 0014 11.459c-.299.77-.544 1.617-.754 2.516.508-.29 1.026-.564 1.554-.82a.75.75 0 00.419-.74 41.029 41.029 0 00-.39-3.114z" clipRule="evenodd" />
                </svg>
                <span className="text-purple-600 font-medium">{activeTitle.name}</span>
              </div>
            )}

            {user.bio && (
              <p className="text-gray-600 text-sm leading-relaxed">{user.bio}</p>
            )}
          </div>
        </div>

        {/* XP Progress */}
        <div>
          <XPProgressBar
            currentXP={user.xp}
            xpInCurrentLevel={xpInCurrent}
            xpToNextLevel={xpToNext}
            currentLevel={user.level}
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalXP}</div>
            <div className="text-sm text-gray-600">Total XP</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.totalBadges}</div>
            <div className="text-sm text-gray-600">Badges</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.questsCompleted}</div>
            <div className="text-sm text-gray-600">Quests</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.modulesCompleted}</div>
            <div className="text-sm text-gray-600">Modules</div>
          </div>
        </div>

        {/* Recent Badges */}
        {user.badges.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Recent Badges</h3>
              <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                View All
              </button>
            </div>
            <BadgeCollection badges={user.badges} maxDisplay={6} size="md" />
          </div>
        )}

        {/* Member Since */}
        <div className="pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Member since {user.createdAt.toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}