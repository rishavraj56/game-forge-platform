'use client';

import React, { useState, useMemo } from 'react';
import { User, Domain } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LeaderboardFilters } from './leaderboard-filters';
import { UserRankingCard } from './user-ranking-card';
import { mockLeaderboardUsers, mockWeeklyLeaderboardUsers } from '@/lib/mock-data';

type LeaderboardPeriod = 'weekly' | 'all-time';

interface LeaderboardPageProps {
  className?: string;
}

export function LeaderboardPage({ className }: LeaderboardPageProps) {
  const [period, setPeriod] = useState<LeaderboardPeriod>('all-time');
  const [selectedDomain, setSelectedDomain] = useState<Domain | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Get base data based on period
  const baseData = period === 'weekly' ? mockWeeklyLeaderboardUsers : mockLeaderboardUsers;

  // Filter and search logic
  const filteredUsers = useMemo(() => {
    let filtered = [...baseData];

    // Filter by domain
    if (selectedDomain !== 'all') {
      filtered = filtered.filter(user => user.domain === selectedDomain);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(user => 
        user.username.toLowerCase().includes(query) ||
        user.domain.toLowerCase().includes(query) ||
        user.bio?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [baseData, selectedDomain, searchQuery]);

  const handleUserClick = (user: User) => {
    // Navigate to user profile or show user details
    console.log('Navigate to user profile:', user.id);
  };

  const clearFilters = () => {
    setSelectedDomain('all');
    setSearchQuery('');
  };

  const hasActiveFilters = selectedDomain !== 'all' || searchQuery.trim() !== '';

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Forge Masters Leaderboard
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Compete with fellow developers and climb the ranks by completing quests, 
          contributing to the community, and sharing your knowledge.
        </p>
      </div>

      {/* Period Toggle */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <Button
                variant={period === 'weekly' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setPeriod('weekly')}
                className={`px-4 py-2 text-sm ${
                  period === 'weekly' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'bg-transparent text-gray-600 hover:bg-gray-200'
                }`}
              >
                Weekly Rankings
              </Button>
              <Button
                variant={period === 'all-time' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setPeriod('all-time')}
                className={`px-4 py-2 text-sm ${
                  period === 'all-time' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'bg-transparent text-gray-600 hover:bg-gray-200'
                }`}
              >
                All-Time Rankings
              </Button>
            </div>
            
            <div className="text-sm text-gray-500">
              {period === 'weekly' 
                ? 'Rankings reset every Monday at midnight UTC' 
                : 'Based on total XP earned since joining'
              }
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Filter & Search</CardTitle>
            {hasActiveFilters && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearFilters}
                className="text-sm"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <LeaderboardFilters
            selectedDomain={selectedDomain}
            searchQuery={searchQuery}
            onDomainChange={setSelectedDomain}
            onSearchChange={setSearchQuery}
          />
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {hasActiveFilters ? 'Filtered Results' : 'Top Performers'}
            </CardTitle>
            <div className="text-sm text-gray-500">
              {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredUsers.length > 0 ? (
            <div className="space-y-3">
              {filteredUsers.map((user, index) => (
                <UserRankingCard
                  key={user.id}
                  user={user}
                  rank={index + 1}
                  onClick={() => handleUserClick(user)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg 
                  className="mx-auto h-12 w-12" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.562M15 6.5a3 3 0 11-6 0 3 3 0 016 0z" 
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No users found
              </h3>
              <p className="text-gray-500 mb-4">
                {hasActiveFilters 
                  ? 'Try adjusting your filters or search terms.'
                  : 'No users available in the leaderboard.'
                }
              </p>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear All Filters
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Footer */}
      {filteredUsers.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {filteredUsers[0]?.xp.toLocaleString() || 0}
                </div>
                <div className="text-sm text-gray-500">Highest XP</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {Math.round(filteredUsers.reduce((sum, user) => sum + user.xp, 0) / filteredUsers.length).toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">Average XP</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {filteredUsers.reduce((sum, user) => sum + user.badges.length, 0)}
                </div>
                <div className="text-sm text-gray-500">Total Badges</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}