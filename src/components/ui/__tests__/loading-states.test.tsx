/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { 
  LoadingSpinner, 
  LoadingSkeleton, 
  LoadingCard, 
  LoadingList,
  LoadingOverlay,
  LoadingButton 
} from '../loading-states'

describe('LoadingSpinner', () => {
  it('renders with default size', () => {
    render(<LoadingSpinner />)
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveClass('h-8', 'w-8')
  })

  it('renders with custom size', () => {
    render(<LoadingSpinner size="lg" />)
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toHaveClass('h-12', 'w-12')
  })

  it('applies custom className', () => {
    render(<LoadingSpinner className="custom-class" />)
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toHaveClass('custom-class')
  })
})

describe('LoadingSkeleton', () => {
  it('renders single line by default', () => {
    render(<LoadingSkeleton />)
    const skeletons = document.querySelectorAll('.animate-pulse .bg-gray-200')
    expect(skeletons).toHaveLength(1)
  })

  it('renders multiple lines', () => {
    render(<LoadingSkeleton lines={3} />)
    const skeletons = document.querySelectorAll('.animate-pulse .bg-gray-200')
    expect(skeletons).toHaveLength(3)
  })
})

describe('LoadingCard', () => {
  it('renders loading card structure', () => {
    render(<LoadingCard />)
    const card = document.querySelector('.animate-pulse')
    expect(card).toBeInTheDocument()
  })
})

describe('LoadingList', () => {
  it('renders default number of loading cards', () => {
    render(<LoadingList />)
    const cards = document.querySelectorAll('.animate-pulse')
    expect(cards.length).toBeGreaterThanOrEqual(3)
  })

  it('renders custom number of loading cards', () => {
    render(<LoadingList count={5} />)
    const cards = document.querySelectorAll('.animate-pulse')
    expect(cards.length).toBeGreaterThanOrEqual(5)
  })
})

describe('LoadingOverlay', () => {
  it('shows children when not loading', () => {
    render(
      <LoadingOverlay isLoading={false}>
        <div>Content</div>
      </LoadingOverlay>
    )
    expect(screen.getByText('Content')).toBeInTheDocument()
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
  })

  it('shows loading overlay when loading', () => {
    render(
      <LoadingOverlay isLoading={true}>
        <div>Content</div>
      </LoadingOverlay>
    )
    expect(screen.getByText('Content')).toBeInTheDocument()
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('shows custom loading message', () => {
    render(
      <LoadingOverlay isLoading={true} message="Custom loading...">
        <div>Content</div>
      </LoadingOverlay>
    )
    expect(screen.getByText('Custom loading...')).toBeInTheDocument()
  })
})

describe('LoadingButton', () => {
  it('renders children when not loading', () => {
    render(
      <LoadingButton isLoading={false}>
        Click me
      </LoadingButton>
    )
    expect(screen.getByText('Click me')).toBeInTheDocument()
    expect(document.querySelector('.animate-spin')).not.toBeInTheDocument()
  })

  it('shows spinner when loading', () => {
    render(
      <LoadingButton isLoading={true}>
        Click me
      </LoadingButton>
    )
    expect(screen.getByText('Click me')).toBeInTheDocument()
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('is disabled when loading', () => {
    render(
      <LoadingButton isLoading={true}>
        Click me
      </LoadingButton>
    )
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('is disabled when explicitly disabled', () => {
    render(
      <LoadingButton isLoading={false} disabled={true}>
        Click me
      </LoadingButton>
    )
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })
})