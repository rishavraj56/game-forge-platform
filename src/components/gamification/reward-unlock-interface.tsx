'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge, Title } from '@/lib/types';
import { cn } from '@/lib/utils';
import { calculateLevelFromXP } from '@/lib/mock-data';

interface RewardUnlockInterfaceProps {
  userXP: number;
  availableBadges: Badge[];
  availableTitles: Title[];
  onClaimReward: (type: 'badge' | 'title', id: string) => void;
  className?: string;
}

export function RewardUnlockInterface({ 
  userXP, 
  availableBadges, 
  availableTitles, 
  onClaimReward,
  className 
}: RewardUnlockInterfaceProps) {
  const [claimedRewards, setClaimedRewards] = useState<Set<string>>(new Set());
  
  const currentLevel = calculateLevelFromXP(userXP);
  
  // Get rewards that can be claimed
  const claimableBadges = availableBadges.filter(badge => 
    userXP >= badge.xpRequirement && !badge.earnedAt && !claimedRewards.has(`badge-${badge.id}`)
  );
  
  const claimableTitles = availableTitles.filter(title => 
    userXP >= title.xpRequirement && !claimedRewards.has(`title-${title.id}`)
  );

  const handleClaimReward = (type: 'badge' | 'title', id: string) => {
    const rewardKey = `${type}-${id}`;
    setClaimedRewards(prev => new Set([...prev, rewardKey]));
    onClaimReward(type, id);
  };

  const totalClaimableRewards = claimableBadges.length + claimableTitles.length;

  if (totalClaimableRewards === 0) {
    return null;
  }

  return (
    <Card className={cn('border-yellow-200 bg-yellow-50', className)}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-yellow-800">
          <span>🎁</span>
          <span>Rewards Ready to Claim!</span>
          <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-yellow-600 rounded-full">
            {totalClaimableRewards}
          </span>
        </CardTitle>
        <p className="text-sm text-yellow-700">
          You&apos;ve earned new rewards! Claim them to add to your collection.
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Claimable Badges */}
        {claimableBadges.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-yellow-800 flex items-center space-x-2">
              <span>🏆</span>
              <span>New Badges ({claimableBadges.length})</span>
            </h4>
            
            <div className="grid gap-3">
              {claimableBadges.map(badge => (
                <div
                  key={badge.id}
                  className="flex items-center justify-between p-4 bg-white rounded-lg border border-yellow-200 shadow-sm"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                      <span className="text-white text-xl">🏆</span>
                    </div>
                    <div>
                      <h5 className="font-semibold text-gray-900">{badge.name}</h5>
                      <p className="text-sm text-gray-600">{badge.description}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-blue-600 font-medium">
                          {badge.xpRequirement} XP Required
                        </span>
                        <span className="text-xs text-green-600 font-medium">
                          ✓ Unlocked
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => handleClaimReward('badge', badge.id)}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                    size="sm"
                  >
                    Claim Badge
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Claimable Titles */}
        {claimableTitles.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-yellow-800 flex items-center space-x-2">
              <span>👑</span>
              <span>New Titles ({claimableTitles.length})</span>
            </h4>
            
            <div className="grid gap-3">
              {claimableTitles.map(title => (
                <div
                  key={title.id}
                  className="flex items-center justify-between p-4 bg-white rounded-lg border border-yellow-200 shadow-sm"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                      <span className="text-white text-xl">👑</span>
                    </div>
                    <div>
                      <h5 className="font-semibold text-gray-900">{title.name}</h5>
                      <p className="text-sm text-gray-600">{title.description}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-blue-600 font-medium">
                          {title.xpRequirement} XP Required
                        </span>
                        <span className="text-xs text-green-600 font-medium">
                          ✓ Unlocked
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => handleClaimReward('title', title.id)}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    size="sm"
                  >
                    Claim Title
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Claim All Button */}
        {totalClaimableRewards > 1 && (
          <div className="pt-4 border-t border-yellow-200">
            <Button
              onClick={() => {
                claimableBadges.forEach(badge => handleClaimReward('badge', badge.id));
                claimableTitles.forEach(title => handleClaimReward('title', title.id));
              }}
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white"
            >
              Claim All Rewards ({totalClaimableRewards})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ProgressMilestoneProps {
  userXP: number;
  milestones: Array<{
    xp: number;
    title: string;
    description: string;
    reward: string;
    type: 'badge' | 'title' | 'feature';
  }>;
  className?: string;
}

export function ProgressMilestone({ userXP, milestones, className }: ProgressMilestoneProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>🎯</span>
          <span>Progress Milestones</span>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Track your progress toward major milestones and rewards
        </p>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {milestones.map((milestone, index) => {
            const isCompleted = userXP >= milestone.xp;
            const isNext = !isCompleted && (index === 0 || userXP >= milestones[index - 1].xp);
            const progress = isCompleted ? 100 : Math.min((userXP / milestone.xp) * 100, 100);
            
            return (
              <div
                key={index}
                className={cn(
                  'relative p-4 rounded-lg border transition-all duration-200',
                  isCompleted && 'bg-green-50 border-green-200',
                  isNext && 'bg-blue-50 border-blue-200',
                  !isCompleted && !isNext && 'bg-gray-50 border-gray-200'
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className={cn(
                        'font-semibold',
                        isCompleted ? 'text-green-900' : isNext ? 'text-blue-900' : 'text-gray-700'
                      )}>
                        {milestone.title}
                      </h4>
                      {isCompleted && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓ Complete
                        </span>
                      )}
                      {isNext && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Next Goal
                        </span>
                      )}
                    </div>
                    <p className={cn(
                      'text-sm mb-2',
                      isCompleted ? 'text-green-700' : isNext ? 'text-blue-700' : 'text-gray-600'
                    )}>
                      {milestone.description}
                    </p>
                    <div className="flex items-center space-x-4 text-xs">
                      <span className={cn(
                        'font-medium',
                        isCompleted ? 'text-green-600' : isNext ? 'text-blue-600' : 'text-gray-500'
                      )}>
                        {milestone.xp.toLocaleString()} XP
                      </span>
                      <span className={cn(
                        'px-2 py-1 rounded-full',
                        milestone.type === 'badge' && 'bg-yellow-100 text-yellow-800',
                        milestone.type === 'title' && 'bg-purple-100 text-purple-800',
                        milestone.type === 'feature' && 'bg-blue-100 text-blue-800'
                      )}>
                        {milestone.reward}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right ml-4">
                    <div className={cn(
                      'text-sm font-medium',
                      isCompleted ? 'text-green-600' : isNext ? 'text-blue-600' : 'text-gray-500'
                    )}>
                      {isCompleted ? 'Complete!' : `${progress.toFixed(0)}%`}
                    </div>
                    {!isCompleted && (
                      <div className="text-xs text-gray-500 mt-1">
                        {(milestone.xp - userXP).toLocaleString()} XP to go
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={cn(
                      'h-2 rounded-full transition-all duration-500',
                      isCompleted ? 'bg-green-500' : isNext ? 'bg-blue-500' : 'bg-gray-400'
                    )}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}