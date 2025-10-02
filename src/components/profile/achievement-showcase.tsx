'use client';

import { Badge, Title } from '@/lib/types';
import { BadgeCollection } from './badge-display';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AchievementShowcaseProps {
  badges: Badge[];
  titles: Title[];
  className?: string;
}

export function AchievementShowcase({ badges, titles, className }: AchievementShowcaseProps) {
  const earnedBadges = badges.filter(badge => badge.earnedAt);
  const activeTitle = titles.find(title => title.isActive);
  const availableTitles = titles.filter(title => !title.isActive);

  return (
    <Card className={cn('p-6 space-y-6', className)}>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Achievements</h3>
        
        {/* Active Title */}
        {activeTitle && (
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-700 mb-2">Current Title</div>
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-purple-500 to-blue-600 text-white">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.664 1.319a.75.75 0 01.672 0 41.059 41.059 0 018.198 5.424.75.75 0 01-.254 1.285 31.372 31.372 0 00-7.86 3.83.75.75 0 01-.84 0 31.508 31.508 0 00-2.08-1.287V9.394c0-.244.116-.463.302-.592a35.504 35.504 0 013.305-2.033.75.75 0 00-.714-1.319 37 37 0 00-3.446 2.12A2.216 2.216 0 006 9.393v.38a31.293 31.293 0 00-4.28-1.746.75.75 0 01-.254-1.285 41.059 41.059 0 018.198-5.424zM6 11.459a29.848 29.848 0 00-2.455-1.158 41.029 41.029 0 00-.39 3.114.75.75 0 00.419.74c.528.256 1.046.53 1.554.82-.21-.899-.455-1.746-.754-2.516zm9.909-1.158A29.848 29.848 0 0014 11.459c-.299.77-.544 1.617-.754 2.516.508-.29 1.026-.564 1.554-.82a.75.75 0 00.419-.74 41.029 41.029 0 00-.39-3.114z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold">{activeTitle.name}</span>
            </div>
          </div>
        )}

        {/* Badges Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-gray-700">
              Badges ({earnedBadges.length}/{badges.length})
            </div>
            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              View All
            </button>
          </div>
          
          {earnedBadges.length > 0 ? (
            <BadgeCollection badges={earnedBadges} maxDisplay={8} size="md" />
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="w-16 h-16 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm">No badges earned yet</p>
              <p className="text-xs text-gray-400 mt-1">Complete quests to earn your first badge!</p>
            </div>
          )}
        </div>

        {/* Available Titles */}
        {availableTitles.length > 0 && (
          <div>
            <div className="text-sm font-medium text-gray-700 mb-3">Available Titles</div>
            <div className="space-y-2">
              {availableTitles.slice(0, 3).map((title) => (
                <div 
                  key={title.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-gray-900">{title.name}</div>
                    <div className="text-sm text-gray-600">{title.description}</div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {title.xpRequirement} XP
                  </div>
                </div>
              ))}
              
              {availableTitles.length > 3 && (
                <button className="w-full text-center py-2 text-sm text-blue-600 hover:text-blue-800 font-medium">
                  View {availableTitles.length - 3} more titles
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}