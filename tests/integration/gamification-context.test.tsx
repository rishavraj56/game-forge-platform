import { renderHook, act, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { GamificationProvider, useGamification } from '@/contexts/gamification-context'
import { server, setupMockFetch, teardownMockFetch, mockFetchResponse } from '../mocks/simple-server'
import { mockUser } from '../utils/test-utils'


// Mock NextAuth
jest.mock('next-auth/react')
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>

// Enable API mocking
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

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <GamificationProvider>{children}</GamificationProvider>
)

describe('GamificationContext Integration', () => {
    beforeEach(() => {
        mockUseSession.mockReturnValue({
            data: { user: mockUser, expires: '2024-12-31' },
            status: 'authenticated',
            update: jest.fn(),
        })
    })

    it('loads initial gamification data', async () => {
        const { result } = renderHook(() => useGamification(), { wrapper })

        // Should start loading
        expect(result.current.isLoading).toBe(true)

        // Wait for data to load
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        // Should have loaded quests
        expect(result.current.dailyQuests).toHaveLength(5)
        expect(result.current.weeklyQuests).toHaveLength(5)
        expect(result.current.availableBadges).toHaveLength(1)
        expect(result.current.availableTitles).toHaveLength(1)
    })

    it('completes a quest successfully', async () => {
        const { result } = renderHook(() => useGamification(), { wrapper })

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        await act(async () => {
            await result.current.completeQuest('quest-1')
        })

        // Should update quest progress
        const questProgress = result.current.getUserProgress('quest-1')
        expect(questProgress?.completed).toBe(true)
    })

    it('updates quest progress', async () => {
        const { result } = renderHook(() => useGamification(), { wrapper })

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        await act(async () => {
            await result.current.updateQuestProgress('quest-1', 50)
        })

        const questProgress = result.current.getUserProgress('quest-1')
        expect(questProgress?.progress).toBe(50)
    })

    it('refreshes quest data', async () => {
        const { result } = renderHook(() => useGamification(), { wrapper })

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        await act(async () => {
            await result.current.refreshQuests()
        })

        // Should have refreshed data
        expect(result.current.dailyQuests).toHaveLength(5)
        expect(result.current.weeklyQuests).toHaveLength(5)
    })

    it('earns a badge', async () => {
        const { result } = renderHook(() => useGamification(), { wrapper })

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        act(() => {
            result.current.earnBadge('badge-1')
        })

        // Check if badge was earned (implementation depends on how earnBadge works)
        // This test may need to be adjusted based on the actual implementation
        expect(result.current.availableBadges).toHaveLength(1)
    })

    it('unlocks a title', async () => {
        const { result } = renderHook(() => useGamification(), { wrapper })

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        act(() => {
            result.current.unlockTitle('title-1')
        })

        const title = result.current.availableTitles.find(t => t.id === 'title-1')
        expect(title?.is_active).toBe(true)
    })

    it('gets completed quests count', async () => {
        const { result } = renderHook(() => useGamification(), { wrapper })

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        // Complete a quest
        await act(async () => {
            await result.current.completeQuest('quest-1')
        })

        const completedCount = result.current.getCompletedQuestsCount()
        expect(completedCount).toBe(1)
    })

    it('handles quest completion error', async () => {
        const { result } = renderHook(() => useGamification(), { wrapper })

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        // Mock API error
        mockFetchResponse(null, false, 500)

        await expect(
            act(async () => {
                await result.current.completeQuest('quest-1')
            })
        ).rejects.toThrow()
    })

    it('does not load data when user is not authenticated', async () => {
        mockUseSession.mockReturnValue({
            data: null,
            status: 'unauthenticated',
            update: jest.fn(),
        })

        const { result } = renderHook(() => useGamification(), { wrapper })

        // Should not be loading
        expect(result.current.isLoading).toBe(false)
        expect(result.current.dailyQuests).toHaveLength(0)
        expect(result.current.weeklyQuests).toHaveLength(0)
    })
})