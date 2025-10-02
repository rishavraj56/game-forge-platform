'use client';

import React, { useState } from 'react';
import { Event, User } from '@/lib/types';
import { EventCreateForm } from './event-create-form';
import { EventParticipants } from './event-participants';
import { EventTimeline } from './event-timeline';
import { EventDetails } from './event-details';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface EventParticipant extends User {
  registeredAt: Date;
  status: 'registered' | 'attended' | 'cancelled';
}

interface TimelineItem {
  id: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  type: 'session' | 'break' | 'announcement' | 'activity';
  speaker?: string;
  location?: string;
}

interface EventManagementProps {
  event?: Event;
  participants?: EventParticipant[];
  timeline?: TimelineItem[];
  onCreateEvent?: (eventData: any) => void;
  onUpdateEvent?: (eventId: string, updates: Partial<Event>) => void;
  onDeleteEvent?: (eventId: string) => void;
  onRemoveParticipant?: (userId: string) => void;
  onMarkAttended?: (userId: string) => void;
  onSendMessage?: (userIds: string[]) => void;
  onAddTimelineItem?: (item: Omit<TimelineItem, 'id'>) => void;
  onUpdateTimelineItem?: (id: string, item: Partial<TimelineItem>) => void;
  onDeleteTimelineItem?: (id: string) => void;
  className?: string;
}

type TabType = 'overview' | 'participants' | 'schedule' | 'settings';

export function EventManagement({
  event,
  participants = [],
  timeline = [],
  onCreateEvent,
  onUpdateEvent,
  onDeleteEvent,
  onRemoveParticipant,
  onMarkAttended,
  onSendMessage,
  onAddTimelineItem,
  onUpdateTimelineItem,
  onDeleteTimelineItem,
  className
}: EventManagementProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isCreating, setIsCreating] = useState(!event);

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: '📊' },
    { id: 'participants' as const, label: 'Participants', icon: '👥', count: participants.length },
    { id: 'schedule' as const, label: 'Schedule', icon: '📅', count: timeline.length },
    { id: 'settings' as const, label: 'Settings', icon: '⚙️' }
  ];

  const handleCreateEvent = (eventData: any) => {
    onCreateEvent?.(eventData);
    setIsCreating(false);
  };

  const getEventStatus = () => {
    if (!event) return null;
    
    const now = new Date();
    if (now < event.startDate) return { status: 'upcoming', color: 'bg-blue-100 text-blue-800' };
    if (now >= event.startDate && now <= event.endDate) return { status: 'live', color: 'bg-green-100 text-green-800' };
    return { status: 'ended', color: 'bg-gray-100 text-gray-800' };
  };

  const eventStatus = getEventStatus();

  if (isCreating) {
    return (
      <div className={className}>
        <EventCreateForm
          onSubmit={handleCreateEvent}
          onCancel={() => setIsCreating(false)}
        />
      </div>
    );
  }

  if (!event) {
    return (
      <div className={cn('text-center py-12', className)}>
        <div className="text-6xl mb-4">📅</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Event Selected</h3>
        <p className="text-gray-600 mb-4">Create a new event or select an existing one to manage.</p>
        <Button
          variant="primary"
          onClick={() => setIsCreating(true)}
        >
          Create New Event
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Event Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
                {eventStatus && (
                  <Badge variant="secondary" className={cn('capitalize', eventStatus.color)}>
                    {eventStatus.status}
                  </Badge>
                )}
              </div>
              <p className="text-gray-600 mb-4">{event.description}</p>
              
              <div className="grid md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="font-medium text-gray-900">Start Date</div>
                  <div className="text-gray-600">
                    {event.startDate.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Duration</div>
                  <div className="text-gray-600">
                    {Math.ceil((event.endDate.getTime() - event.startDate.getTime()) / (1000 * 60 * 60))} hours
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Participants</div>
                  <div className="text-gray-600">
                    {event.currentParticipants}
                    {event.maxParticipants && `/${event.maxParticipants}`}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-900">XP Reward</div>
                  <div className="text-gray-600">{event.xpReward || 0} XP</div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreating(true)}
              >
                Edit Event
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => onDeleteEvent?.(event.id)}
              >
                Delete Event
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors',
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <Badge variant="secondary" className="text-xs">
                  {tab.count}
                </Badge>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <EventDetails
              event={event}
              onRegister={() => {}}
              onUnregister={() => {}}
            />
            
            {/* Quick Stats */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{participants.length}</div>
                    <div className="text-sm text-gray-600">Total Participants</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {participants.filter(p => p.status === 'attended').length}
                    </div>
                    <div className="text-sm text-gray-600">Attended</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">{timeline.length}</div>
                    <div className="text-sm text-gray-600">Schedule Items</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'participants' && (
          <EventParticipants
            event={event}
            participants={participants}
            onRemoveParticipant={onRemoveParticipant}
            onMarkAttended={onMarkAttended}
            onSendMessage={onSendMessage}
          />
        )}

        {activeTab === 'schedule' && (
          <EventTimeline
            event={event}
            timeline={timeline}
            onAddItem={onAddTimelineItem}
            onUpdateItem={onUpdateTimelineItem}
            onDeleteItem={onDeleteTimelineItem}
            isEditable={true}
          />
        )}

        {activeTab === 'settings' && (
          <Card>
            <CardHeader>
              <CardTitle>Event Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Danger Zone</h3>
                  <div className="border border-red-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-red-900">Delete Event</h4>
                        <p className="text-sm text-red-700">
                          This action cannot be undone. All participant data will be lost.
                        </p>
                      </div>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => onDeleteEvent?.(event.id)}
                      >
                        Delete Event
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}