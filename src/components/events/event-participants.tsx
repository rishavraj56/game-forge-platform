'use client';

import React, { useState } from 'react';
import { Event, User } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface EventParticipant extends User {
  registeredAt: Date;
  status: 'registered' | 'attended' | 'cancelled';
}

interface EventParticipantsProps {
  event: Event;
  participants: EventParticipant[];
  onRemoveParticipant?: (userId: string) => void;
  onMarkAttended?: (userId: string) => void;
  onSendMessage?: (userIds: string[]) => void;
  className?: string;
}

export function EventParticipants({
  event,
  participants,
  onRemoveParticipant,
  onMarkAttended,
  onSendMessage,
  className
}: EventParticipantsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'registered' | 'attended' | 'cancelled'>('all');

  const filteredParticipants = participants.filter(participant => {
    const matchesSearch = participant.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         participant.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         participant.domain.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || participant.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleSelectParticipant = (userId: string) => {
    setSelectedParticipants(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedParticipants.length === filteredParticipants.length) {
      setSelectedParticipants([]);
    } else {
      setSelectedParticipants(filteredParticipants.map(p => p.id));
    }
  };

  const getStatusColor = (status: EventParticipant['status']) => {
    switch (status) {
      case 'registered':
        return 'bg-blue-100 text-blue-800';
      case 'attended':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: EventParticipant['status']) => {
    switch (status) {
      case 'registered':
        return '📝';
      case 'attended':
        return '✅';
      case 'cancelled':
        return '❌';
      default:
        return '❓';
    }
  };

  const formatRegistrationDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const statusCounts = {
    all: participants.length,
    registered: participants.filter(p => p.status === 'registered').length,
    attended: participants.filter(p => p.status === 'attended').length,
    cancelled: participants.filter(p => p.status === 'cancelled').length
  };

  const isEventPast = event.endDate < new Date();

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Event Participants ({participants.length})</CardTitle>
          <div className="flex items-center space-x-2">
            {selectedParticipants.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSendMessage?.(selectedParticipants)}
                >
                  Message ({selectedParticipants.length})
                </Button>
                {!isEventPast && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      selectedParticipants.forEach(userId => onMarkAttended?.(userId));
                      setSelectedParticipants([]);
                    }}
                  >
                    Mark Attended
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search participants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex space-x-2">
            {(['all', 'registered', 'attended', 'cancelled'] as const).map((status) => (
              <Button
                key={status}
                variant={filterStatus === status ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus(status)}
                className="capitalize"
              >
                {status} ({statusCounts[status]})
              </Button>
            ))}
          </div>
        </div>

        {/* Bulk Actions */}
        {filteredParticipants.length > 0 && (
          <div className="flex items-center justify-between py-2 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedParticipants.length === filteredParticipants.length}
                onChange={handleSelectAll}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-600">
                {selectedParticipants.length > 0 
                  ? `${selectedParticipants.length} selected`
                  : 'Select all'
                }
              </span>
            </div>
            
            {selectedParticipants.length > 0 && (
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedParticipants([])}
                >
                  Clear Selection
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Participants List */}
        <div className="space-y-3">
          {filteredParticipants.length > 0 ? (
            filteredParticipants.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selectedParticipants.includes(participant.id)}
                  onChange={() => handleSelectParticipant(participant.id)}
                  className="rounded border-gray-300"
                />
                
                <Avatar className="h-10 w-10">
                  <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium">
                    {participant.username.charAt(0).toUpperCase()}
                  </div>
                </Avatar>

                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-900">{participant.username}</h4>
                    <Badge variant="outline" className="text-xs">
                      {participant.domain}
                    </Badge>
                    <Badge 
                      variant="secondary" 
                      className={cn('text-xs', getStatusColor(participant.status))}
                    >
                      {getStatusIcon(participant.status)} {participant.status}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                    <span>{participant.email}</span>
                    <span>Level {participant.level}</span>
                    <span>Registered {formatRegistrationDate(participant.registeredAt)}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {participant.status === 'registered' && !isEventPast && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onMarkAttended?.(participant.id)}
                    >
                      Mark Attended
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSendMessage?.([participant.id])}
                  >
                    Message
                  </Button>
                  
                  {participant.status !== 'cancelled' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => onRemoveParticipant?.(participant.id)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">👥</div>
              <p className="text-sm">
                {searchQuery || filterStatus !== 'all' 
                  ? 'No participants match your filters'
                  : 'No participants yet'
                }
              </p>
              {(searchQuery || filterStatus !== 'all') && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterStatus('all');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {participants.length > 0 && (
          <div className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">{statusCounts.registered}</div>
                <div className="text-sm text-gray-600">Registered</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{statusCounts.attended}</div>
                <div className="text-sm text-gray-600">Attended</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{statusCounts.cancelled}</div>
                <div className="text-sm text-gray-600">Cancelled</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {statusCounts.attended > 0 ? Math.round((statusCounts.attended / statusCounts.all) * 100) : 0}%
                </div>
                <div className="text-sm text-gray-600">Attendance Rate</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}