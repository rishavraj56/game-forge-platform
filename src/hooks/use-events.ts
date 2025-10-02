'use client';

import { useState, useEffect, useCallback } from 'react';
import { Event, Domain } from '@/lib/types';
import { 
  mockEvents,
  getUpcomingEvents,
  getEventsByDomain,
  getUserRegisteredEvents
} from '@/lib/mock-data';

interface UseEventsOptions {
  type?: 'upcoming' | 'all' | 'registered';
  domain?: Domain;
  limit?: number;
}

interface EventsData {
  events: Event[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export function useEvents(options: UseEventsOptions = {}) {
  const {
    type = 'upcoming',
    domain,
    limit = 10
  } = options;

  const [data, setData] = useState<EventsData>({
    events: [],
    isLoading: true,
    error: null,
    lastUpdated: null,
  });

  const fetchEvents = useCallback(async () => {
    setData(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300));

      let events: Event[] = [];

      switch (type) {
        case 'upcoming':
          events = getUpcomingEvents();
          break;
        case 'registered':
          events = getUserRegisteredEvents('1'); // Assuming user ID '1' for demo
          break;
        case 'all':
        default:
          events = [...mockEvents];
          break;
      }

      // Filter by domain if specified
      if (domain) {
        events = getEventsByDomain(domain);
      }

      // Apply limit
      const limitedEvents = events.slice(0, limit);

      setData({
        events: limitedEvents,
        isLoading: false,
        error: null,
        lastUpdated: new Date(),
      });
    } catch (error) {
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load events',
      }));
    }
  }, [type, domain, limit]);

  // Initial load
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const refresh = useCallback(() => {
    fetchEvents();
  }, [fetchEvents]);

  const registerForEvent = useCallback(async (eventId: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update the event's registration status
      setData(prev => ({
        ...prev,
        events: prev.events.map(event =>
          event.id === eventId
            ? { 
                ...event, 
                isRegistered: true,
                currentParticipants: event.currentParticipants + 1
              }
            : event
        ),
      }));

      // Save to localStorage
      const savedRegistrations = localStorage.getItem('gameforge_event_registrations');
      const registrations = savedRegistrations ? JSON.parse(savedRegistrations) : [];
      
      if (!registrations.includes(eventId)) {
        registrations.push(eventId);
        localStorage.setItem('gameforge_event_registrations', JSON.stringify(registrations));
      }
    } catch (error) {
      throw new Error('Failed to register for event');
    }
  }, []);

  const unregisterFromEvent = useCallback(async (eventId: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update the event's registration status
      setData(prev => ({
        ...prev,
        events: prev.events.map(event =>
          event.id === eventId
            ? { 
                ...event, 
                isRegistered: false,
                currentParticipants: Math.max(0, event.currentParticipants - 1)
              }
            : event
        ),
      }));

      // Remove from localStorage
      const savedRegistrations = localStorage.getItem('gameforge_event_registrations');
      const registrations = savedRegistrations ? JSON.parse(savedRegistrations) : [];
      const updatedRegistrations = registrations.filter((id: string) => id !== eventId);
      localStorage.setItem('gameforge_event_registrations', JSON.stringify(updatedRegistrations));
    } catch (error) {
      throw new Error('Failed to unregister from event');
    }
  }, []);

  return {
    ...data,
    refresh,
    registerForEvent,
    unregisterFromEvent,
  };
}