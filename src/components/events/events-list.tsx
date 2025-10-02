'use client';

import React, { useState, useMemo } from 'react';
import { Event, Domain, EventType } from '@/lib/types';
import { EventCard } from './event-card';
import { EventFilters } from './event-filters';
import { EventCalendar } from './event-calendar';
import { EventDetails } from './event-details';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface EventsListProps {
  events: Event[];
  onRegister?: (eventId: string) => void;
  onUnregister?: (eventId: string) => void;
  className?: string;
}

export function EventsList({ 
  events, 
  onRegister, 
  onUnregister, 
  className 
}: EventsListProps) {
  const [selectedDomain, setSelectedDomain] = useState<Domain | undefined>();
  const [selectedEventType, setSelectedEventType] = useState<EventType | undefined>();
  const [selectedTimeframe, setSelectedTimeframe] = useState<'upcoming' | 'this_week' | 'this_month' | 'all'>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Filter events based on selected filters
  const filteredEvents = useMemo(() => {
    let filtered = events;

    // Filter by domain
    if (selectedDomain) {
      filtered = filtered.filter(event => event.domain === selectedDomain);
    }

    // Filter by event type
    if (selectedEventType) {
      filtered = filtered.filter(event => event.type === selectedEventType);
    }

    // Filter by timeframe
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    switch (selectedTimeframe) {
      case 'upcoming':
        filtered = filtered.filter(event => event.startDate > now);
        break;
      case 'this_week':
        filtered = filtered.filter(event => 
          event.startDate > now && event.startDate <= oneWeekFromNow
        );
        break;
      case 'this_month':
        filtered = filtered.filter(event => 
          event.startDate > now && event.startDate <= oneMonthFromNow
        );
        break;
      case 'all':
        // Show all events
        break;
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.organizer.username.toLowerCase().includes(query) ||
        event.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Sort by start date
    return filtered.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }, [events, selectedDomain, selectedEventType, selectedTimeframe, searchQuery]);

  // Calculate event counts for filters
  const eventCounts = useMemo(() => {
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const counts: Record<string, number> = {
      upcoming: events.filter(e => e.startDate > now).length,
      this_week: events.filter(e => e.startDate > now && e.startDate <= oneWeekFromNow).length,
      this_month: events.filter(e => e.startDate > now && e.startDate <= oneMonthFromNow).length,
      all: events.length,
      all_types: events.length,
      all_domains: events.length
    };

    // Count by event type
    const eventTypes: EventType[] = ['game_jam', 'workshop', 'meetup', 'competition', 'webinar', 'panel', 'showcase'];
    eventTypes.forEach(type => {
      counts[type] = events.filter(e => e.type === type).length;
    });

    // Count by domain
    const domains: Domain[] = [
      'Game Development', 'Game Design', 'Game Art', 
      'AI for Game Development', 'Creative', 'Corporate'
    ];
    domains.forEach(domain => {
      counts[domain] = events.filter(e => e.domain === domain).length;
    });

    return counts;
  }, [events]);

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
  };

  const handleCloseDetails = () => {
    setSelectedEvent(null);
  };

  if (selectedEvent) {
    return (
      <EventDetails
        event={selectedEvent}
        onRegister={onRegister}
        onUnregister={onUnregister}
        onClose={handleCloseDetails}
        className={className}
      />
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-600">Join game jams, workshops, and community activities</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'list' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            📋 List
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('calendar')}
          >
            📅 Calendar
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Input
          placeholder="Search events..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <EventFilters
            selectedDomain={selectedDomain}
            selectedEventType={selectedEventType}
            selectedTimeframe={selectedTimeframe}
            onDomainChange={setSelectedDomain}
            onEventTypeChange={setSelectedEventType}
            onTimeframeChange={setSelectedTimeframe}
            eventCounts={eventCounts}
          />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {viewMode === 'calendar' ? (
            <EventCalendar
              events={filteredEvents}
              onEventClick={handleEventClick}
            />
          ) : (
            <div className="space-y-6">
              {/* Results Summary */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
                </div>
                {(selectedDomain || selectedEventType || selectedTimeframe !== 'upcoming' || searchQuery) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedDomain(undefined);
                      setSelectedEventType(undefined);
                      setSelectedTimeframe('upcoming');
                      setSearchQuery('');
                    }}
                  >
                    Clear filters
                  </Button>
                )}
              </div>

              {/* Events Grid */}
              {filteredEvents.length > 0 ? (
                <div className="grid gap-6">
                  {filteredEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onRegister={onRegister}
                      onUnregister={onUnregister}
                      onViewDetails={(eventId) => {
                        const event = filteredEvents.find(e => e.id === eventId);
                        if (event) handleEventClick(event);
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📅</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchQuery || selectedDomain || selectedEventType || selectedTimeframe !== 'upcoming'
                      ? 'Try adjusting your filters or search terms.'
                      : 'Check back later for exciting community events!'
                    }
                  </p>
                  {(selectedDomain || selectedEventType || selectedTimeframe !== 'upcoming' || searchQuery) && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedDomain(undefined);
                        setSelectedEventType(undefined);
                        setSelectedTimeframe('upcoming');
                        setSearchQuery('');
                      }}
                    >
                      Clear all filters
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}