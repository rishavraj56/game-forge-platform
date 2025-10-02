'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Domain } from '@/lib/types';

interface AnnouncementCreatorProps {
  domain: Domain;
  onClose?: () => void;
}

type AnnouncementType = 'general' | 'event' | 'quest' | 'achievement' | 'urgent';
type AnnouncementPriority = 'low' | 'medium' | 'high' | 'urgent';

export function AnnouncementCreator({ domain, onClose }: AnnouncementCreatorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<AnnouncementType>('general');
  const [priority, setPriority] = useState<AnnouncementPriority>('medium');
  const [targetAudience, setTargetAudience] = useState<'domain' | 'all_members' | 'leads_only'>('domain');
  const [scheduleDate, setScheduleDate] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const announcement = {
      title,
      content,
      type,
      priority,
      targetAudience,
      domain,
      scheduleDate: isScheduled ? scheduleDate : null,
      attachments,
      createdAt: new Date()
    };

    console.log('Creating announcement:', announcement);
    
    // Reset form
    setTitle('');
    setContent('');
    setType('general');
    setPriority('medium');
    setTargetAudience('domain');
    setScheduleDate('');
    setIsScheduled(false);
    setAttachments([]);
    
    if (onClose) onClose();
  };

  const handleAddAttachment = () => {
    // Mock file upload - in real app would handle file selection
    const mockAttachment = `attachment-${Date.now()}.pdf`;
    setAttachments([...attachments, mockAttachment]);
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const getTypeColor = (type: AnnouncementType) => {
    switch (type) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'event': return 'bg-blue-100 text-blue-800';
      case 'quest': return 'bg-green-100 text-green-800';
      case 'achievement': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: AnnouncementPriority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Create Announcement</CardTitle>
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
                Announcement Title *
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter announcement title..."
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <Select 
                value={type} 
                onValueChange={(value) => setType(value as AnnouncementType)}
                options={[
                  { value: 'general', label: 'General' },
                  { value: 'event', label: 'Event' },
                  { value: 'quest', label: 'Quest' },
                  { value: 'achievement', label: 'Achievement' },
                  { value: 'urgent', label: 'Urgent' }
                ]}
              />
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your announcement content here..."
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <Select 
                value={priority} 
                onValueChange={(value) => setPriority(value as AnnouncementPriority)}
                options={[
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' },
                  { value: 'urgent', label: 'Urgent' }
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Audience
              </label>
              <Select 
                value={targetAudience} 
                onValueChange={(value) => setTargetAudience(value as typeof targetAudience)}
                options={[
                  { value: 'domain', label: `${domain} Members` },
                  { value: 'all_members', label: 'All Members' },
                  { value: 'leads_only', label: 'Domain Leads Only' }
                ]}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <input
                  type="checkbox"
                  checked={isScheduled}
                  onChange={(e) => setIsScheduled(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                Schedule for later
              </label>
              {isScheduled && (
                <Input
                  type="datetime-local"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                />
              )}
            </div>
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attachments
            </label>
            <div className="flex items-center gap-2 mb-2">
              <Button type="button" variant="outline" size="sm" onClick={handleAddAttachment}>
                Add Attachment
              </Button>
              <span className="text-sm text-gray-500">
                {attachments.length} file{attachments.length !== 1 ? 's' : ''} attached
              </span>
            </div>
            {attachments.length > 0 && (
              <div className="space-y-2">
                {attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-700">{attachment}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAttachment(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="border-t pt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Preview</h4>
            <Card className="bg-gray-50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h5 className="font-medium text-gray-900">{title || 'Announcement Title'}</h5>
                    <Badge className={getTypeColor(type)}>{type}</Badge>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${getPriorityColor(priority)}`} title={`${priority} priority`} />
                </div>
                <p className="text-sm text-gray-700 mb-2">
                  {content || 'Announcement content will appear here...'}
                </p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>To: {targetAudience.replace('_', ' ')}</span>
                  <span>Domain: {domain}</span>
                  {isScheduled && scheduleDate && (
                    <span>Scheduled: {new Date(scheduleDate).toLocaleString()}</span>
                  )}
                </div>
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
              {isScheduled ? 'Schedule Announcement' : 'Publish Announcement'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}