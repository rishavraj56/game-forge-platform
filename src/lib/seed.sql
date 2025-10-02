-- Game Forge Platform Seed Data
-- This file contains initial data for the Game Forge platform

-- Insert default badges
INSERT INTO badges (id, name, description, icon_url, xp_requirement, domain) VALUES
  (uuid_generate_v4(), 'First Steps', 'Complete your first quest', '/badges/first-steps.svg', 10, NULL),
  (uuid_generate_v4(), 'Community Builder', 'Make your first post in the community', '/badges/community-builder.svg', 25, NULL),
  (uuid_generate_v4(), 'Learning Enthusiast', 'Complete your first learning module', '/badges/learning-enthusiast.svg', 50, NULL),
  (uuid_generate_v4(), 'Game Dev Novice', 'Reach 100 XP in Game Development', '/badges/gamedev-novice.svg', 100, 'Game Development'),
  (uuid_generate_v4(), 'Design Thinker', 'Reach 100 XP in Game Design', '/badges/design-thinker.svg', 100, 'Game Design'),
  (uuid_generate_v4(), 'Art Creator', 'Reach 100 XP in Game Art', '/badges/art-creator.svg', 100, 'Game Art'),
  (uuid_generate_v4(), 'AI Pioneer', 'Reach 100 XP in AI for Game Development', '/badges/ai-pioneer.svg', 100, 'AI for Game Development'),
  (uuid_generate_v4(), 'Creative Mind', 'Reach 100 XP in Creative', '/badges/creative-mind.svg', 100, 'Creative'),
  (uuid_generate_v4(), 'Business Strategist', 'Reach 100 XP in Corporate', '/badges/business-strategist.svg', 100, 'Corporate'),
  (uuid_generate_v4(), 'Forge Master', 'Reach 1000 XP in any domain', '/badges/forge-master.svg', 1000, NULL)
ON CONFLICT (name) DO NOTHING;

-- Insert default titles
INSERT INTO titles (id, name, description, xp_requirement, domain) VALUES
  (uuid_generate_v4(), 'Apprentice', 'New member of The Game Forge', 0, NULL),
  (uuid_generate_v4(), 'Journeyman', 'Experienced community member', 250, NULL),
  (uuid_generate_v4(), 'Craftsman', 'Skilled contributor', 500, NULL),
  (uuid_generate_v4(), 'Master', 'Expert in their field', 1000, NULL),
  (uuid_generate_v4(), 'Grandmaster', 'Legendary community member', 2500, NULL),
  (uuid_generate_v4(), 'Code Warrior', 'Game Development specialist', 500, 'Game Development'),
  (uuid_generate_v4(), 'Design Sage', 'Game Design expert', 500, 'Game Design'),
  (uuid_generate_v4(), 'Art Virtuoso', 'Game Art master', 500, 'Game Art'),
  (uuid_generate_v4(), 'AI Architect', 'AI for Game Development expert', 500, 'AI for Game Development'),
  (uuid_generate_v4(), 'Creative Genius', 'Creative domain master', 500, 'Creative'),
  (uuid_generate_v4(), 'Business Mogul', 'Corporate domain expert', 500, 'Corporate')
ON CONFLICT (name) DO NOTHING;

-- Insert default channels for each domain
INSERT INTO channels (id, name, domain, type, description, is_active) VALUES
  (uuid_generate_v4(), 'General Discussion', 'Game Development', 'primary', 'General discussions about game development', true),
  (uuid_generate_v4(), 'Code Reviews', 'Game Development', 'sub', 'Share and review code with fellow developers', true),
  (uuid_generate_v4(), 'Tools & Resources', 'Game Development', 'sub', 'Discuss development tools and resources', true),
  
  (uuid_generate_v4(), 'Design Philosophy', 'Game Design', 'primary', 'Discuss game design principles and philosophy', true),
  (uuid_generate_v4(), 'Mechanics Workshop', 'Game Design', 'sub', 'Workshop for game mechanics and systems', true),
  (uuid_generate_v4(), 'Player Psychology', 'Game Design', 'sub', 'Understanding player behavior and motivation', true),
  
  (uuid_generate_v4(), 'Art Showcase', 'Game Art', 'primary', 'Share and discuss game art and visual design', true),
  (uuid_generate_v4(), '2D Art', 'Game Art', 'sub', 'Focus on 2D art techniques and styles', true),
  (uuid_generate_v4(), '3D Modeling', 'Game Art', 'sub', 'Discuss 3D modeling and animation', true),
  
  (uuid_generate_v4(), 'AI Innovation', 'AI for Game Development', 'primary', 'Explore AI applications in game development', true),
  (uuid_generate_v4(), 'Machine Learning', 'AI for Game Development', 'sub', 'ML techniques for games', true),
  (uuid_generate_v4(), 'Procedural Generation', 'AI for Game Development', 'sub', 'AI-driven content generation', true),
  
  (uuid_generate_v4(), 'Creative Corner', 'Creative', 'primary', 'General creative discussions and inspiration', true),
  (uuid_generate_v4(), 'Writing & Narrative', 'Creative', 'sub', 'Game writing and storytelling', true),
  (uuid_generate_v4(), 'Audio & Music', 'Creative', 'sub', 'Game audio and music composition', true),
  
  (uuid_generate_v4(), 'Business Strategy', 'Corporate', 'primary', 'Game industry business discussions', true),
  (uuid_generate_v4(), 'Marketing & PR', 'Corporate', 'sub', 'Game marketing and public relations', true),
  (uuid_generate_v4(), 'Publishing & Distribution', 'Corporate', 'sub', 'Game publishing and distribution strategies', true)
ON CONFLICT DO NOTHING;

-- Insert default daily quests
INSERT INTO quests (id, title, description, type, xp_reward, domain, requirements) VALUES
  (uuid_generate_v4(), 'Daily Check-in', 'Visit your Main Anvil dashboard', 'daily', 5, NULL, '[{"type": "visit_dashboard", "count": 1}]'),
  (uuid_generate_v4(), 'Community Engagement', 'Make a post or comment in any channel', 'daily', 10, NULL, '[{"type": "post_or_comment", "count": 1}]'),
  (uuid_generate_v4(), 'Learning Progress', 'Spend 15 minutes in The Academy', 'daily', 15, NULL, '[{"type": "academy_time", "minutes": 15}]'),
  (uuid_generate_v4(), 'Help a Fellow Forger', 'Reply to someone else''s post or comment', 'daily', 10, NULL, '[{"type": "reply_to_others", "count": 1}]'),
  (uuid_generate_v4(), 'Profile Polish', 'Update your profile or portfolio', 'daily', 8, NULL, '[{"type": "update_profile", "count": 1}]')
ON CONFLICT DO NOTHING;

-- Insert default weekly quests
INSERT INTO quests (id, title, description, type, xp_reward, domain, requirements) VALUES
  (uuid_generate_v4(), 'Weekly Warrior', 'Complete 5 daily quests this week', 'weekly', 50, NULL, '[{"type": "complete_daily_quests", "count": 5}]'),
  (uuid_generate_v4(), 'Knowledge Seeker', 'Complete a learning module', 'weekly', 75, NULL, '[{"type": "complete_module", "count": 1}]'),
  (uuid_generate_v4(), 'Community Champion', 'Make 10 posts or comments this week', 'weekly', 60, NULL, '[{"type": "posts_and_comments", "count": 10}]'),
  (uuid_generate_v4(), 'Event Participant', 'Attend a community event', 'weekly', 100, NULL, '[{"type": "attend_event", "count": 1}]'),
  (uuid_generate_v4(), 'Mentor or Mentee', 'Engage in mentorship activities', 'weekly', 80, NULL, '[{"type": "mentorship_activity", "count": 1}]')
ON CONFLICT DO NOTHING;

-- Insert sample learning modules for each domain
INSERT INTO learning_modules (id, title, description, domain, difficulty, xp_reward, content, prerequisites, estimated_duration, is_published, created_by) VALUES
  (uuid_generate_v4(), 'Introduction to Game Development', 'Learn the basics of game development and the development pipeline', 'Game Development', 'beginner', 100, '[{"type": "text", "content": "Welcome to game development!"}, {"type": "video", "url": "/videos/intro-gamedev.mp4"}, {"type": "quiz", "questions": []}]', '[]', 60, true, NULL),
  (uuid_generate_v4(), 'Game Design Fundamentals', 'Core principles of game design and player experience', 'Game Design', 'beginner', 100, '[{"type": "text", "content": "Game design is the art of creating engaging experiences"}, {"type": "interactive", "content": "Design a simple game mechanic"}]', '[]', 45, true, NULL),
  (uuid_generate_v4(), 'Digital Art Basics', 'Introduction to digital art tools and techniques for games', 'Game Art', 'beginner', 100, '[{"type": "text", "content": "Digital art is essential for modern games"}, {"type": "tutorial", "steps": []}]', '[]', 90, true, NULL),
  (uuid_generate_v4(), 'AI in Games 101', 'Understanding how AI enhances game development', 'AI for Game Development', 'beginner', 100, '[{"type": "text", "content": "AI is revolutionizing game development"}, {"type": "code_example", "language": "python"}]', '[]', 75, true, NULL),
  (uuid_generate_v4(), 'Creative Game Concepts', 'Developing unique and creative game ideas', 'Creative', 'beginner', 100, '[{"type": "text", "content": "Creativity is the heart of great games"}, {"type": "brainstorm", "prompts": []}]', '[]', 50, true, NULL),
  (uuid_generate_v4(), 'Game Industry Business', 'Understanding the business side of game development', 'Corporate', 'beginner', 100, '[{"type": "text", "content": "The game industry is a multi-billion dollar market"}, {"type": "case_study", "examples": []}]', '[]', 65, true, NULL)
ON CONFLICT DO NOTHING;

-- Insert sample mentorship programs
INSERT INTO mentorship_programs (id, name, description, domain, is_active) VALUES
  (uuid_generate_v4(), 'Code Mentorship', 'Pair experienced developers with newcomers', 'Game Development', true),
  (uuid_generate_v4(), 'Design Guidance', 'Learn game design from industry veterans', 'Game Design', true),
  (uuid_generate_v4(), 'Art Apprenticeship', 'Develop your artistic skills with professional artists', 'Game Art', true),
  (uuid_generate_v4(), 'AI Innovation Lab', 'Explore cutting-edge AI techniques with experts', 'AI for Game Development', true),
  (uuid_generate_v4(), 'Creative Collective', 'Nurture your creative vision with like-minded creators', 'Creative', true),
  (uuid_generate_v4(), 'Business Bootcamp', 'Learn the business of games from industry leaders', 'Corporate', true)
ON CONFLICT DO NOTHING;

-- Update channel member counts (this would normally be handled by triggers)
UPDATE channels SET member_count = 0 WHERE member_count IS NULL;