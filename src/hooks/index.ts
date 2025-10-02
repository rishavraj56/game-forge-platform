// Data fetching hooks
export { useLeaderboard } from './use-leaderboard';
export { useActivityFeed } from './use-activity-feed';
export { useEvents } from './use-events';
export { useNotifications } from './use-notifications';

// Authorization hooks
export { useAuthorization } from './use-authorization';

// Admin hooks
export { useAdmin } from './use-admin';

// Local storage hooks
export { default as useLocalStorage } from './use-local-storage';
export {
  useThemePreference,
  useSidebarPreference,
  useNotificationSettings,
  useDashboardLayout,
  useRecentSearches,
  useFavoriteChannels,
  useCompletedTutorials,
} from './use-local-storage';