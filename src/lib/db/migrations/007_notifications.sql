-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'mention', 'quest_available', 'event_reminder', 'achievement', 'system'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  email_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  in_app_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, type)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON notification_preferences(user_id);

-- Insert default notification preferences for existing users
INSERT INTO notification_preferences (user_id, type, in_app_enabled, email_enabled)
SELECT 
  u.id,
  unnest(ARRAY['mention', 'quest_available', 'event_reminder', 'achievement', 'system']) as type,
  true as in_app_enabled,
  CASE 
    WHEN unnest(ARRAY['mention', 'quest_available', 'event_reminder', 'achievement', 'system']) IN ('mention', 'achievement', 'event_reminder') 
    THEN true 
    ELSE false 
  END as email_enabled
FROM users u
ON CONFLICT (user_id, type) DO NOTHING;