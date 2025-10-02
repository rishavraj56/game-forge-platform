import { useState, useEffect, useCallback } from 'react';
import { 
  AdminDashboardData, 
  User, 
  UserRole, 
  Domain, 
  Report, 
  UserSanction,
  PlatformAnalytics,
  Quest,
  Badge,
  Title,
  PaginatedResponse 
} from '@/lib/types';

interface UseAdminReturn {
  // Dashboard
  dashboardData: AdminDashboardData | null;
  loadingDashboard: boolean;
  
  // User Management
  users: User[];
  loadingUsers: boolean;
  usersPagination: any;
  
  // Moderation
  reports: Report[];
  loadingReports: boolean;
  reportsPagination: any;
  
  // Analytics
  analytics: PlatformAnalytics | null;
  loadingAnalytics: boolean;
  
  // Gamification
  quests: Quest[];
  badges: Badge[];
  titles: Title[];
  loadingGamification: boolean;
  
  // Actions
  fetchDashboard: () => Promise<void>;
  fetchUsers: (filters?: any) => Promise<void>;
  updateUser: (userId: string, updates: any) => Promise<void>;
  createUserSanction: (userId: string, sanctionData: any) => Promise<void>;
  fetchReports: (filters?: any) => Promise<void>;
  resolveReport: (reportId: string, action: string, notes?: string) => Promise<void>;
  fetchAnalytics: (timeframe?: string, domain?: string) => Promise<void>;
  fetchGamification: () => Promise<void>;
  createGamificationItem: (type: string, data: any) => Promise<void>;
  updateGamificationItem: (type: string, id: string, data: any) => Promise<void>;
  deleteGamificationItem: (type: string, id: string) => Promise<void>;
  
  // Error handling
  error: string | null;
  clearError: () => void;
}

export function useAdmin(): UseAdminReturn {
  // State
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersPagination, setUsersPagination] = useState(null);
  
  const [reports, setReports] = useState<Report[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportsPagination, setReportsPagination] = useState(null);
  
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  
  const [quests, setQuests] = useState<Quest[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [titles, setTitles] = useState<Title[]>([]);
  const [loadingGamification, setLoadingGamification] = useState(false);
  
  const [error, setError] = useState<string | null>(null);

  // Helper function for API calls
  const apiCall = async (url: string, options: RequestInit = {}) => {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'API request failed');
    }

    return data;
  };

  // Dashboard
  const fetchDashboard = useCallback(async () => {
    setLoadingDashboard(true);
    setError(null);
    
    try {
      const response = await apiCall('/api/admin');
      setDashboardData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard');
    } finally {
      setLoadingDashboard(false);
    }
  }, []);

  // User Management
  const fetchUsers = useCallback(async (filters: any = {}) => {
    setLoadingUsers(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });

      const response = await apiCall(`/api/admin/users?${params.toString()}`);
      setUsers(response.data);
      setUsersPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const updateUser = useCallback(async (userId: string, updates: any) => {
    setError(null);
    
    try {
      const response = await apiCall(`/api/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      // Update the user in the local state
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, ...response.data } : user
      ));

      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
      throw err;
    }
  }, []);

  const createUserSanction = useCallback(async (userId: string, sanctionData: any) => {
    setError(null);
    
    try {
      const response = await apiCall(`/api/admin/users/${userId}/sanctions`, {
        method: 'POST',
        body: JSON.stringify(sanctionData),
      });

      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create sanction');
      throw err;
    }
  }, []);

  // Moderation
  const fetchReports = useCallback(async (filters: any = {}) => {
    setLoadingReports(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });

      const response = await apiCall(`/api/admin/moderation?${params.toString()}`);
      setReports(response.data);
      setReportsPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reports');
    } finally {
      setLoadingReports(false);
    }
  }, []);

  const resolveReport = useCallback(async (reportId: string, action: string, notes?: string) => {
    setError(null);
    
    try {
      const response = await apiCall(`/api/admin/moderation/${reportId}`, {
        method: 'PUT',
        body: JSON.stringify({ action, resolutionNotes: notes }),
      });

      // Update the report in the local state
      setReports(prev => prev.map(report => 
        report.id === reportId 
          ? { ...report, status: response.data.status, resolved_at: new Date() }
          : report
      ));

      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve report');
      throw err;
    }
  }, []);

  // Analytics
  const fetchAnalytics = useCallback(async (timeframe: string = '30d', domain?: string) => {
    setLoadingAnalytics(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({ timeframe });
      if (domain) params.append('domain', domain);

      const response = await apiCall(`/api/admin/analytics?${params.toString()}`);
      setAnalytics(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setLoadingAnalytics(false);
    }
  }, []);

  // Gamification Management
  const fetchGamification = useCallback(async () => {
    setLoadingGamification(true);
    setError(null);
    
    try {
      const response = await apiCall('/api/admin/gamification');
      setQuests(response.data.quests);
      setBadges(response.data.badges);
      setTitles(response.data.titles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch gamification data');
    } finally {
      setLoadingGamification(false);
    }
  }, []);

  const createGamificationItem = useCallback(async (type: string, data: any) => {
    setError(null);
    
    try {
      const response = await apiCall('/api/admin/gamification', {
        method: 'POST',
        body: JSON.stringify({ itemType: type, ...data }),
      });

      // Update local state based on type
      if (type === 'quest') {
        setQuests(prev => [response.data, ...prev]);
      } else if (type === 'badge') {
        setBadges(prev => [response.data, ...prev]);
      } else if (type === 'title') {
        setTitles(prev => [response.data, ...prev]);
      }

      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to create ${type}`);
      throw err;
    }
  }, []);

  const updateGamificationItem = useCallback(async (type: string, id: string, data: any) => {
    setError(null);
    
    try {
      const response = await apiCall(`/api/admin/gamification/${type}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      // Update local state based on type
      if (type === 'quest') {
        setQuests(prev => prev.map(item => item.id === id ? response.data : item));
      } else if (type === 'badge') {
        setBadges(prev => prev.map(item => item.id === id ? response.data : item));
      } else if (type === 'title') {
        setTitles(prev => prev.map(item => item.id === id ? response.data : item));
      }

      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to update ${type}`);
      throw err;
    }
  }, []);

  const deleteGamificationItem = useCallback(async (type: string, id: string) => {
    setError(null);
    
    try {
      await apiCall(`/api/admin/gamification/${type}/${id}`, {
        method: 'DELETE',
      });

      // Update local state based on type
      if (type === 'quest') {
        setQuests(prev => prev.filter(item => item.id !== id));
      } else if (type === 'badge') {
        setBadges(prev => prev.filter(item => item.id !== id));
      } else if (type === 'title') {
        setTitles(prev => prev.filter(item => item.id !== id));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to delete ${type}`);
      throw err;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Dashboard
    dashboardData,
    loadingDashboard,
    
    // User Management
    users,
    loadingUsers,
    usersPagination,
    
    // Moderation
    reports,
    loadingReports,
    reportsPagination,
    
    // Analytics
    analytics,
    loadingAnalytics,
    
    // Gamification
    quests,
    badges,
    titles,
    loadingGamification,
    
    // Actions
    fetchDashboard,
    fetchUsers,
    updateUser,
    createUserSanction,
    fetchReports,
    resolveReport,
    fetchAnalytics,
    fetchGamification,
    createGamificationItem,
    updateGamificationItem,
    deleteGamificationItem,
    
    // Error handling
    error,
    clearError,
  };
}