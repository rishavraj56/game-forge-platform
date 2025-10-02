'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Domain, QuestType, QuestRequirement } from '@/lib/types';

interface QuestSuggestionSystemProps {
  domain: Domain;
  onClose?: () => void;
}

type QuestCategory = 'engagement' | 'learning' | 'community' | 'creation' | 'mentorship';

export function QuestSuggestionSystem({ domain, onClose }: QuestSuggestionSystemProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questType, setQuestType] = useState<QuestType>('daily');
  const [category, setCategory] = useState<QuestCategory>('engagement');
  const [xpReward, setXpReward] = useState('50');
  const [requirements, setRequirements] = useState<QuestRequirement[]>([
    { type: 'post', target: 1, description: 'Create a post' }
  ]);
  const [targetLevel, setTargetLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [estimatedTime, setEstimatedTime] = useState('15');

  // Domain-specific quest templates
  const questTemplates = {
    'Game Development': [
      {
        title: 'Code Review Champion',
        description: 'Review and provide feedback on 3 code snippets shared by community members',
        category: 'community' as QuestCategory,
        xp: 75,
        requirements: [{ type: 'comment' as const, target: 3, description: 'Review 3 code snippets' }]
      },
      {
        title: 'Unity Explorer',
        description: 'Complete a Unity tutorial and share your project screenshot',
        category: 'learning' as QuestCategory,
        xp: 100,
        requirements: [{ type: 'post' as const, target: 1, description: 'Share Unity project screenshot' }]
      },
      {
        title: 'Bug Hunter',
        description: 'Help solve 2 technical problems posted by other developers',
        category: 'community' as QuestCategory,
        xp: 80,
        requirements: [{ type: 'comment' as const, target: 2, description: 'Help solve technical problems' }]
      }
    ],
    'Game Art': [
      {
        title: 'Art Showcase',
        description: 'Share your latest game art creation with the community',
        category: 'creation' as QuestCategory,
        xp: 60,
        requirements: [{ type: 'post' as const, target: 1, description: 'Share art creation' }]
      },
      {
        title: 'Feedback Artist',
        description: 'Provide constructive feedback on 5 art pieces shared by others',
        category: 'community' as QuestCategory,
        xp: 70,
        requirements: [{ type: 'comment' as const, target: 5, description: 'Provide art feedback' }]
      },
      {
        title: 'Technique Master',
        description: 'Complete an art technique tutorial and share your results',
        category: 'learning' as QuestCategory,
        xp: 90,
        requirements: [{ type: 'module_complete' as const, target: 1, description: 'Complete art tutorial' }]
      }
    ],
    'Game Design': [
      {
        title: 'Design Document Creator',
        description: 'Create and share a game design document for a small game concept',
        category: 'creation' as QuestCategory,
        xp: 120,
        requirements: [{ type: 'post' as const, target: 1, description: 'Share game design document' }]
      },
      {
        title: 'Playtester',
        description: 'Playtest and provide feedback on 3 game prototypes',
        category: 'community' as QuestCategory,
        xp: 85,
        requirements: [{ type: 'comment' as const, target: 3, description: 'Provide playtest feedback' }]
      }
    ],
    'AI for Game Development': [
      {
        title: 'AI Implementation',
        description: 'Implement and share an AI behavior in your game project',
        category: 'creation' as QuestCategory,
        xp: 150,
        requirements: [{ type: 'post' as const, target: 1, description: 'Share AI implementation' }]
      },
      {
        title: 'Algorithm Explorer',
        description: 'Complete an AI/ML tutorial relevant to game development',
        category: 'learning' as QuestCategory,
        xp: 100,
        requirements: [{ type: 'module_complete' as const, target: 1, description: 'Complete AI tutorial' }]
      }
    ],
    'Creative': [
      {
        title: 'Story Weaver',
        description: 'Write and share a short game narrative or character backstory',
        category: 'creation' as QuestCategory,
        xp: 80,
        requirements: [{ type: 'post' as const, target: 1, description: 'Share game narrative' }]
      },
      {
        title: 'Audio Architect',
        description: 'Create and share a game audio asset (music, SFX, or voice)',
        category: 'creation' as QuestCategory,
        xp: 90,
        requirements: [{ type: 'post' as const, target: 1, description: 'Share audio asset' }]
      }
    ],
    'Corporate': [
      {
        title: 'Market Analyst',
        description: 'Research and share insights about a game market trend',
        category: 'learning' as QuestCategory,
        xp: 100,
        requirements: [{ type: 'post' as const, target: 1, description: 'Share market insights' }]
      },
      {
        title: 'Business Mentor',
        description: 'Provide business advice to 3 indie developers',
        category: 'mentorship' as QuestCategory,
        xp: 120,
        requirements: [{ type: 'comment' as const, target: 3, description: 'Provide business advice' }]
      }
    ]
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const quest = {
      title,
      description,
      type: questType,
      category,
      domain,
      xpReward: parseInt(xpReward),
      requirements,
      targetLevel,
      estimatedTime: parseInt(estimatedTime),
      createdAt: new Date()
    };

    console.log('Suggesting quest:', quest);
    
    // Reset form
    setTitle('');
    setDescription('');
    setQuestType('daily');
    setCategory('engagement');
    setXpReward('50');
    setRequirements([{ type: 'post', target: 1, description: 'Create a post' }]);
    setTargetLevel('beginner');
    setEstimatedTime('15');
    
    if (onClose) onClose();
  };

  const handleUseTemplate = (template: typeof questTemplates[Domain][0]) => {
    setTitle(template.title);
    setDescription(template.description);
    setCategory(template.category);
    setXpReward(template.xp.toString());
    setRequirements(template.requirements);
  };

  const handleAddRequirement = () => {
    setRequirements([
      ...requirements,
      { type: 'post', target: 1, description: 'New requirement' }
    ]);
  };

  const handleRemoveRequirement = (index: number) => {
    setRequirements(requirements.filter((_, i) => i !== index));
  };

  const handleRequirementChange = (index: number, field: keyof QuestRequirement, value: any) => {
    const newRequirements = [...requirements];
    newRequirements[index] = { ...newRequirements[index], [field]: value };
    setRequirements(newRequirements);
  };

  const getCategoryColor = (category: QuestCategory) => {
    switch (category) {
      case 'engagement': return 'bg-blue-100 text-blue-800';
      case 'learning': return 'bg-green-100 text-green-800';
      case 'community': return 'bg-purple-100 text-purple-800';
      case 'creation': return 'bg-orange-100 text-orange-800';
      case 'mentorship': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const domainTemplates = questTemplates[domain] || [];

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Quest Suggestion System</CardTitle>
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
        {/* Templates Section */}
        {domainTemplates.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              {domain} Quest Templates
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {domainTemplates.map((template, index) => (
                <Card key={index} className="cursor-pointer hover:bg-gray-50" onClick={() => handleUseTemplate(template)}>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-medium text-sm text-gray-900">{template.title}</h5>
                      <Badge className={getCategoryColor(template.category)} variant="secondary">
                        {template.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{template.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{template.xp} XP</span>
                      <Button variant="ghost" size="sm" className="text-xs h-6">
                        Use Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quest Title *
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter quest title..."
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quest Type
              </label>
              <Select 
                value={questType} 
                onValueChange={(value) => setQuestType(value as QuestType)}
                options={[
                  { value: 'daily', label: 'Daily Quest' },
                  { value: 'weekly', label: 'Weekly Quest' }
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
              placeholder="Describe what participants need to do to complete this quest..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Quest Settings */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <Select 
                value={category} 
                onValueChange={(value) => setCategory(value as QuestCategory)}
                options={[
                  { value: 'engagement', label: 'Engagement' },
                  { value: 'learning', label: 'Learning' },
                  { value: 'community', label: 'Community' },
                  { value: 'creation', label: 'Creation' },
                  { value: 'mentorship', label: 'Mentorship' }
                ]}
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
                min="1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Level
              </label>
              <Select 
                value={targetLevel} 
                onValueChange={(value) => setTargetLevel(value as typeof targetLevel)}
                options={[
                  { value: 'beginner', label: 'Beginner' },
                  { value: 'intermediate', label: 'Intermediate' },
                  { value: 'advanced', label: 'Advanced' }
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Est. Time (min)
              </label>
              <Input
                type="number"
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(e.target.value)}
                min="5"
                placeholder="15"
              />
            </div>
          </div>

          {/* Requirements */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Quest Requirements
              </label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddRequirement}>
                Add Requirement
              </Button>
            </div>
            <div className="space-y-3">
              {requirements.map((req, index) => (
                <div key={index} className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Select
                      value={req.type}
                      onValueChange={(value) => handleRequirementChange(index, 'type', value)}
                      options={[
                        { value: 'post', label: 'Create Post' },
                        { value: 'comment', label: 'Leave Comment' },
                        { value: 'module_complete', label: 'Complete Module' },
                        { value: 'login', label: 'Login/Visit' },
                        { value: 'profile_update', label: 'Update Profile' }
                      ]}
                    />
                  </div>
                  <div className="w-20">
                    <Input
                      type="number"
                      value={req.target}
                      onChange={(e) => handleRequirementChange(index, 'target', parseInt(e.target.value))}
                      min="1"
                      placeholder="1"
                    />
                  </div>
                  <div className="flex-2">
                    <Input
                      value={req.description}
                      onChange={(e) => handleRequirementChange(index, 'description', e.target.value)}
                      placeholder="Requirement description..."
                    />
                  </div>
                  {requirements.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveRequirement(index)}
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
            <h4 className="text-sm font-medium text-gray-700 mb-3">Quest Preview</h4>
            <Card className="bg-gray-50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h5 className="font-medium text-gray-900">{title || 'Quest Title'}</h5>
                    <Badge className={getCategoryColor(category)}>{category}</Badge>
                    <Badge variant="outline">{questType}</Badge>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-blue-600">{xpReward} XP</p>
                    <p className="text-xs text-gray-500">{estimatedTime} min</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-3">
                  {description || 'Quest description will appear here...'}
                </p>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-600">Requirements:</p>
                  {requirements.map((req, index) => (
                    <p key={index} className="text-xs text-gray-600">
                      • {req.description} ({req.target}x)
                    </p>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                  <span>Domain: {domain}</span>
                  <span>Level: {targetLevel}</span>
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
              Save as Template
            </Button>
            <Button type="submit" variant="primary">
              Suggest Quest
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}