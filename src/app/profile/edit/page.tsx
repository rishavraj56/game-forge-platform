'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/types';
import { mockUser } from '@/lib/mock-data';
import { ProfileEditForm } from '@/components/profile/profile-edit-form';
import { PortfolioSection, Project } from '@/components/profile/portfolio-section';
import { SkillsSelection, Skill } from '@/components/profile/skills-selection';
import { Button } from '@/components/ui/button';

// Mock data for portfolio and skills
const mockProjects: Project[] = [
  {
    id: '1',
    title: 'Mystic Quest RPG',
    description: 'A fantasy RPG with turn-based combat and rich storytelling. Features custom dialogue system and procedural dungeon generation.',
    imageUrl: '/projects/mystic-quest.jpg',
    projectUrl: 'https://codecrafter.itch.io/mystic-quest',
    githubUrl: 'https://github.com/codecrafter/mystic-quest',
    technologies: ['Unity', 'C#', 'SQLite', 'Ink'],
    featured: true,
    createdAt: new Date('2024-01-15')
  },
  {
    id: '2',
    title: 'Pixel Platformer',
    description: 'A retro-style platformer with tight controls and challenging level design.',
    imageUrl: '/projects/pixel-platformer.jpg',
    projectUrl: 'https://codecrafter.itch.io/pixel-platformer',
    githubUrl: 'https://github.com/codecrafter/pixel-platformer',
    technologies: ['GameMaker Studio', 'GML', 'Aseprite'],
    featured: false,
    createdAt: new Date('2023-11-20')
  }
];

const mockSkills: Skill[] = [
  { id: '1', name: 'Unity', category: 'Game Engines', level: 'advanced' },
  { id: '2', name: 'C#', category: 'Programming Languages', level: 'advanced' },
  { id: '3', name: 'JavaScript', category: 'Programming Languages', level: 'intermediate' },
  { id: '4', name: 'Blender', category: '3D Modeling', level: 'beginner' },
  { id: '5', name: 'Git', category: 'Tools', level: 'intermediate' }
];

export default function ProfileEditPage() {
  const router = useRouter();
  const [user, setUser] = useState<User>(mockUser);
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [skills, setSkills] = useState<Skill[]>(mockSkills);
  const [activeTab, setActiveTab] = useState<'profile' | 'portfolio' | 'skills'>('profile');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleProfileSave = (updatedProfile: Partial<User>) => {
    setUser(prev => ({ ...prev, ...updatedProfile }));
    setHasUnsavedChanges(true);
  };

  const handleAddProject = (project: Omit<Project, 'id' | 'createdAt'>) => {
    const newProject: Project = {
      ...project,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    setProjects(prev => [...prev, newProject]);
    setHasUnsavedChanges(true);
  };

  const handleUpdateProject = (id: string, updatedProject: Omit<Project, 'id' | 'createdAt'>) => {
    setProjects(prev => 
      prev.map(project => 
        project.id === id ? { ...project, ...updatedProject } : project
      )
    );
    setHasUnsavedChanges(true);
  };

  const handleDeleteProject = (id: string) => {
    setProjects(prev => prev.filter(project => project.id !== id));
    setHasUnsavedChanges(true);
  };

  const handleSkillsChange = (newSkills: Skill[]) => {
    setSkills(newSkills);
    setHasUnsavedChanges(true);
  };

  const handleSaveAll = async () => {
    // In a real app, this would make API calls to save the data
    console.log('Saving profile data:', { user, projects, skills });
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setHasUnsavedChanges(false);
    router.push('/profile');
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!confirmed) return;
    }
    router.push('/profile');
  };

  const tabs = [
    { id: 'profile', label: 'Profile Info', icon: '👤' },
    { id: 'portfolio', label: 'Portfolio', icon: '💼' },
    { id: 'skills', label: 'Skills', icon: '🛠️' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
              <p className="text-gray-600 mt-2">Update your profile information, portfolio, and skills</p>
            </div>
            
            <div className="flex space-x-3">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveAll}
                disabled={!hasUnsavedChanges}
                className="relative"
              >
                Save Changes
                {hasUnsavedChanges && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                )}
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {activeTab === 'profile' && (
              <ProfileEditForm
                user={user}
                onSave={handleProfileSave}
                onCancel={handleCancel}
              />
            )}

            {activeTab === 'portfolio' && (
              <PortfolioSection
                projects={projects}
                onAddProject={handleAddProject}
                onUpdateProject={handleUpdateProject}
                onDeleteProject={handleDeleteProject}
                isEditing={true}
              />
            )}

            {activeTab === 'skills' && (
              <SkillsSelection
                selectedSkills={skills}
                domain={user.domain}
                onSkillsChange={handleSkillsChange}
                isEditing={true}
              />
            )}
          </div>

          {/* Unsaved Changes Warning */}
          {hasUnsavedChanges && (
            <div className="fixed bottom-4 right-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-lg">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-yellow-800 text-sm font-medium">
                  You have unsaved changes
                </span>
                <Button size="sm" onClick={handleSaveAll}>
                  Save Now
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}