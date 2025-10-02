'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { ClockIcon, StarIcon, UsersIcon, TrophyIcon, MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { Domain, Difficulty, LearningModule } from '@/lib/types';
import { mockLearningModules, searchModules, getUserModuleProgress } from '@/lib/mock-data';

interface ModuleBrowserProps {
  userId?: string;
}

export function ModuleBrowser({ userId = '1' }: ModuleBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<Domain | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | 'all'>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'popularity' | 'newest'>('rating');

  const domains: Domain[] = [
    'Game Development',
    'Game Design',
    'Game Art',
    'AI for Game Development',
    'Creative',
    'Corporate'
  ];

  const difficulties: Difficulty[] = ['beginner', 'intermediate', 'advanced'];

  const filteredModules = useMemo(() => {
    let modules = mockLearningModules.filter(module => module.isPublished);

    // Apply search filter
    if (searchQuery.trim()) {
      modules = searchModules(
        searchQuery,
        selectedDomain === 'all' ? undefined : selectedDomain,
        selectedDifficulty === 'all' ? undefined : selectedDifficulty
      );
    } else {
      // Apply domain filter
      if (selectedDomain !== 'all') {
        modules = modules.filter(module => module.domain === selectedDomain);
      }

      // Apply difficulty filter
      if (selectedDifficulty !== 'all') {
        modules = modules.filter(module => module.difficulty === selectedDifficulty);
      }
    }

    // Apply sorting
    switch (sortBy) {
      case 'rating':
        modules.sort((a, b) => b.rating - a.rating);
        break;
      case 'popularity':
        modules.sort((a, b) => b.enrollmentCount - a.enrollmentCount);
        break;
      case 'newest':
        modules.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    return modules;
  }, [searchQuery, selectedDomain, selectedDifficulty, sortBy]);

  const getDifficultyColor = (difficulty: Difficulty) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediate':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'advanced':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MagnifyingGlassIcon className="h-5 w-5" />
            Browse Learning Modules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search modules by title, description, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <Select
                  value={selectedDomain}
                  onValueChange={(value) => setSelectedDomain(value as Domain | 'all')}
                  options={[
                    { value: 'all', label: 'All Domains' },
                    ...domains.map(domain => ({ value: domain, label: domain }))
                  ]}
                  placeholder="All Domains"
                />
              </div>

              <div className="flex-1 min-w-[150px]">
                <Select
                  value={selectedDifficulty}
                  onValueChange={(value) => setSelectedDifficulty(value as Difficulty | 'all')}
                  options={[
                    { value: 'all', label: 'All Levels' },
                    ...difficulties.map(difficulty => ({ 
                      value: difficulty, 
                      label: difficulty.charAt(0).toUpperCase() + difficulty.slice(1) 
                    }))
                  ]}
                  placeholder="All Levels"
                />
              </div>

              <div className="flex-1 min-w-[150px]">
                <Select
                  value={sortBy}
                  onValueChange={(value) => setSortBy(value as 'rating' | 'popularity' | 'newest')}
                  options={[
                    { value: 'rating', label: 'Highest Rated' },
                    { value: 'popularity', label: 'Most Popular' },
                    { value: 'newest', label: 'Newest' }
                  ]}
                  placeholder="Sort by"
                />
              </div>
            </div>

            {/* Active Filters Display */}
            {(selectedDomain !== 'all' || selectedDifficulty !== 'all' || searchQuery) && (
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-gray-600">Active filters:</span>
                {searchQuery && (
                  <Badge variant="secondary" className="gap-1">
                    Search: "{searchQuery}"
                    <button
                      onClick={() => setSearchQuery('')}
                      className="ml-1 hover:bg-gray-300 rounded-full w-4 h-4 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {selectedDomain !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    {selectedDomain}
                    <button
                      onClick={() => setSelectedDomain('all')}
                      className="ml-1 hover:bg-gray-300 rounded-full w-4 h-4 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {selectedDifficulty !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    {selectedDifficulty.charAt(0).toUpperCase() + selectedDifficulty.slice(1)}
                    <button
                      onClick={() => setSelectedDifficulty('all')}
                      className="ml-1 hover:bg-gray-300 rounded-full w-4 h-4 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {filteredModules.length} module{filteredModules.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Module Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredModules.map((module) => {
          const userProgress = getUserModuleProgress(userId, module.id);
          const isEnrolled = !!userProgress;
          const isCompleted = userProgress?.completed || false;

          return (
            <Card key={module.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getDomainColor(module.domain)} variant="secondary">
                        {module.domain}
                      </Badge>
                      <Badge className={getDifficultyColor(module.difficulty)} variant="outline">
                        {module.difficulty.charAt(0).toUpperCase() + module.difficulty.slice(1)}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg leading-tight">{module.title}</CardTitle>
                  </div>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{module.description}</p>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Module Stats */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-1 text-gray-600">
                    <ClockIcon className="h-4 w-4" />
                    <span>{formatDuration(module.estimatedDuration)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <TrophyIcon className="h-4 w-4" />
                    <span>{module.xpReward} XP</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <StarIcon className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{module.rating.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <UsersIcon className="h-4 w-4" />
                    <span>{module.enrollmentCount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Progress Bar (if enrolled) */}
                {isEnrolled && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium">{userProgress.progress}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          isCompleted ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${userProgress.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Tags */}
                {module.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {module.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {module.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{module.tags.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}

                {/* Action Button */}
                <Button 
                  className="w-full" 
                  variant={isCompleted ? "outline" : "primary"}
                  size="sm"
                  onClick={() => window.location.href = `/academy/module/${module.id}`}
                >
                  {isCompleted ? (
                    <>
                      <TrophyIcon className="h-4 w-4 mr-2" />
                      Completed
                    </>
                  ) : isEnrolled ? (
                    'Continue Learning'
                  ) : (
                    'Start Learning'
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredModules.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FunnelIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No modules found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search criteria or filters to find more learning modules.
            </p>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchQuery('');
                setSelectedDomain('all');
                setSelectedDifficulty('all');
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