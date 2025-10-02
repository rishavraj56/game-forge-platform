'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  XPProgressIndicator, 
  CircularXPProgress, 
  XPGainAnimation,
  LevelUpAnimation,
  LevelUpNotification,
  RewardUnlockInterface,
  ProgressMilestone,
  AchievementNotificationManager
} from '@/components/gamification';
import { mockBadges, mockTitles, mockUserStats } from '@/lib/mock-data';

export default function GamificationDemoPage() {
  const [currentXP, setCurrentXP] = useState(mockUserStats.totalXP);
  const [showXPGain, setShowXPGain] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showLevelUpNotification, setShowLevelUpNotification] = useState(false);
  const [xpGainAmount, setXPGainAmount] = useState(0);
  const [oldXP, setOldXP] = useState(currentXP);

  const handleAddXP = (amount: number) => {
    const newXP = currentXP + amount;
    setOldXP(currentXP);
    setCurrentXP(newXP);
    setXPGainAmount(amount);
    setShowXPGain(true);

    // Check for level up
    const oldLevel = Math.floor(currentXP / 200) + 1;
    const newLevel = Math.floor(newXP / 200) + 1;
    
    if (newLevel > oldLevel) {
      setTimeout(() => {
        setShowLevelUp(true);
      }, 1000);
      
      setTimeout(() => {
        setShowLevelUpNotification(true);
      }, 4000);
    }
  };

  const handleClaimReward = (type: 'badge' | 'title', id: string) => {
    console.log(`Claimed ${type}: ${id}`);
    // In a real app, this would update the user's rewards
  };

  const progressMilestones = [
    {
      xp: 500,
      title: 'Community Contributor',
      description: 'Make your mark in the community',
      reward: 'Contributor Badge',
      type: 'badge' as const
    },
    {
      xp: 1000,
      title: 'Forge Apprentice',
      description: 'Master the basics of The Game Forge',
      reward: 'Apprentice Title',
      type: 'title' as const
    },
    {
      xp: 2000,
      title: 'Master Forger',
      description: 'Become a true master of your craft',
      reward: 'Master Title',
      type: 'title' as const
    },
    {
      xp: 5000,
      title: 'Community Leader',
      description: 'Lead and inspire others in the community',
      reward: 'Mentorship Features',
      type: 'feature' as const
    }
  ];

  return (
    <AchievementNotificationManager>
      <MainLayout>
        <div className="space-y-6">
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gamification Demo</h1>
            <p className="text-gray-600">
              Interactive demonstration of XP progression, level-ups, and reward systems
            </p>
          </div>

          {/* XP Controls */}
          <Card>
            <CardHeader>
              <CardTitle>XP Controls</CardTitle>
              <p className="text-sm text-gray-600">
                Add XP to see progression animations and level-up effects
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => handleAddXP(25)} variant="outline">
                  +25 XP (Small Quest)
                </Button>
                <Button onClick={() => handleAddXP(50)} variant="outline">
                  +50 XP (Daily Quest)
                </Button>
                <Button onClick={() => handleAddXP(100)} variant="outline">
                  +100 XP (Weekly Quest)
                </Button>
                <Button onClick={() => handleAddXP(200)} variant="outline">
                  +200 XP (Level Up!)
                </Button>
                <Button 
                  onClick={() => setCurrentXP(0)} 
                  variant="outline"
                  className="ml-auto"
                >
                  Reset XP
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* XP Progress Indicators */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Linear Progress Indicators</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3">Small Size</h4>
                  <XPProgressIndicator currentXP={currentXP} size="sm" />
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Medium Size (Default)</h4>
                  <XPProgressIndicator currentXP={currentXP} size="md" />
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Large Size</h4>
                  <XPProgressIndicator currentXP={currentXP} size="lg" />
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Minimal (No Details)</h4>
                  <XPProgressIndicator 
                    currentXP={currentXP} 
                    size="md" 
                    showDetails={false} 
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Circular Progress Indicators</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6 text-center">
                  <div>
                    <h4 className="font-medium mb-3">Small (80px)</h4>
                    <CircularXPProgress currentXP={currentXP} size={80} />
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3">Medium (120px)</h4>
                    <CircularXPProgress currentXP={currentXP} size={120} />
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3">Large (160px)</h4>
                    <CircularXPProgress currentXP={currentXP} size={160} />
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3">No Level Display</h4>
                    <CircularXPProgress 
                      currentXP={currentXP} 
                      size={120} 
                      showLevel={false} 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Reward Unlock Interface */}
          <RewardUnlockInterface
            userXP={currentXP}
            availableBadges={mockBadges}
            availableTitles={mockTitles}
            onClaimReward={handleClaimReward}
          />

          {/* Progress Milestones */}
          <ProgressMilestone
            userXP={currentXP}
            milestones={progressMilestones}
          />

          {/* Current Stats Display */}
          <Card>
            <CardHeader>
              <CardTitle>Current Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {currentXP.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">Total XP</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {Math.floor(currentXP / 200) + 1}
                  </div>
                  <div className="text-sm text-gray-500">Current Level</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.max(0, 200 - (currentXP % 200))}
                  </div>
                  <div className="text-sm text-gray-500">XP to Next Level</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {mockBadges.filter(b => currentXP >= b.xpRequirement).length}
                  </div>
                  <div className="text-sm text-gray-500">Badges Available</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Animations */}
        <XPGainAnimation
          xpGained={xpGainAmount}
          isVisible={showXPGain}
          onComplete={() => setShowXPGain(false)}
          position={{ x: 50, y: 30 }}
        />

        <LevelUpAnimation
          newXP={currentXP}
          oldXP={oldXP}
          isVisible={showLevelUp}
          onAnimationComplete={() => setShowLevelUp(false)}
        />

        <LevelUpNotification
          newLevel={Math.floor(currentXP / 200) + 1}
          isVisible={showLevelUpNotification}
          onClose={() => setShowLevelUpNotification(false)}
        />
      </MainLayout>
    </AchievementNotificationManager>
  );
}