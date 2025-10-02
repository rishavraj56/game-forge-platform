/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { QuestCard } from '../quest-card'
import { Quest, UserQuestProgress } from '@/lib/types'

const mockQuest: Quest = {
  id: 'quest-1',
  title: 'Test Quest',
  description: 'A test quest for testing',
  type: 'daily',
  xp_reward: 50,
  requirements: [
    {
      type: 'test',
      target: 3,
      description: 'Complete 3 test actions',
    },
  ],
  is_active: true,
  created_at: new Date(),
  updated_at: new Date(),
}

const mockProgress: UserQuestProgress = {
  id: 'progress-1',
  user_id: 'user-1',
  quest_id: 'quest-1',
  completed: false,
  progress: 2,
  created_at: new Date(),
  updated_at: new Date(),
}

describe('QuestCard', () => {
  it('renders quest information', () => {
    render(<QuestCard quest={mockQuest} />)
    
    expect(screen.getByText('Test Quest')).toBeInTheDocument()
    expect(screen.getByText('A test quest for testing')).toBeInTheDocument()
    expect(screen.getByText('+50')).toBeInTheDocument()
    expect(screen.getByText('XP')).toBeInTheDocument()
  })

  it('shows progress when provided', () => {
    render(<QuestCard quest={mockQuest} progress={mockProgress} />)
    
    expect(screen.getByText('2/3')).toBeInTheDocument()
    expect(screen.getByText('Complete 3 test actions')).toBeInTheDocument()
  })

  it('shows completed state', () => {
    const completedProgress = { ...mockProgress, completed: true, progress: 3 }
    render(<QuestCard quest={mockQuest} progress={completedProgress} />)
    
    expect(screen.getByText('✓ Complete')).toBeInTheDocument()
  })

  it('shows ready to claim state', () => {
    const readyProgress = { ...mockProgress, completed: false, progress: 3 }
    render(<QuestCard quest={mockQuest} progress={readyProgress} />)
    
    expect(screen.getByText('Ready to claim!')).toBeInTheDocument()
  })

  it('calls onComplete when quest is ready and clicked', async () => {
    const onComplete = jest.fn().mockResolvedValue(undefined)
    const readyProgress = { ...mockProgress, completed: false, progress: 3 }
    
    render(<QuestCard quest={mockQuest} progress={readyProgress} onComplete={onComplete} />)
    
    const card = screen.getByRole('button')
    fireEvent.click(card)
    
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith('quest-1')
    })
  })

  it('shows loading state during completion', async () => {
    const onComplete = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    const readyProgress = { ...mockProgress, completed: false, progress: 3 }
    
    render(<QuestCard quest={mockQuest} progress={readyProgress} onComplete={onComplete} />)
    
    const card = screen.getByRole('button')
    fireEvent.click(card)
    
    expect(screen.getByText('Claiming...')).toBeInTheDocument()
    
    await waitFor(() => {
      expect(screen.queryByText('Claiming...')).not.toBeInTheDocument()
    }, { timeout: 200 })
  })

  it('shows error message when completion fails', async () => {
    const onComplete = jest.fn().mockRejectedValue(new Error('Completion failed'))
    const readyProgress = { ...mockProgress, completed: false, progress: 3 }
    
    render(<QuestCard quest={mockQuest} progress={readyProgress} onComplete={onComplete} />)
    
    const card = screen.getByRole('button')
    fireEvent.click(card)
    
    await waitFor(() => {
      expect(screen.getByText('Completion failed')).toBeInTheDocument()
    })
  })

  it('does not call onComplete when quest is not ready', () => {
    const onComplete = jest.fn()
    const notReadyProgress = { ...mockProgress, completed: false, progress: 1 }
    
    render(<QuestCard quest={mockQuest} progress={notReadyProgress} onComplete={onComplete} />)
    
    const card = screen.getByRole('button')
    fireEvent.click(card)
    
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('shows domain badge when quest has domain', () => {
    const questWithDomain = { ...mockQuest, domain: 'Game Development' as const }
    render(<QuestCard quest={questWithDomain} />)
    
    expect(screen.getByText('Game Development')).toBeInTheDocument()
  })
})