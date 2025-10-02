'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  UserIcon, 
  CalendarIcon, 
  ChatBubbleLeftRightIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { Domain } from '@/lib/types';

interface MentorshipSession {
  id: string;
  mentorId: string;
  mentorName: string;
  mentorAvatar: string;
  date: Date;
  duration: number;
  type: 'video' | 'chat' | 'review';
  status: 'scheduled' | 'completed' | 'cancelled';
  topic: string;
  notes?: string;
  rating?: number;
}

interface MentorshipGoal {
  id: string;
  title: string;
  description: string;
  targetDate: Date;
  progress: number;
  status: 'active' | 'completed' | 'paused';
  milestones: {
    id: string;
    title: string;
    completed: boolean;
    completedAt?: Date;
  }[];
}

interface MentorshipDashboardProps {
  userId: string;
  userDomain: Domain;
}

export function MentorshipDashboard({ userId, userDomain }: MentorshipDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'goals' | 'mentors'>('overview');

  // Mock data
  const mockSessions: MentorshipSession[] = [
    {
      id: 'session-1',
      mentorId: 'mentor-1',
      mentorName: 'Sarah Chen',
      mentorAvatar: '/avatars/mentor-1.png',
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      duration: 60,
      type: 'video',
      status: 'scheduled',
      topic: 'Unity Performance Optimization'
    },
    {
      id: 'session-2',
      mentorId: 'mentor-1',
      mentorName: 'Sarah Chen',
      mentorAvatar: '/avatars/mentor-1.png',
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      duration: 45,
      type: 'video',
      status: 'completed',
      topic: 'Code Review: Player Controller',
      notes: 'Great progress on the movement system. Focus on input buffering for next session.',
      rating: 5
    },
    {
      id: 'session-3',
      mentorId: 'mentor-2',
      mentorName: 'Mike Rodriguez',
      mentorAvatar: '/avatars/mentor-2.png',
      date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 2 weeks ago
      duration: 30,
      type: 'chat',
      status: 'completed',
      topic: 'Career Guidance Discussion',
      rating: 4
    }
  ];

  const mockGoals: MentorshipGoal[] = [
    {
      id: 'goal-1',
      title: 'Master Unity Fundamentals',
      description: 'Complete comprehensive Unity training and build first complete game',
      targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 3 months from now
      progress: 65,
      status: 'active',
      milestones: [
        { id: 'm1', title: 'Complete Unity Basics Course', completed: true, completedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        { id: 'm2', title: 'Build Simple 2D Game', completed: true, completedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
        { id: 'm3', title: 'Learn Advanced Scripting', completed: false },
        { id: 'm4', title: 'Create Portfolio Project', completed: false }
      ]
    },
    {
      id: 'goal-2',
      title: 'Prepare for Junior Developer Role',
      description: 'Build portfolio and interview skills for entry-level positions',
      targetDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000), // 4 months from now
      progress: 25,
      status: 'active',
      milestones: [
        { id: 'm5', title: 'Update Resume', completed: true, completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        { id: 'm6', title: 'Build 3 Portfolio Projects', completed: false },
        { id: 'm7', title: 'Practice Technical Interviews', completed: false },
        { id: 'm8', title: 'Apply to 10 Companies', completed: false }
      ]
    }
  ];

  const upcomingSessions = mockSessions.filter(s => s.status === 'scheduled' && s.date > new Date());
  const recentSessions = mockSessions.filter(s => s.status === 'completed').slice(0, 3);
  const activeGoals = mockGoals.filter(g => g.status === 'active');

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSessionIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <VideoCameraIcon className="h-4 w-4" />;
      case 'chat':
        return <ChatBubbleLeftRightIcon className="h-4 w-4" />;
      case 'review':
        return <DocumentTextIcon className="h-4 w-4" />;
      default:
        return <CalendarIcon className="h-4 w-4" />;
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{mockSessions.filter(s => s.status === 'completed').length}</div>
            <div className="text-sm text-gray-600">Sessions Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{activeGoals.length}</div>
            <div className="text-sm text-gray-600">Active Goals</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(mockSessions.filter(s => s.rating).reduce((acc, s) => acc + (s.rating || 0), 0) / mockSessions.filter(s => s.rating).length * 10) / 10}
            </div>
            <div className="text-sm text-gray-600">Avg Rating</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {mockSessions.filter(s => s.status === 'completed').reduce((acc, s) => acc + s.duration, 0)}
            </div>
            <div className="text-sm text-gray-600">Minutes Mentored</div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Sessions */}
      {upcomingSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Upcoming Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="font-medium">{session.topic}</div>
                      <div className="text-sm text-gray-600">
                        with {session.mentorName} • {formatDate(session.date)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getSessionIcon(session.type)}
                    <span className="text-sm text-gray-600">{session.duration}min</span>
                    <Button size="sm">Join</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5" />
              Active Goals
            </div>
            <Button size="sm" variant="outline">
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Goal
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeGoals.map((goal) => (
              <div key={goal.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{goal.title}</h4>
                    <p className="text-sm text-gray-600">{goal.description}</p>
                  </div>
                  <Badge variant="outline">
                    {Math.round((new Date(goal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium">{goal.progress}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <div className="text-sm font-medium text-gray-700 mb-2">Milestones:</div>
                  <div className="space-y-1">
                    {goal.milestones.slice(0, 2).map((milestone) => (
                      <div key={milestone.id} className="flex items-center gap-2 text-sm">
                        {milestone.completed ? (
                          <CheckCircleIcon className="h-4 w-4 text-green-500" />
                        ) : (
                          <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />
                        )}
                        <span className={milestone.completed ? 'text-gray-500 line-through' : 'text-gray-700'}>
                          {milestone.title}
                        </span>
                      </div>
                    ))}
                    {goal.milestones.length > 2 && (
                      <div className="text-xs text-gray-500 ml-6">
                        +{goal.milestones.length - 2} more milestones
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSessions = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">All Sessions</h3>
        <Button>
          <PlusIcon className="h-4 w-4 mr-2" />
          Schedule Session
        </Button>
      </div>

      <div className="space-y-4">
        {mockSessions.map((session) => (
          <Card key={session.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                    <UserIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium">{session.topic}</h4>
                    <p className="text-sm text-gray-600">with {session.mentorName}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4" />
                        {formatDate(session.date)}
                      </div>
                      <div className="flex items-center gap-1">
                        <ClockIcon className="h-4 w-4" />
                        {session.duration} minutes
                      </div>
                      <div className="flex items-center gap-1">
                        {getSessionIcon(session.type)}
                        {session.type}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <Badge 
                    variant={session.status === 'completed' ? 'default' : session.status === 'scheduled' ? 'secondary' : 'outline'}
                  >
                    {session.status}
                  </Badge>
                  {session.rating && (
                    <div className="flex items-center gap-1 mt-2">
                      <StarIcon className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">{session.rating}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {session.notes && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 mb-1">Session Notes:</div>
                  <p className="text-sm text-gray-600">{session.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Mentorship Dashboard</h2>
        <p className="text-gray-600">Track your mentorship journey and connect with industry experts</p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: CalendarIcon },
            { id: 'sessions', label: 'Sessions', icon: VideoCameraIcon },
            { id: 'goals', label: 'Goals', icon: CheckCircleIcon },
            { id: 'mentors', label: 'Find Mentors', icon: UserIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'sessions' && renderSessions()}
      {activeTab === 'goals' && (
        <div className="text-center py-12">
          <CheckCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Goals Management</h3>
          <p className="text-gray-600">Detailed goals management interface coming soon.</p>
        </div>
      )}
      {activeTab === 'mentors' && (
        <div className="text-center py-12">
          <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Find Mentors</h3>
          <p className="text-gray-600">Browse and connect with mentors in your field.</p>
          <Button className="mt-4">Browse Mentors</Button>
        </div>
      )}
    </div>
  );
}