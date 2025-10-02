'use client';

import React, { useState } from 'react';
import { Event } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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

interface EventTimelineProps {
  event: Event;
  timeline: TimelineItem[];
  onAddItem?: (item: Omit<TimelineItem, 'id'>) => void;
  onUpdateItem?: (id: string, item: Partial<TimelineItem>) => void;
  onDeleteItem?: (id: string) => void;
  isEditable?: boolean;
  className?: string;
}

export function EventTimeline({
  event,
  timeline,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  isEditable = false,
  className
}: EventTimelineProps) {
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<Omit<TimelineItem, 'id'>>({
    title: '',
    description: '',
    startTime: new Date(),
    endTime: new Date(),
    type: 'session',
    speaker: '',
    location: ''
  });

  const sortedTimeline = [...timeline].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  const getTypeColor = (type: TimelineItem['type']) => {
    switch (type) {
      case 'session':
        return 'bg-blue-100 text-blue-800';
      case 'break':
        return 'bg-green-100 text-green-800';
      case 'announcement':
        return 'bg-yellow-100 text-yellow-800';
      case 'activity':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: TimelineItem['type']) => {
    switch (type) {
      case 'session':
        return '📚';
      case 'break':
        return '☕';
      case 'announcement':
        return '📢';
      case 'activity':
        return '🎯';
      default:
        return '📅';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDuration = (start: Date, end: Date) => {
    const durationMs = end.getTime() - start.getTime();
    const minutes = Math.floor(durationMs / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours === 0) return `${minutes}m`;
    if (remainingMinutes === 0) return `${hours}h`;
    return `${hours}h ${remainingMinutes}m`;
  };

  const handleAddItem = () => {
    if (newItem.title && newItem.startTime && newItem.endTime) {
      onAddItem?.(newItem);
      setNewItem({
        title: '',
        description: '',
        startTime: new Date(),
        endTime: new Date(),
        type: 'session',
        speaker: '',
        location: ''
      });
      setIsAddingItem(false);
    }
  };

  const getCurrentTimelineItem = () => {
    const now = new Date();
    return sortedTimeline.find(item => 
      now >= item.startTime && now <= item.endTime
    );
  };

  const getNextTimelineItem = () => {
    const now = new Date();
    return sortedTimeline.find(item => item.startTime > now);
  };

  const currentItem = getCurrentTimelineItem();
  const nextItem = getNextTimelineItem();

  return (
    <div className={cn('space-y-6', className)}>
      {/* Current/Next Item Status */}
      {(currentItem || nextItem) && (
        <Card>
          <CardContent className="pt-6">
            {currentItem ? (
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-lg">🔴</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Live Now
                    </Badge>
                    <Badge variant="secondary" className={getTypeColor(currentItem.type)}>
                      {getTypeIcon(currentItem.type)} {currentItem.type}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-gray-900">{currentItem.title}</h3>
                  <p className="text-sm text-gray-600">
                    {formatTime(currentItem.startTime)} - {formatTime(currentItem.endTime)}
                    {currentItem.speaker && ` • ${currentItem.speaker}`}
                  </p>
                </div>
              </div>
            ) : nextItem ? (
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-lg">⏰</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      Coming Up
                    </Badge>
                    <Badge variant="secondary" className={getTypeColor(nextItem.type)}>
                      {getTypeIcon(nextItem.type)} {nextItem.type}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-gray-900">{nextItem.title}</h3>
                  <p className="text-sm text-gray-600">
                    {formatTime(nextItem.startTime)} - {formatTime(nextItem.endTime)}
                    {nextItem.speaker && ` • ${nextItem.speaker}`}
                  </p>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Event Schedule</CardTitle>
            {isEditable && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddingItem(true)}
              >
                Add Item
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Add New Item Form */}
          {isAddingItem && (
            <Card className="border-dashed">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField label="Title" required>
                      <Input
                        value={newItem.title}
                        onChange={(e) => setNewItem(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Session title"
                      />
                    </FormField>

                    <FormField label="Type">
                      <select
                        value={newItem.type}
                        onChange={(e) => setNewItem(prev => ({ ...prev, type: e.target.value as TimelineItem['type'] }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="session">Session</option>
                        <option value="break">Break</option>
                        <option value="announcement">Announcement</option>
                        <option value="activity">Activity</option>
                      </select>
                    </FormField>
                  </div>

                  <FormField label="Description">
                    <textarea
                      value={newItem.description}
                      onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Session description"
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </FormField>

                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField label="Start Time">
                      <Input
                        type="datetime-local"
                        value={newItem.startTime.toISOString().slice(0, 16)}
                        onChange={(e) => setNewItem(prev => ({ ...prev, startTime: new Date(e.target.value) }))}
                      />
                    </FormField>

                    <FormField label="End Time">
                      <Input
                        type="datetime-local"
                        value={newItem.endTime.toISOString().slice(0, 16)}
                        onChange={(e) => setNewItem(prev => ({ ...prev, endTime: new Date(e.target.value) }))}
                      />
                    </FormField>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField label="Speaker/Presenter">
                      <Input
                        value={newItem.speaker || ''}
                        onChange={(e) => setNewItem(prev => ({ ...prev, speaker: e.target.value }))}
                        placeholder="Speaker name"
                      />
                    </FormField>

                    <FormField label="Location">
                      <Input
                        value={newItem.location || ''}
                        onChange={(e) => setNewItem(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="Room, link, etc."
                      />
                    </FormField>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleAddItem}
                    >
                      Add Item
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddingItem(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline Items */}
          {sortedTimeline.length > 0 ? (
            <div className="space-y-4">
              {sortedTimeline.map((item, index) => {
                const isCurrentItem = currentItem?.id === item.id;
                const isPastItem = new Date() > item.endTime;
                
                return (
                  <div
                    key={item.id}
                    className={cn(
                      'relative flex items-start space-x-4 p-4 rounded-lg border',
                      isCurrentItem ? 'bg-green-50 border-green-200' : 
                      isPastItem ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'
                    )}
                  >
                    {/* Timeline Line */}
                    {index < sortedTimeline.length - 1 && (
                      <div className="absolute left-8 top-16 w-0.5 h-8 bg-gray-300" />
                    )}

                    {/* Time Indicator */}
                    <div className="flex-shrink-0 text-center">
                      <div className={cn(
                        'w-16 h-16 rounded-full flex flex-col items-center justify-center text-xs font-medium',
                        isCurrentItem ? 'bg-green-100 text-green-800' :
                        isPastItem ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-800'
                      )}>
                        <div>{formatTime(item.startTime)}</div>
                        <div className="text-xs opacity-75">{formatDuration(item.startTime, item.endTime)}</div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant="secondary" className={getTypeColor(item.type)}>
                          {getTypeIcon(item.type)} {item.type}
                        </Badge>
                        {isCurrentItem && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Live Now
                          </Badge>
                        )}
                      </div>
                      
                      <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                      
                      {item.description && (
                        <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>{formatTime(item.startTime)} - {formatTime(item.endTime)}</span>
                        {item.speaker && <span>👤 {item.speaker}</span>}
                        {item.location && <span>📍 {item.location}</span>}
                      </div>
                    </div>

                    {/* Actions */}
                    {isEditable && (
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingItem(item.id)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-800"
                          onClick={() => onDeleteItem?.(item.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📅</div>
              <p className="text-sm">No schedule items yet</p>
              {isEditable && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => setIsAddingItem(true)}
                >
                  Add First Item
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}