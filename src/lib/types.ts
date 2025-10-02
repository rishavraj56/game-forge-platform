// Database model types for Game Forge Platform

export type Domain = 
  | 'Game Development'
  | 'Game Design'
  | 'Game Art'
  | 'AI for Game Development'
  | 'Creative'
  | 'Corporate';

export type UserRole = 'member' | 'domain_lead' | 'admin';

export type QuestType = 'daily' | 'weekly';

export type EventType = 'game_jam' | 'workshop' | 'meetup' | 'conference' | 'hackathon';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export type NotificationType = 
  | 'quest_completed'
  | 'badge_earned'
  | 'level_up'
  | 'event_reminder'
  | 'post_reaction'
  | 'comment_reply'
  | 'mentorship_match'
  | 'system_announcement';

export type ActivityType =
  | 'quest_completed'
  | 'badge_earned'
  | 'level_up'
  | 'post_created'
  | 'comment_added'
  | 'module_completed'
  | 'event_joined'
  | 'profile_updated';

// Core User Interface
export interface User {
  id: string;
  username: string;
  email: string;
  domain: Domain;
  role: UserRole;
  xp: number;
  level: number;
  avatar_url?: string;
  bio?: string;
  is_active: boolean;
  email_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

// Authentication
export interface Account {
  id: string;
  user_id: string;
  type: string;
  provider: string;
  provider_account_id: string;
  refresh_token?: string;
  access_token?: string;
  expires_at?: number;
  token_type?: string;
  scope?: string;
  id_token?: string;
  session_state?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Session {
  id: string;
  session_token: string;
  user_id: string;
  expires: Date;
  created_at: Date;
}

export interface VerificationToken {
  identifier: string;
  token: string;
  expires: Date;
}

// Gamification
export interface Quest {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  xp_reward: number;
  domain?: Domain;
  requirements: QuestRequirement[];
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface QuestRequirement {
  type: string;
  count?: number;
  minutes?: number;
  [key: string]: any;
}

export interface UserQuestProgress {
  id: string;
  user_id: string;
  quest_id: string;
  completed: boolean;
  progress: number;
  completed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Badge {
  id: string;
  name: string;
  description?: string;
  icon_url?: string;
  xp_requirement?: number;
  domain?: Domain;
  is_active: boolean;
  created_at: Date;
}

export interface UserBadge {
  user_id: string;
  badge_id: string;
  earned_at: Date;
}

export interface Title {
  id: string;
  name: string;
  description?: string;
  xp_requirement?: number;
  domain?: Domain;
  is_active: boolean;
  created_at: Date;
}

export interface UserTitle {
  user_id: string;
  title_id: string;
  is_active: boolean;
  earned_at: Date;
}

// Community
export interface Channel {
  id: string;
  name: string;
  domain: Domain;
  type: 'primary' | 'sub';
  parent_id?: string;
  lead_id?: string;
  description?: string;
  member_count: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ChannelMember {
  channel_id: string;
  user_id: string;
  joined_at: Date;
}

export interface Post {
  id: string;
  channel_id: string;
  author_id: string;
  content: string;
  attachments: Attachment[];
  reaction_counts: Record<string, number>;
  is_pinned: boolean;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Attachment {
  type: 'image' | 'file' | 'link';
  url: string;
  name?: string;
  size?: number;
}

export interface PostReaction {
  id: string;
  post_id: string;
  user_id: string;
  reaction_type: string;
  created_at: Date;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  parent_id?: string;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

// Learning Academy
export interface LearningModule {
  id: string;
  title: string;
  description: string;
  domain: Domain;
  difficulty: Difficulty;
  xp_reward: number;
  content: ModuleContent[];
  prerequisites: string[];
  estimated_duration?: number;
  is_published: boolean;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ModuleContent {
  type: 'text' | 'video' | 'quiz' | 'interactive' | 'code_example';
  content: string;
  data?: any;
}

export interface UserModuleProgress {
  id: string;
  user_id: string;
  module_id: string;
  completed: boolean;
  progress: number;
  started_at: Date;
  completed_at?: Date;
  last_accessed: Date;
}

export interface MentorshipProgram {
  id: string;
  name: string;
  description?: string;
  domain: Domain;
  is_active: boolean;
  created_at: Date;
}

export interface MentorshipRelationship {
  id: string;
  program_id: string;
  mentor_id: string;
  mentee_id: string;
  status: 'active' | 'completed' | 'cancelled';
  started_at: Date;
  ended_at?: Date;
}

// Events
export interface Event {
  id: string;
  title: string;
  description: string;
  domain?: Domain;
  event_type: string;
  start_date: Date;
  end_date: Date;
  max_participants?: number;
  current_participants: number;
  organizer_id: string;
  location?: string;
  is_virtual: boolean;
  xp_reward: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface EventRegistration {
  user_id: string;
  event_id: string;
  status: 'registered' | 'attended' | 'cancelled';
  registered_at: Date;
}

// Notifications and Activities
export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, any>;
  is_read: boolean;
  created_at: Date;
}

export interface NotificationPreferences {
  user_id: string;
  in_app: {
    quest_completed: boolean;
    badge_earned: boolean;
    level_up: boolean;
    post_reaction: boolean;
    comment_reply: boolean;
    mention: boolean;
    event_reminder: boolean;
    event_registration: boolean;
    module_completed: boolean;
    system_announcement: boolean;
    domain_announcement: boolean;
  };
  email: {
    quest_completed: boolean;
    badge_earned: boolean;
    level_up: boolean;
    post_reaction: boolean;
    comment_reply: boolean;
    mention: boolean;
    event_reminder: boolean;
    event_registration: boolean;
    module_completed: boolean;
    system_announcement: boolean;
    domain_announcement: boolean;
  };
  updated_at: Date;
}

export interface Activity {
  id: string;
  user_id: string;
  type: ActivityType;
  description: string;
  data: Record<string, any>;
  created_at: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Leaderboard Types
export interface LeaderboardEntry {
  id: string;
  username: string;
  avatar_url?: string;
  domain: Domain;
  role: UserRole;
  xp: number;
  level: number;
  weekly_xp?: number;
  rank: number;
  active_title?: string;
  badge_count?: number;
}

// Statistics Types
export interface PlatformStats {
  total_users: number;
  total_posts: number;
  total_modules: number;
  upcoming_events: number;
  completed_quests: number;
}

export interface DomainStats {
  domain_users: number;
  domain_channels: number;
  domain_modules: number;
  domain_events: number;
}

// Form Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  domain: Domain;
}

export interface ProfileUpdateData {
  username?: string;
  bio?: string;
  avatar_url?: string;
}

// Profile API Types
export interface UserProfileData {
  user: User;
  badges: Badge[];
  titles: Title[];
  stats: {
    completed_quests: number;
    completed_modules: number;
    total_posts: number;
    events_attended: number;
  };
}

export interface DomainInfo {
  name: Domain;
  stats?: {
    total_members: number;
    domain_leads: number;
    channels: number;
    learning_modules: number;
    upcoming_events: number;
    avg_xp: number;
    max_xp: number;
  };
  leads?: Array<{
    id: string;
    username: string;
    avatar_url?: string;
    xp: number;
    level: number;
    created_at: Date;
  }>;
}

export interface UserSearchFilters {
  query?: string;
  domain?: Domain;
  role?: UserRole;
  hasAvatar?: boolean;
  hasBio?: boolean;
  minXp?: number;
  maxXp?: number;
  minLevel?: number;
  maxLevel?: number;
  joinedAfter?: string;
  joinedBefore?: string;
  sortBy?: 'created_at' | 'xp' | 'username' | 'level' | 'updated_at';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
}

export interface UserSearchResult extends User {
  stats?: {
    badge_count: number;
    completed_quests: number;
    total_posts: number;
  };
}

// Admin Types
export interface Report {
  id: string;
  content_type: 'post' | 'comment';
  content_id: string;
  reporter_id: string;
  reason: 'spam' | 'harassment' | 'hate_speech' | 'inappropriate_content' | 'misinformation' | 'copyright_violation' | 'other';
  description?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  resolved_by?: string;
  resolved_at?: Date;
  resolution_notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ModerationAction {
  id: string;
  moderator_id: string;
  content_type: 'post' | 'comment' | 'user';
  content_id: string;
  action: 'delete' | 'restore' | 'pin' | 'unpin' | 'warn' | 'suspend' | 'ban' | 'create' | 'update';
  reason?: string;
  notes?: string;
  created_at: Date;
}

export interface UserSanction {
  id: string;
  user_id: string;
  moderator_id: string;
  type: 'warning' | 'temporary_ban' | 'permanent_ban';
  reason: string;
  description?: string;
  expires_at?: Date;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface AdminDashboardData {
  users: {
    total_users: number;
    new_users_week: number;
    new_users_month: number;
    domain_leads: number;
    active_users: number;
  };
  content: {
    total_posts: number;
    posts_week: number;
    total_comments: number;
    published_modules: number;
    active_events: number;
  };
  gamification: {
    active_quests: number;
    completed_quests: number;
    badges_earned: number;
    avg_user_xp: number;
  };
  recentActivity: Activity[];
}

export interface PlatformAnalytics {
  overview: {
    userGrowth: Array<{
      date: Date;
      new_users: number;
      total_users: number;
    }>;
    growthRates: {
      users: number;
      posts: number;
      quests: number;
    };
  };
  content: {
    posts_created: number;
    comments_created: number;
    modules_created: number;
    events_created: number;
  };
  engagement: {
    quests_completed: number;
    badges_earned: number;
    modules_completed: number;
    event_registrations: number;
    reactions_given: number;
  };
  gamification: {
    avg_xp: number;
    max_xp: number;
    high_xp_users: number;
    high_level_users: number;
  };
  domains: Array<{
    domain: Domain;
    user_count: number;
    avg_xp: number;
    domain_leads: number;
    posts_count: number;
    events_count: number;
  }>;
  topUsers: Array<User & {
    post_count: number;
    completed_quests: number;
  }>;
  recentActivity: Array<{
    type: string;
    count: number;
    date: Date;
  }>;
  timeframe: string;
  generatedAt: string;
}

// Context Types
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: ProfileUpdateData) => Promise<void>;
}

export interface GamificationContextType {
  userQuests: Quest[];
  userProgress: UserQuestProgress[];
  userBadges: Badge[];
  userTitles: Title[];
  leaderboard: LeaderboardEntry[];
  completeQuest: (questId: string) => Promise<void>;
  refreshData: () => Promise<void>;
}