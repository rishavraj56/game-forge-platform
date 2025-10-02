'use client';

import React from 'react';
import { Event } from '@/lib/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface EventCardProps {
  event: Event;
  onRegister?: (eventId: string) => void;
  onUnregister?: (eventId: string) => void;
  onViewDetails?: (eventId: string) => void;
  className?: string;
}

export function EventCard({ 
  event, 
  onRegister, 
  onUnregister, 
  onViewDetails,
  className 
}: EventCardProps) {
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

  const getCapacityStatus = () => {
    if (!event.maxParticipants) return null;
    
    const percentage = (event.currentParticipants / event.maxParticipants) * 100;
    
    if (percentage >= 100) return { status: 'full', color: 'text-red-600' };
    if (percentage >= 80) return { status: 'filling', color: 'text-orange-600' };
    return { status: 'available', color: 'text-green-600' };
  };

  const capacityStatus = getCapacityStatus();
  const isEventPast = event.endDate < new Date();
  const isEventFull = capacityStatus?.status === 'full';

  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
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
              {event.isRegistered && (
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                  ✓ Registered
                </Badge>
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {event.title}
            </h3>
            <p className="text-sm text-gray-600 line-clamp-2">
              {event.description}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Event Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-gray-600">
                <span>📅</span>
                <span>{formatEventDate(event.startDate)}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <span>🕒</span>
                <span>{formatEventTime(event.startDate)}</span>
              </div>
              {event.location && (
                <div className="flex items-center space-x-2 text-gray-600">
                  <span>📍</span>
                  <span>{event.location}</span>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              {capacityStatus && (
                <div className="flex items-center space-x-2">
                  <span>👥</span>
                  <span className={cn('text-sm font-medium', capacityStatus.color)}>
                    {event.currentParticipants}
                    {event.maxParticipants && `/${event.maxParticipants}`} participants
                  </span>
                </div>
              )}
              {event.xpReward && (
                <div className="flex items-center space-x-2 text-gray-600">
                  <span>⭐</span>
                  <span className="text-sm">{event.xpReward} XP reward</span>
                </div>
              )}
            </div>
          </div>

          {/* Organizer */}
          <div className="flex items-center space-x-2 pt-2 border-t border-gray-100">
            <Avatar className="h-6 w-6">
              <div className="h-6 w-6 bg-gray-200 rounded-full flex items-center justify-center text-xs">
                {event.organizer.username.charAt(0).toUpperCase()}
              </div>
            </Avatar>
            <span className="text-xs text-gray-500">
              Organized by <span className="font-medium">{event.organizer.username}</span>
            </span>
          </div>

          {/* Tags */}
          {event.tags && event.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-2">
              {event.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs px-2 py-0.5">
                  {tag}
                </Badge>
              ))}
              {event.tags.length > 3 && (
                <Badge variant="outline" className="text-xs px-2 py-0.5">
                  +{event.tags.length - 3} more
                </Badge>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-3">
            {!isEventPast && (
              <>
                {!event.isRegistered ? (
                  <Button
                    size="sm"
                    variant="primary"
                    className="flex-1"
                    onClick={() => onRegister?.(event.id)}
                    disabled={isEventFull}
                  >
                    {isEventFull ? 'Event Full' : 'Register'}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => onUnregister?.(event.id)}
                  >
                    Unregister
                  </Button>
                )}
              </>
            )}
            <Button
              size="sm"
              variant="outline"
              className={isEventPast ? 'flex-1' : ''}
              onClick={() => onViewDetails?.(event.id)}
            >
              {isEventPast ? 'View Details' : 'Details'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}