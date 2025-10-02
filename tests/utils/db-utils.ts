import { sql } from '@vercel/postgres'
import { User, Quest, Channel } from '@/lib/types'

// Test database utilities
export class TestDatabase {
  static async cleanup() {
    try {
      // Clean up test data in reverse dependency order
      await sql`DELETE FROM user_quest_progress WHERE user_id LIKE 'test-%'`
      await sql`DELETE FROM user_badges WHERE user_id LIKE 'test-%'`
      await sql`DELETE FROM user_titles WHERE user_id LIKE 'test-%'`
      await sql`DELETE FROM post_reactions WHERE user_id LIKE 'test-%'`
      await sql`DELETE FROM comments WHERE author_id LIKE 'test-%'`
      await sql`DELETE FROM posts WHERE author_id LIKE 'test-%'`
      await sql`DELETE FROM channel_members WHERE user_id LIKE 'test-%'`
      await sql`DELETE FROM event_registrations WHERE user_id LIKE 'test-%'`
      await sql`DELETE FROM user_module_progress WHERE user_id LIKE 'test-%'`
      await sql`DELETE FROM notifications WHERE user_id LIKE 'test-%'`
      await sql`DELETE FROM activities WHERE user_id LIKE 'test-%'`
      await sql`DELETE FROM users WHERE id LIKE 'test-%'`
      
      // Clean up test quests, channels, etc.
      await sql`DELETE FROM quests WHERE id LIKE 'test-%'`
      await sql`DELETE FROM channels WHERE id LIKE 'test-%'`
      await sql`DELETE FROM learning_modules WHERE id LIKE 'test-%'`
      await sql`DELETE FROM events WHERE id LIKE 'test-%'`
      await sql`DELETE FROM badges WHERE id LIKE 'test-%'`
      await sql`DELETE FROM titles WHERE id LIKE 'test-%'`
    } catch (error) {
      console.error('Database cleanup error:', error)
    }
  }

  static async createTestUser(userData: Partial<User> = {}): Promise<User> {
    const defaultUser = {
      id: `test-user-${Date.now()}`,
      username: 'TestUser',
      email: 'test@example.com',
      password_hash: 'hashed-password',
      domain: 'Game Development',
      role: 'member',
      xp: 0,
      level: 1,
      is_active: true,
      email_verified: false,
      ...userData,
    }

    const result = await sql`
      INSERT INTO users (
        id, username, email, password_hash, domain, role, xp, level, 
        is_active, email_verified, created_at, updated_at
      )
      VALUES (
        ${defaultUser.id}, ${defaultUser.username}, ${defaultUser.email}, 
        ${defaultUser.password_hash}, ${defaultUser.domain}, ${defaultUser.role}, 
        ${defaultUser.xp}, ${defaultUser.level}, ${defaultUser.is_active}, 
        ${defaultUser.email_verified}, NOW(), NOW()
      )
      RETURNING *
    `

    return result.rows[0] as User
  }

  static async createTestQuest(questData: Partial<Quest> = {}): Promise<Quest> {
    const defaultQuest = {
      id: `test-quest-${Date.now()}`,
      title: 'Test Quest',
      description: 'A test quest for testing',
      type: 'daily',
      xp_reward: 50,
      requirements: [
        { type: 'test', target: 3, description: 'Complete 3 test actions' }
      ],
      is_active: true,
      ...questData,
    }

    // Convert requirements to JSON string if it's an array
    const requirementsJson = Array.isArray(defaultQuest.requirements) 
      ? JSON.stringify(defaultQuest.requirements)
      : defaultQuest.requirements

    const result = await sql`
      INSERT INTO quests (
        id, title, description, type, xp_reward, domain, requirements, 
        is_active, created_at, updated_at
      )
      VALUES (
        ${defaultQuest.id}, ${defaultQuest.title}, ${defaultQuest.description},
        ${defaultQuest.type}, ${defaultQuest.xp_reward}, ${defaultQuest.domain || null},
        ${requirementsJson}, ${defaultQuest.is_active}, NOW(), NOW()
      )
      RETURNING *
    `

    return result.rows[0] as Quest
  }

  static async createTestChannel(channelData: Partial<Channel> = {}): Promise<Channel> {
    const defaultChannel = {
      id: `test-channel-${Date.now()}`,
      name: 'Test Channel',
      domain: 'Game Development',
      type: 'primary',
      description: 'A test channel for testing',
      member_count: 0,
      is_active: true,
      ...channelData,
    }

    const result = await sql`
      INSERT INTO channels (
        id, name, domain, type, parent_id, lead_id, description, 
        member_count, is_active, created_at, updated_at
      )
      VALUES (
        ${defaultChannel.id}, ${defaultChannel.name}, ${defaultChannel.domain},
        ${defaultChannel.type}, ${defaultChannel.parent_id || null}, 
        ${defaultChannel.lead_id || null}, ${defaultChannel.description},
        ${defaultChannel.member_count}, ${defaultChannel.is_active}, NOW(), NOW()
      )
      RETURNING *
    `

    return result.rows[0] as Channel
  }

  static async getUserById(id: string): Promise<User | null> {
    const result = await sql`SELECT * FROM users WHERE id = ${id}`
    return result.rows[0] as User || null
  }

  static async getQuestById(id: string): Promise<Quest | null> {
    const result = await sql`SELECT * FROM quests WHERE id = ${id}`
    return result.rows[0] as Quest || null
  }

  static async getUserQuestProgress(userId: string, questId: string) {
    const result = await sql`
      SELECT * FROM user_quest_progress 
      WHERE user_id = ${userId} AND quest_id = ${questId}
    `
    return result.rows[0] || null
  }

  static async completeQuestForUser(userId: string, questId: string) {
    await sql`
      INSERT INTO user_quest_progress (user_id, quest_id, completed, progress, completed_at, created_at, updated_at)
      VALUES (${userId}, ${questId}, true, 100, NOW(), NOW(), NOW())
      ON CONFLICT (user_id, quest_id) 
      DO UPDATE SET completed = true, progress = 100, completed_at = NOW(), updated_at = NOW()
    `
  }

  static async seedTestData() {
    // Create test users
    const testUser = await this.createTestUser({
      id: 'test-user-seed',
      username: 'SeedUser',
      email: 'seed@example.com',
      xp: 1000,
      level: 5,
    })

    // Create test quests
    const testQuest = await this.createTestQuest({
      id: 'test-quest-seed',
      title: 'Seed Quest',
      description: 'A seeded quest for testing',
    })

    // Create test channel
    const testChannel = await this.createTestChannel({
      id: 'test-channel-seed',
      name: 'Seed Channel',
      description: 'A seeded channel for testing',
    })

    return { testUser, testQuest, testChannel }
  }
}

// Helper to run tests with database cleanup
export const withDatabaseCleanup = (testFn: () => Promise<void> | void) => {
  return async () => {
    try {
      await TestDatabase.cleanup()
      await testFn()
    } finally {
      await TestDatabase.cleanup()
    }
  }
}