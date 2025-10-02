'use client';

import React, { useState } from 'react';
import { User, Domain } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LeaderboardFilters } from './leaderboard-filters';
import { UserRankingCard } from './user-ranking-card';
import { mockLeaderboardUsers, mockWeeklyLeaderboardUsers } from '@/lib/mock-data';

type LeaderboardPeriod = 'weekly' | 'all-time';
type ViewMode = 'grid' | 'list';

interface ResponsiveLeaderboardProps {
  maxEntries?: number;
  showFilters?: boolean;
  showPeriodToggle?: boolean;
  className?: string;
}

export function ResponsiveLeaderboard({ 
  maxEntries = 50,
  showFilters = true,
  showPeriodToggle = true,
  className 
}: ResponsiveLeaderboardProps) {
  const [period, setPeriod] = useState<LeaderboardPeriod>('all-time');
  const [selectedDomain, setSelectedDomain] = useState<Domain | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Get and filter data
  const baseData = period === 'weekly' ? mockWeeklyLeaderboardUsers : mockLeaderboardUsers;
  
  let filteredUsers = [...baseData];
  
  if (selectedDomain !== 'all') {
    filteredUsers = filteredUsers.filter(user => user.domain === selectedDomain);
  }
  
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    filteredUsers = filteredUsers.filter(user => 
      user.username.toLowerCase().includes(query) ||
      user.domain.toLowerCase().includes(query)
    );
  }
  
  const displayUsers = filteredUsers.slice(0, maxEntries);

  const handleUserClick = (user: User) => {
    console.log('Navigate to user profile:', user.id);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header Controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        {showPeriodToggle && (
          <div className="flex bg-gray-100 rounded-lg p-1">
            <Button
              variant={period === 'weekly' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setPeriod('weekly')}
              className={`px-3 py-1 text-sm ${
                period === 'weekly' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'bg-transparent text-gray-600 hover:bg-gray-200'
              }`}
            >
              Weekly
            </Button>
            <Button
              variant={period === 'all-time' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setPeriod('all-time')}
              className={`px-3 py-1 text-sm ${
                period === 'all-time' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'bg-transparent text-gray-600 hover:bg-gray-200'
              }`}
            >
              All-Time
            </Button>
          </div>
        )}

        {/* View Mode Toggle - Hidden on mobile */}
        <div className="hidden md:flex bg-gray-100 rounded-lg p-1">
          <Button
            variant={viewMode === 'list' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 text-sm ${
              viewMode === 'list' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'bg-transparent text-gray-600 hover:bg-gray-200'
            }`}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            List
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1 text-sm ${
              viewMode === 'grid' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'bg-transparent text-gray-600 hover:bg-gray-200'
            }`}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Grid
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <LeaderboardFilters
              selectedDomain={selectedDomain}
              searchQuery={searchQuery}
              onDomainChange={setSelectedDomain}
              onSearchChange={setSearchQuery}
            />
          </CardContent>
        </Card>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          Showing {displayUsers.length} of {filteredUsers.length} users
        </span>
        {period === 'weekly' && (
          <span className="text-xs">
            Resets Monday UTC
          </span>
        )}
      </div>

      {/* Leaderboard Content */}
      {displayUsers.length > 0 ? (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4' 
            : 'space-y-3'
        }>
          {displayUsers.map((user, index) => (
            <UserRankingCard
              key={user.id}
              user={user}
              rank={index + 1}
              compact={viewMode === 'grid'}
              onClick={() => handleUserClick(user)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
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
              <p className="text-gray-500">
                Try adjusting your filters or search terms.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Load More Button */}
      {filteredUsers.length > maxEntries && (
        <div className="text-center">
          <Button variant="outline">
            Load More Users
          </Button>
        </div>
      )}
    </div>
  );
}