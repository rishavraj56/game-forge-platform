'use client';

import React from 'react';
import { Event } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface EventDetailsProps {
  event: Event;
  onRegister?: (eventId: string) => void;
  onUnregister?: (eventId: string) => void;
  onClose?: () => void;
  className?: string;
}

export function EventDetails({ 
  event, 
  onRegister, 
  onUnregister, 
  onClose,
  className 
}: EventDetailsProps) {
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

  const formatEventDateTime = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDuration = () => {
    const durationMs = event.endDate.getTime() - event.startDate.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours === 0) return `${minutes} minutes`;
    if (minutes === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minutes`;
  };

  const getCapacityStatus = () => {
    if (!event.maxParticipants) return null;
    
    const percentage = (event.currentParticipants / event.maxParticipants) * 100;
    
    if (percentage >= 100) return { status: 'full', color: 'text-red-600', bgColor: 'bg-red-50' };
    if (percentage >= 80) return { status: 'filling', color: 'text-orange-600', bgColor: 'bg-orange-50' };
    return { status: 'available', color: 'text-green-600', bgColor: 'bg-green-50' };
  };

  const capacityStatus = getCapacityStatus();
  const isEventPast = event.endDate < new Date();
  const isEventFull = capacityStatus?.status === 'full';

  return (
    <div className={cn('max-w-4xl mx-auto', className)}>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-3">
                <Badge 
                  variant="secondary" 
                  className={cn('text-sm px-3 py-1', getEventTypeColor(event.type))}
                >
                  {getEventTypeIcon(event.type)} {event.type.replace('_', ' ')}
                </Badge>
                {event.domain && (
                  <Badge variant="outline" className="text-sm px-3 py-1">
                    {event.domain}
                  </Badge>
                )}
                {event.isRegistered && (
                  <Badge variant="secondary" className="text-sm bg-green-100 text-green-800 px-3 py-1">
                    ✓ Registered
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {event.title}
              </h1>
              <p className="text-gray-600 text-lg leading-relaxed">
                {event.description}
              </p>
            </div>
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="ml-4"
              >
                ✕
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Event Information Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Event Details</h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <span className="text-lg">📅</span>
                    <div>
                      <div className="font-medium text-gray-900">Start Date</div>
                      <div className="text-gray-600">{formatEventDateTime(event.startDate)}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <span className="text-lg">🏁</span>
                    <div>
                      <div className="font-medium text-gray-900">End Date</div>
                      <div className="text-gray-600">{formatEventDateTime(event.endDate)}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <span className="text-lg">⏱️</span>
                    <div>
                      <div className="font-medium text-gray-900">Duration</div>
                      <div className="text-gray-600">{formatDuration()}</div>
                    </div>
                  </div>
                  
                  {event.location && (
                    <div className="flex items-start space-x-3">
                      <span className="text-lg">📍</span>
                      <div>
                        <div className="font-medium text-gray-900">Location</div>
                        <div className="text-gray-600">{event.location}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Organizer */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Organizer</h3>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Avatar className="h-10 w-10">
                    <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium">
                      {event.organizer.username.charAt(0).toUpperCase()}
                    </div>
                  </Avatar>
                  <div>
                    <div className="font-medium text-gray-900">{event.organizer.username}</div>
                    <div className="text-sm text-gray-600">{event.organizer.domain}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* Participation */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Participation</h3>
                {capacityStatus ? (
                  <div className={cn('p-4 rounded-lg', capacityStatus.bgColor)}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">Participants</span>
                      <span className={cn('font-bold', capacityStatus.color)}>
                        {event.currentParticipants}
                        {event.maxParticipants && `/${event.maxParticipants}`}
                      </span>
                    </div>
                    {event.maxParticipants && (
                      <div className="w-full bg-white rounded-full h-2">
                        <div 
                          className={cn(
                            'h-2 rounded-full transition-all',
                            capacityStatus.status === 'full' ? 'bg-red-500' :
                            capacityStatus.status === 'filling' ? 'bg-orange-500' : 'bg-green-500'
                          )}
                          style={{ 
                            width: `${Math.min((event.currentParticipants / event.maxParticipants) * 100, 100)}%` 
                          }}
                        />
                      </div>
                    )}
                    <div className={cn('text-sm mt-2', capacityStatus.color)}>
                      {capacityStatus.status === 'full' && 'Event is full'}
                      {capacityStatus.status === 'filling' && 'Filling up fast!'}
                      {capacityStatus.status === 'available' && 'Spots available'}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">Participants</span>
                      <span className="font-bold text-gray-900">{event.currentParticipants}</span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">No participant limit</div>
                  </div>
                )}
              </div>

              {/* Rewards */}
              {event.xpReward && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Rewards</h3>
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">⭐</span>
                      <span className="font-medium text-gray-900">
                        {event.xpReward} XP
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Earned upon event completion
                    </div>
                  </div>
                </div>
              )}

              {/* Tags */}
              {event.tags && event.tags.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {event.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-sm px-3 py-1">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {!isEventPast && (
            <div className="flex space-x-4 pt-6 border-t border-gray-200">
              {!event.isRegistered ? (
                <Button
                  size="lg"
                  className="flex-1 max-w-xs"
                  onClick={() => onRegister?.(event.id)}
                  disabled={isEventFull}
                >
                  {isEventFull ? 'Event Full' : 'Register for Event'}
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="outline"
                  className="flex-1 max-w-xs text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => onUnregister?.(event.id)}
                >
                  Unregister from Event
                </Button>
              )}
              <Button
                size="lg"
                variant="outline"
                className="flex-1 max-w-xs"
              >
                Share Event
              </Button>
            </div>
          )}

          {isEventPast && (
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <div className="text-gray-600">This event has ended</div>
              {event.isRegistered && (
                <div className="text-sm text-green-600 mt-1">
                  ✓ You attended this event
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}