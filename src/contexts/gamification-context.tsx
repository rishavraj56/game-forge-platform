'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Quest, UserQuestProgress, Badge, Title } from '@/lib/types';
import { apiClient } from '@/lib/api-client';
import { useAuth } from './auth-context';

interface GamificationState {
  dailyQuests: Quest[];
  weeklyQuests: Quest[];
  userQuestProgress: UserQuestProgress[];
  availableBadges: Badge[];
  availableTitles: Title[];
  isLoading: boolean;
}

type GamificationAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_QUESTS'; payload: { daily: Quest[]; weekly: Quest[] } }
  | { type: 'SET_USER_PROGRESS'; payload: UserQuestProgress[] }
  | { type: 'UPDATE_QUEST_PROGRESS'; payload: { questId: string; progress: number; completed?: boolean } }
  | { type: 'COMPLETE_QUEST'; payload: { questId: string; xpGained: number } }
  | { type: 'SET_BADGES'; payload: Badge[] }
  | { type: 'SET_TITLES'; payload: Title[] }
  | { type: 'EARN_BADGE'; payload: Badge }
  | { type: 'UNLOCK_TITLE'; payload: Title };

interface GamificationContextType extends GamificationState {
  completeQuest: (questId: string) => Promise<void>;
  updateQuestProgress: (questId: string, progress: number) => void;
  earnBadge: (badgeId: string) => void;
  unlockTitle: (titleId: string) => void;
  refreshQuests: () => Promise<void>;
  getUserProgress: (questId: string) => UserQuestProgress | undefined;
  getCompletedQuestsCount: () => number;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

const gamificationReducer = (state: GamificationState, action: GamificationAction): GamificationState => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_QUESTS':
      return {
        ...state,
        dailyQuests: action.payload.daily,
        weeklyQuests: action.payload.weekly,
      };
    case 'SET_USER_PROGRESS':
      return {
        ...state,
        userQuestProgress: action.payload,
      };
    case 'UPDATE_QUEST_PROGRESS':
      return {
        ...state,
        userQuestProgress: state.userQuestProgress.map(progress =>
          progress.quest_id === action.payload.questId
            ? { 
                ...progress, 
                progress: action.payload.progress,
                completed: action.payload.completed ?? progress.completed,
                completed_at: action.payload.completed ? new Date() : progress.completed_at,
                updated_at: new Date()
              }
            : progress
        ),
      };
    case 'COMPLETE_QUEST':
      return {
        ...state,
        userQuestProgress: state.userQuestProgress.map(progress =>
          progress.quest_id === action.payload.questId
            ? { 
                ...progress, 
                completed: true,
                completed_at: new Date(),
                updated_at: new Date()
              }
            : progress
        ),
      };
    case 'SET_BADGES':
      return {
        ...state,
        availableBadges: action.payload,
      };
    case 'SET_TITLES':
      return {
        ...state,
        availableTitles: action.payload,
      };
    case 'EARN_BADGE':
      return {
        ...state,
        availableBadges: state.availableBadges.map(badge =>
          badge.id === action.payload.id
            ? { ...badge, earnedAt: new Date() }
            : badge
        ),
      };
    case 'UNLOCK_TITLE':
      return {
        ...state,
        availableTitles: state.availableTitles.map(title =>
          title.id === action.payload.id
            ? { ...title, isActive: true }
            : title
        ),
      };
    default:
      return state;
  }
};

const initialState: GamificationState = {
  dailyQuests: [],
  weeklyQuests: [],
  userQuestProgress: [],
  availableBadges: [],
  availableTitles: [],
  isLoading: false,
};

interface GamificationProviderProps {
  children: ReactNode;
}

export function GamificationProvider({ children }: GamificationProviderProps) {
  const [state, dispatch] = useReducer(gamificationReducer, initialState);
  const { user } = useAuth();

  // Load initial data
  useEffect(() => {
    const loadGamificationData = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      try {
        // Load quests
        const [dailyQuestsResponse, weeklyQuestsResponse, badgesResponse, titlesResponse] = await Promise.all([
          apiClient.getQuests({ type: 'daily', active: true }),
          apiClient.getQuests({ type: 'weekly', active: true }),
          apiClient.getBadges(),
          apiClient.getTitles()
        ]);

        if (dailyQuestsResponse.success && weeklyQuestsResponse.success) {
          dispatch({ 
            type: 'SET_QUESTS', 
            payload: { 
              daily: dailyQuestsResponse.data?.quests || [], 
              weekly: weeklyQuestsResponse.data?.quests || []
            } 
          });

          // Extract user progress from quest data
          const allQuests = [
            ...(dailyQuestsResponse.data?.quests || []),
            ...(weeklyQuestsResponse.data?.quests || [])
          ];
          
          const userProgress: UserQuestProgress[] = allQuests.map(quest => ({
            id: `progress-${quest.id}-${user!.id}`,
            quest_id: quest.id,
            user_id: user!.id,
            completed: (quest as any).user_completed || false,
            progress: (quest as any).user_progress || 0,
            completed_at: (quest as any).user_completed_at ? new Date((quest as any).user_completed_at) : undefined,
            created_at: new Date(),
            updated_at: new Date()
          }));

          dispatch({ type: 'SET_USER_PROGRESS', payload: userProgress });
        }

        if (badgesResponse.success) {
          dispatch({ type: 'SET_BADGES', payload: badgesResponse.data?.badges || [] });
        }

        if (titlesResponse.success) {
          dispatch({ type: 'SET_TITLES', payload: titlesResponse.data?.titles || [] });
        }
      } catch (error) {
        console.error('Error loading gamification data:', error);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    if (user) {
      loadGamificationData();
    }
  }, [user]);

  const completeQuest = async (questId: string): Promise<void> => {
    if (!user) return;

    try {
      // Call API to complete quest
      const response = await apiClient.completeQuest(questId);
      
      if (response.success) {
        const xpGained = response.data?.xpGained || 0;

        // Update quest progress
        dispatch({ 
          type: 'COMPLETE_QUEST', 
          payload: { questId, xpGained } 
        });

        // Note: User XP will be updated by the backend automatically
      }
    } catch (error) {
      console.error('Error completing quest:', error);
      throw error;
    }
  };

  const updateQuestProgress = async (questId: string, progress: number) => {
    if (!user) return;

    try {
      // Call API to update progress
      const response = await apiClient.updateQuestProgress(questId, progress);
      
      if (response.success) {
        const isCompleted = progress >= 100;
        
        dispatch({ 
          type: 'UPDATE_QUEST_PROGRESS', 
          payload: { questId, progress, completed: isCompleted } 
        });
      }
    } catch (error) {
      console.error('Error updating quest progress:', error);
      // Still update locally for better UX
      const isCompleted = progress >= 100;
      dispatch({ 
        type: 'UPDATE_QUEST_PROGRESS', 
        payload: { questId, progress, completed: isCompleted } 
      });
    }
  };

  const earnBadge = (badgeId: string) => {
    dispatch({ 
      type: 'EARN_BADGE', 
      payload: state.availableBadges.find(b => b.id === badgeId)! 
    });

    // Save to localStorage
    const savedBadges = localStorage.getItem('gameforge_earned_badges');
    let earnedBadges = savedBadges ? JSON.parse(savedBadges) : [];
    
    if (!earnedBadges.includes(badgeId)) {
      earnedBadges.push(badgeId);
      localStorage.setItem('gameforge_earned_badges', JSON.stringify(earnedBadges));
    }
  };

  const unlockTitle = (titleId: string) => {
    dispatch({ 
      type: 'UNLOCK_TITLE', 
      payload: state.availableTitles.find(t => t.id === titleId)! 
    });

    // Save to localStorage
    localStorage.setItem('gameforge_active_title', titleId);
  };

  const refreshQuests = async (): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // Fetch fresh quest data from API
      const [dailyQuestsResponse, weeklyQuestsResponse] = await Promise.all([
        apiClient.getQuests({ type: 'daily', active: true }),
        apiClient.getQuests({ type: 'weekly', active: true })
      ]);

      if (dailyQuestsResponse.success && weeklyQuestsResponse.success) {
        dispatch({ 
          type: 'SET_QUESTS', 
          payload: { 
            daily: dailyQuestsResponse.data?.quests || [], 
            weekly: weeklyQuestsResponse.data?.quests || []
          } 
        });

        // Update user progress from fresh data
        const allQuests = [
          ...(dailyQuestsResponse.data?.quests || []),
          ...(weeklyQuestsResponse.data?.quests || [])
        ];
        
        const userProgress: UserQuestProgress[] = allQuests.map(quest => ({
          id: `progress-${quest.id}-${user!.id}`,
          quest_id: quest.id,
          user_id: user!.id,
          completed: (quest as any).user_completed || false,
          progress: (quest as any).user_progress || 0,
          completed_at: (quest as any).user_completed_at ? new Date((quest as any).user_completed_at) : undefined,
          created_at: new Date(),
          updated_at: new Date()
        }));

        dispatch({ type: 'SET_USER_PROGRESS', payload: userProgress });
      }
    } catch (error) {
      console.error('Error refreshing quests:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const getUserProgress = (questId: string): UserQuestProgress | undefined => {
    return state.userQuestProgress.find(progress => 
      progress.quest_id === questId && progress.user_id === user?.id
    );
  };

  const getCompletedQuestsCount = (): number => {
    return state.userQuestProgress.filter(progress => 
      progress.user_id === user?.id && progress.completed
    ).length;
  };

  const value: GamificationContextType = {
    ...state,
    completeQuest,
    updateQuestProgress,
    earnBadge,
    unlockTitle,
    refreshQuests,
    getUserProgress,
    getCompletedQuestsCount,
  };

  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification(): GamificationContextType {
  const context = useContext(GamificationContext);
  if (context === undefined) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
}