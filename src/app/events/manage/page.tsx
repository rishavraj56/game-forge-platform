'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { EventManagement } from '@/components/events';
import { mockEvents, mockLeaderboardUsers } from '@/lib/mock-data';
import { useState } from 'react';

// Mock data for event participants
const mockEventParticipants = mockLeaderboardUsers.slice(0, 5).map((user, index) => ({
  ...user,
  registeredAt: new Date(Date.now() - (index + 1) * 24 * 60 * 60 * 1000),
  status: index < 3 ? 'registered' as const : index === 3 ? 'attended' as const : 'cancelled' as const
}));

// Mock timeline data
const mockTimeline = [
  {
    id: '1',
    title: 'Welcome & Introduction',
    description: 'Opening remarks and event overview',
    startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
    type: 'announcement' as const,
    speaker: 'Event Organizer',
    location: 'Main Hall'
  },
  {
    id: '2',
    title: 'Unity Basics Workshop',
    description: 'Learn the fundamentals of Unity game development',
    startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
    endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
    type: 'session' as const,
    speaker: 'John Smith',
    location: 'Workshop Room A'
  },
  {
    id: '3',
    title: 'Coffee Break',
    description: 'Networking and refreshments',
    startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
    endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 2.5 * 60 * 60 * 1000),
    type: 'break' as const,
    location: 'Lobby'
  }
];

export default function EventManagePage() {
  const [selectedEvent, setSelectedEvent] = useState(mockEvents[0]);
  const [participants, setParticipants] = useState(mockEventParticipants);
  const [timeline, setTimeline] = useState(mockTimeline);

  const handleCreateEvent = (eventData: any) => {
    console.log('Creating event:', eventData);
    // TODO: Implement event creation logic
  };

  const handleUpdateEvent = (eventId: string, updates: any) => {
    console.log('Updating event:', eventId, updates);
    // TODO: Implement event update logic
  };

  const handleDeleteEvent = (eventId: string) => {
    console.log('Deleting event:', eventId);
    // TODO: Implement event deletion logic
  };

  const handleRemoveParticipant = (userId: string) => {
    setParticipants(prev => prev.filter(p => p.id !== userId));
    console.log('Removing participant:', userId);
  };

  const handleMarkAttended = (userId: string) => {
    setParticipants(prev => prev.map(p => 
      p.id === userId ? { ...p, status: 'attended' as const } : p
    ));
    console.log('Marking attended:', userId);
  };

  const handleSendMessage = (userIds: string[]) => {
    console.log('Sending message to:', userIds);
    // TODO: Implement messaging logic
  };

  const handleAddTimelineItem = (item: any) => {
    const newItem = {
      ...item,
      id: Date.now().toString()
    };
    setTimeline(prev => [...prev, newItem]);
    console.log('Adding timeline item:', newItem);
  };

  const handleUpdateTimelineItem = (id: string, updates: any) => {
    setTimeline(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
    console.log('Updating timeline item:', id, updates);
  };

  const handleDeleteTimelineItem = (id: string) => {
    setTimeline(prev => prev.filter(item => item.id !== id));
    console.log('Deleting timeline item:', id);
  };

  return (
    <MainLayout>
      <EventManagement
        event={selectedEvent}
        participants={participants}
        timeline={timeline}
        onCreateEvent={handleCreateEvent}
        onUpdateEvent={handleUpdateEvent}
        onDeleteEvent={handleDeleteEvent}
        onRemoveParticipant={handleRemoveParticipant}
        onMarkAttended={handleMarkAttended}
        onSendMessage={handleSendMessage}
        onAddTimelineItem={handleAddTimelineItem}
        onUpdateTimelineItem={handleUpdateTimelineItem}
        onDeleteTimelineItem={handleDeleteTimelineItem}
      />
    </MainLayout>
  );
}