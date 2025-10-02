'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Quest, UserQuestProgress } from '@/lib/types';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/loading-states';
import { ErrorMessage } from '@/components/ui/error-states';

interface QuestCardProps {
  quest: Quest;
  progress?: UserQuestProgress;
  onComplete?: (questId: string) => Promise<void>;
  className?: string;
}

export function QuestCard({ quest, progress, onComplete, className }: QuestCardProps) {
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const isCompleted = progress?.completed || false;
  const currentProgress = progress?.progress || 0;
  const totalRequired = quest.requirements.reduce((sum, req) => sum + (req.target || req.count || 1), 0);
  const progressPercentage = totalRequired > 0 ? (currentProgress / totalRequired) * 100 : 0;

  const handleComplete = async () => {
    if (!isCompleted && progressPercentage >= 100 && onComplete) {
      setIsCompleting(true);
      setError(null);
      
      try {
        await onComplete(quest.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to complete quest');
      } finally {
        setIsCompleting(false);
      }
    }
  };

  const getTimeRemaining = () => {
    if (!quest.expiresAt) return null;
    
    const now = new Date();
    const timeLeft = quest.expiresAt.getTime() - now.getTime();
    
    if (timeLeft <= 0) return 'Expired';
    
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const timeRemaining = getTimeRemaining();

  return (
    <Card 
      className={cn(
        'transition-all duration-200 hover:shadow-md',
        isCompleted && 'bg-green-50 border-green-200',
        !isCompleted && progressPercentage >= 100 && 'bg-yellow-50 border-yellow-200 cursor-pointer hover:bg-yellow-100',
        isCompleting && 'opacity-75 cursor-wait',
        className
      )}
      onClick={!isCompleting ? handleComplete : undefined}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className={cn(
              'text-base',
              isCompleted && 'text-green-700',
              !isCompleted && progressPercentage >= 100 && 'text-yellow-700'
            )}>
              {quest.title}
              {isCompleted && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  ✓ Complete
                </span>
              )}
              {!isCompleted && progressPercentage >= 100 && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  {isCompleting ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-1" />
                      Claiming...
                    </>
                  ) : (
                    'Ready to claim!'
                  )}
                </span>
              )}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">{quest.description}</p>
          </div>
          <div className="flex flex-col items-end text-right ml-4">
            <div className="flex items-center space-x-1">
              <span className="text-lg font-bold text-blue-600">+{quest.xpReward}</span>
              <span className="text-xs text-gray-500">XP</span>
            </div>
            {timeRemaining && (
              <span className={cn(
                'text-xs mt-1',
                timeRemaining === 'Expired' ? 'text-red-500' : 'text-gray-500'
              )}>
                {timeRemaining}
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium">
                {currentProgress}/{totalRequired}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  isCompleted ? 'bg-green-500' : 
                  progressPercentage >= 100 ? 'bg-yellow-500' : 'bg-blue-500'
                )}
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>
          </div>

          {/* Requirements */}
          <div className="space-y-2">
            {quest.requirements.map((requirement, index) => {
              const target = requirement.target || requirement.count || 1;
              return (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{requirement.description || requirement.type}</span>
                  <span className={cn(
                    'font-medium',
                    currentProgress >= target ? 'text-green-600' : 'text-gray-500'
                  )}>
                    {Math.min(currentProgress, target)}/{target}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-2">
              <ErrorMessage 
                message={error} 
                onRetry={() => setError(null)}
                className="py-2"
              />
            </div>
          )}

          {/* Domain Badge */}
          {quest.domain && (
            <div className="flex justify-start">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {quest.domain}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}