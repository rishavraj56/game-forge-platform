'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { 
  DashboardGrid, 
  DashboardSection,
  WelcomeWidget,
  MyQuestsWidget,
  LeaderboardWidget,
  UpcomingEventsWidget,
  ActivityFeed
} from '@/components/dashboard';
import { LiveActivityFeed } from '@/components/ui/live-activity-feed';
import { RealTimeStatus } from '@/components/ui/real-time-status';
import { 
  QuestCompletionAnimation
} from '@/components/gamification';
import { 
  mockDailyQuests, 
  mockWeeklyQuests, 
  mockUserQuestProgress, 
  mockUserStats,
  mockUser,
  mockLeaderboardUsers,
  mockWeeklyLeaderboardUsers,
  mockUpcomingEvents,
  mockActivityFeed
} from '@/lib/mock-data';
import { Quest } from '@/lib/types';

export default function MainAnvilPage() {
  const [completedQuest, setCompletedQuest] = useState<Quest | null>(null);
  const [showAnimation, setShowAnimation] = useState(false);

  const handleQuestComplete = (questId: string) => {
    const quest = [...mockDailyQuests, ...mockWeeklyQuests].find(q => q.id === questId);
    if (quest) {
      setCompletedQuest(quest);
      setShowAnimation(true);
    }
  };

  const handleAnimationComplete = () => {
    setShowAnimation(false);
    setCompletedQuest(null);
  };

  const handleEventRegister = (eventId: string) => {
    console.log('Registering for event:', eventId);
    // TODO: Implement event registration logic
  };

  const handleEventUnregister = (eventId: string) => {
    console.log('Unregistering from event:', eventId);
    // TODO: Implement event unregistration logic
  };

  const handleViewProfile = () => {
    console.log('Navigating to profile');
    // TODO: Navigate to profile page
  };

  const handleViewQuests = () => {
    console.log('Navigating to quests');
    // TODO: Navigate to quests page or scroll to quests section
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Main Anvil</h1>
          <p className="text-gray-600">Your personalized dashboard and command center</p>
        </div>

        <DashboardGrid>
          {/* Welcome Widget - spans 2 columns on large screens */}
          <DashboardSection span={{ lg: 2 }}>
            <WelcomeWidget
              user={mockUser}
              userStats={mockUserStats}
              onViewProfile={handleViewProfile}
              onViewQuests={handleViewQuests}
            />
          </DashboardSection>

          {/* Live Activity Feed - spans 1 column */}
          <DashboardSection>
            <div className="h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Live Activity</h3>
                <RealTimeStatus size="sm" />
              </div>
              <div className="h-[400px]">
                <LiveActivityFeed 
                  maxItems={8}
                  showHeader={false}
                  className="h-full"
                />
              </div>
            </div>
          </DashboardSection>

          {/* My Quests Widget - spans 2 columns on large screens */}
          <DashboardSection span={{ lg: 2 }}>
            <MyQuestsWidget
              dailyQuests={mockDailyQuests}
              weeklyQuests={mockWeeklyQuests}
              userProgress={mockUserQuestProgress}
              onQuestComplete={handleQuestComplete}
            />
          </DashboardSection>

          {/* Leaderboard Widget - spans 1 column */}
          <DashboardSection>
            <LeaderboardWidget
              allTimeUsers={mockLeaderboardUsers}
              weeklyUsers={mockWeeklyLeaderboardUsers}
              currentUser={mockUser}
            />
          </DashboardSection>

          {/* Upcoming Events Widget - spans full width on medium screens and up */}
          <DashboardSection span={{ md: 2, lg: 3 }}>
            <UpcomingEventsWidget
              events={mockUpcomingEvents}
              onRegister={handleEventRegister}
              onUnregister={handleEventUnregister}
            />
          </DashboardSection>
        </DashboardGrid>
      </div>

      {/* Quest Completion Animation */}
      <QuestCompletionAnimation
        quest={completedQuest}
        isVisible={showAnimation}
        onAnimationComplete={handleAnimationComplete}
      />
    </MainLayout>
  );
}