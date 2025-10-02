'use client';

import React, { useEffect, useState } from 'react';
import { Badge, Title } from '@/lib/types';
import { cn } from '@/lib/utils';

interface AchievementNotificationProps {
  achievement: Badge | Title | null;
  type: 'badge' | 'title';
  isVisible: boolean;
  onClose: () => void;
}

export function AchievementNotification({ 
  achievement, 
  type, 
  isVisible, 
  onClose 
}: AchievementNotificationProps) {
  const [animationStage, setAnimationStage] = useState<'enter' | 'show' | 'exit'>('enter');

  useEffect(() => {
    if (!isVisible || !achievement) return;

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
  }, [isVisible, achievement, onClose]);

  if (!isVisible || !achievement) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div 
        className={cn(
          'bg-white rounded-lg shadow-xl border-l-4 p-4 max-w-sm transform transition-all duration-300',
          type === 'badge' ? 'border-l-yellow-500' : 'border-l-purple-500',
          animationStage === 'enter' && 'translate-x-full opacity-0',
          animationStage === 'show' && 'translate-x-0 opacity-100',
          animationStage === 'exit' && 'translate-x-full opacity-0'
        )}
      >
        <div className="flex items-start space-x-3">
          {/* Achievement Icon */}
          <div className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0',
            type === 'badge' 
              ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' 
              : 'bg-gradient-to-br from-purple-400 to-purple-600'
          )}>
            <span className="text-white text-xl">
              {type === 'badge' ? '🏆' : '👑'}
            </span>
          </div>

          {/* Achievement Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="font-semibold text-gray-900 text-sm">
                {type === 'badge' ? 'Badge Unlocked!' : 'New Title Earned!'}
              </h4>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                ✕
              </button>
            </div>
            
            <h5 className="font-medium text-gray-800 text-sm mb-1">
              {achievement.name}
            </h5>
            
            <p className="text-gray-600 text-xs mb-2">
              {achievement.description}
            </p>

            {/* XP Requirement */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-blue-600 font-medium">
                {achievement.xpRequirement} XP Required
              </span>
              {type === 'badge' && 'earnedAt' in achievement && achievement.earnedAt && (
                <span className="text-xs text-green-600">
                  Just earned!
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar Animation */}
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div 
              className={cn(
                'h-1 rounded-full transition-all duration-1000 ease-out',
                type === 'badge' ? 'bg-yellow-500' : 'bg-purple-500'
              )}
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

interface AchievementNotificationManagerProps {
  children: React.ReactNode;
}

export function AchievementNotificationManager({ children }: AchievementNotificationManagerProps) {
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    achievement: Badge | Title;
    type: 'badge' | 'title';
    isVisible: boolean;
  }>>([]);

  const showBadgeNotification = (badge: Badge) => {
    const id = `badge-${badge.id}-${Date.now()}`;
    setNotifications(prev => [...prev, {
      id,
      achievement: badge,
      type: 'badge',
      isVisible: true
    }]);
  };

  const showTitleNotification = (title: Title) => {
    const id = `title-${title.id}-${Date.now()}`;
    setNotifications(prev => [...prev, {
      id,
      achievement: title,
      type: 'title',
      isVisible: true
    }]);
  };

  const closeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Provide context for triggering notifications
  const contextValue = {
    showBadgeNotification,
    showTitleNotification
  };

  return (
    <div>
      {children}
      
      {/* Render notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification, index) => (
          <div
            key={notification.id}
            style={{ 
              transform: `translateY(${index * 10}px)`,
              zIndex: 50 - index 
            }}
          >
            <AchievementNotification
              achievement={notification.achievement}
              type={notification.type}
              isVisible={notification.isVisible}
              onClose={() => closeNotification(notification.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}