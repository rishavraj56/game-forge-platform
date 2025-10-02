'use client';

import React, { useState, useEffect } from 'react';
import { User, LeaderboardEntry } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api-client';

interface LeaderboardDisplayProps {
  title?: string;
  showToggle?: boolean;
  maxEntries?: number;
  className?: string;
}

type LeaderboardPeriod = 'weekly' | 'all-time';

export function LeaderboardDisplay({ 
  title = "Forge Masters", 
  showToggle = true, 
  maxEntries = 10,
  className 
}: LeaderboardDisplayProps) {
  const [period, setPeriod] = useState<LeaderboardPeriod>('all-time');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load leaderboard data
  useEffect(() => {
    const loadLeaderboard = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await apiClient.getLeaderboard({
          type: period,
          limit: maxEntries
        });

        if (response.success) {
          setLeaderboardData(response.data?.leaderboard || []);
        } else {
          setError(response.error?.message || 'Failed to load leaderboard');
        }
      } catch (err) {
        console.error('Error loading leaderboard:', err);
        setError('Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, [period, maxEntries]);

  const displayData = leaderboardData.slice(0, maxEntries);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'text-yellow-600 bg-yellow-50';
      case 2:
        return 'text-gray-600 bg-gray-50';
      case 3:
        return 'text-amber-600 bg-amber-50';
      default:
        return 'text-gray-500 bg-gray-50';
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-gray-900">
            {title}
          </CardTitle>
          {showToggle && (
            <div className="flex bg-gray-100 rounded-lg p-1">
              <Button
                variant={period === 'weekly' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setPeriod('weekly')}
                className={`px-3 py-1 text-xs ${
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
                className={`px-3 py-1 text-xs ${
                  period === 'all-time' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'bg-transparent text-gray-600 hover:bg-gray-200'
                }`}
              >
                All-Time
              </Button>
            </div>
          )}
        </div>
        {period === 'weekly' && (
          <p className="text-sm text-gray-500">
            Rankings reset every Monday at midnight UTC
          </p>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600 mb-2">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        ) : displayData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No leaderboard data available
          </div>
        ) : (
          <div className="space-y-3">
            {displayData.map((entry, index) => {
              const rank = index + 1;
              return (
                <div
                  key={entry.id}
                  className={`flex items-center gap-4 p-3 rounded-lg border transition-all duration-200 hover:shadow-md ${
                    rank <= 3 ? 'bg-gradient-to-r from-gray-50 to-white border-gray-200' : 'bg-white border-gray-100'
                  }`}
                >
                  {/* Rank */}
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm ${getRankColor(rank)}`}>
                    {getRankIcon(rank)}
                  </div>
                  
                  {/* Avatar */}
                  <div className="relative">
                    <img
                      src={entry.avatar_url || '/avatars/default-avatar.png'}
                      alt={`${entry.username}'s avatar`}
                      className="w-12 h-12 rounded-full border-2 border-gray-200 object-cover"
                    />
                    {entry.role === 'domain_lead' && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">L</span>
                      </div>
                    )}
                  </div>
                  
                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {entry.username}
                      </h3>
                      {entry.active_title && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                          {entry.active_title}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-gray-600">
                        {entry.domain}
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-sm text-gray-600">
                        Level {entry.level}
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-sm text-gray-600">
                        {entry.badge_count || 0} badges
                      </span>
                    </div>
                  </div>
                  
                  {/* XP Display */}
                  <div className="text-right">
                    <div className="font-bold text-lg text-gray-900">
                      {entry.xp.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      XP
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {!loading && !error && leaderboardData.length > maxEntries && (
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm">
              View Full Leaderboard
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}