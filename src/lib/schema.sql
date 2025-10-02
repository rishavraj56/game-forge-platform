-- Game Forge Platform Database Schema
-- This file contains the complete database schema for the Game Forge platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users and Authentication
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  domain VARCHAR(50) NOT NULL CHECK (domain IN ('Game Development', 'Game Design', 'Game Art', 'AI for Game Development', 'Creative', 'Corporate')),
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('member', 'domain_lead', 'admin')),
  xp INTEGER DEFAULT 0 CHECK (xp >= 0),
  level INTEGER DEFAULT 1 CHECK (level >= 1),
  avatar_url TEXT,
  bio TEXT,
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User sessions for NextAuth
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  provider_account_id VARCHAR(255) NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type VARCHAR(50),
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(provider, provider_account_id)
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_token VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier VARCHAR(255) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires TIMESTAMP WITH TIME ZONE NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- Gamification System
CREATE TABLE IF NOT EXISTS quests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('daily', 'weekly')),
  xp_reward INTEGER NOT NULL CHECK (xp_reward > 0),
  domain VARCHAR(50) CHECK (domain IN ('Game Development', 'Game Design', 'Game Art', 'AI for Game Development', 'Creative', 'Corporate')),
  requirements JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_quest_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, quest_id)
);

CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  icon_url TEXT,
  xp_requirement INTEGER CHECK (xp_requirement >= 0),
  domain VARCHAR(50) CHECK (domain IN ('Game Development', 'Game Design', 'Game Art', 'AI for Game Development', 'Creative', 'Corporate')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_badges (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_id)
);

CREATE TABLE IF NOT EXISTS titles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  xp_requirement INTEGER CHECK (xp_requirement >= 0),
  domain VARCHAR(50) CHECK (domain IN ('Game Development', 'Game Design', 'Game Art', 'AI for Game Development', 'Creative', 'Corporate')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_titles (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title_id UUID REFERENCES titles(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT false,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, title_id)
);

-- Community System
CREATE TABLE IF NOT EXISTS channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  domain VARCHAR(50) NOT NULL CHECK (domain IN ('Game Development', 'Game Design', 'Game Art', 'AI for Game Development', 'Creative', 'Corporate')),
  type VARCHAR(10) DEFAULT 'primary' CHECK (type IN ('primary', 'sub')),
  parent_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES users(id) ON DELETE SET NULL,
  description TEXT,
  member_count INTEGER DEFAULT 0 CHECK (member_count >= 0),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS channel_members (
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (channel_id, user_id)
);

CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  reaction_counts JSONB DEFAULT '{}',
  is_pinned BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS post_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction_type VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id, reaction_type)
);

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Learning Academy
CREATE TABLE IF NOT EXISTS learning_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  domain VARCHAR(50) NOT NULL CHECK (domain IN ('Game Development', 'Game Design', 'Game Art', 'AI for Game Development', 'Creative', 'Corporate')),
  difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  xp_reward INTEGER NOT NULL CHECK (xp_reward > 0),
  content JSONB NOT NULL DEFAULT '[]',
  prerequisites JSONB DEFAULT '[]',
  estimated_duration INTEGER, -- in minutes
  is_published BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_module_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES learning_modules(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, module_id)
);

CREATE TABLE IF NOT EXISTS mentorship_programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  domain VARCHAR(50) NOT NULL CHECK (domain IN ('Game Development', 'Game Design', 'Game Art', 'AI for Game Development', 'Creative', 'Corporate')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mentorship_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID NOT NULL REFERENCES mentorship_programs(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mentee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(program_id, mentor_id, mentee_id)
);

-- Events System
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  domain VARCHAR(50) CHECK (domain IN ('Game Development', 'Game Design', 'Game Art', 'AI for Game Development', 'Creative', 'Corporate')),
  event_type VARCHAR(50) NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0 CHECK (current_participants >= 0),
  organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  location TEXT,
  is_virtual BOOLEAN DEFAULT true,
  xp_reward INTEGER DEFAULT 0 CHECK (xp_reward >= 0),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (end_date > start_date),
  CHECK (max_participants IS NULL OR current_participants <= max_participants)
);

CREATE TABLE IF NOT EXISTS event_registrations (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'cancelled')),
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, event_id)
);

-- Notifications System
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity Feed
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Indexes
-- User lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_domain ON users(domain);
CREATE INDEX IF NOT EXISTS idx_users_xp ON users(xp DESC);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- Authentication indexes
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);

-- Gamification queries
CREATE INDEX IF NOT EXISTS idx_quests_active ON quests(is_active, type);
CREATE INDEX IF NOT EXISTS idx_quests_domain ON quests(domain, is_active);
CREATE INDEX IF NOT EXISTS idx_user_quest_progress_user ON user_quest_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quest_progress_completed ON user_quest_progress(completed, completed_at);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_titles_user ON user_titles(user_id, is_active);

-- Community content
CREATE INDEX IF NOT EXISTS idx_posts_channel ON posts(channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_active ON posts(is_deleted, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_channels_domain ON channels(domain, is_active);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_post_reactions_post ON post_reactions(post_id);

-- Learning progress
CREATE INDEX IF NOT EXISTS idx_module_progress_user ON user_module_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_module_progress_module ON user_module_progress(module_id);
CREATE INDEX IF NOT EXISTS idx_modules_domain ON learning_modules(domain, is_published);
CREATE INDEX IF NOT EXISTS idx_modules_difficulty ON learning_modules(difficulty, is_published);

-- Events
CREATE INDEX IF NOT EXISTS idx_events_date ON events(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_events_domain ON events(domain, is_active);
CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user ON event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event ON event_registrations(event_id);

-- Notifications and activities
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type, created_at DESC);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_users_domain_xp ON users(domain, xp DESC) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_posts_channel_active ON posts(channel_id, created_at DESC) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_events_active_date ON events(is_active, start_date) WHERE is_active = true;