'use client';

import React from 'react';
import { WidgetContainer } from './widget-container';
import { Button } from '@/components/ui/button';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { Event } from '@/lib/types';

interface UpcomingEventsWidgetProps {
  events: Event[];
  onRegister?: (eventId: string) => void;
  onUnregister?: (eventId: string) => void;
  className?: string;
}

export function UpcomingEventsWidget({ 
  events, 
  onRegister, 
  onUnregister,
  className 
}: UpcomingEventsWidgetProps) {
  const upcomingEvents = events
    .filter(event => event.startDate > new Date())
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    .slice(0, 4);

  const getEventTypeIcon = (type: Event['type']) => {
    switch (type) {
      case 'game_jam':
        return '🎮';
      case 'workshop':
        return '🛠️';
      case 'meetup':
        return '👥';
      case 'competition':
        return '🏆';
      case 'webinar':
        return '📺';
      case 'panel':
        return '🎤';
      case 'showcase':
        return '🎨';
      default:
        return '📅';
    }
  };

  const getEventTypeColor = (type: Event['type']) => {
    switch (type) {
      case 'game_jam':
        return 'bg-purple-100 text-purple-800';
      case 'workshop':
        return 'bg-blue-100 text-blue-800';
      case 'meetup':
        return 'bg-green-100 text-green-800';
      case 'competition':
        return 'bg-yellow-100 text-yellow-800';
      case 'webinar':
        return 'bg-indigo-100 text-indigo-800';
      case 'panel':
        return 'bg-orange-100 text-orange-800';
      case 'showcase':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatEventDate = (date: Date) => {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `In ${diffDays} days`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const formatEventTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getCapacityStatus = (event: Event) => {
    if (!event.maxParticipants) return null;
    
    const percentage = (event.currentParticipants / event.maxParticipants) * 100;
    
    if (percentage >= 100) return { status: 'full', color: 'text-red-600' };
    if (percentage >= 80) return { status: 'filling', color: 'text-orange-600' };
    return { status: 'available', color: 'text-green-600' };
  };

  return (
    <WidgetContainer 
      title="Upcoming Events" 
      size="lg"
      className={className}
      headerAction={
        <Button variant="outline" size="sm" className="text-xs">
          View All
        </Button>
      }
    >
      <div className="space-y-4">
        {upcomingEvents.map((event) => {
          const capacityStatus = getCapacityStatus(event);
          
          return (
            <div 
              key={event.id} 
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {/* Event Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <Badge 
                      variant="secondary" 
                      className={cn('text-xs px-2 py-1', getEventTypeColor(event.type))}
                    >
                      {getEventTypeIcon(event.type)} {event.type.replace('_', ' ')}
                    </Badge>
                    {event.domain && (
                      <Badge variant="outline" className="text-xs px-2 py-1">
                        {event.domain}
                      </Badge>
                    )}
                  </div>
                  <h4 className="font-semibold text-sm text-gray-900 mb-1">
                    {event.title}
                  </h4>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {event.description}
                  </p>
                </div>
              </div>

              {/* Event Details */}
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-4">
                    <span className="text-gray-600">
                      📅 {formatEventDate(event.startDate)}
                    </span>
                    <span className="text-gray-600">
                      🕒 {formatEventTime(event.startDate)}
                    </span>
                  </div>
                  {capacityStatus && (
                    <span className={cn('font-medium', capacityStatus.color)}>
                      {event.currentParticipants}
                      {event.maxParticipants && `/${event.maxParticipants}`} participants
                    </span>
                  )}
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">
                    Organized by {event.organizer.username}
                  </span>
                  {event.isRegistered && (
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                      ✓ Registered
                    </Badge>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="flex space-x-2">
                {!event.isRegistered ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs"
                    onClick={() => onRegister?.(event.id)}
                    disabled={capacityStatus?.status === 'full'}
                  >
                    {capacityStatus?.status === 'full' ? 'Event Full' : 'Register'}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => onUnregister?.(event.id)}
                  >
                    Unregister
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs text-gray-600"
                >
                  Details
                </Button>
              </div>
            </div>
          );
        })}

        {upcomingEvents.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📅</div>
            <p className="text-sm">No upcoming events</p>
            <p className="text-xs text-gray-400 mt-1">Check back later for exciting community events!</p>
          </div>
        )}
      </div>
    </WidgetContainer>
  );
}