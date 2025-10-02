'use client';

import { useState, useEffect, useCallback } from 'react';

type SetValue<T> = T | ((val: T) => T);

function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: SetValue<T>) => void, () => void] {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = useCallback(
    (value: SetValue<T>) => {
      try {
        // Allow value to be a function so we have the same API as useState
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        
        // Save state
        setStoredValue(valueToStore);
        
        // Save to local storage
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  // Function to remove the item from localStorage
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

export default useLocalStorage;

// Specific hooks for common app preferences
export function useThemePreference() {
  return useLocalStorage<'light' | 'dark' | 'system'>('gameforge_theme', 'system');
}

export function useSidebarPreference() {
  return useLocalStorage<boolean>('gameforge_sidebar_collapsed', false);
}

export function useNotificationSettings() {
  return useLocalStorage<{
    sound: boolean;
    desktop: boolean;
    email: boolean;
  }>('gameforge_notification_settings', {
    sound: true,
    desktop: true,
    email: false,
  });
}

export function useDashboardLayout() {
  return useLocalStorage<{
    widgetOrder: string[];
    hiddenWidgets: string[];
  }>('gameforge_dashboard_layout', {
    widgetOrder: ['welcome', 'quests', 'leaderboard', 'activity', 'events'],
    hiddenWidgets: [],
  });
}

export function useRecentSearches() {
  return useLocalStorage<string[]>('gameforge_recent_searches', []);
}

export function useFavoriteChannels() {
  return useLocalStorage<string[]>('gameforge_favorite_channels', []);
}

export function useCompletedTutorials() {
  return useLocalStorage<string[]>('gameforge_completed_tutorials', []);
}