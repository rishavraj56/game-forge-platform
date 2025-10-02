'use client';

import React from 'react';
import { Domain, EventType } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface EventFiltersProps {
  selectedDomain?: Domain;
  selectedEventType?: EventType;
  selectedTimeframe?: 'upcoming' | 'this_week' | 'this_month' | 'all';
  onDomainChange?: (domain?: Domain) => void;
  onEventTypeChange?: (type?: EventType) => void;
  onTimeframeChange?: (timeframe: 'upcoming' | 'this_week' | 'this_month' | 'all') => void;
  eventCounts?: Record<string, number>;
  className?: string;
}

export function EventFilters({
  selectedDomain,
  selectedEventType,
  selectedTimeframe = 'upcoming',
  onDomainChange,
  onEventTypeChange,
  onTimeframeChange,
  eventCounts = {},
  className
}: EventFiltersProps) {
  const domains: Domain[] = [
    'Game Development',
    'Game Design',
    'Game Art',
    'AI for Game Development',
    'Creative',
    'Corporate'
  ];

  const eventTypes: { type: EventType; label: string; icon: string }[] = [
    { type: 'game_jam', label: 'Game Jams', icon: '🎮' },
    { type: 'workshop', label: 'Workshops', icon: '🛠️' },
    { type: 'meetup', label: 'Meetups', icon: '👥' },
    { type: 'competition', label: 'Competitions', icon: '🏆' },
    { type: 'webinar', label: 'Webinars', icon: '📺' },
    { type: 'panel', label: 'Panels', icon: '🎤' },
    { type: 'showcase', label: 'Showcases', icon: '🎨' }
  ];

  const timeframes = [
    { value: 'upcoming' as const, label: 'Upcoming' },
    { value: 'this_week' as const, label: 'This Week' },
    { value: 'this_month' as const, label: 'This Month' },
    { value: 'all' as const, label: 'All Events' }
  ];

  return (
    <div className={cn('space-y-6', className)}>
      {/* Timeframe Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Timeframe</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {timeframes.map((timeframe) => (
              <Button
                key={timeframe.value}
                variant={selectedTimeframe === timeframe.value ? 'primary' : 'ghost'}
                size="sm"
                className="w-full justify-start text-sm"
                onClick={() => onTimeframeChange?.(timeframe.value)}
              >
                {timeframe.label}
                {eventCounts[timeframe.value] !== undefined && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {eventCounts[timeframe.value]}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Event Type Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Event Types</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <Button
              variant={!selectedEventType ? 'primary' : 'ghost'}
              size="sm"
              className="w-full justify-start text-sm"
              onClick={() => onEventTypeChange?.(undefined)}
            >
              All Types
              {eventCounts.all_types !== undefined && (
                <Badge variant="secondary" className="ml-auto text-xs">
                  {eventCounts.all_types}
                </Badge>
              )}
            </Button>
            {eventTypes.map((eventType) => (
              <Button
                key={eventType.type}
                variant={selectedEventType === eventType.type ? 'primary' : 'ghost'}
                size="sm"
                className="w-full justify-start text-sm"
                onClick={() => onEventTypeChange?.(eventType.type)}
              >
                <span className="mr-2">{eventType.icon}</span>
                {eventType.label}
                {eventCounts[eventType.type] !== undefined && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {eventCounts[eventType.type]}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Domain Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Domains</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <Button
              variant={!selectedDomain ? 'primary' : 'ghost'}
              size="sm"
              className="w-full justify-start text-sm"
              onClick={() => onDomainChange?.(undefined)}
            >
              All Domains
              {eventCounts.all_domains !== undefined && (
                <Badge variant="secondary" className="ml-auto text-xs">
                  {eventCounts.all_domains}
                </Badge>
              )}
            </Button>
            {domains.map((domain) => (
              <Button
                key={domain}
                variant={selectedDomain === domain ? 'primary' : 'ghost'}
                size="sm"
                className="w-full justify-start text-sm"
                onClick={() => onDomainChange?.(domain)}
              >
                {domain}
                {eventCounts[domain] !== undefined && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {eventCounts[domain]}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Clear Filters */}
      {(selectedDomain || selectedEventType || selectedTimeframe !== 'upcoming') && (
        <Card>
          <CardContent className="pt-6">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                onDomainChange?.(undefined);
                onEventTypeChange?.(undefined);
                onTimeframeChange?.('upcoming');
              }}
            >
              Clear All Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}