'use client';

import React from 'react';
import { Badge } from '@/lib/types';
import { cn } from '@/lib/utils';

interface BadgeDisplayProps {
  badge: Badge;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  isEarned?: boolean;
  className?: string;
}

export function BadgeDisplay({ 
  badge, 
  size = 'md', 
  showDetails = true, 
  isEarned = true,
  className 
}: BadgeDisplayProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className={cn('flex items-center space-x-3', className)}>
      {/* Badge Icon */}
      <div className="relative">
        <div 
          className={cn(
            'rounded-full flex items-center justify-center border-2 transition-all duration-200',
            sizeClasses[size],
            isEarned 
              ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 border-yellow-500 shadow-lg' 
              : 'bg-gray-200 border-gray-300 opacity-50'
          )}
        >
          {/* Badge Icon/Emoji */}
          <div className={cn(
            'text-white font-bold',
            size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-lg'
          )}>
            {isEarned ? '🏆' : '🔒'}
          </div>
        </div>
        
        {/* Earned indicator */}
        {isEarned && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">✓</span>
          </div>
        )}
      </div>

      {/* Badge Details */}
      {showDetails && (
        <div className="flex-1 min-w-0">
          <h4 className={cn(
            'font-semibold truncate',
            textSizeClasses[size],
            isEarned ? 'text-gray-900' : 'text-gray-500'
          )}>
            {badge.name}
          </h4>
          <p className={cn(
            'text-gray-600 truncate',
            size === 'sm' ? 'text-xs' : 'text-sm'
          )}>
            {badge.description}
          </p>
          
          {/* XP Requirement and Earned Date */}
          <div className="flex items-center justify-between mt-1">
            <span className={cn(
              'text-blue-600 font-medium',
              size === 'sm' ? 'text-xs' : 'text-sm'
            )}>
              {badge.xpRequirement} XP
            </span>
            {badge.earnedAt && (
              <span className={cn(
                'text-green-600 text-xs',
                size === 'sm' ? 'text-xs' : 'text-sm'
              )}>
                Earned {badge.earnedAt.toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface BadgeGridProps {
  badges: Badge[];
  userXP: number;
  className?: string;
}

export function BadgeGrid({ badges, userXP, className }: BadgeGridProps) {
  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4', className)}>
      {badges.map(badge => {
        const isEarned = badge.earnedAt !== undefined;
        const canEarn = userXP >= badge.xpRequirement;
        
        return (
          <div
            key={badge.id}
            className={cn(
              'p-4 rounded-lg border transition-all duration-200 hover:shadow-md',
              isEarned 
                ? 'bg-yellow-50 border-yellow-200' 
                : canEarn 
                  ? 'bg-blue-50 border-blue-200' 
                  : 'bg-gray-50 border-gray-200'
            )}
          >
            <BadgeDisplay
              badge={badge}
              size="md"
              showDetails={true}
              isEarned={isEarned}
            />
            
            {/* Progress indicator for unearned badges */}
            {!isEarned && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{Math.min(userXP, badge.xpRequirement)}/{badge.xpRequirement}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={cn(
                      'h-2 rounded-full transition-all duration-300',
                      canEarn ? 'bg-green-500' : 'bg-blue-500'
                    )}
                    style={{ 
                      width: `${Math.min((userXP / badge.xpRequirement) * 100, 100)}%` 
                    }}
                  />
                </div>
                {canEarn && (
                  <p className="text-xs text-green-600 mt-1 font-medium">
                    Ready to unlock!
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}