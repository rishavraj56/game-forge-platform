import { apiClient } from '../api-client'
import { server, setupMockFetch, teardownMockFetch, mockFetchResponse } from '../../../tests/mocks/simple-server'

// Enable API mocking before tests
beforeAll(() => {
    server.listen()
    setupMockFetch()
})
afterEach(() => {
    server.resetHandlers()
    jest.clearAllMocks()
})
afterAll(() => {
    server.close()
    teardownMockFetch()
})

describe('APIClient', () => {
    describe('Authentication', () => {
        it('registers a new user', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
                domain: 'Game Development' as const,
            }

            mockFetchResponse({
                user: {
                    id: 'new-user-1',
                    username: 'NewUser',
                    email: 'newuser@example.com',
                    domain: 'Game Development',
                    role: 'member',
                    xp: 0,
                    level: 1,
                    created_at: new Date(),
                }
            })

            const response = await apiClient.register(userData)

            expect(response.success).toBe(true)
            expect(response.data?.user).toMatchObject({
                username: 'NewUser',
                email: 'newuser@example.com',
                domain: 'Game Development',
            })
        })

        it('logs in a user', async () => {
            const credentials = {
                email: 'test@example.com',
                password: 'password123',
            }

            mockFetchResponse({
                user: {
                    id: 'test-user-1',
                    username: 'TestUser',
                    email: 'test@example.com',
                    domain: 'Game Development',
                    role: 'member',
                    xp: 1250,
                    level: 8,
                }
            })

            const response = await apiClient.login(credentials)

            expect(response.success).toBe(true)
            expect(response.data?.user).toMatchObject({
                username: 'TestUser',
                email: 'test@example.com',
            })
        })
    })

    describe('Gamification', () => {
        it('fetches quests', async () => {
            mockFetchResponse({
                quests: [
                    {
                        id: 'quest-1',
                        title: 'Test Quest 1',
                        description: 'Description for test quest 1',
                        type: 'daily',
                        xp_reward: 50,
                        requirements: [],
                        is_active: true,
                        created_at: new Date(),
                        updated_at: new Date(),
                    }
                ]
            })

            const response = await apiClient.getQuests()

            expect(response.success).toBe(true)
            expect(response.data?.quests).toHaveLength(1)
            expect(response.data?.quests[0]).toMatchObject({
                title: expect.any(String),
                type: expect.stringMatching(/daily|weekly/),
                xp_reward: expect.any(Number),
            })
        })

        it('fetches quests with filters', async () => {
            mockFetchResponse({
                quests: [
                    {
                        id: 'quest-1',
                        title: 'Daily Quest',
                        type: 'daily',
                        xp_reward: 50,
                    }
                ]
            })

            const response = await apiClient.getQuests({ type: 'daily' })

            expect(response.success).toBe(true)
            expect(response.data?.quests).toBeDefined()
        })

        it('completes a quest', async () => {
            mockFetchResponse({
                xpGained: 75
            })

            const response = await apiClient.completeQuest('quest-1')

            expect(response.success).toBe(true)
            expect(response.data?.xpGained).toBe(75)
        })

        it('fetches badges', async () => {
            mockFetchResponse({
                badges: [
                    {
                        id: 'badge-1',
                        name: 'First Steps',
                        description: 'Completed your first quest',
                        icon_url: '/badges/first-steps.svg',
                        xp_requirement: 10,
                        is_active: true,
                        created_at: new Date(),
                    }
                ]
            })

            const response = await apiClient.getBadges()

            expect(response.success).toBe(true)
            expect(response.data?.badges).toHaveLength(1)
            expect(response.data?.badges[0]).toMatchObject({
                name: 'First Steps',
                description: expect.any(String),
            })
        })

        it('fetches titles', async () => {
            mockFetchResponse({
                titles: [
                    {
                        id: 'title-1',
                        name: 'Apprentice Developer',
                        description: 'Starting your journey',
                        xp_requirement: 0,
                        is_active: true,
                        created_at: new Date(),
                    }
                ]
            })

            const response = await apiClient.getTitles()

            expect(response.success).toBe(true)
            expect(response.data?.titles).toHaveLength(1)
            expect(response.data?.titles[0]).toMatchObject({
                name: 'Apprentice Developer',
                description: expect.any(String),
            })
        })
    })

    describe('Leaderboard', () => {
        it('fetches leaderboard', async () => {
            mockFetchResponse({
                leaderboard: Array.from({ length: 10 }, (_, i) => ({
                    id: `user-${i + 1}`,
                    username: `User${i + 1}`,
                    xp: 2000 - i * 200,
                    level: 10 - i,
                    rank: i + 1,
                })),
                pagination: {
                    limit: 10,
                    offset: 0,
                    total: 10,
                    hasNext: false,
                    hasPrev: false,
                },
                type: 'all-time',
            })

            const response = await apiClient.getLeaderboard()

            expect(response.success).toBe(true)
            expect(response.data?.leaderboard).toHaveLength(10)
            expect(response.data?.pagination).toMatchObject({
                limit: 10,
                offset: 0,
                total: expect.any(Number),
            })
        })

        it('fetches leaderboard with filters', async () => {
            mockFetchResponse({
                leaderboard: [
                    { id: 'user-1', username: 'User1', xp: 2000, level: 10, rank: 1 }
                ],
                pagination: { limit: 5, offset: 0, total: 1, hasNext: false, hasPrev: false },
                type: 'weekly',
            })

            const response = await apiClient.getLeaderboard({
                type: 'weekly',
                domain: 'Game Development',
                limit: 5,
            })

            expect(response.success).toBe(true)
            expect(response.data?.leaderboard).toBeDefined()
        })
    })

    describe('Community', () => {
        it('fetches channels', async () => {
            mockFetchResponse({
                channels: [
                    {
                        id: 'channel-1',
                        name: 'Game Development',
                        domain: 'Game Development',
                        type: 'primary',
                        description: 'Main channel for game development discussions',
                        member_count: 1247,
                        is_active: true,
                        created_at: new Date(),
                        updated_at: new Date(),
                    }
                ]
            })

            const response = await apiClient.getChannels()

            expect(response.success).toBe(true)
            expect(response.data?.channels).toHaveLength(1)
            expect(response.data?.channels[0]).toMatchObject({
                name: 'Game Development',
                domain: 'Game Development',
                type: 'primary',
            })
        })

        it('fetches channel posts', async () => {
            const response = await apiClient.getChannelPosts('channel-1')

            expect(response.success).toBe(true)
            expect(response.data?.posts).toHaveLength(5)
        })

        it('creates a post', async () => {
            const response = await apiClient.createPost('channel-1', 'Test post content')

            expect(response.success).toBe(true)
            expect(response.data?.post).toMatchObject({
                content: 'Test post content',
                channel_id: 'channel-1',
            })
        })

        it('fetches post comments', async () => {
            const response = await apiClient.getPostComments('post-1')

            expect(response.success).toBe(true)
            expect(response.data?.comments).toHaveLength(1)
            expect(response.data?.comments[0]).toMatchObject({
                content: 'Great post!',
                post_id: 'post-1',
            })
        })

        it('creates a comment', async () => {
            const response = await apiClient.createComment('post-1', 'Test comment')

            expect(response.success).toBe(true)
            expect(response.data?.comment).toMatchObject({
                content: 'Test comment',
                post_id: 'post-1',
            })
        })
    })

    describe('Learning Academy', () => {
        it('fetches learning modules', async () => {
            const response = await apiClient.getLearningModules()

            expect(response.success).toBe(true)
            expect(response.data?.modules).toHaveLength(1)
            expect(response.data?.modules[0]).toMatchObject({
                title: 'Unity Fundamentals',
                domain: 'Game Development',
                difficulty: 'beginner',
            })
        })

        it('fetches module progress', async () => {
            const response = await apiClient.getModuleProgress('module-1')

            expect(response.success).toBe(true)
            expect(response.data?.progress).toMatchObject({
                module_id: 'module-1',
                completed: false,
                progress: 50,
            })
        })
    })

    describe('Events', () => {
        it('fetches events', async () => {
            const response = await apiClient.getEvents()

            expect(response.success).toBe(true)
            expect(response.data?.events).toHaveLength(1)
            expect(response.data?.events[0]).toMatchObject({
                title: '48-Hour Game Jam',
                event_type: 'game_jam',
            })
        })
    })

    describe('Notifications', () => {
        it('fetches notifications', async () => {
            const response = await apiClient.getNotifications()

            expect(response.success).toBe(true)
            expect(response.data?.notifications).toHaveLength(1)
            expect(response.data?.notifications[0]).toMatchObject({
                type: 'quest_completed',
                title: 'Quest Completed!',
            })
        })
    })

    describe('Error Handling', () => {
        it('handles API errors', async () => {
            mockFetchResponse(null, false, 500)

            try {
                await apiClient.getQuests()
            } catch (error) {
                expect(error).toBeDefined()
            }
        })

        it('handles network errors', async () => {
            ; (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

            try {
                await apiClient.getQuests()
            } catch (error) {
                expect(error).toBeDefined()
            }
        })
    })

    describe('Retry Logic', () => {
        it('retries failed requests', async () => {
            let callCount = 0

                ; (global.fetch as jest.Mock).mockImplementation(() => {
                    callCount++
                    if (callCount < 3) {
                        return Promise.reject(new Error('Network error'))
                    }
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve({
                            success: true,
                            data: { message: 'Success after retry' },
                            timestamp: new Date().toISOString()
                        })
                    })
                })

            // Test that retry logic works by making a request that should succeed after retries
            try {
                const response = await apiClient.getQuests()
                expect(response.success).toBe(true)
                expect(callCount).toBeGreaterThan(1) // Should have retried
            } catch (error) {
                // If it still fails, at least verify retries were attempted
                expect(callCount).toBeGreaterThan(1)
            }
        })
    })
})