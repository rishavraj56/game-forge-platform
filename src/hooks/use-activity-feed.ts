'use client';

import { useState, useEffect, useCallback } from 'react';
import { ActivityItem } from '@/components/dashboard';
import { mockActivityFeed } from '@/lib/mock-data';
import { Domain } from '@/lib/types';

interface UseActivityFeedOptions {
  limit?: number;
  domain?: Domain;
  userId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface ActivityFeedData {
  activities: ActivityItem[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  lastUpdated: Date | null;
}

export function useActivityFeed(options: UseActivityFeedOptions = {}) {
  const {
    limit = 20,
    domain,
    userId,
    autoRefresh = true,
    refreshInterval = 15000 // 15 seconds
  } = options;

  const [data, setData] = useState<ActivityFeedData>({
    activities: [],
    isLoading: true,
    error: null,
    hasMore: false,
    lastUpdated: null,
  });

  const fetchActivityFeed = useCallback(async () => {
    setData(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 200));

      let activities = [...mockActivityFeed];

      // Filter by domain if specified
      if (domain) {
        activities = activities.filter(activity => activity.user.domain === domain);
      }

      // Filter by user if specified
      if (userId) {
        activities = activities.filter(activity => activity.user.id === userId);
      }

      // Sort by timestamp (newest first)
      activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Apply limit
      const limitedActivities = activities.slice(0, limit);
      const hasMore = activities.length > limit;

      setData({
        activities: limitedActivities,
        isLoading: false,
        error: null,
        hasMore,
        lastUpdated: new Date(),
      });
    } catch (error) {
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load activity feed',
      }));
    }
  }, [limit, domain, userId]);

  // Initial load
  useEffect(() => {
    fetchActivityFeed();
  }, [fetchActivityFeed]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchActivityFeed, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchActivityFeed]);

  const refresh = useCallback(() => {
    fetchActivityFeed();
  }, [fetchActivityFeed]);

  const loadMore = useCallback(async () => {
    if (!data.hasMore || data.isLoading) return;

    try {
      // Simulate loading more data
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // In a real app, this would fetch the next page
      // For now, we'll just simulate by adding more mock data
      const moreActivities = mockActivityFeed.slice(data.activities.length, data.activities.length + limit);
      
      setData(prev => ({
        ...prev,
        activities: [...prev.activities, ...moreActivities],
        hasMore: data.activities.length + moreActivities.length < mockActivityFeed.length,
      }));
    } catch (error) {
      setData(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load more activities',
      }));
    }
  }, [data.activities.length, data.hasMore, data.isLoading, limit]);

  return {
    ...data,
    refresh,
    loadMore,
  };
}