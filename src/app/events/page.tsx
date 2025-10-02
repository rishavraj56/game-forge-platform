'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { EventsList } from '@/components/events';
import { mockEvents } from '@/lib/mock-data';

export default function EventsPage() {
  const handleRegister = (eventId: string) => {
    console.log('Registering for event:', eventId);
    // TODO: Implement registration logic
  };

  const handleUnregister = (eventId: string) => {
    console.log('Unregistering from event:', eventId);
    // TODO: Implement unregistration logic
  };

  return (
    <MainLayout>
      <EventsList
        events={mockEvents}
        onRegister={handleRegister}
        onUnregister={handleUnregister}
      />
    </MainLayout>
  );
}