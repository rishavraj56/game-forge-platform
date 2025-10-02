'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Title } from '@/lib/types';
import { cn } from '@/lib/utils';

interface TitleSelectionProps {
  titles: Title[];
  userXP: number;
  activeTitle?: Title;
  onTitleSelect: (title: Title) => void;
  className?: string;
}

export function TitleSelection({ 
  titles, 
  userXP, 
  activeTitle, 
  onTitleSelect,
  className 
}: TitleSelectionProps) {
  const [selectedTitle, setSelectedTitle] = useState<Title | null>(activeTitle || null);

  const handleTitleSelect = (title: Title) => {
    setSelectedTitle(title);
    onTitleSelect(title);
  };

  const getUnlockedTitles = () => {
    return titles.filter(title => userXP >= title.xpRequirement);
  };

  const getLockedTitles = () => {
    return titles.filter(title => userXP < title.xpRequirement);
  };

  const unlockedTitles = getUnlockedTitles();
  const lockedTitles = getLockedTitles();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>👑</span>
          <span>Title Selection</span>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Choose a title to display on your profile. Unlock more titles by earning XP!
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Current Active Title */}
        {activeTitle && (
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-purple-900">Currently Active</h4>
                <p className="text-purple-700 font-medium">{activeTitle.name}</p>
                <p className="text-sm text-purple-600">{activeTitle.description}</p>
              </div>
              <div className="text-2xl">👑</div>
            </div>
          </div>
        )}

        {/* Unlocked Titles */}
        {unlockedTitles.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
              <span>✨</span>
              <span>Available Titles ({unlockedTitles.length})</span>
            </h3>
            
            <div className="grid gap-3">
              {unlockedTitles.map(title => (
                <div
                  key={title.id}
                  className={cn(
                    'p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md',
                    selectedTitle?.id === title.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 bg-white hover:border-purple-300'
                  )}
                  onClick={() => handleTitleSelect(title)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className={cn(
                          'font-medium',
                          selectedTitle?.id === title.id ? 'text-purple-900' : 'text-gray-900'
                        )}>
                          {title.name}
                        </h4>
                        {title.isActive && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        )}
                      </div>
                      <p className={cn(
                        'text-sm mt-1',
                        selectedTitle?.id === title.id ? 'text-purple-700' : 'text-gray-600'
                      )}>
                        {title.description}
                      </p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-xs text-blue-600 font-medium">
                          {title.xpRequirement} XP Required
                        </span>
                        <span className="text-xs text-green-600 font-medium">
                          ✓ Unlocked
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {selectedTitle?.id === title.id && (
                        <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                      <span className="text-2xl">👑</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Locked Titles */}
        {lockedTitles.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
              <span>🔒</span>
              <span>Locked Titles ({lockedTitles.length})</span>
            </h3>
            
            <div className="grid gap-3">
              {lockedTitles.map(title => (
                <div
                  key={title.id}
                  className="p-4 border border-gray-200 rounded-lg bg-gray-50 opacity-75"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-700">{title.name}</h4>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-600">
                          Locked
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {title.description}
                      </p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-xs text-blue-600 font-medium">
                          {title.xpRequirement} XP Required
                        </span>
                        <span className="text-xs text-gray-500">
                          Need {title.xpRequirement - userXP} more XP
                        </span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <div 
                            className="h-1 bg-blue-500 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${Math.min((userXP / title.xpRequirement) * 100, 100)}%` 
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl opacity-50">🔒</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Titles Available */}
        {unlockedTitles.length === 0 && lockedTitles.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">👑</div>
            <p>No titles available yet.</p>
            <p className="text-sm">Keep earning XP to unlock titles!</p>
          </div>
        )}

        {/* Action Buttons */}
        {selectedTitle && selectedTitle.id !== activeTitle?.id && (
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setSelectedTitle(activeTitle || null)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleTitleSelect(selectedTitle)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Set as Active Title
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface TitleDisplayProps {
  title: Title;
  size?: 'sm' | 'md' | 'lg';
  showDescription?: boolean;
  className?: string;
}

export function TitleDisplay({ 
  title, 
  size = 'md', 
  showDescription = false,
  className 
}: TitleDisplayProps) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <span className="text-purple-600">👑</span>
      <div>
        <span className={cn(
          'font-semibold text-purple-700',
          sizeClasses[size]
        )}>
          {title.name}
        </span>
        {showDescription && (
          <p className="text-sm text-gray-600 mt-1">
            {title.description}
          </p>
        )}
      </div>
    </div>
  );
}