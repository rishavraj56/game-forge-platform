'use client';

import React, { useState } from 'react';
import { Quest, UserQuestProgress } from '@/lib/types';
import { QuestCard } from './quest-card';
import { cn } from '@/lib/utils';

interface QuestSectionsProps {
  dailyQuests: Quest[];
  weeklyQuests: Quest[];
  userProgress: UserQuestProgress[];
  onQuestComplete?: (questId: string) => void;
  className?: string;
}

export function QuestSections({ 
  dailyQuests, 
  weeklyQuests, 
  userProgress, 
  onQuestComplete,
  className 
}: QuestSectionsProps) {
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly'>('daily');

  const getProgressForQuest = (questId: string) => {
    return userProgress.find(p => p.questId === questId);
  };

  const getCompletedCount = (quests: Quest[]) => {
    return quests.filter(quest => {
      const progress = getProgressForQuest(quest.id);
      return progress?.completed;
    }).length;
  };

  const getReadyToClaimCount = (quests: Quest[]) => {
    return quests.filter(quest => {
      const progress = getProgressForQuest(quest.id);
      if (progress?.completed) return false;
      
      const totalRequired = quest.requirements.reduce((sum, req) => sum + req.target, 0);
      const currentProgress = progress?.progress || 0;
      return currentProgress >= totalRequired;
    }).length;
  };

  const dailyCompleted = getCompletedCount(dailyQuests);
  const dailyReadyToClaim = getReadyToClaimCount(dailyQuests);
  const weeklyCompleted = getCompletedCount(weeklyQuests);
  const weeklyReadyToClaim = getReadyToClaimCount(weeklyQuests);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('daily')}
          className={cn(
            'flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200',
            activeTab === 'daily'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          <div className="flex items-center justify-center space-x-2">
            <span>Daily Quests</span>
            <div className="flex space-x-1">
              {dailyReadyToClaim > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-yellow-500 rounded-full">
                  {dailyReadyToClaim}
                </span>
              )}
              <span className="text-xs text-gray-500">
                ({dailyCompleted}/{dailyQuests.length})
              </span>
            </div>
          </div>
        </button>
        
        <button
          onClick={() => setActiveTab('weekly')}
          className={cn(
            'flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200',
            activeTab === 'weekly'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          <div className="flex items-center justify-center space-x-2">
            <span>Weekly Quests</span>
            <div className="flex space-x-1">
              {weeklyReadyToClaim > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-yellow-500 rounded-full">
                  {weeklyReadyToClaim}
                </span>
              )}
              <span className="text-xs text-gray-500">
                ({weeklyCompleted}/{weeklyQuests.length})
              </span>
            </div>
          </div>
        </button>
      </div>

      {/* Quest Content */}
      <div className="space-y-4">
        {activeTab === 'daily' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Daily Quests</h3>
              <div className="text-sm text-gray-500">
                Resets in {getTimeUntilReset('daily')}
              </div>
            </div>
            
            {dailyQuests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🎯</div>
                <p>No daily quests available right now.</p>
                <p className="text-sm">Check back later for new challenges!</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {dailyQuests.map(quest => (
                  <QuestCard
                    key={quest.id}
                    quest={quest}
                    progress={getProgressForQuest(quest.id)}
                    onComplete={onQuestComplete}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'weekly' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Weekly Quests</h3>
              <div className="text-sm text-gray-500">
                Resets in {getTimeUntilReset('weekly')}
              </div>
            </div>
            
            {weeklyQuests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🏆</div>
                <p>No weekly quests available right now.</p>
                <p className="text-sm">Check back later for new challenges!</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {weeklyQuests.map(quest => (
                  <QuestCard
                    key={quest.id}
                    quest={quest}
                    progress={getProgressForQuest(quest.id)}
                    onComplete={onQuestComplete}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function getTimeUntilReset(type: 'daily' | 'weekly'): string {
  const now = new Date();
  
  if (type === 'daily') {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const timeLeft = tomorrow.getTime() - now.getTime();
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  } else {
    // Weekly reset on Monday
    const nextMonday = new Date(now);
    const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
    nextMonday.setDate(now.getDate() + daysUntilMonday);
    nextMonday.setHours(0, 0, 0, 0);
    
    const timeLeft = nextMonday.getTime() - now.getTime();
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    return days > 0 ? `${days}d ${hours}h` : `${hours}h`;
  }
}