'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { mockChannels, mockPosts, mockEvents } from '@/lib/mock-data';
import { Domain } from '@/lib/types';
import { AnnouncementCreator } from './announcement-creator';
import { EventOrganizer } from './event-organizer';
import { QuestSuggestionSystem } from './quest-suggestion-system';

interface ContentCurationProps {
  domain: Domain;
}

type ContentType = 'posts' | 'channels' | 'events' | 'learning' | 'announcements' | 'quest_suggestions';

export function ContentCuration({ domain }: ContentCurationProps) {
  const [activeTab, setActiveTab] = useState<ContentType>('posts');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'flagged'>('all');
  const [showAnnouncementCreator, setShowAnnouncementCreator] = useState(false);
  const [showEventOrganizer, setShowEventOrganizer] = useState(false);
  const [showQuestSuggestion, setShowQuestSuggestion] = useState(false);

  // Filter content by domain
  const domainChannels = mockChannels.filter(channel => channel.domain === domain);
  const domainPosts = mockPosts.filter(post => {
    const channel = mockChannels.find(c => c.id === post.channelId);
    return channel?.domain === domain;
  });
  const domainEvents = mockEvents.filter(event => event.domain === domain);

  // Mock pending content for demonstration
  const pendingContent = [
    {
      id: 'pending-1',
      type: 'post',
      title: 'New Unity 2024 Features Discussion',
      author: 'CodeCrafter42',
      content: 'Has anyone tried the new Unity 2024 features? I\'m particularly interested in...',
      status: 'pending',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      flagReason: null
    },
    {
      id: 'pending-2',
      type: 'post',
      title: 'Best Practices for Game Optimization',
      author: 'UnityMaster',
      content: 'Sharing some optimization techniques I\'ve learned over the years...',
      status: 'flagged',
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      flagReason: 'Potential spam content'
    },
    {
      id: 'pending-3',
      type: 'channel',
      title: 'VR Development Sub-channel',
      author: 'VRExplorer',
      content: 'Proposal to create a dedicated VR development sub-channel',
      status: 'pending',
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      flagReason: null
    }
  ];

  const handleApproveContent = (contentId: string) => {
    console.log(`Approving content: ${contentId}`);
  };

  const handleRejectContent = (contentId: string) => {
    console.log(`Rejecting content: ${contentId}`);
  };

  const handleFeatureContent = (contentId: string) => {
    console.log(`Featuring content: ${contentId}`);
  };

  const handleCreateAnnouncement = () => {
    setActiveTab('announcements');
    setShowAnnouncementCreator(true);
  };

  const renderPendingContent = () => (
    <div className="space-y-4">
      {pendingContent.map((content) => (
        <Card key={content.id} className={`${content.status === 'flagged' ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}`}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium text-gray-900">{content.title}</h4>
                  <Badge variant={content.status === 'flagged' ? 'destructive' : 'secondary'}>
                    {content.status}
                  </Badge>
                  <Badge variant="outline">{content.type}</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">By {content.author}</p>
                <p className="text-sm text-gray-700 mb-2">{content.content}</p>
                {content.flagReason && (
                  <p className="text-sm text-red-600 font-medium">Flag reason: {content.flagReason}</p>
                )}
                <p className="text-xs text-gray-500">
                  {content.createdAt.toLocaleDateString()} at {content.createdAt.toLocaleTimeString()}
                </p>
              </div>
              <div className="flex gap-2 ml-4">
                <Button variant="outline" size="sm" onClick={() => handleApproveContent(content.id)}>
                  Approve
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleRejectContent(content.id)}>
                  Reject
                </Button>
                {content.status !== 'flagged' && (
                  <Button variant="primary" size="sm" onClick={() => handleFeatureContent(content.id)}>
                    Feature
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderChannelManagement = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Channel Management</h3>
        <Button variant="primary" onClick={() => console.log('Creating new channel')}>
          Create Sub-channel
        </Button>
      </div>
      
      {domainChannels.map((channel) => (
        <Card key={channel.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-900">{channel.name}</h4>
                  <Badge variant={channel.type === 'primary' ? 'default' : 'secondary'}>
                    {channel.type}
                  </Badge>
                  <Badge variant={channel.isActive ? 'default' : 'secondary'}>
                    {channel.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{channel.description}</p>
                <p className="text-sm text-gray-500">{channel.memberCount} members</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">Edit</Button>
                <Button variant="ghost" size="sm">Moderate</Button>
                <Button variant="outline" size="sm">Settings</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderEventManagement = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Event Management</h3>
        <Button variant="primary" onClick={() => setShowEventOrganizer(true)}>
          Create Event
        </Button>
      </div>
      
      {domainEvents.map((event) => (
        <Card key={event.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-900">{event.title}</h4>
                  <Badge variant="outline">{event.type}</Badge>
                  <Badge variant={event.isActive ? 'default' : 'secondary'}>
                    {event.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{event.description}</p>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-sm text-gray-500">
                    {event.startDate.toLocaleDateString()}
                  </span>
                  <span className="text-sm text-gray-500">
                    {event.currentParticipants}/{event.maxParticipants || '∞'} participants
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">Edit</Button>
                <Button variant="ghost" size="sm">Participants</Button>
                <Button variant="outline" size="sm">Promote</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderLearningContent = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Learning Content</h3>
        <Button variant="primary" onClick={() => console.log('Creating new module')}>
          Create Module
        </Button>
      </div>
      
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500 mb-4">No learning modules found for this domain.</p>
          <Button variant="outline" onClick={() => console.log('Import content')}>
            Import Content
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderAnnouncementTools = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Announcement Tools</h3>
        <Button variant="primary" onClick={() => setShowAnnouncementCreator(true)}>
          Create Announcement
        </Button>
      </div>
      
      {showAnnouncementCreator ? (
        <AnnouncementCreator 
          domain={domain} 
          onClose={() => setShowAnnouncementCreator(false)} 
        />
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500 mb-4">Create announcements to communicate with your domain members.</p>
            <Button variant="outline" onClick={() => setShowAnnouncementCreator(true)}>
              Get Started
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderQuestSuggestionTools = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Quest Suggestion System</h3>
        <Button variant="primary" onClick={() => setShowQuestSuggestion(true)}>
          Suggest New Quest
        </Button>
      </div>
      
      {showQuestSuggestion ? (
        <QuestSuggestionSystem 
          domain={domain} 
          onClose={() => setShowQuestSuggestion(false)} 
        />
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500 mb-4">Suggest domain-specific quests to engage your community members.</p>
            <Button variant="outline" onClick={() => setShowQuestSuggestion(true)}>
              Create Quest Suggestion
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'posts':
        return renderPendingContent();
      case 'channels':
        return renderChannelManagement();
      case 'events':
        return showEventOrganizer ? (
          <EventOrganizer domain={domain} onClose={() => setShowEventOrganizer(false)} />
        ) : (
          renderEventManagement()
        );
      case 'learning':
        return renderLearningContent();
      case 'announcements':
        return renderAnnouncementTools();
      case 'quest_suggestions':
        return renderQuestSuggestionTools();
      default:
        return renderPendingContent();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Content Curation</h2>
          <p className="text-gray-600">Manage and moderate content in the {domain} domain</p>
        </div>
        <Button variant="primary" onClick={handleCreateAnnouncement}>
          Create Announcement
        </Button>
      </div>

      {/* Tabs */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'posts' ? 'primary' : 'ghost'}
              onClick={() => setActiveTab('posts')}
            >
              Pending Content ({pendingContent.length})
            </Button>
            <Button
              variant={activeTab === 'channels' ? 'primary' : 'ghost'}
              onClick={() => setActiveTab('channels')}
            >
              Channels ({domainChannels.length})
            </Button>
            <Button
              variant={activeTab === 'events' ? 'primary' : 'ghost'}
              onClick={() => setActiveTab('events')}
            >
              Events ({domainEvents.length})
            </Button>
            <Button
              variant={activeTab === 'learning' ? 'primary' : 'ghost'}
              onClick={() => setActiveTab('learning')}
            >
              Learning Content
            </Button>
            <Button
              variant={activeTab === 'announcements' ? 'primary' : 'ghost'}
              onClick={() => setActiveTab('announcements')}
            >
              Announcements
            </Button>
            <Button
              variant={activeTab === 'quest_suggestions' ? 'primary' : 'ghost'}
              onClick={() => setActiveTab('quest_suggestions')}
            >
              Quest Suggestions
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      {activeTab === 'posts' && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'approved', label: 'Approved' },
                  { value: 'flagged', label: 'Flagged' }
                ]}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      {renderTabContent()}
    </div>
  );
}