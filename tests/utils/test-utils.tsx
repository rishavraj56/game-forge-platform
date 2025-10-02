import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { SessionProvider } from 'next-auth/react'
import { User } from '@/lib/types'

export const mockUser: User = {
  id: 'test-user-1',
  username: 'TestUser',
  email: 'test@example.com',
  domain: 'Game Development',
  role: 'member',
  xp: 1250,
  level: 8,
  avatar_url: '/avatars/test-avatar.png',
  bio: 'Test user for testing purposes',
  is_active: true,
  email_verified: true,
  created_at: new Date('2024-01-01'),
  updated_at: new Date('2024-03-01'),
}

export const mockSession = {
  user: mockUser,
  expires: '2024-12-31',
}

interface AllTheProvidersProps {
  children: React.ReactNode
  session?: any
}

const AllTheProviders = ({ children, session = null }: AllTheProvidersProps) => {
  return (
    <SessionProvider session={session}>
      {children}
    </SessionProvider>
  )
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  session?: any
}

const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { session, ...renderOptions } = options
  
  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders session={session}>
        {children}
      </AllTheProviders>
    ),
    ...renderOptions,
  })
}

export * from '@testing-library/react'
export { customRender as render }

export const renderWithAuth = (ui: ReactElement, user = mockUser) => {
  return customRender(ui, { session: { user, expires: '2024-12-31' } })
}

export const renderWithoutAuth = (ui: ReactElement) => {
  return customRender(ui, { session: null })
}

export const createMockApiResponse = function<T>(data: T, success = true) {
  return {
    success,
    data,
    timestamp: new Date().toISOString(),
    ...(success ? {} : { error: { code: 'TEST_ERROR', message: 'Test error' } }),
  }
}

export const mockFetchSuccess = function<T>(data: T) {
  const mockResponse = createMockApiResponse(data)
  ;(global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => mockResponse,
  })
}

export const mockFetchError = (message = 'Test error', status = 500) => {
  ;(global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: false,
    status,
    json: async () => ({
      success: false,
      error: { code: 'TEST_ERROR', message },
      timestamp: new Date().toISOString(),
    }),
  })
}

export const waitForLoadingToFinish = () => {
  return new Promise(resolve => setTimeout(resolve, 0))
}

export const generateMockQuests = (count = 3) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `quest-${i + 1}`,
    title: `Test Quest ${i + 1}`,
    description: `Description for test quest ${i + 1}`,
    type: (i % 2 === 0 ? 'daily' : 'weekly') as 'daily' | 'weekly',
    xp_reward: 50 + i * 25,
    requirements: [
      {
        type: 'test',
        target: 3,
        description: `Complete 3 test actions`,
      },
    ],
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  }))
}

export const generateMockLeaderboard = (count = 5) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `user-${i + 1}`,
    username: `User${i + 1}`,
    avatar_url: `/avatars/user-${i + 1}.png`,
    domain: 'Game Development' as const,
    role: 'member' as const,
    xp: 2000 - i * 200,
    level: 10 - i,
    rank: i + 1,
    active_title: i === 0 ? 'Master Forger' : undefined,
    badge_count: 5 - i,
  }))
}

export const generateMockPosts = (count = 3) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `post-${i + 1}`,
    channel_id: 'channel-1',
    author_id: 'user-1',
    content: `This is test post content ${i + 1}`,
    attachments: [],
    reaction_counts: { like: i + 1, love: i },
    is_pinned: i === 0,
    is_deleted: false,
    created_at: new Date(Date.now() - i * 60000),
    updated_at: new Date(Date.now() - i * 60000),
  }))
}