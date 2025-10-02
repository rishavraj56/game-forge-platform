'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';

interface XPRewardConfig {
  id: string;
  action: string;
  baseXP: number;
  multiplier: number;
  description: string;
  isActive: boolean;
}

// Mock XP reward configuration data
const mockXPRewards: XPRewardConfig[] = [
  {
    id: 'post-create',
    action: 'Create Post',
    baseXP: 25,
    multiplier: 1.0,
    description: 'XP awarded for creating a new post in community channels',
    isActive: true
  },
  {
    id: 'comment-create',
    action: 'Leave Comment',
    baseXP: 10,
    multiplier: 1.0,
    description: 'XP awarded for commenting on posts',
    isActive: true
  },
  {
    id: 'module-complete',
    action: 'Complete Learning Module',
    baseXP: 75,
    multiplier: 1.5,
    description: 'XP awarded for completing learning modules (with difficulty multiplier)',
    isActive: true
  },
  {
    id: 'quest-daily',
    action: 'Complete Daily Quest',
    baseXP: 50,
    multiplier: 1.0,
    description: 'Base XP for daily quest completion (actual XP set per quest)',
    isActive: true
  },
  {
    id: 'quest-weekly',
    action: 'Complete Weekly Quest',
    baseXP: 150,
    multiplier: 1.0,
    description: 'Base XP for weekly quest completion (actual XP set per quest)',
    isActive: true
  },
  {
    id: 'event-participate',
    action: 'Event Participation',
    baseXP: 100,
    multiplier: 1.0,
    description: 'XP awarded for participating in community events',
    isActive: true
  },
  {
    id: 'profile-update',
    action: 'Profile Update',
    baseXP: 15,
    multiplier: 1.0,
    description: 'XP awarded for updating profile information',
    isActive: true
  },
  {
    id: 'login-daily',
    action: 'Daily Login',
    baseXP: 5,
    multiplier: 1.0,
    description: 'XP awarded for daily platform login',
    isActive: true
  }
];

interface LevelConfig {
  level: number;
  xpRequired: number;
  xpTotal: number;
  rewards: string[];
}

// Mock level configuration
const mockLevelConfig: LevelConfig[] = [
  { level: 1, xpRequired: 0, xpTotal: 0, rewards: ['Basic profile customization'] },
  { level: 2, xpRequired: 200, xpTotal: 200, rewards: ['Avatar upload'] },
  { level: 3, xpRequired: 200, xpTotal: 400, rewards: ['Custom title selection'] },
  { level: 4, xpRequired: 300, xpTotal: 700, rewards: ['Badge showcase'] },
  { level: 5, xpRequired: 300, xpTotal: 1000, rewards: ['Profile theme options'] },
  { level: 10, xpRequired: 500, xpTotal: 2500, rewards: ['Forge Master badge', 'Special title colors'] },
  { level: 15, xpRequired: 750, xpTotal: 5000, rewards: ['Elite member status', 'Priority support'] },
  { level: 20, xpRequired: 1000, xpTotal: 8000, rewards: ['Legendary status', 'Custom badge creation'] }
];

interface XPRewardFormProps {
  reward?: XPRewardConfig;
  onSave: (reward: Omit<XPRewardConfig, 'id'>) => void;
  onCancel: () => void;
}

function XPRewardForm({ reward, onSave, onCancel }: XPRewardFormProps) {
  const [formData, setFormData] = useState({
    action: reward?.action || '',
    baseXP: reward?.baseXP || 10,
    multiplier: reward?.multiplier || 1.0,
    description: reward?.description || '',
    isActive: reward?.isActive ?? true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{reward ? 'Edit XP Reward' : 'Create New XP Reward'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Action Name" required>
            <Input
              value={formData.action}
              onChange={(e) => setFormData({ ...formData, action: e.target.value })}
              placeholder="e.g., Create Post, Complete Module"
              required
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Base XP" required>
              <Input
                type="number"
                min="1"
                value={formData.baseXP}
                onChange={(e) => setFormData({ ...formData, baseXP: parseInt(e.target.value) })}
                required
              />
            </FormField>

            <FormField label="Multiplier" required>
              <Input
                type="number"
                min="0.1"
                step="0.1"
                value={formData.multiplier}
                onChange={(e) => setFormData({ ...formData, multiplier: parseFloat(e.target.value) })}
                required
              />
            </FormField>
          </div>

          <FormField label="Description" required>
            <textarea
              className="w-full p-2 border border-gray-300 rounded-md resize-none"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe when this XP reward is given"
              required
            />
          </FormField>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">
              Reward is active
            </label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" variant="primary">
              {reward ? 'Update Reward' : 'Create Reward'}
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

export function XPRewardConfig() {
  const [xpRewards, setXPRewards] = useState<XPRewardConfig[]>(mockXPRewards);
  const [levelConfig, setLevelConfig] = useState<LevelConfig[]>(mockLevelConfig);
  const [showRewardForm, setShowRewardForm] = useState(false);
  const [editingReward, setEditingReward] = useState<XPRewardConfig | undefined>();
  const [activeTab, setActiveTab] = useState<'rewards' | 'levels'>('rewards');

  const handleSaveReward = (rewardData: Omit<XPRewardConfig, 'id'>) => {
    if (editingReward) {
      setXPRewards(prevRewards =>
        prevRewards.map(reward =>
          reward.id === editingReward.id
            ? { ...rewardData, id: editingReward.id }
            : reward
        )
      );
    } else {
      const newReward: XPRewardConfig = {
        ...rewardData,
        id: `reward-${Date.now()}`
      };
      setXPRewards(prevRewards => [...prevRewards, newReward]);
    }
    
    setShowRewardForm(false);
    setEditingReward(undefined);
  };

  const handleEditReward = (reward: XPRewardConfig) => {
    setEditingReward(reward);
    setShowRewardForm(true);
  };

  const handleDeleteReward = (rewardId: string) => {
    setXPRewards(prevRewards => prevRewards.filter(reward => reward.id !== rewardId));
  };

  const handleToggleRewardActive = (rewardId: string) => {
    setXPRewards(prevRewards =>
      prevRewards.map(reward =>
        reward.id === rewardId ? { ...reward, isActive: !reward.isActive } : reward
      )
    );
  };

  if (showRewardForm) {
    return (
      <XPRewardForm
        reward={editingReward}
        onSave={handleSaveReward}
        onCancel={() => {
          setShowRewardForm(false);
          setEditingReward(undefined);
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
              variant={activeTab === 'rewards' ? 'primary' : 'ghost'}
              onClick={() => setActiveTab('rewards')}
            >
              XP Rewards
            </Button>
            <Button
              variant={activeTab === 'levels' ? 'primary' : 'ghost'}
              onClick={() => setActiveTab('levels')}
            >
              Level Configuration
            </Button>
          </div>
        </CardContent>
      </Card>

      {activeTab === 'rewards' && (
        <>
          {/* XP Rewards Header */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>XP Reward Configuration</CardTitle>
                <Button onClick={() => setShowRewardForm(true)}>
                  Add New Reward
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Configure XP rewards for different user actions. Base XP can be modified by multipliers based on context.
              </p>
            </CardContent>
          </Card>

          {/* XP Rewards List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {xpRewards.map(reward => (
              <Card key={reward.id} className={`${!reward.isActive ? 'opacity-60' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{reward.action}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-2xl font-bold text-blue-600">{reward.baseXP} XP</span>
                        {reward.multiplier !== 1.0 && (
                          <span className="text-sm text-gray-500">× {reward.multiplier}</span>
                        )}
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          reward.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {reward.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <p className="text-gray-700 mb-4 text-sm">{reward.description}</p>
                  
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEditReward(reward)}>
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant={reward.isActive ? 'secondary' : 'success'}
                      onClick={() => handleToggleRewardActive(reward.id)}
                    >
                      {reward.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleDeleteReward(reward.id)}>
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {activeTab === 'levels' && (
        <>
          {/* Level Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Level Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Configure XP requirements and rewards for each level. Users unlock new features and customization options as they level up.
              </p>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">XP Required</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total XP</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rewards</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {levelConfig.map(level => (
                      <tr key={level.level} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">
                              {level.level}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium">{level.xpRequired.toLocaleString()}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600">{level.xpTotal.toLocaleString()}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            {level.rewards.map((reward, index) => (
                              <div key={index} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full inline-block mr-1">
                                {reward}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Button size="sm" variant="outline">
                            Edit
                          </Button>
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