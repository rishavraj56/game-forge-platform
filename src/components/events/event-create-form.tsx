'use client';

import React, { useState } from 'react';
import { Domain, EventType } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface EventFormData {
  title: string;
  description: string;
  type: EventType;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  domain?: Domain;
  maxParticipants?: number;
  location: string;
  xpReward?: number;
  tags: string[];
}

interface EventCreateFormProps {
  onSubmit?: (eventData: EventFormData) => void;
  onCancel?: () => void;
  className?: string;
}

export function EventCreateForm({ onSubmit, onCancel, className }: EventCreateFormProps) {
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    type: 'workshop',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    domain: undefined,
    maxParticipants: undefined,
    location: 'Online',
    xpReward: 50,
    tags: []
  });

  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const eventTypes: { value: EventType; label: string }[] = [
    { value: 'workshop', label: 'Workshop' },
    { value: 'game_jam', label: 'Game Jam' },
    { value: 'meetup', label: 'Meetup' },
    { value: 'competition', label: 'Competition' },
    { value: 'webinar', label: 'Webinar' },
    { value: 'panel', label: 'Panel' },
    { value: 'showcase', label: 'Showcase' }
  ];

  const domains: { value: Domain; label: string }[] = [
    { value: 'Game Development', label: 'Game Development' },
    { value: 'Game Design', label: 'Game Design' },
    { value: 'Game Art', label: 'Game Art' },
    { value: 'AI for Game Development', label: 'AI for Game Development' },
    { value: 'Creative', label: 'Creative' },
    { value: 'Corporate', label: 'Corporate' }
  ];

  const handleInputChange = (field: keyof EventFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'End time is required';
    }

    if (formData.startDate && formData.endDate && formData.startTime && formData.endTime) {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
      
      if (endDateTime <= startDateTime) {
        newErrors.endDate = 'End date/time must be after start date/time';
      }
    }

    if (formData.maxParticipants && formData.maxParticipants < 1) {
      newErrors.maxParticipants = 'Max participants must be at least 1';
    }

    if (formData.xpReward && formData.xpReward < 0) {
      newErrors.xpReward = 'XP reward cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit?.(formData);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Create New Event</CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
            
            <FormField label="Event Title" error={errors.title} required>
              <Input
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter event title"
                className={errors.title ? 'border-red-300' : ''}
              />
            </FormField>

            <FormField label="Description" error={errors.description} required>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe your event..."
                rows={4}
                className={cn(
                  'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none',
                  errors.description ? 'border-red-300' : ''
                )}
              />
            </FormField>

            <div className="grid md:grid-cols-2 gap-4">
              <FormField label="Event Type" required>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleInputChange('type', value as EventType)}
                  options={eventTypes}
                />
              </FormField>

              <FormField label="Domain">
                <Select
                  value={formData.domain || ''}
                  onValueChange={(value) => handleInputChange('domain', value as Domain || undefined)}
                  options={[
                    { value: '', label: 'All Domains' },
                    ...domains
                  ]}
                />
              </FormField>
            </div>
          </div>

          {/* Date and Time */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Date & Time</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <FormField label="Start Date" error={errors.startDate} required>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  className={errors.startDate ? 'border-red-300' : ''}
                />
              </FormField>

              <FormField label="Start Time" error={errors.startTime} required>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleInputChange('startTime', e.target.value)}
                  className={errors.startTime ? 'border-red-300' : ''}
                />
              </FormField>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <FormField label="End Date" error={errors.endDate} required>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  className={errors.endDate ? 'border-red-300' : ''}
                />
              </FormField>

              <FormField label="End Time" error={errors.endTime} required>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                  className={errors.endTime ? 'border-red-300' : ''}
                />
              </FormField>
            </div>
          </div>

          {/* Event Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Event Settings</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <FormField label="Location" required>
                <Input
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Online, City, Venue..."
                />
              </FormField>

              <FormField label="Max Participants" error={errors.maxParticipants}>
                <Input
                  type="number"
                  value={formData.maxParticipants || ''}
                  onChange={(e) => handleInputChange('maxParticipants', e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="Leave empty for unlimited"
                  min="1"
                  className={errors.maxParticipants ? 'border-red-300' : ''}
                />
              </FormField>
            </div>

            <FormField label="XP Reward" error={errors.xpReward}>
              <Input
                type="number"
                value={formData.xpReward || ''}
                onChange={(e) => handleInputChange('xpReward', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="XP awarded to participants"
                min="0"
                className={errors.xpReward ? 'border-red-300' : ''}
              />
            </FormField>
          </div>

          {/* Tags */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Tags</h3>
            
            <div className="flex space-x-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add a tag..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddTag}
                disabled={!tagInput.trim()}
              >
                Add
              </Button>
            </div>

            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex space-x-4 pt-6 border-t border-gray-200">
            <Button
              type="submit"
              variant="primary"
              className="flex-1 max-w-xs"
            >
              Create Event
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1 max-w-xs"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}