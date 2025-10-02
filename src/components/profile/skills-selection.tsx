'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Domain } from '@/lib/types';

export interface Skill {
  id: string;
  name: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

interface SkillsSelectionProps {
  selectedSkills: Skill[];
  domain: Domain;
  onSkillsChange: (skills: Skill[]) => void;
  isEditing?: boolean;
  className?: string;
}

// Predefined skills by domain
const skillsByDomain: Record<Domain, Record<string, string[]>> = {
  'Game Development': {
    'Programming Languages': ['C#', 'C++', 'JavaScript', 'Python', 'Java', 'Rust', 'Go'],
    'Game Engines': ['Unity', 'Unreal Engine', 'Godot', 'GameMaker Studio', 'Construct 3'],
    'Frameworks & Libraries': ['MonoGame', 'LibGDX', 'Phaser', 'Three.js', 'Babylon.js'],
    'Tools': ['Visual Studio', 'Git', 'Perforce', 'Jenkins', 'Docker']
  },
  'Game Design': {
    'Design Tools': ['Figma', 'Sketch', 'Adobe XD', 'Miro', 'Lucidchart'],
    'Documentation': ['Confluence', 'Notion', 'Google Docs', 'Markdown'],
    'Prototyping': ['Balsamiq', 'InVision', 'Marvel', 'Principle'],
    'Analytics': ['Google Analytics', 'Unity Analytics', 'GameAnalytics']
  },
  'Game Art': {
    '2D Art': ['Photoshop', 'Illustrator', 'Procreate', 'Aseprite', 'Krita'],
    '3D Modeling': ['Blender', 'Maya', 'Max', '3ds Max', 'ZBrush'],
    'Animation': ['After Effects', 'Spine', 'DragonBones', 'Toon Boom'],
    'Texturing': ['Substance Painter', 'Substance Designer', 'Quixel']
  },
  'AI for Game Development': {
    'Machine Learning': ['TensorFlow', 'PyTorch', 'Scikit-learn', 'Keras'],
    'AI Frameworks': ['ML-Agents', 'OpenAI Gym', 'Stable Baselines3'],
    'Programming': ['Python', 'R', 'MATLAB', 'C++'],
    'Tools': ['Jupyter', 'Google Colab', 'Weights & Biases']
  },
  'Creative': {
    'Audio': ['Audacity', 'Pro Tools', 'Logic Pro', 'Ableton Live', 'FMOD'],
    'Video': ['Premiere Pro', 'Final Cut Pro', 'DaVinci Resolve'],
    'Writing': ['Twine', 'Ink', 'Articy Draft', 'World Anvil'],
    'Music': ['FL Studio', 'Cubase', 'Reaper', 'GarageBand']
  },
  'Corporate': {
    'Project Management': ['Jira', 'Trello', 'Asana', 'Monday.com', 'Notion'],
    'Communication': ['Slack', 'Discord', 'Microsoft Teams', 'Zoom'],
    'Analytics': ['Excel', 'Tableau', 'Power BI', 'Google Analytics'],
    'Marketing': ['Mailchimp', 'HubSpot', 'Google Ads', 'Facebook Ads']
  }
};

const skillLevels = [
  { value: 'beginner', label: 'Beginner', color: 'bg-green-100 text-green-800' },
  { value: 'intermediate', label: 'Intermediate', color: 'bg-blue-100 text-blue-800' },
  { value: 'advanced', label: 'Advanced', color: 'bg-purple-100 text-purple-800' },
  { value: 'expert', label: 'Expert', color: 'bg-red-100 text-red-800' }
];

export function SkillsSelection({
  selectedSkills,
  domain,
  onSkillsChange,
  isEditing = false,
  className
}: SkillsSelectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customSkill, setCustomSkill] = useState<{ name: string; category: string; level: Skill['level'] }>({ name: '', category: 'Other', level: 'beginner' });

  const domainSkills = skillsByDomain[domain] || {};

  const filteredSkills = Object.entries(domainSkills).reduce((acc, [category, skills]) => {
    const filtered = skills.filter(skill =>
      skill.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[category] = filtered;
    }
    return acc;
  }, {} as Record<string, string[]>);

  const isSkillSelected = (skillName: string) => {
    return selectedSkills.some(skill => skill.name === skillName);
  };

  const getSkillLevel = (skillName: string) => {
    const skill = selectedSkills.find(skill => skill.name === skillName);
    return skill?.level || 'beginner';
  };

  const toggleSkill = (skillName: string, category: string) => {
    const isSelected = isSkillSelected(skillName);

    if (isSelected) {
      // Remove skill
      onSkillsChange(selectedSkills.filter(skill => skill.name !== skillName));
    } else {
      // Add skill
      const newSkill: Skill = {
        id: `${category}-${skillName}`.toLowerCase().replace(/\s+/g, '-'),
        name: skillName,
        category,
        level: 'beginner'
      };
      onSkillsChange([...selectedSkills, newSkill]);
    }
  };

  const updateSkillLevel = (skillName: string, level: Skill['level']) => {
    onSkillsChange(
      selectedSkills.map(skill =>
        skill.name === skillName ? { ...skill, level } : skill
      )
    );
  };

  const addCustomSkill = () => {
    if (!customSkill.name.trim()) return;

    const newSkill: Skill = {
      id: `custom-${customSkill.name}`.toLowerCase().replace(/\s+/g, '-'),
      name: customSkill.name,
      category: customSkill.category,
      level: customSkill.level
    };

    onSkillsChange([...selectedSkills, newSkill]);
    setCustomSkill({ name: '', category: 'Other', level: 'beginner' });
    setShowAddCustom(false);
  };

  const getLevelColor = (level: Skill['level']) => {
    return skillLevels.find(l => l.value === level)?.color || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className={cn('p-6', className)}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Skills & Technologies</h3>
          {isEditing && (
            <Button
              onClick={() => setShowAddCustom(true)}
              size="sm"
              variant="outline"
            >
              Add Custom Skill
            </Button>
          )}
        </div>

        {/* Selected Skills Display */}
        {selectedSkills.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Your Skills</h4>
            <div className="flex flex-wrap gap-2">
              {selectedSkills.map((skill) => (
                <div
                  key={skill.id}
                  className="inline-flex items-center space-x-2 px-3 py-1 bg-white border border-gray-200 rounded-full"
                >
                  <span className="text-sm font-medium">{skill.name}</span>
                  <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', getLevelColor(skill.level))}>
                    {skill.level}
                  </span>
                  {isEditing && (
                    <button
                      onClick={() => onSkillsChange(selectedSkills.filter(s => s.id !== skill.id))}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Custom Skill Form */}
        {showAddCustom && (
          <Card className="p-4 border-2 border-blue-200">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Add Custom Skill</h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Skill Name</label>
                  <Input
                    value={customSkill.name}
                    onChange={(e) => setCustomSkill(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter skill name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <Input
                    value={customSkill.category}
                    onChange={(e) => setCustomSkill(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="Enter category"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                  <select
                    value={customSkill.level}
                    onChange={(e) => setCustomSkill(prev => ({ ...prev, level: e.target.value as Skill['level'] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {skillLevels.map(level => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddCustom(false)}
                >
                  Cancel
                </Button>
                <Button onClick={addCustomSkill}>
                  Add Skill
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Skills Browser (only in editing mode) */}
        {isEditing && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Browse {domain} Skills</h4>

            {/* Search */}
            <div className="mb-4">
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search skills..."
                className="max-w-md"
              />
            </div>

            {/* Skills by Category */}
            <div className="space-y-4">
              {Object.entries(filteredSkills).map(([category, skills]) => (
                <div key={category}>
                  <h5 className="text-sm font-medium text-gray-600 mb-2">{category}</h5>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skillName) => {
                      const isSelected = isSkillSelected(skillName);
                      const currentLevel = getSkillLevel(skillName);

                      return (
                        <div key={skillName} className="relative">
                          <button
                            onClick={() => toggleSkill(skillName, category)}
                            className={cn(
                              'px-3 py-1 rounded-full text-sm font-medium transition-colors',
                              isSelected
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                            )}
                          >
                            {skillName}
                            {isSelected && (
                              <span className={cn('ml-2 px-1.5 py-0.5 rounded text-xs', getLevelColor(currentLevel))}>
                                {currentLevel}
                              </span>
                            )}
                          </button>

                          {/* Level selector for selected skills */}
                          {isSelected && (
                            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 hidden group-hover:block">
                              {skillLevels.map(level => (
                                <button
                                  key={level.value}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateSkillLevel(skillName, level.value as Skill['level']);
                                  }}
                                  className={cn(
                                    'block w-full text-left px-3 py-2 text-sm hover:bg-gray-50',
                                    currentLevel === level.value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                                  )}
                                >
                                  {level.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {selectedSkills.length === 0 && !isEditing && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No skills listed</h3>
            <p className="text-gray-600">Add your skills to showcase your expertise</p>
          </div>
        )}
      </div>
    </Card>
  );
}