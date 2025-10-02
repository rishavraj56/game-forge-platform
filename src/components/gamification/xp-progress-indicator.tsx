'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { calculateLevelFromXP, calculateXPForNextLevel } from '@/lib/mock-data';

interface XPProgressIndicatorProps {
  currentXP: number;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  animated?: boolean;
  className?: string;
}

export function XPProgressIndicator({ 
  currentXP, 
  size = 'md', 
  showDetails = true,
  animated = true,
  className 
}: XPProgressIndicatorProps) {
  const currentLevel = calculateLevelFromXP(currentXP);
  const { xpToNext, xpInCurrent } = calculateXPForNextLevel(currentXP);
  const xpForCurrentLevel = currentLevel * 200; // XP needed for current level
  const progressPercentage = (xpInCurrent / 200) * 100;

  const sizeClasses = {
    sm: {
      container: 'space-y-1',
      bar: 'h-1',
      text: 'text-xs',
      level: 'text-sm'
    },
    md: {
      container: 'space-y-2',
      bar: 'h-2',
      text: 'text-sm',
      level: 'text-base'
    },
    lg: {
      container: 'space-y-3',
      bar: 'h-3',
      text: 'text-base',
      level: 'text-lg'
    }
  };

  const classes = sizeClasses[size];

  return (
    <div className={cn(classes.container, className)}>
      {/* Level and XP Display */}
      {showDetails && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={cn(
              'font-bold text-blue-600 flex items-center space-x-1',
              classes.level
            )}>
              <span>⭐</span>
              <span>Level {currentLevel}</span>
            </div>
            {size !== 'sm' && (
              <div className={cn('text-gray-600', classes.text)}>
                ({currentXP.toLocaleString()} XP)
              </div>
            )}
          </div>
          <div className={cn('text-gray-500', classes.text)}>
            {xpToNext} XP to next level
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="relative">
        <div className={cn(
          'w-full bg-gray-200 rounded-full overflow-hidden',
          classes.bar
        )}>
          <div 
            className={cn(
              'bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out',
              classes.bar,
              animated && 'animate-pulse'
            )}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        
        {/* XP Numbers on Progress Bar */}
        {size === 'lg' && showDetails && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-medium text-white drop-shadow-sm">
              {xpInCurrent} / 200 XP
            </span>
          </div>
        )}
      </div>

      {/* Detailed Progress Info */}
      {size === 'lg' && showDetails && (
        <div className="flex justify-between text-xs text-gray-500">
          <span>Level {currentLevel}</span>
          <span>{progressPercentage.toFixed(1)}% to Level {currentLevel + 1}</span>
        </div>
      )}
    </div>
  );
}

interface CircularXPProgressProps {
  currentXP: number;
  size?: number;
  strokeWidth?: number;
  showLevel?: boolean;
  className?: string;
}

export function CircularXPProgress({ 
  currentXP, 
  size = 120, 
  strokeWidth = 8,
  showLevel = true,
  className 
}: CircularXPProgressProps) {
  const currentLevel = calculateLevelFromXP(currentXP);
  const { xpInCurrent } = calculateXPForNextLevel(currentXP);
  const progressPercentage = (xpInCurrent / 200) * 100;
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-200"
        />
        
        {/* Progress Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="text-blue-500 transition-all duration-500 ease-out"
        />
      </svg>
      
      {/* Center Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showLevel && (
          <>
            <div className="text-2xl font-bold text-blue-600">
              {currentLevel}
            </div>
            <div className="text-xs text-gray-500 -mt-1">
              Level
            </div>
          </>
        )}
      </div>
    </div>
  );
}

interface XPGainAnimationProps {
  xpGained: number;
  isVisible: boolean;
  onComplete: () => void;
  position?: { x: number; y: number };
}

export function XPGainAnimation({ 
  xpGained, 
  isVisible, 
  onComplete,
  position = { x: 50, y: 50 }
}: XPGainAnimationProps) {
  React.useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onComplete, 2000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div 
      className="fixed z-50 pointer-events-none"
      style={{ 
        left: `${position.x}%`, 
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)'
      }}
    >
      <div className="animate-bounce">
        <div className="bg-blue-600 text-white px-3 py-1 rounded-full font-bold text-sm shadow-lg">
          +{xpGained} XP
        </div>
      </div>
    </div>
  );
}