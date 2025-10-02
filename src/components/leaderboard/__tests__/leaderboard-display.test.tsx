import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LeaderboardDisplay } from '../leaderboard-display'
import { generateMockLeaderboard, mockFetchSuccess, mockFetchError } from '../../../../tests/utils/test-utils'

// Mock the API client
jest.mock('@/lib/api-client', () => ({
    apiClient: {
        getLeaderboard: jest.fn(),
    },
}))

import { apiClient } from '@/lib/api-client'

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>

describe('LeaderboardDisplay', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders loading state initially', () => {
        mockApiClient.getLeaderboard.mockImplementation(() => new Promise(() => { })) // Never resolves

        render(<LeaderboardDisplay />)

        expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument()
    })

    it('renders leaderboard data when loaded', async () => {
        const mockLeaderboard = generateMockLeaderboard(3)
        mockApiClient.getLeaderboard.mockResolvedValue({
            success: true,
            data: {
                leaderboard: mockLeaderboard,
                pagination: {
                    limit: 10,
                    offset: 0,
                    total: 3,
                    hasNext: false,
                    hasPrev: false,
                },
                type: 'all-time',
            },
            timestamp: new Date().toISOString(),
        })

        render(<LeaderboardDisplay />)

        await waitFor(() => {
            expect(screen.getByText('User1')).toBeInTheDocument()
            expect(screen.getByText('User2')).toBeInTheDocument()
            expect(screen.getByText('User3')).toBeInTheDocument()
        })

        // Check rank icons
        expect(screen.getByText('🥇')).toBeInTheDocument()
        expect(screen.getByText('🥈')).toBeInTheDocument()
        expect(screen.getByText('🥉')).toBeInTheDocument()
    })

    it('shows error state when API fails', async () => {
        mockApiClient.getLeaderboard.mockResolvedValue({
            success: false,
            error: { code: 'API_ERROR', message: 'Failed to load leaderboard' },
            timestamp: new Date().toISOString(),
        })

        render(<LeaderboardDisplay />)

        await waitFor(() => {
            expect(screen.getByText('Failed to load leaderboard')).toBeInTheDocument()
            expect(screen.getByText('Retry')).toBeInTheDocument()
        })
    })

    it('shows empty state when no data', async () => {
        mockApiClient.getLeaderboard.mockResolvedValue({
            success: true,
            data: {
                leaderboard: [],
                pagination: {
                    limit: 10,
                    offset: 0,
                    total: 0,
                    hasNext: false,
                    hasPrev: false,
                },
                type: 'all-time',
            },
            timestamp: new Date().toISOString(),
        })

        render(<LeaderboardDisplay />)

        await waitFor(() => {
            expect(screen.getByText('No leaderboard data available')).toBeInTheDocument()
        })
    })

    it('toggles between weekly and all-time', async () => {
        const mockLeaderboard = generateMockLeaderboard(2)
        mockApiClient.getLeaderboard.mockResolvedValue({
            success: true,
            data: {
                leaderboard: mockLeaderboard,
                pagination: {
                    limit: 10,
                    offset: 0,
                    total: 2,
                    hasNext: false,
                    hasPrev: false,
                },
                type: 'all-time',
            },
            timestamp: new Date().toISOString(),
        })

        render(<LeaderboardDisplay />)

        await waitFor(() => {
            expect(screen.getByText('User1')).toBeInTheDocument()
        })

        // Click weekly button
        fireEvent.click(screen.getByText('Weekly'))

        await waitFor(() => {
            expect(mockApiClient.getLeaderboard).toHaveBeenCalledWith({
                type: 'weekly',
                limit: 10,
            })
        })
    })

    it('shows custom title when provided', () => {
        mockApiClient.getLeaderboard.mockImplementation(() => new Promise(() => { }))

        render(<LeaderboardDisplay title="Custom Leaderboard" />)

        expect(screen.getByText('Custom Leaderboard')).toBeInTheDocument()
    })

    it('hides toggle when showToggle is false', () => {
        mockApiClient.getLeaderboard.mockImplementation(() => new Promise(() => { }))

        render(<LeaderboardDisplay showToggle={false} />)

        expect(screen.queryByText('Weekly')).not.toBeInTheDocument()
        expect(screen.queryByText('All-Time')).not.toBeInTheDocument()
    })

    it('limits entries when maxEntries is set', async () => {
        const mockLeaderboard = generateMockLeaderboard(5)
        mockApiClient.getLeaderboard.mockResolvedValue({
            success: true,
            data: {
                leaderboard: mockLeaderboard,
                pagination: {
                    limit: 3,
                    offset: 0,
                    total: 5,
                    hasNext: true,
                    hasPrev: false,
                },
                type: 'all-time',
            },
            timestamp: new Date().toISOString(),
        })

        render(<LeaderboardDisplay maxEntries={3} />)

        await waitFor(() => {
            expect(mockApiClient.getLeaderboard).toHaveBeenCalledWith({
                type: 'all-time',
                limit: 3,
            })
        })
    })

    it('shows domain lead indicator', async () => {
        const mockLeaderboard = [
            {
                id: 'user-1',
                username: 'DomainLead',
                avatar_url: '/avatar.png',
                domain: 'Game Development' as const,
                role: 'domain_lead' as const,
                xp: 2000,
                level: 10,
                rank: 1,
                badge_count: 5,
            },
        ]

        mockApiClient.getLeaderboard.mockResolvedValue({
            success: true,
            data: {
                leaderboard: mockLeaderboard,
                pagination: {
                    limit: 10,
                    offset: 0,
                    total: 1,
                    hasNext: false,
                    hasPrev: false,
                },
                type: 'all-time',
            },
            timestamp: new Date().toISOString(),
        })

        render(<LeaderboardDisplay />)

        await waitFor(() => {
            expect(screen.getByText('L')).toBeInTheDocument() // Domain lead indicator
        })
    })

    it('shows active title when available', async () => {
        const mockLeaderboard = [
            {
                id: 'user-1',
                username: 'TitledUser',
                avatar_url: '/avatar.png',
                domain: 'Game Development' as const,
                role: 'member' as const,
                xp: 2000,
                level: 10,
                rank: 1,
                active_title: 'Master Forger',
                badge_count: 5,
            },
        ]

        mockApiClient.getLeaderboard.mockResolvedValue({
            success: true,
            data: {
                leaderboard: mockLeaderboard,
                pagination: {
                    limit: 10,
                    offset: 0,
                    total: 1,
                    hasNext: false,
                    hasPrev: false,
                },
                type: 'all-time',
            },
            timestamp: new Date().toISOString(),
        })

        render(<LeaderboardDisplay />)

        await waitFor(() => {
            expect(screen.getByText('Master Forger')).toBeInTheDocument()
        })
    })

    it('retries on error', async () => {
        mockApiClient.getLeaderboard
            .mockResolvedValueOnce({
                success: false,
                error: { code: 'API_ERROR', message: 'Network error' },
                timestamp: new Date().toISOString(),
            })
            .mockResolvedValueOnce({
                success: true,
                data: {
                    leaderboard: generateMockLeaderboard(1),
                    pagination: {
                        limit: 10,
                        offset: 0,
                        total: 1,
                        hasNext: false,
                        hasPrev: false,
                    },
                    type: 'all-time',
                },
                timestamp: new Date().toISOString(),
            })

        render(<LeaderboardDisplay />)

        await waitFor(() => {
            expect(screen.getByText('Network error')).toBeInTheDocument()
        })

        fireEvent.click(screen.getByText('Retry'))

        await waitFor(() => {
            expect(screen.getByText('User1')).toBeInTheDocument()
        })

        expect(mockApiClient.getLeaderboard).toHaveBeenCalledTimes(2)
    })
})