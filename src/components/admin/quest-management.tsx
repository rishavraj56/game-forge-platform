'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FormField } from '@/components/ui/form-field';
import { mockDailyQuests, mockWeeklyQuests } from '@/lib/mock-data';
import { Quest, QuestType, Domain, QuestRequirement } from '@/lib/types';

interface QuestFormProps {
  quest?: Quest;
  onSave: (quest: Omit<Quest, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

function QuestForm({ quest, onSave, onCancel }: QuestFormProps) {
  const [formData, setFormData] = useState({
    title: quest?.title || '',
    description: quest?.description || '',
    type: quest?.type || 'daily' as QuestType,
    xpReward: quest?.xpReward || 50,
    domain: quest?.domain || '' as Domain | '',
    isActive: quest?.isActive ?? true,
    requirements: quest?.requirements || [{ type: 'post', target: 1, description: '' }] as QuestRequirement[]
  });

  const handleRequirementChange = (index: number, field: keyof QuestRequirement, value: any) => {
    const newRequirements = [...formData.requirements];
    newRequirements[index] = { ...newRequirements[index], [field]: value };
    setFormData({ ...formData, requirements: newRequirements });
  };

  const addRequirement = () => {
    setFormData({
      ...formData,
      requirements: [...formData.requirements, { type: 'post', target: 1, description: '' }]
    });
  };

  const removeRequirement = (index: number) => {
    setFormData({
      ...formData,
      requirements: formData.requirements.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const questData = {
      ...formData,
      domain: formData.domain || undefined,
      expiresAt: formData.type === 'daily' 
        ? new Date(Date.now() + 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      updatedAt: new Date()
    };
    
    onSave(questData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{quest ? 'Edit Quest' : 'Create New Quest'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Title" required>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter quest title"
              required
            />
          </FormField>

          <FormField label="Description" required>
            <textarea
              className="w-full p-2 border border-gray-300 rounded-md resize-none"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter quest description"
              required
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Type" required>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as QuestType })}
                options={[
                  { value: 'daily', label: 'Daily' },
                  { value: 'weekly', label: 'Weekly' }
                ]}
              />
            </FormField>

            <FormField label="XP Reward" required>
              <Input
                type="number"
                min="1"
                value={formData.xpReward}
                onChange={(e) => setFormData({ ...formData, xpReward: parseInt(e.target.value) })}
                required
              />
            </FormField>

            <FormField label="Domain (Optional)">
              <Select
                value={formData.domain}
                onValueChange={(value) => setFormData({ ...formData, domain: value as Domain })}
                options={[
                  { value: '', label: 'All Domains' },
                  { value: 'Game Development', label: 'Game Development' },
                  { value: 'Game Art', label: 'Game Art' },
                  { value: 'Game Design', label: 'Game Design' },
                  { value: 'AI for Game Development', label: 'AI for Game Development' },
                  { value: 'Creative', label: 'Creative' },
                  { value: 'Corporate', label: 'Corporate' }
                ]}
              />
            </FormField>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Requirements
            </label>
            {formData.requirements.map((req, index) => (
              <div key={index} className="flex gap-2 mb-2 p-3 bg-gray-50 rounded-lg">
                <Select
                  value={req.type}
                  onValueChange={(value) => handleRequirementChange(index, 'type', value)}
                  className="w-40"
                  options={[
                    { value: 'post', label: 'Create Posts' },
                    { value: 'comment', label: 'Leave Comments' },
                    { value: 'module_complete', label: 'Complete Modules' },
                    { value: 'login', label: 'Daily Login' },
                    { value: 'profile_update', label: 'Update Profile' }
                  ]}
                />
                
                <Input
                  type="number"
                  min="1"
                  value={req.target}
                  onChange={(e) => handleRequirementChange(index, 'target', parseInt(e.target.value))}
                  placeholder="Target"
                  className="w-20"
                />
                
                <Input
                  value={req.description}
                  onChange={(e) => handleRequirementChange(index, 'description', e.target.value)}
                  placeholder="Description"
                  className="flex-1"
                />
                
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => removeRequirement(index)}
                  disabled={formData.requirements.length === 1}
                >
                  Remove
                </Button>
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addRequirement}
            >
              Add Requirement
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">
              Quest is active
            </label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" variant="primary">
              {quest ? 'Update Quest' : 'Create Quest'}
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

interface QuestCardProps {
  quest: Quest;
  onEdit: (quest: Quest) => void;
  onDelete: (questId: string) => void;
  onToggleActive: (questId: string) => void;
}

function QuestCard({ quest, onEdit, onDelete, onToggleActive }: QuestCardProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <Card className={`${!quest.isActive ? 'opacity-60' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{quest.title}</CardTitle>
            <div className="flex gap-2 mt-2">
              <Badge className={quest.type === 'daily' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}>
                {quest.type}
              </Badge>
              {quest.domain && (
                <Badge className="bg-gray-100 text-gray-800">
                  {quest.domain}
                </Badge>
              )}
              <Badge className={quest.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {quest.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-blue-600">{quest.xpReward} XP</div>
            {quest.expiresAt && (
              <div className="text-xs text-gray-500">
                Expires: {formatDate(quest.expiresAt)}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-gray-700 mb-4">{quest.description}</p>
        
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-700 mb-2">Requirements:</div>
          <ul className="space-y-1">
            {quest.requirements.map((req, index) => (
              <li key={index} className="text-sm text-gray-600">
                • {req.description || `${req.type.replace('_', ' ')} (${req.target})`}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => onEdit(quest)}>
            Edit
          </Button>
          <Button 
            size="sm" 
            variant={quest.isActive ? 'secondary' : 'success'}
            onClick={() => onToggleActive(quest.id)}
          >
            {quest.isActive ? 'Deactivate' : 'Activate'}
          </Button>
          <Button size="sm" variant="danger" onClick={() => onDelete(quest.id)}>
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function QuestManagement() {
  const [quests, setQuests] = useState<Quest[]>([...mockDailyQuests, ...mockWeeklyQuests]);
  const [showForm, setShowForm] = useState(false);
  const [editingQuest, setEditingQuest] = useState<Quest | undefined>();
  const [typeFilter, setTypeFilter] = useState<'all' | 'daily' | 'weekly'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const handleSaveQuest = (questData: Omit<Quest, 'id' | 'createdAt'>) => {
    if (editingQuest) {
      // Update existing quest
      setQuests(prevQuests =>
        prevQuests.map(quest =>
          quest.id === editingQuest.id
            ? { ...questData, id: editingQuest.id, createdAt: editingQuest.createdAt }
            : quest
        )
      );
    } else {
      // Create new quest
      const newQuest: Quest = {
        ...questData,
        id: `quest-${Date.now()}`,
        createdAt: new Date()
      };
      setQuests(prevQuests => [...prevQuests, newQuest]);
    }
    
    setShowForm(false);
    setEditingQuest(undefined);
  };

  const handleEditQuest = (quest: Quest) => {
    setEditingQuest(quest);
    setShowForm(true);
  };

  const handleDeleteQuest = (questId: string) => {
    setQuests(prevQuests => prevQuests.filter(quest => quest.id !== questId));
  };

  const handleToggleActive = (questId: string) => {
    setQuests(prevQuests =>
      prevQuests.map(quest =>
        quest.id === questId ? { ...quest, isActive: !quest.isActive } : quest
      )
    );
  };

  const filteredQuests = quests.filter(quest => {
    const matchesType = typeFilter === 'all' || quest.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && quest.isActive) ||
      (statusFilter === 'inactive' && !quest.isActive);
    
    return matchesType && matchesStatus;
  });

  if (showForm) {
    return (
      <QuestForm
        quest={editingQuest}
        onSave={handleSaveQuest}
        onCancel={() => {
          setShowForm(false);
          setEditingQuest(undefined);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Quest Management</CardTitle>
            <Button onClick={() => setShowForm(true)}>
              Create New Quest
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Select
              value={typeFilter}
              onValueChange={(value) => setTypeFilter(value as 'all' | 'daily' | 'weekly')}
              options={[
                { value: 'all', label: 'All Types' },
                { value: 'daily', label: 'Daily Quests' },
                { value: 'weekly', label: 'Weekly Quests' }
              ]}
            />
            
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as 'all' | 'active' | 'inactive')}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' }
              ]}
            />
          </div>
          
          <div className="text-sm text-gray-600">
            Showing {filteredQuests.length} of {quests.length} quests
          </div>
        </CardContent>
      </Card>

      {/* Quests Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredQuests.map(quest => (
          <QuestCard
            key={quest.id}
            quest={quest}
            onEdit={handleEditQuest}
            onDelete={handleDeleteQuest}
            onToggleActive={handleToggleActive}
          />
        ))}
      </div>

      {filteredQuests.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-gray-500">
              No quests found matching your criteria
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}