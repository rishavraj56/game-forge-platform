'use client';

import React from 'react';
import { WidgetContainer } from './widget-container';
import { Button } from '@/components/ui/button';
import { Badge } from '../ui/badge';
import { Quest, UserQuestProgress } from '@/lib/types';
import { cn } from '@/lib/utils';

interface MyQuestsWidgetProps {
  dailyQuests: Quest[];
  weeklyQuests: Quest[];
  userProgress: UserQuestProgress[];
  onQuestComplete?: (questId: string) => void;
  className?: string;
}

export function MyQuestsWidget({ 
  dailyQuests, 
  weeklyQuests, 
  userProgress, 
  onQuestComplete,
  className 
}: MyQuestsWidgetProps) {
  const getQuestProgress = (questId: string) => {
    return userProgress.find(p => p.questId === questId);
  };

  const getProgressPercentage = (quest: Quest, progress?: UserQuestProgress) => {
    if (!progress) return 0;
    if (progress.completed) return 100;
    
    const requirement = quest.requirements[0]; // Simplified - taking first requirement
    return Math.min((progress.progress / requirement.target) * 100, 100);
  };

  const renderQuestItem = (quest: Quest) => {
    const progress = getQuestProgress(quest.id);
    const percentage = getProgressPercentage(quest, progress);
    const isCompleted = progress?.completed || false;

    return (
      <div key={quest.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h4 className={cn(
              'font-medium text-sm',
              isCompleted ? 'text-green-700 line-through' : 'text-gray-900'
            )}>
              {quest.title}
            </h4>
            <p className="text-xs text-gray-600 mt-1">{quest.description}</p>
          </div>
          <div className="flex items-center space-x-2 ml-2">
            <Badge variant="outline" className="text-xs">
              +{quest.xpReward} XP
            </Badge>
            {quest.type === 'daily' && (
              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                Daily
              </Badge>
            )}
            {quest.type === 'weekly' && (
              <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                Weekly
              </Badge>
            )}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-500">
              Progress: {progress?.progress || 0}/{quest.requirements[0]?.target || 0}
            </span>
            <span className="text-xs text-gray-500">{Math.round(percentage)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                isCompleted ? 'bg-green-500' : 'bg-blue-500'
              )}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Action Button */}
        {!isCompleted && onQuestComplete && (
          <Button
            size="sm"
            variant="outline"
            className="w-full text-xs"
            onClick={() => onQuestComplete(quest.id)}
          >
            {percentage > 0 ? 'Continue Quest' : 'Start Quest'}
          </Button>
        )}
        
        {isCompleted && (
          <div className="flex items-center justify-center py-2">
            <span className="text-xs text-green-600 font-medium">✓ Completed</span>
          </div>
        )}
      </div>
    );
  };

  const activeDailyQuests = dailyQuests.filter(q => q.isActive).slice(0, 3);
  const activeWeeklyQuests = weeklyQuests.filter(q => q.isActive).slice(0, 2);

  return (
    <WidgetContainer 
      title="My Quests" 
      size="lg"
      className={className}
      headerAction={
        <Button variant="outline" size="sm" className="text-xs">
          View All
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Daily Quests */}
        {activeDailyQuests.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              Daily Quests
            </h3>
            <div className="space-y-2">
              {activeDailyQuests.map(renderQuestItem)}
            </div>
          </div>
        )}

        {/* Weekly Quests */}
        {activeWeeklyQuests.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
              Weekly Quests
            </h3>
            <div className="space-y-2">
              {activeWeeklyQuests.map(renderQuestItem)}
            </div>
          </div>
        )}

        {activeDailyQuests.length === 0 && activeWeeklyQuests.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🎯</div>
            <p className="text-sm">No active quests</p>
            <p className="text-xs text-gray-400 mt-1">New quests will appear here daily and weekly!</p>
          </div>
        )}
      </div>
    </WidgetContainer>
  );
}