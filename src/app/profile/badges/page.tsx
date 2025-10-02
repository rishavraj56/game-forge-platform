'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BadgeGrid, 
  TitleSelection, 
  AchievementNotificationManager,
  AchievementNotification 
} from '@/components/gamification';
import { mockBadges, mockTitles, mockUser, mockUserStats } from '@/lib/mock-data';
import { Badge, Title } from '@/lib/types';

export default function BadgesPage() {
  const [activeTitle, setActiveTitle] = useState<Title | undefined>(
    mockTitles.find(t => t.isActive)
  );
  const [showNotification, setShowNotification] = useState(false);
  const [notificationAchievement, setNotificationAchievement] = useState<Badge | Title | null>(null);
  const [notificationType, setNotificationType] = useState<'badge' | 'title'>('badge');

  const handleTitleSelect = (title: Title) => {
    setActiveTitle(title);
    // Simulate title change notification
    setNotificationAchievement(title);
    setNotificationType('title');
    setShowNotification(true);
  };

  const handleBadgeDemo = (badge: Badge) => {
    // Demo function to show badge notification
    setNotificationAchievement(badge);
    setNotificationType('badge');
    setShowNotification(true);
  };

  const handleNotificationClose = () => {
    setShowNotification(false);
    setNotificationAchievement(null);
  };

  return (
    <AchievementNotificationManager>
      <MainLayout>
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Badges & Titles</h1>
              <p className="text-gray-600">Manage your achievements and display preferences</p>
            </div>
            <Link href="/profile">
              <Button variant="outline">Back to Profile</Button>
            </Link>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{mockUserStats.totalXP}</div>
                <div className="text-sm text-gray-500">Total XP</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{mockUserStats.currentLevel}</div>
                <div className="text-sm text-gray-500">Current Level</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {mockBadges.filter(b => b.earnedAt).length}
                </div>
                <div className="text-sm text-gray-500">Badges Earned</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {mockTitles.filter(t => mockUserStats.totalXP >= t.xpRequirement).length}
                </div>
                <div className="text-sm text-gray-500">Titles Unlocked</div>
              </CardContent>
            </Card>
          </div>

          {/* Title Selection */}
          <TitleSelection
            titles={mockTitles}
            userXP={mockUserStats.totalXP}
            activeTitle={activeTitle}
            onTitleSelect={handleTitleSelect}
          />

          {/* Badges Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <span>🏆</span>
                  <span>Badge Collection</span>
                </CardTitle>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBadgeDemo(mockBadges[0])}
                  >
                    Demo Badge Notification
                  </Button>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Your earned badges and progress toward unlocking new ones
              </p>
            </CardHeader>
            <CardContent>
              <BadgeGrid
                badges={mockBadges}
                userXP={mockUserStats.totalXP}
              />
            </CardContent>
          </Card>

          {/* Achievement Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Achievement Progress</CardTitle>
              <p className="text-sm text-gray-600">
                Track your progress toward earning new achievements
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Next Badge Progress */}
                {(() => {
                  const nextBadge = mockBadges
                    .filter(b => !b.earnedAt && mockUserStats.totalXP < b.xpRequirement)
                    .sort((a, b) => a.xpRequirement - b.xpRequirement)[0];
                  
                  if (!nextBadge) return null;
                  
                  const progress = (mockUserStats.totalXP / nextBadge.xpRequirement) * 100;
                  
                  return (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-blue-900">Next Badge: {nextBadge.name}</h4>
                        <span className="text-sm text-blue-700">
                          {mockUserStats.totalXP}/{nextBadge.xpRequirement} XP
                        </span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                        <div 
                          className="h-2 bg-blue-600 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <p className="text-sm text-blue-700">
                        {nextBadge.description}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        {nextBadge.xpRequirement - mockUserStats.totalXP} XP remaining
                      </p>
                    </div>
                  );
                })()}

                {/* Next Title Progress */}
                {(() => {
                  const nextTitle = mockTitles
                    .filter(t => mockUserStats.totalXP < t.xpRequirement)
                    .sort((a, b) => a.xpRequirement - b.xpRequirement)[0];
                  
                  if (!nextTitle) return null;
                  
                  const progress = (mockUserStats.totalXP / nextTitle.xpRequirement) * 100;
                  
                  return (
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-purple-900">Next Title: {nextTitle.name}</h4>
                        <span className="text-sm text-purple-700">
                          {mockUserStats.totalXP}/{nextTitle.xpRequirement} XP
                        </span>
                      </div>
                      <div className="w-full bg-purple-200 rounded-full h-2 mb-2">
                        <div 
                          className="h-2 bg-purple-600 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <p className="text-sm text-purple-700">
                        {nextTitle.description}
                      </p>
                      <p className="text-xs text-purple-600 mt-1">
                        {nextTitle.xpRequirement - mockUserStats.totalXP} XP remaining
                      </p>
                    </div>
                  );
                })()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Achievement Notification */}
        <AchievementNotification
          achievement={notificationAchievement}
          type={notificationType}
          isVisible={showNotification}
          onClose={handleNotificationClose}
        />
      </MainLayout>
    </AchievementNotificationManager>
  );
}