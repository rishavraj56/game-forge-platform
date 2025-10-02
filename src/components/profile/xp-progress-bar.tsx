'use client';

import { cn } from '@/lib/utils';

interface XPProgressBarProps {
  currentXP: number;
  xpInCurrentLevel: number;
  xpToNextLevel: number;
  currentLevel: number;
  className?: string;
  showLabel?: boolean;
}

export function XPProgressBar({
  currentXP,
  xpInCurrentLevel,
  xpToNextLevel,
  currentLevel,
  className,
  showLabel = true
}: XPProgressBarProps) {
  const totalXPForLevel = xpInCurrentLevel + xpToNextLevel;
  const progressPercentage = totalXPForLevel > 0 ? (xpInCurrentLevel / totalXPForLevel) * 100 : 0;

  return (
    <div className={cn('space-y-2', className)}>
      {showLabel && (
        <div className="flex justify-between items-center text-sm">
          <span className="font-medium text-gray-700">Level {currentLevel}</span>
          <span className="text-gray-500">
            {xpInCurrentLevel} / {totalXPForLevel} XP
          </span>
        </div>
      )}
      
      <div className="relative">
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        
        {/* Level indicator */}
        <div className="absolute -top-1 -left-1 w-5 h-5 bg-blue-600 rounded-full border-2 border-white flex items-center justify-center">
          <span className="text-xs font-bold text-white">{currentLevel}</span>
        </div>
        
        {/* Next level indicator */}
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-gray-400 rounded-full border-2 border-white flex items-center justify-center">
          <span className="text-xs font-bold text-white">{currentLevel + 1}</span>
        </div>
      </div>
      
      {showLabel && (
        <div className="text-center text-xs text-gray-500">
          {xpToNextLevel} XP to next level
        </div>
      )}
    </div>
  );
}