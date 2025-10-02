'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { LearningModule, UserModuleProgress, Domain, Difficulty } from '@/lib/types';
import { apiClient } from '@/lib/api-client';
import { useAuth } from './auth-context';

interface LearningState {
  modules: LearningModule[];
  userProgress: UserModuleProgress[];
  currentModule: LearningModule | null;
  currentProgress: UserModuleProgress | null;
  isLoading: boolean;
}

type LearningAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_MODULES'; payload: LearningModule[] }
  | { type: 'SET_USER_PROGRESS'; payload: UserModuleProgress[] }
  | { type: 'SET_CURRENT_MODULE'; payload: LearningModule | null }
  | { type: 'SET_CURRENT_PROGRESS'; payload: UserModuleProgress | null }
  | { type: 'START_MODULE'; payload: { moduleId: string; progress: UserModuleProgress } }
  | { type: 'UPDATE_PROGRESS'; payload: { moduleId: string; progress: number; currentContentId?: string } }
  | { type: 'COMPLETE_MODULE'; payload: { moduleId: string; xpGained: number } }
  | { type: 'UPDATE_TIME_SPENT'; payload: { moduleId: string; timeSpent: number } };

interface LearningContextType extends LearningState {
  loadModules: () => Promise<void>;
  loadUserProgress: () => Promise<void>;
  startModule: (moduleId: string) => Promise<void>;
  updateProgress: (moduleId: string, progress: number, currentContentId?: string) => Promise<void>;
  completeModule: (moduleId: string) => Promise<void>;
  updateTimeSpent: (moduleId: string, additionalTime: number) => void;
  setCurrentModule: (module: LearningModule | null) => void;
  getModulesByDomain: (domain: Domain) => LearningModule[];
  getModulesByDifficulty: (difficulty: Difficulty) => LearningModule[];
  getUserProgress: (moduleId: string) => UserModuleProgress | undefined;
  getCompletedModules: () => LearningModule[];
  getInProgressModules: () => LearningModule[];
  getRecommendedModules: () => LearningModule[];
}

const LearningContext = createContext<LearningContextType | undefined>(undefined);

const learningReducer = (state: LearningState, action: LearningAction): LearningState => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_MODULES':
      return {
        ...state,
        modules: action.payload,
      };
    case 'SET_USER_PROGRESS':
      return {
        ...state,
        userProgress: action.payload,
      };
    case 'SET_CURRENT_MODULE':
      return {
        ...state,
        currentModule: action.payload,
      };
    case 'SET_CURRENT_PROGRESS':
      return {
        ...state,
        currentProgress: action.payload,
      };
    case 'START_MODULE':
      return {
        ...state,
        userProgress: [...state.userProgress, action.payload.progress],
      };
    case 'UPDATE_PROGRESS':
      return {
        ...state,
        userProgress: state.userProgress.map(progress =>
          progress.moduleId === action.payload.moduleId
            ? { 
                ...progress, 
                progress: action.payload.progress,
                currentContentId: action.payload.currentContentId || progress.currentContentId
              }
            : progress
        ),
        currentProgress: state.currentProgress?.moduleId === action.payload.moduleId
          ? {
              ...state.currentProgress,
              progress: action.payload.progress,
              currentContentId: action.payload.currentContentId || state.currentProgress.currentContentId
            }
          : state.currentProgress,
      };
    case 'COMPLETE_MODULE':
      return {
        ...state,
        userProgress: state.userProgress.map(progress =>
          progress.moduleId === action.payload.moduleId
            ? { 
                ...progress, 
                completed: true,
                progress: 100,
                completedAt: new Date()
              }
            : progress
        ),
        currentProgress: state.currentProgress?.moduleId === action.payload.moduleId
          ? {
              ...state.currentProgress,
              completed: true,
              progress: 100,
              completedAt: new Date()
            }
          : state.currentProgress,
      };
    case 'UPDATE_TIME_SPENT':
      return {
        ...state,
        userProgress: state.userProgress.map(progress =>
          progress.moduleId === action.payload.moduleId
            ? { ...progress, timeSpent: action.payload.timeSpent }
            : progress
        ),
        currentProgress: state.currentProgress?.moduleId === action.payload.moduleId
          ? { ...state.currentProgress, timeSpent: action.payload.timeSpent }
          : state.currentProgress,
      };
    default:
      return state;
  }
};

const initialState: LearningState = {
  modules: [],
  userProgress: [],
  currentModule: null,
  currentProgress: null,
  isLoading: false,
};

interface LearningProviderProps {
  children: ReactNode;
}

export function LearningProvider({ children }: LearningProviderProps) {
  const [state, dispatch] = useReducer(learningReducer, initialState);
  const { user } = useAuth();

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      try {
        const modulesResponse = await apiClient.getLearningModules();
        
        if (modulesResponse.success) {
          dispatch({ type: 'SET_MODULES', payload: modulesResponse.data?.modules || [] });
        }
        
        // Load user progress for each module
        await loadUserProgress();
      } catch (error) {
        console.error('Error loading learning data:', error);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    if (user) {
      loadInitialData();
    }
  }, [user]);

  const loadModules = async (): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const response = await apiClient.getLearningModules();
      
      if (response.success) {
        dispatch({ type: 'SET_MODULES', payload: response.data?.modules || [] });
      }
    } catch (error) {
      console.error('Error loading modules:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const loadUserProgress = async (): Promise<void> => {
    if (!user) return;

    try {
      // For now, we'll collect progress for all modules
      // In a real implementation, this would be a single API call
      const progressPromises = state.modules.map(async (module) => {
        try {
          const response = await apiClient.getModuleProgress(module.id);
          return response.success ? response.data?.progress : null;
        } catch {
          return null;
        }
      });

      const progressResults = await Promise.all(progressPromises);
      const validProgress = progressResults.filter(p => p !== null) as UserModuleProgress[];
      
      dispatch({ type: 'SET_USER_PROGRESS', payload: validProgress });
    } catch (error) {
      console.error('Error loading user progress:', error);
    }
  };

  const startModule = async (moduleId: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    const newProgress: UserModuleProgress = {
      userId: user.id,
      moduleId,
      completed: false,
      progress: 0,
      startedAt: new Date(),
      timeSpent: 0,
    };

    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      dispatch({ 
        type: 'START_MODULE', 
        payload: { moduleId, progress: newProgress } 
      });

      // Save to localStorage
      const savedProgress = localStorage.getItem('gameforge_learning_progress');
      let progressData = savedProgress ? JSON.parse(savedProgress) : [];
      progressData.push(newProgress);
      localStorage.setItem('gameforge_learning_progress', JSON.stringify(progressData));
    } catch (error) {
      console.error('Error starting module:', error);
      throw error;
    }
  };

  const updateProgress = async (moduleId: string, progress: number, currentContentId?: string): Promise<void> => {
    if (!user) return;

    try {
      const response = await apiClient.updateModuleProgress(moduleId, progress);
      
      if (response.success) {
        dispatch({ 
          type: 'UPDATE_PROGRESS', 
          payload: { moduleId, progress, currentContentId } 
        });
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      // Still update locally for better UX
      dispatch({ 
        type: 'UPDATE_PROGRESS', 
        payload: { moduleId, progress, currentContentId } 
      });
    }
  };

  const completeModule = async (moduleId: string): Promise<void> => {
    if (!user) return;

    try {
      const response = await apiClient.completeModule(moduleId);
      
      if (response.success) {
        const xpGained = response.data?.xpGained || 0;
        
        dispatch({ 
          type: 'COMPLETE_MODULE', 
          payload: { moduleId, xpGained } 
        });

        // Note: User XP will be updated by the backend automatically
      }
    } catch (error) {
      console.error('Error completing module:', error);
      throw error;
    }
  };

  const updateTimeSpent = (moduleId: string, additionalTime: number) => {
    if (!user) return;

    const currentProgress = state.userProgress.find(p => 
      p.moduleId === moduleId && p.userId === user.id
    );
    
    if (currentProgress) {
      const newTimeSpent = currentProgress.timeSpent + additionalTime;
      
      dispatch({ 
        type: 'UPDATE_TIME_SPENT', 
        payload: { moduleId, timeSpent: newTimeSpent } 
      });

      // Save to localStorage
      const savedProgress = localStorage.getItem('gameforge_learning_progress');
      let progressData = savedProgress ? JSON.parse(savedProgress) : [];
      
      const existingIndex = progressData.findIndex((p: UserModuleProgress) => 
        p.moduleId === moduleId && p.userId === user.id
      );
      
      if (existingIndex >= 0) {
        progressData[existingIndex] = {
          ...progressData[existingIndex],
          timeSpent: newTimeSpent
        };
        localStorage.setItem('gameforge_learning_progress', JSON.stringify(progressData));
      }
    }
  };

  const setCurrentModule = (module: LearningModule | null) => {
    dispatch({ type: 'SET_CURRENT_MODULE', payload: module });
    
    if (module && user) {
      const progress = state.userProgress.find(p => 
        p.moduleId === module.id && p.userId === user.id
      );
      dispatch({ type: 'SET_CURRENT_PROGRESS', payload: progress || null });
    } else {
      dispatch({ type: 'SET_CURRENT_PROGRESS', payload: null });
    }
  };

  const getUserProgress = (moduleId: string): UserModuleProgress | undefined => {
    return state.userProgress.find(progress => 
      progress.moduleId === moduleId && progress.userId === user?.id
    );
  };

  const getCompletedModules = (): LearningModule[] => {
    const completedIds = state.userProgress
      .filter(p => p.userId === user?.id && p.completed)
      .map(p => p.moduleId);
    
    return state.modules.filter(module => completedIds.includes(module.id));
  };

  const getInProgressModules = (): LearningModule[] => {
    const inProgressIds = state.userProgress
      .filter(p => p.userId === user?.id && !p.completed && p.progress > 0)
      .map(p => p.moduleId);
    
    return state.modules.filter(module => inProgressIds.includes(module.id));
  };

  const getRecommendedModules = (): LearningModule[] => {
    if (!user) return [];
    
    // Recommend modules from user's domain that they haven't started
    const startedIds = state.userProgress
      .filter(p => p.userId === user.id)
      .map(p => p.moduleId);
    
    return state.modules
      .filter(module => 
        module.domain === user.domain && 
        !startedIds.includes(module.id) &&
        module.isPublished
      )
      .sort((a, b) => {
        // Sort by difficulty (beginner first) and rating
        const difficultyOrder = { beginner: 0, intermediate: 1, advanced: 2 };
        const aDiff = difficultyOrder[a.difficulty];
        const bDiff = difficultyOrder[b.difficulty];
        
        if (aDiff !== bDiff) return aDiff - bDiff;
        return 0; // No rating field in current schema
      })
      .slice(0, 6); // Limit to 6 recommendations
  };

  const value: LearningContextType = {
    ...state,
    loadModules,
    loadUserProgress,
    startModule,
    updateProgress,
    completeModule,
    updateTimeSpent,
    setCurrentModule,
    getModulesByDomain: (domain: Domain) => state.modules.filter(module => module.domain === domain),
    getModulesByDifficulty: (difficulty: Difficulty) => state.modules.filter(module => module.difficulty === difficulty),
    getUserProgress,
    getCompletedModules,
    getInProgressModules,
    getRecommendedModules,
  };

  return (
    <LearningContext.Provider value={value}>
      {children}
    </LearningContext.Provider>
  );
}

export function useLearning(): LearningContextType {
  const context = useContext(LearningContext);
  if (context === undefined) {
    throw new Error('useLearning must be used within a LearningProvider');
  }
  return context;
}