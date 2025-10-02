-- Additional indexes for leaderboard performance optimization
-- These indexes are specifically designed for leaderboard queries

-- Composite index for all-time leaderboard with domain filtering
CREATE INDEX IF NOT EXISTS idx_users_leaderboard_all_time 
ON users(is_active, domain, xp DESC, level DESC, username) 
WHERE is_active = true;

-- Composite index for all-time leaderboard without domain filtering
CREATE INDEX IF NOT EXISTS idx_users_leaderboard_all_time_global 
ON users(is_active, xp DESC, level DESC, username) 
WHERE is_active = true;

-- Index for weekly XP calculations - quest completions in last 7 days
CREATE INDEX IF NOT EXISTS idx_user_quest_progress_weekly 
ON user_quest_progress(user_id, completed, completed_at) 
WHERE completed = true AND completed_at >= (NOW() - INTERVAL '7 days');

-- Index for quest XP rewards lookup
CREATE INDEX IF NOT EXISTS idx_quests_xp_reward 
ON quests(id, xp_reward, is_active) 
WHERE is_active = true;

-- Composite index for user quest progress with completion date
CREATE INDEX IF NOT EXISTS idx_user_quest_progress_completed_date 
ON user_quest_progress(user_id, quest_id, completed, completed_at) 
WHERE completed = true;

-- Index for user domain lookup (for leaderboard filtering)
CREATE INDEX IF NOT EXISTS idx_users_domain_active 
ON users(domain, is_active) 
WHERE is_active = true;

-- Partial index for active users only (most leaderboard queries)
CREATE INDEX IF NOT EXISTS idx_users_active_xp_desc 
ON users(xp DESC, level DESC, username) 
WHERE is_active = true;

-- Index for weekly leaderboard calculations with domain
CREATE INDEX IF NOT EXISTS idx_weekly_leaderboard_domain 
ON users(is_active, domain, id) 
WHERE is_active = true;

-- Index for counting total users by domain (pagination)
CREATE INDEX IF NOT EXISTS idx_users_count_by_domain 
ON users(domain, is_active) 
WHERE is_active = true;

-- Index for user rank calculations
CREATE INDEX IF NOT EXISTS idx_users_rank_calculation 
ON users(is_active, xp, level, username, id) 
WHERE is_active = true;

-- Analyze tables to update statistics for query planner
ANALYZE users;
ANALYZE user_quest_progress;
ANALYZE quests;