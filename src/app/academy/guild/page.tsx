'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { MentorshipOverview } from '@/components/academy/mentorship-overview';
import { MentorMatching } from '@/components/academy/mentor-matching';
import { MentorshipDashboard } from '@/components/academy/mentorship-dashboard';

export default function GuildPage() {
  const [currentView, setCurrentView] = useState<'overview' | 'find-mentor' | 'dashboard'>('overview');
  const userId = '1'; // Mock user ID
  const userDomain = 'Game Development'; // Mock user domain

  const handleJoinProgram = () => {
    setCurrentView('dashboard');
  };

  const handleFindMentor = () => {
    setCurrentView('find-mentor');
  };

  const handleBecomeMentor = () => {
    // In a real app, this would navigate to mentor application
    console.log('Navigate to mentor application');
  };

  const handleRequestMentorship = (mentorId: string) => {
    console.log('Request mentorship from:', mentorId);
    // In a real app, this would send a mentorship request
    setCurrentView('dashboard');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'find-mentor':
        return (
          <MentorMatching
            userDomain={userDomain}
            onRequestMentorship={handleRequestMentorship}
          />
        );
      case 'dashboard':
        return (
          <MentorshipDashboard
            userId={userId}
            userDomain={userDomain}
          />
        );
      default:
        return (
          <MentorshipOverview
            onJoinProgram={handleJoinProgram}
            onFindMentor={handleFindMentor}
            onBecomeMentor={handleBecomeMentor}
          />
        );
    }
  };

  return (
    <MainLayout>
      <div className="py-6">
        {/* Navigation breadcrumb */}
        {currentView !== 'overview' && (
          <div className="mb-6">
            <button
              onClick={() => setCurrentView('overview')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              ← Back to Guild Overview
            </button>
          </div>
        )}
        
        {renderContent()}
      </div>
    </MainLayout>
  );
}