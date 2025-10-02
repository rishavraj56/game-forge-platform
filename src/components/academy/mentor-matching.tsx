'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { 
  UserIcon, 
  StarIcon, 
  ClockIcon,
  MapPinIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  ChatBubbleLeftRightIcon,
  HeartIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { Domain, User } from '@/lib/types';

interface Mentor extends User {
  yearsExperience: number;
  specializations: string[];
  menteeCount: number;
  rating: number;
  reviewCount: number;
  availability: 'high' | 'medium' | 'low';
  location: string;
  company: string;
  bio: string;
  hourlyRate?: number;
  languages: string[];
  responseTime: string;
}

interface MentorMatchingProps {
  userDomain: Domain;
  onRequestMentorship?: (mentorId: string) => void;
}

export function MentorMatching({ userDomain, onRequestMentorship }: MentorMatchingProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<Domain | 'all'>('all');
  const [selectedExperience, setSelectedExperience] = useState<string>('all');
  const [selectedAvailability, setSelectedAvailability] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'experience' | 'availability'>('rating');

  // Mock mentor data
  const mockMentors: Mentor[] = [
    {
      id: 'mentor-1',
      username: 'SarahChen',
      email: 'sarah@example.com',
      domain: 'Game Development',
      role: 'member',
      xp: 5000,
      level: 25,
      badges: [],
      titles: [],
      avatarUrl: '/avatars/mentor-1.png',
      createdAt: new Date('2020-01-01'),
      updatedAt: new Date('2024-03-01'),
      yearsExperience: 8,
      specializations: ['Unity', 'C#', 'Mobile Games', 'AR/VR'],
      menteeCount: 12,
      rating: 4.9,
      reviewCount: 24,
      availability: 'high',
      location: 'San Francisco, CA',
      company: 'Epic Games',
      bio: 'Senior Unity Developer with 8+ years of experience in mobile and AR/VR game development. Passionate about helping new developers learn best practices and advance their careers.',
      hourlyRate: 75,
      languages: ['English', 'Mandarin'],
      responseTime: '< 2 hours'
    },
    {
      id: 'mentor-2',
      username: 'MikeRodriguez',
      email: 'mike@example.com',
      domain: 'Game Design',
      role: 'member',
      xp: 4200,
      level: 21,
      badges: [],
      titles: [],
      avatarUrl: '/avatars/mentor-2.png',
      createdAt: new Date('2019-06-01'),
      updatedAt: new Date('2024-02-28'),
      yearsExperience: 6,
      specializations: ['Level Design', 'Game Mechanics', 'Player Psychology', 'Monetization'],
      menteeCount: 8,
      rating: 4.8,
      reviewCount: 16,
      availability: 'medium',
      location: 'Austin, TX',
      company: 'Indie Studio',
      bio: 'Game Designer focused on creating engaging player experiences. Specialized in F2P mobile games and player retention strategies.',
      hourlyRate: 60,
      languages: ['English', 'Spanish'],
      responseTime: '< 4 hours'
    },
    {
      id: 'mentor-3',
      username: 'AlexArtist',
      email: 'alex@example.com',
      domain: 'Game Art',
      role: 'member',
      xp: 3800,
      level: 19,
      badges: [],
      titles: [],
      avatarUrl: '/avatars/mentor-3.png',
      createdAt: new Date('2021-03-01'),
      updatedAt: new Date('2024-02-25'),
      yearsExperience: 5,
      specializations: ['3D Modeling', 'Texturing', 'Character Art', 'Environment Art'],
      menteeCount: 15,
      rating: 4.7,
      reviewCount: 30,
      availability: 'high',
      location: 'Remote',
      company: 'Freelance',
      bio: 'Freelance 3D artist specializing in stylized game art. Love teaching artistic fundamentals and helping artists develop their unique style.',
      languages: ['English', 'French'],
      responseTime: '< 1 hour'
    },
    {
      id: 'mentor-4',
      username: 'AIExpert',
      email: 'ai@example.com',
      domain: 'AI for Game Development',
      role: 'member',
      xp: 4500,
      level: 22,
      badges: [],
      titles: [],
      avatarUrl: '/avatars/mentor-4.png',
      createdAt: new Date('2018-09-01'),
      updatedAt: new Date('2024-03-01'),
      yearsExperience: 10,
      specializations: ['Machine Learning', 'Procedural Generation', 'NPC AI', 'Optimization'],
      menteeCount: 6,
      rating: 4.9,
      reviewCount: 12,
      availability: 'low',
      location: 'Seattle, WA',
      company: 'Microsoft',
      bio: 'AI researcher and game developer with expertise in applying machine learning to game development. Focus on practical AI implementations.',
      hourlyRate: 100,
      languages: ['English'],
      responseTime: '< 24 hours'
    }
  ];

  const domains: Domain[] = [
    'Game Development',
    'Game Design',
    'Game Art',
    'AI for Game Development',
    'Creative',
    'Corporate'
  ];

  const filteredMentors = mockMentors.filter(mentor => {
    const matchesSearch = !searchQuery || 
      mentor.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentor.specializations.some(spec => spec.toLowerCase().includes(searchQuery.toLowerCase())) ||
      mentor.company.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDomain = selectedDomain === 'all' || mentor.domain === selectedDomain;
    
    const matchesExperience = selectedExperience === 'all' || 
      (selectedExperience === 'junior' && mentor.yearsExperience < 3) ||
      (selectedExperience === 'mid' && mentor.yearsExperience >= 3 && mentor.yearsExperience < 7) ||
      (selectedExperience === 'senior' && mentor.yearsExperience >= 7);
    
    const matchesAvailability = selectedAvailability === 'all' || mentor.availability === selectedAvailability;
    
    return matchesSearch && matchesDomain && matchesExperience && matchesAvailability;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return b.rating - a.rating;
      case 'experience':
        return b.yearsExperience - a.yearsExperience;
      case 'availability':
        const availabilityOrder = { high: 3, medium: 2, low: 1 };
        return availabilityOrder[b.availability] - availabilityOrder[a.availability];
      default:
        return 0;
    }
  });

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'high':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDomainColor = (domain: Domain) => {
    const colors = {
      'Game Development': 'bg-blue-100 text-blue-800',
      'Game Design': 'bg-green-100 text-green-800',
      'Game Art': 'bg-purple-100 text-purple-800',
      'AI for Game Development': 'bg-orange-100 text-orange-800',
      'Creative': 'bg-pink-100 text-pink-800',
      'Corporate': 'bg-gray-100 text-gray-800'
    };
    return colors[domain] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MagnifyingGlassIcon className="h-5 w-5" />
            Find Your Mentor
          </CardTitle>
          <p className="text-gray-600">
            Connect with experienced professionals in your field for personalized guidance and career growth.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name, skills, or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select
                value={selectedDomain}
                onValueChange={(value) => setSelectedDomain(value as Domain | 'all')}
                options={[
                  { value: 'all', label: 'All Domains' },
                  ...domains.map(domain => ({ value: domain, label: domain }))
                ]}
                placeholder="Domain"
              />

              <Select
                value={selectedExperience}
                onValueChange={setSelectedExperience}
                options={[
                  { value: 'all', label: 'All Experience' },
                  { value: 'junior', label: 'Junior (0-3 years)' },
                  { value: 'mid', label: 'Mid (3-7 years)' },
                  { value: 'senior', label: 'Senior (7+ years)' }
                ]}
                placeholder="Experience"
              />

              <Select
                value={selectedAvailability}
                onValueChange={setSelectedAvailability}
                options={[
                  { value: 'all', label: 'All Availability' },
                  { value: 'high', label: 'High Availability' },
                  { value: 'medium', label: 'Medium Availability' },
                  { value: 'low', label: 'Low Availability' }
                ]}
                placeholder="Availability"
              />

              <Select
                value={sortBy}
                onValueChange={(value) => setSortBy(value as 'rating' | 'experience' | 'availability')}
                options={[
                  { value: 'rating', label: 'Highest Rated' },
                  { value: 'experience', label: 'Most Experienced' },
                  { value: 'availability', label: 'Most Available' }
                ]}
                placeholder="Sort by"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Found {filteredMentors.length} mentor{filteredMentors.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Mentor Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
        {filteredMentors.map((mentor) => (
          <Card key={mentor.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <UserIcon className="h-8 w-8 text-white" />
                  </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{mentor.username}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getDomainColor(mentor.domain)}>
                          {mentor.domain}
                        </Badge>
                        <Badge className={getAvailabilityColor(mentor.availability)} variant="secondary">
                          {mentor.availability} availability
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 mb-1">
                        <StarIcon className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{mentor.rating}</span>
                        <span className="text-sm text-gray-500">({mentor.reviewCount})</span>
                      </div>
                      {mentor.hourlyRate && (
                        <div className="text-sm text-gray-600">${mentor.hourlyRate}/hr</div>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{mentor.bio}</p>

                  {/* Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <BriefcaseIcon className="h-4 w-4" />
                        <span>{mentor.yearsExperience} years at {mentor.company}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPinIcon className="h-4 w-4" />
                        <span>{mentor.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <ClockIcon className="h-4 w-4" />
                        <span>Responds in {mentor.responseTime}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <AcademicCapIcon className="h-4 w-4" />
                        <span>{mentor.menteeCount} mentees</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <ChatBubbleLeftRightIcon className="h-4 w-4" />
                        <span>{mentor.languages.join(', ')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Specializations */}
                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">Specializations:</div>
                    <div className="flex flex-wrap gap-1">
                      {mentor.specializations.map((spec) => (
                        <Badge key={spec} variant="outline" size="sm">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => onRequestMentorship?.(mentor.id)}
                      className="flex-1"
                    >
                      Request Mentorship
                    </Button>
                    <Button variant="outline" size="sm">
                      View Profile
                    </Button>
                    <Button variant="ghost" size="sm">
                      <HeartIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredMentors.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FunnelIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No mentors found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search criteria or filters to find more mentors.
            </p>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchQuery('');
                setSelectedDomain('all');
                setSelectedExperience('all');
                setSelectedAvailability('all');
              }}
            >
              Clear All Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}