'use client';

import { useState, useEffect, useCallback } from 'react';
import { User, Domain } from '@/lib/types';
import { 
  mockLeaderboardUsers, 
  mockWeeklyLeaderboardUsers,
  getLeaderboardByDomain,
  getUserRank
} from '@/lib/mock-data';

interface UseLeaderboardOptions {
  type?: 'weekly' | 'all-time';
  domain?: Domain;
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface LeaderboardData {
  users: User[];
  userRank: number;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export function useLeaderboard(options: UseLeaderboardOptions = {}) {
  const {
    type = 'all-time',
    domain,
    limit = 10,
    autoRefresh = false,
    refreshInterval = 30000 // 30 seconds
  } = options;

  const [data, setData] = useState<LeaderboardData>({
    users: [],
    userRank: -1,
    isLoading: true,
    error: null,
    lastUpdated: null,
  });

  const fetchLeaderboard = useCallback(async () => {
    setData(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300));

      let users = type === 'weekly' ? mockWeeklyLeaderboardUsers : mockLeaderboardUsers;
      
      // Filter by domain if specified
      if (domain) {
        users = getLeaderboardByDomain(domain, type);
      }

      // Apply limit
      const limitedUsers = users.slice(0, limit);

      // Get current user's rank (assuming user ID '1' for demo)
      const userRank = getUserRank('1', type);

      setData({
        users: limitedUsers,
        userRank,
        isLoading: false,
        error: null,
        lastUpdated: new Date(),
      });
    } catch (error) {
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load leaderboard',
      }));
    }
  }, [type, domain, limit]);

  // Initial load
  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchLeaderboard, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchLeaderboard]);

  const refresh = useCallback(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return {
    ...data,
    refresh,
  };
}