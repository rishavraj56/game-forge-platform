'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QuestManagement } from './quest-management';
import { XPRewardConfig } from './xp-reward-config';
import { BadgeManagement } from './badge-management';

type GamificationView = 'quests' | 'xp' | 'badges';

export function GamificationManagement() {
  const [activeView, setActiveView] = useState<GamificationView>('quests');

  const renderContent = () => {
    switch (activeView) {
      case 'quests':
        return <QuestManagement />;
      case 'xp':
        return <XPRewardConfig />;
      case 'badges':
        return <BadgeManagement />;
      default:
        return <QuestManagement />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gamification Management
          </h1>
          <p className="text-gray-600">
            Manage quests, XP rewards, badges, and titles
          </p>
        </div>

        {/* Navigation */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Button
                variant={activeView === 'quests' ? 'primary' : 'ghost'}
                onClick={() => setActiveView('quests')}
              >
                Quest Management
              </Button>
              <Button
                variant={activeView === 'xp' ? 'primary' : 'ghost'}
                onClick={() => setActiveView('xp')}
              >
                XP & Rewards
              </Button>
              <Button
                variant={activeView === 'badges' ? 'primary' : 'ghost'}
                onClick={() => setActiveView('badges')}
              >
                Badges & Titles
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        {renderContent()}
      </div>
    </div>
  );
}