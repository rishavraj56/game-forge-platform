'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Badge } from '@/components/ui/badge';
import { mockBadges, mockTitles } from '@/lib/mock-data';
import { Badge as BadgeType, Title } from '@/lib/types';

interface BadgeFormProps {
  badge?: BadgeType;
  onSave: (badge: Omit<BadgeType, 'id'>) => void;
  onCancel: () => void;
}

function BadgeForm({ badge, onSave, onCancel }: BadgeFormProps) {
  const [formData, setFormData] = useState({
    name: badge?.name || '',
    description: badge?.description || '',
    iconUrl: badge?.iconUrl || '',
    xpRequirement: badge?.xpRequirement || 100
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{badge ? 'Edit Badge' : 'Create New Badge'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Badge Name" required>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Community Builder, Knowledge Seeker"
              required
            />
          </FormField>

          <FormField label="Description" required>
            <textarea
              className="w-full p-2 border border-gray-300 rounded-md resize-none"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe how this badge is earned"
              required
            />
          </FormField>

          <FormField label="Icon URL" required>
            <Input
              value={formData.iconUrl}
              onChange={(e) => setFormData({ ...formData, iconUrl: e.target.value })}
              placeholder="/badges/badge-name.svg"
              required
            />
          </FormField>

          <FormField label="XP Requirement" required>
            <Input
              type="number"
              min="0"
              value={formData.xpRequirement}
              onChange={(e) => setFormData({ ...formData, xpRequirement: parseInt(e.target.value) })}
              required
            />
          </FormField>

          <div className="flex gap-2 pt-4">
            <Button type="submit" variant="primary">
              {badge ? 'Update Badge' : 'Create Badge'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

interface TitleFormProps {
  title?: Title;
  onSave: (title: Omit<Title, 'id'>) => void;
  onCancel: () => void;
}

function TitleForm({ title, onSave, onCancel }: TitleFormProps) {
  const [formData, setFormData] = useState({
    name: title?.name || '',
    description: title?.description || '',
    xpRequirement: title?.xpRequirement || 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title ? 'Edit Title' : 'Create New Title'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Title Name" required>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Master Forger, Code Artisan"
              required
            />
          </FormField>

          <FormField label="Description" required>
            <textarea
              className="w-full p-2 border border-gray-300 rounded-md resize-none"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what this title represents"
              required
            />
          </FormField>

          <FormField label="XP Requirement" required>
            <Input
              type="number"
              min="0"
              value={formData.xpRequirement}
              onChange={(e) => setFormData({ ...formData, xpRequirement: parseInt(e.target.value) })}
              required
            />
          </FormField>

          <div className="flex gap-2 pt-4">
            <Button type="submit" variant="primary">
              {title ? 'Update Title' : 'Create Title'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function BadgeManagement() {
  const [badges, setBadges] = useState<BadgeType[]>(mockBadges);
  const [titles, setTitles] = useState<Title[]>(mockTitles);
  const [activeTab, setActiveTab] = useState<'badges' | 'titles'>('badges');
  const [showBadgeForm, setShowBadgeForm] = useState(false);
  const [showTitleForm, setShowTitleForm] = useState(false);
  const [editingBadge, setEditingBadge] = useState<BadgeType | undefined>();
  const [editingTitle, setEditingTitle] = useState<Title | undefined>();

  const handleSaveBadge = (badgeData: Omit<BadgeType, 'id'>) => {
    if (editingBadge) {
      setBadges(prevBadges =>
        prevBadges.map(badge =>
          badge.id === editingBadge.id
            ? { ...badgeData, id: editingBadge.id }
            : badge
        )
      );
    } else {
      const newBadge: BadgeType = {
        ...badgeData,
        id: `badge-${Date.now()}`
      };
      setBadges(prevBadges => [...prevBadges, newBadge]);
    }
    
    setShowBadgeForm(false);
    setEditingBadge(undefined);
  };

  const handleSaveTitle = (titleData: Omit<Title, 'id'>) => {
    if (editingTitle) {
      setTitles(prevTitles =>
        prevTitles.map(title =>
          title.id === editingTitle.id
            ? { ...titleData, id: editingTitle.id }
            : title
        )
      );
    } else {
      const newTitle: Title = {
        ...titleData,
        id: `title-${Date.now()}`
      };
      setTitles(prevTitles => [...prevTitles, newTitle]);
    }
    
    setShowTitleForm(false);
    setEditingTitle(undefined);
  };

  const handleEditBadge = (badge: BadgeType) => {
    setEditingBadge(badge);
    setShowBadgeForm(true);
  };

  const handleEditTitle = (title: Title) => {
    setEditingTitle(title);
    setShowTitleForm(true);
  };

  const handleDeleteBadge = (badgeId: string) => {
    setBadges(prevBadges => prevBadges.filter(badge => badge.id !== badgeId));
  };

  const handleDeleteTitle = (titleId: string) => {
    setTitles(prevTitles => prevTitles.filter(title => title.id !== titleId));
  };

  if (showBadgeForm) {
    return (
      <BadgeForm
        badge={editingBadge}
        onSave={handleSaveBadge}
        onCancel={() => {
          setShowBadgeForm(false);
          setEditingBadge(undefined);
        }}
      />
    );
  }

  if (showTitleForm) {
    return (
      <TitleForm
        title={editingTitle}
        onSave={handleSaveTitle}
        onCancel={() => {
          setShowTitleForm(false);
          setEditingTitle(undefined);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'badges' ? 'primary' : 'ghost'}
              onClick={() => setActiveTab('badges')}
            >
              Badges
            </Button>
            <Button
              variant={activeTab === 'titles' ? 'primary' : 'ghost'}
              onClick={() => setActiveTab('titles')}
            >
              Titles
            </Button>
          </div>
        </CardContent>
      </Card>

      {activeTab === 'badges' && (
        <>
          {/* Badges Header */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Badge Management</CardTitle>
                <Button onClick={() => setShowBadgeForm(true)}>
                  Create New Badge
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Manage achievement badges that users can earn through various activities and milestones.
              </p>
            </CardContent>
          </Card>

          {/* Badges Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {badges.map(badge => (
              <Card key={badge.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      {badge.iconUrl ? (
                        <img src={badge.iconUrl} alt={badge.name} className="w-8 h-8" />
                      ) : (
                        <div className="w-8 h-8 bg-blue-500 rounded"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{badge.name}</CardTitle>
                      <div className="text-sm text-blue-600 font-medium">
                        {badge.xpRequirement} XP Required
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <p className="text-gray-700 text-sm mb-4">{badge.description}</p>
                  
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEditBadge(badge)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleDeleteBadge(badge.id)}>
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {activeTab === 'titles' && (
        <>
          {/* Titles Header */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Title Management</CardTitle>
                <Button onClick={() => setShowTitleForm(true)}>
                  Create New Title
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Manage titles that users can unlock and display on their profiles to show their achievements and status.
              </p>
            </CardContent>
          </Card>

          {/* Titles List */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        XP Requirement
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {titles.map(title => (
                      <tr key={title.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <Badge className="bg-purple-100 text-purple-800 font-medium">
                              {title.name}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-700">{title.description}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-blue-600">
                            {title.xpRequirement.toLocaleString()} XP
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleEditTitle(title)}>
                              Edit
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => handleDeleteTitle(title.id)}>
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}