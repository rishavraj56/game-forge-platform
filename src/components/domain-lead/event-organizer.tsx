'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Domain, EventType } from '@/lib/types';

interface EventOrganizerProps {
  domain: Domain;
  onClose?: () => void;
}

export function EventOrganizer({ domain, onClose }: EventOrganizerProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState<EventType>('workshop');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [location, setLocation] = useState('Online');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [xpReward, setXpReward] = useState('100');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [requirements, setRequirements] = useState('');
  const [agenda, setAgenda] = useState<{ time: string; activity: string }[]>([
    { time: '', activity: '' }
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const event = {
      title,
      description,
      type: eventType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      domain,
      location,
      maxParticipants: maxParticipants ? parseInt(maxParticipants) : undefined,
      xpReward: parseInt(xpReward),
      tags,
      requirements,
      agenda: agenda.filter(item => item.time && item.activity),
      createdAt: new Date()
    };

    console.log('Creating event:', event);
    
    // Reset form
    setTitle('');
    setDescription('');
    setEventType('workshop');
    setStartDate('');
    setEndDate('');
    setLocation('Online');
    setMaxParticipants('');
    setXpReward('100');
    setTags([]);
    setRequirements('');
    setAgenda([{ time: '', activity: '' }]);
    
    if (onClose) onClose();
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleAddAgendaItem = () => {
    setAgenda([...agenda, { time: '', activity: '' }]);
  };

  const handleRemoveAgendaItem = (index: number) => {
    setAgenda(agenda.filter((_, i) => i !== index));
  };

  const handleAgendaChange = (index: number, field: 'time' | 'activity', value: string) => {
    const newAgenda = [...agenda];
    newAgenda[index][field] = value;
    setAgenda(newAgenda);
  };

  const getEventTypeColor = (type: EventType) => {
    switch (type) {
      case 'game_jam': return 'bg-red-100 text-red-800';
      case 'workshop': return 'bg-blue-100 text-blue-800';
      case 'competition': return 'bg-purple-100 text-purple-800';
      case 'meetup': return 'bg-green-100 text-green-800';
      case 'webinar': return 'bg-yellow-100 text-yellow-800';
      case 'panel': return 'bg-indigo-100 text-indigo-800';
      case 'showcase': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Organize Event</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{domain}</Badge>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                ✕
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Title *
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter event title..."
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Type
              </label>
              <Select 
                value={eventType} 
                onValueChange={(value) => setEventType(value as EventType)}
                options={[
                  { value: 'workshop', label: 'Workshop' },
                  { value: 'game_jam', label: 'Game Jam' },
                  { value: 'competition', label: 'Competition' },
                  { value: 'meetup', label: 'Meetup' },
                  { value: 'webinar', label: 'Webinar' },
                  { value: 'panel', label: 'Panel Discussion' },
                  { value: 'showcase', label: 'Showcase' }
                ]}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your event, what participants will learn or do..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date & Time *
              </label>
              <Input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date & Time *
              </label>
              <Input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || new Date().toISOString().slice(0, 16)}
                required
              />
            </div>
          </div>

          {/* Location and Capacity */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Online, City, Venue..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Participants
              </label>
              <Input
                type="number"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                placeholder="Leave empty for unlimited"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                XP Reward
              </label>
              <Input
                type="number"
                value={xpReward}
                onChange={(e) => setXpReward(e.target.value)}
                placeholder="100"
                min="0"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              />
              <Button type="button" variant="outline" onClick={handleAddTag}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Requirements */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Requirements (Optional)
            </label>
            <textarea
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="Any prerequisites, software, or materials needed..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Agenda */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Agenda (Optional)
              </label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddAgendaItem}>
                Add Item
              </Button>
            </div>
            <div className="space-y-2">
              {agenda.map((item, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    type="time"
                    value={item.time}
                    onChange={(e) => handleAgendaChange(index, 'time', e.target.value)}
                    className="w-32"
                  />
                  <Input
                    value={item.activity}
                    onChange={(e) => handleAgendaChange(index, 'activity', e.target.value)}
                    placeholder="Activity description..."
                    className="flex-1"
                  />
                  {agenda.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAgendaItem(index)}
                    >
                      ✕
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="border-t pt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Preview</h4>
            <Card className="bg-gray-50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h5 className="font-medium text-gray-900">{title || 'Event Title'}</h5>
                    <Badge className={getEventTypeColor(eventType)}>{eventType.replace('_', ' ')}</Badge>
                  </div>
                  <Badge variant="outline">{domain}</Badge>
                </div>
                <p className="text-sm text-gray-700 mb-3">
                  {description || 'Event description will appear here...'}
                </p>
                <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                  <div>
                    <strong>When:</strong> {startDate ? new Date(startDate).toLocaleString() : 'TBD'}
                  </div>
                  <div>
                    <strong>Where:</strong> {location}
                  </div>
                  <div>
                    <strong>Capacity:</strong> {maxParticipants || 'Unlimited'}
                  </div>
                  <div>
                    <strong>XP Reward:</strong> {xpReward}
                  </div>
                </div>
                {tags.length > 0 && (
                  <div className="mt-2">
                    <div className="flex flex-wrap gap-1">
                      {tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            {onClose && (
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
            )}
            <Button type="button" variant="outline">
              Save Draft
            </Button>
            <Button type="submit" variant="primary">
              Create Event
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}