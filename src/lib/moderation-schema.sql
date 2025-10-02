-- Moderation and Reporting System Tables
-- This file contains additional tables needed for content moderation and reporting

-- Reports table for user-generated content reports
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('post', 'comment')),
  content_id UUID NOT NULL,
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason VARCHAR(50) NOT NULL CHECK (reason IN (
    'spam', 'harassment', 'hate_speech', 'inappropriate_content', 
    'misinformation', 'copyright_violation', 'other'
  )),
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Moderation actions log for tracking moderator actions
CREATE TABLE IF NOT EXISTS moderation_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  moderator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('post', 'comment', 'user')),
  content_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL CHECK (action IN (
    'delete', 'restore', 'pin', 'unpin', 'warn', 'suspend', 'ban'
  )),
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User warnings and sanctions
CREATE TABLE IF NOT EXISTS user_sanctions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  moderator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('warning', 'temporary_ban', 'permanent_ban')),
  reason TEXT NOT NULL,
  description TEXT,
  expires_at TIMESTAMP WITH TIME ZONE, -- NULL for permanent bans and warnings
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reports_content ON reports(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_resolver ON reports(resolved_by, resolved_at DESC);

CREATE INDEX IF NOT EXISTS idx_moderation_actions_moderator ON moderation_actions(moderator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_content ON moderation_actions(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_action ON moderation_actions(action, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_sanctions_user ON user_sanctions(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_user_sanctions_moderator ON user_sanctions(moderator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_sanctions_active ON user_sanctions(is_active, expires_at);

-- Composite indexes for common moderation queries
CREATE INDEX IF NOT EXISTS idx_reports_pending_by_content ON reports(status, content_type, created_at DESC) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_moderation_recent_actions ON moderation_actions(created_at DESC, moderator_id);
CREATE INDEX IF NOT EXISTS idx_user_sanctions_active_bans ON user_sanctions(user_id, type, expires_at) WHERE is_active = true AND type IN ('temporary_ban', 'permanent_ban');