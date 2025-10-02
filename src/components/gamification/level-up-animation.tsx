'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { calculateLevelFromXP } from '@/lib/mock-data';

interface LevelUpAnimationProps {
  newXP: number;
  oldXP: number;
  isVisible: boolean;
  onAnimationComplete: () => void;
}

export function LevelUpAnimation({ 
  newXP, 
  oldXP, 
  isVisible, 
  onAnimationComplete 
}: LevelUpAnimationProps) {
  const [animationStage, setAnimationStage] = useState<'enter' | 'celebrate' | 'exit'>('enter');
  
  const oldLevel = calculateLevelFromXP(oldXP);
  const newLevel = calculateLevelFromXP(newXP);
  const hasLeveledUp = newLevel > oldLevel;

  useEffect(() => {
    if (!isVisible || !hasLeveledUp) return;

    const timer1 = setTimeout(() => {
      setAnimationStage('celebrate');
    }, 500);

    const timer2 = setTimeout(() => {
      setAnimationStage('exit');
    }, 3000);

    const timer3 = setTimeout(() => {
      onAnimationComplete();
      setAnimationStage('enter');
    }, 3500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isVisible, hasLeveledUp, onAnimationComplete]);

  if (!isVisible || !hasLeveledUp) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div 
        className={cn(
          'bg-white rounded-xl p-8 max-w-md mx-4 text-center transform transition-all duration-500',
          animationStage === 'enter' && 'scale-0 opacity-0 rotate-180',
          animationStage === 'celebrate' && 'scale-100 opacity-100 rotate-0',
          animationStage === 'exit' && 'scale-110 opacity-0'
        )}
      >
        {/* Level Up Icon with Glow Effect */}
        <div className="relative mb-6">
          <div 
            className={cn(
              'w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center transform transition-all duration-1000',
              animationStage === 'celebrate' && 'animate-pulse scale-110'
            )}
          >
            <div className="text-4xl">⭐</div>
          </div>
          
          {/* Radiating Light Effect */}
          {animationStage === 'celebrate' && (
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-8 bg-yellow-400 opacity-70"
                  style={{
                    left: '50%',
                    top: '50%',
                    transformOrigin: '0 0',
                    transform: `translate(-50%, -50%) rotate(${i * 30}deg) translateY(-40px)`,
                    animation: `pulse 1s ease-in-out infinite ${i * 0.1}s`
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Level Up Message */}
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Level Up!
        </h2>
        
        <div className="flex items-center justify-center space-x-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">
              {oldLevel}
            </div>
            <div className="text-xs text-gray-500">Previous</div>
          </div>
          
          <div className="text-2xl text-gray-400">→</div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {newLevel}
            </div>
            <div className="text-xs text-gray-500">New Level</div>
          </div>
        </div>

        {/* XP Display */}
        <div className="bg-blue-50 rounded-lg p-4 mb-4">
          <div className="text-lg font-semibold text-blue-900 mb-1">
            {newXP.toLocaleString()} XP
          </div>
          <div className="text-sm text-blue-700">
            +{(newXP - oldXP).toLocaleString()} XP gained
          </div>
        </div>

        {/* Celebration Message */}
        <p className="text-gray-600 mb-4">
          Congratulations! You&apos;ve reached a new level and unlocked new possibilities!
        </p>

        {/* Floating Particles */}
        {animationStage === 'celebrate' && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  'absolute w-2 h-2 rounded-full animate-ping',
                  i % 5 === 0 && 'bg-yellow-400',
                  i % 5 === 1 && 'bg-blue-400',
                  i % 5 === 2 && 'bg-green-400',
                  i % 5 === 3 && 'bg-purple-400',
                  i % 5 === 4 && 'bg-red-400'
                )}
                style={{
                  left: `${10 + (i * 4)}%`,
                  top: `${10 + (i % 3) * 30}%`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '1.5s'
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface LevelUpNotificationProps {
  newLevel: number;
  isVisible: boolean;
  onClose: () => void;
}

export function LevelUpNotification({ 
  newLevel, 
  isVisible, 
  onClose 
}: LevelUpNotificationProps) {
  const [animationStage, setAnimationStage] = useState<'enter' | 'show' | 'exit'>('enter');

  useEffect(() => {
    if (!isVisible) return;

    const timer1 = setTimeout(() => {
      setAnimationStage('show');
    }, 100);

    const timer2 = setTimeout(() => {
      setAnimationStage('exit');
    }, 4000);

    const timer3 = setTimeout(() => {
      onClose();
      setAnimationStage('enter');
    }, 4500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div 
        className={cn(
          'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white rounded-lg shadow-xl p-4 max-w-sm transform transition-all duration-300',
          animationStage === 'enter' && 'translate-x-full opacity-0',
          animationStage === 'show' && 'translate-x-0 opacity-100',
          animationStage === 'exit' && 'translate-x-full opacity-0'
        )}
      >
        <div className="flex items-center space-x-3">
          {/* Level Icon */}
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-xl">⭐</span>
          </div>

          {/* Notification Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-semibold text-sm">
                Level Up!
              </h4>
              <button
                onClick={onClose}
                className="text-white hover:text-yellow-200 text-sm opacity-70 hover:opacity-100"
              >
                ✕
              </button>
            </div>
            
            <p className="text-sm opacity-90">
              You&apos;ve reached Level {newLevel}!
            </p>
            
            <div className="text-xs opacity-75 mt-1">
              New rewards and features unlocked
            </div>
          </div>
        </div>

        {/* Progress Bar Animation */}
        <div className="mt-3">
          <div className="w-full bg-white bg-opacity-20 rounded-full h-1">
            <div 
              className="h-1 bg-white rounded-full transition-all duration-1000 ease-out"
              style={{ 
                width: animationStage === 'show' ? '100%' : '0%' 
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}