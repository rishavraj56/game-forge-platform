'use client';

import React, { useEffect, useState } from 'react';
import { Quest } from '@/lib/types';
import { cn } from '@/lib/utils';

interface QuestCompletionAnimationProps {
  quest: Quest | null;
  isVisible: boolean;
  onAnimationComplete: () => void;
}

export function QuestCompletionAnimation({ 
  quest, 
  isVisible, 
  onAnimationComplete 
}: QuestCompletionAnimationProps) {
  const [animationStage, setAnimationStage] = useState<'enter' | 'celebrate' | 'exit'>('enter');

  useEffect(() => {
    if (!isVisible || !quest) return;

    const timer1 = setTimeout(() => {
      setAnimationStage('celebrate');
    }, 300);

    const timer2 = setTimeout(() => {
      setAnimationStage('exit');
    }, 2000);

    const timer3 = setTimeout(() => {
      onAnimationComplete();
      setAnimationStage('enter');
    }, 2500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isVisible, quest, onAnimationComplete]);

  if (!isVisible || !quest) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div 
        className={cn(
          'bg-white rounded-lg p-8 max-w-md mx-4 text-center transform transition-all duration-300',
          animationStage === 'enter' && 'scale-0 opacity-0',
          animationStage === 'celebrate' && 'scale-100 opacity-100',
          animationStage === 'exit' && 'scale-110 opacity-0'
        )}
      >
        {/* Success Icon with Animation */}
        <div className="relative mb-6">
          <div 
            className={cn(
              'w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center transform transition-all duration-500',
              animationStage === 'celebrate' && 'animate-bounce'
            )}
          >
            <div className="text-4xl">✅</div>
          </div>
          
          {/* Confetti Effect */}
          {animationStage === 'celebrate' && (
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'absolute w-2 h-2 rounded-full animate-ping',
                    i % 4 === 0 && 'bg-yellow-400',
                    i % 4 === 1 && 'bg-blue-400',
                    i % 4 === 2 && 'bg-green-400',
                    i % 4 === 3 && 'bg-red-400'
                  )}
                  style={{
                    left: `${20 + (i * 10)}%`,
                    top: `${20 + (i % 2) * 30}%`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: '1s'
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Quest Completion Message */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Quest Complete!
        </h2>
        
        <p className="text-lg text-gray-700 mb-4">
          {quest.title}
        </p>

        {/* XP Reward */}
        <div className="bg-blue-50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-center space-x-2">
            <span className="text-2xl">⭐</span>
            <span className="text-xl font-bold text-blue-600">
              +{quest.xpReward} XP
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Experience points earned!
          </p>
        </div>

        {/* Quest Type Badge */}
        <div className="flex justify-center">
          <span className={cn(
            'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
            quest.type === 'daily' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-purple-100 text-purple-800'
          )}>
            {quest.type === 'daily' ? '📅 Daily Quest' : '🏆 Weekly Quest'}
          </span>
        </div>

        {/* Floating XP Animation */}
        {animationStage === 'celebrate' && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="animate-bounce text-2xl font-bold text-blue-600">
                +{quest.xpReward}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}