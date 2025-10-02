'use client';

import Link from 'next/link';
import { UserProfileCard, AchievementShowcase, PortfolioSection, SkillsSelection } from '@/components/profile';
import { mockUser, mockUserStats } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';

// Mock data for portfolio and skills (same as in edit page)
const mockProjects = [
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

const mockSkills = [
  { id: '1', name: 'Unity', category: 'Game Engines', level: 'advanced' as const },
  { id: '2', name: 'C#', category: 'Programming Languages', level: 'advanced' as const },
  { id: '3', name: 'JavaScript', category: 'Programming Languages', level: 'intermediate' as const },
  { id: '4', name: 'Blender', category: '3D Modeling', level: 'beginner' as const },
  { id: '5', name: 'Git', category: 'Tools', level: 'intermediate' as const }
];

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
              <p className="text-gray-600 mt-2">Your Game Forge profile and achievements</p>
            </div>
            <Link href="/profile/edit">
              <Button>Edit Profile</Button>
            </Link>
          </div>

          {/* Profile Card */}
          <UserProfileCard user={mockUser} stats={mockUserStats} />

          {/* Achievement Showcase */}
          <AchievementShowcase 
            badges={mockUser.badges} 
            titles={mockUser.titles}
          />

          {/* Portfolio Section */}
          <PortfolioSection
            projects={mockProjects}
            onAddProject={() => {}}
            onUpdateProject={() => {}}
            onDeleteProject={() => {}}
            isEditing={false}
          />

          {/* Skills Section */}
          <SkillsSelection
            selectedSkills={mockSkills}
            domain={mockUser.domain}
            onSkillsChange={() => {}}
            isEditing={false}
          />

          {/* Compact Profile Card Demo */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Compact Profile Card</h2>
            <div className="max-w-md">
              <UserProfileCard 
                user={mockUser} 
                stats={mockUserStats} 
                variant="compact"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}