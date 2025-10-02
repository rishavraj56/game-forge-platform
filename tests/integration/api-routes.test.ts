import { createMocks } from 'node-mocks-http'
import { NextRequest } from 'next/server'
import { TestDatabase, withDatabaseCleanup } from '../utils/db-utils'

// Mock NextAuth
jest.mock('next-auth/next', () => ({
  default: jest.fn(),
}))

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

describe('API Routes Integration', () => {
  describe('/api/auth/register', () => {
    it('should register a new user', withDatabaseCleanup(async () => {
      const { POST } = await import('@/app/api/auth/register/route')
      
      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
          domain: 'Game Development',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.user).toMatchObject({
        username: 'testuser',
        email: 'test@example.com',
        domain: 'Game Development',
      })
    }))

    it('should validate required fields', async () => {
      const { POST } = await import('@/app/api/auth/register/route')
      
      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          username: 'testuser',
          // Missing email, password, domain
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })

    it('should prevent duplicate users', withDatabaseCleanup(async () => {
      // Create a user first
      await TestDatabase.createTestUser({
        username: 'existinguser',
        email: 'existing@example.com',
      })

      const { POST } = await import('@/app/api/auth/register/route')
      
      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          username: 'existinguser',
          email: 'existing@example.com',
          password: 'password123',
          domain: 'Game Development',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('USER_EXISTS')
    }))
  })

  describe('/api/gamification/quests', () => {
    it('should fetch quests', withDatabaseCleanup(async () => {
      // Create test user and quest
      const testUser = await TestDatabase.createTestUser()
      const testQuest = await TestDatabase.createTestQuest()

      // Mock authentication
      const { getServerSession } = await import('next-auth')
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: testUser.id }
      })

      const { GET } = await import('@/app/api/gamification/quests/route')
      
      const request = new NextRequest('http://localhost:3000/api/gamification/quests')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.quests).toHaveLength(1)
      expect(data.data.quests[0]).toMatchObject({
        id: testQuest.id,
        title: testQuest.title,
        type: testQuest.type,
      })
    }))

    it('should filter quests by type', withDatabaseCleanup(async () => {
      const testUser = await TestDatabase.createTestUser()
      await TestDatabase.createTestQuest({ type: 'daily' })
      await TestDatabase.createTestQuest({ type: 'weekly' })

      const { getServerSession } = await import('next-auth')
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: testUser.id }
      })

      const { GET } = await import('@/app/api/gamification/quests/route')
      
      const request = new NextRequest('http://localhost:3000/api/gamification/quests?type=daily')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.quests.every((q: any) => q.type === 'daily')).toBe(true)
    }))

    it('should require authentication', async () => {
      const { getServerSession } = await import('next-auth')
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const { GET } = await import('@/app/api/gamification/quests/route')
      
      const request = new NextRequest('http://localhost:3000/api/gamification/quests')

      const response = await GET(request)

      expect(response.status).toBe(401)
    })
  })

  describe('/api/leaderboards', () => {
    it('should fetch leaderboard data', withDatabaseCleanup(async () => {
      // Create test users with different XP
      const user1 = await TestDatabase.createTestUser({ 
        username: 'TopPlayer', 
        xp: 2000, 
        level: 10 
      })
      const user2 = await TestDatabase.createTestUser({ 
        username: 'SecondPlace', 
        xp: 1500, 
        level: 8 
      })

      const { getServerSession } = await import('next-auth')
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: user1.id }
      })

      const { GET } = await import('@/app/api/leaderboards/route')
      
      const request = new NextRequest('http://localhost:3000/api/leaderboards')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.leaderboard).toHaveLength(2)
      expect(data.data.leaderboard[0].username).toBe('TopPlayer')
      expect(data.data.leaderboard[1].username).toBe('SecondPlace')
    }))

    it('should support pagination', withDatabaseCleanup(async () => {
      const testUser = await TestDatabase.createTestUser()

      const { getServerSession } = await import('next-auth')
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: testUser.id }
      })

      const { GET } = await import('@/app/api/leaderboards/route')
      
      const request = new NextRequest('http://localhost:3000/api/leaderboards?limit=5&offset=0')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.pagination).toMatchObject({
        limit: 5,
        offset: 0,
        total: expect.any(Number),
      })
    }))
  })

  describe('/api/community/channels', () => {
    it('should fetch channels', withDatabaseCleanup(async () => {
      const testUser = await TestDatabase.createTestUser()
      const testChannel = await TestDatabase.createTestChannel()

      const { getServerSession } = await import('next-auth')
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: testUser.id }
      })

      const { GET } = await import('@/app/api/community/channels/route')
      
      const request = new NextRequest('http://localhost:3000/api/community/channels')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.channels).toHaveLength(1)
      expect(data.data.channels[0]).toMatchObject({
        id: testChannel.id,
        name: testChannel.name,
        domain: testChannel.domain,
      })
    }))
  })

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      // Mock database error
      jest.doMock('@vercel/postgres', () => ({
        sql: jest.fn().mockRejectedValue(new Error('Database connection failed'))
      }))

      const { GET } = await import('@/app/api/health/route')

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })

    it('should handle malformed JSON requests', async () => {
      const { POST } = await import('@/app/api/auth/register/route')
      
      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: 'invalid json',
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })
  })
})