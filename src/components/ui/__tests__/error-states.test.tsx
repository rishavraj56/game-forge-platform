/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { 
  ErrorMessage, 
  ErrorCard, 
  NetworkError, 
  NotFoundError,
  EmptyState,
  RetryableError 
} from '../error-states'

describe('ErrorMessage', () => {
  it('renders error message', () => {
    render(<ErrorMessage message="Something went wrong" />)
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Error')).toBeInTheDocument()
  })

  it('renders custom title', () => {
    render(<ErrorMessage title="Custom Error" message="Something went wrong" />)
    expect(screen.getByText('Custom Error')).toBeInTheDocument()
  })

  it('shows retry button when onRetry provided', () => {
    const onRetry = jest.fn()
    render(<ErrorMessage message="Error" onRetry={onRetry} />)
    
    const retryButton = screen.getByText('Try Again')
    expect(retryButton).toBeInTheDocument()
    
    fireEvent.click(retryButton)
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('does not show retry button when onRetry not provided', () => {
    render(<ErrorMessage message="Error" />)
    expect(screen.queryByText('Try Again')).not.toBeInTheDocument()
  })
})

describe('ErrorCard', () => {
  it('renders error card with message', () => {
    render(<ErrorCard message="Card error message" />)
    expect(screen.getByText('Card error message')).toBeInTheDocument()
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('calls onRetry when retry button clicked', () => {
    const onRetry = jest.fn()
    render(<ErrorCard message="Error" onRetry={onRetry} />)
    
    fireEvent.click(screen.getByText('Try Again'))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})

describe('NetworkError', () => {
  it('renders network error message', () => {
    render(<NetworkError />)
    expect(screen.getByText('Connection Error')).toBeInTheDocument()
    expect(screen.getByText(/Unable to connect to the server/)).toBeInTheDocument()
  })

  it('calls onRetry when provided', () => {
    const onRetry = jest.fn()
    render(<NetworkError onRetry={onRetry} />)
    
    fireEvent.click(screen.getByText('Try Again'))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})

describe('NotFoundError', () => {
  it('renders default not found message', () => {
    render(<NotFoundError />)
    expect(screen.getByText('Page Not Found')).toBeInTheDocument()
    expect(screen.getByText(/The page you're looking for doesn't exist/)).toBeInTheDocument()
  })

  it('renders custom resource name', () => {
    render(<NotFoundError resource="user" />)
    expect(screen.getByText('User Not Found')).toBeInTheDocument()
    expect(screen.getByText(/The user you're looking for doesn't exist/)).toBeInTheDocument()
  })

  it('calls onGoBack when provided', () => {
    const onGoBack = jest.fn()
    render(<NotFoundError onGoBack={onGoBack} />)
    
    fireEvent.click(screen.getByText('Go Back'))
    expect(onGoBack).toHaveBeenCalledTimes(1)
  })
})

describe('EmptyState', () => {
  it('renders empty state with title and message', () => {
    render(<EmptyState title="No Items" message="No items found" />)
    expect(screen.getByText('No Items')).toBeInTheDocument()
    expect(screen.getByText('No items found')).toBeInTheDocument()
  })

  it('renders action button when provided', () => {
    const onClick = jest.fn()
    render(
      <EmptyState 
        title="No Items" 
        message="No items found"
        action={{ label: 'Add Item', onClick }}
      />
    )
    
    const button = screen.getByText('Add Item')
    expect(button).toBeInTheDocument()
    
    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})

describe('RetryableError', () => {
  const mockError = new Error('Test error')

  it('renders retryable error with attempt count', () => {
    const onRetry = jest.fn()
    render(
      <RetryableError 
        error={mockError} 
        onRetry={onRetry}
        maxRetries={3}
        currentRetry={1}
      />
    )
    
    expect(screen.getByText('Temporary Error')).toBeInTheDocument()
    expect(screen.getByText(/Test error \(Attempt 2\/3\)/)).toBeInTheDocument()
  })

  it('shows max retries reached message', () => {
    const onRetry = jest.fn()
    render(
      <RetryableError 
        error={mockError} 
        onRetry={onRetry}
        maxRetries={3}
        currentRetry={3}
      />
    )
    
    expect(screen.getByText('Error')).toBeInTheDocument()
    expect(screen.getByText(/Maximum retry attempts reached/)).toBeInTheDocument()
    expect(screen.queryByText('Try Again')).not.toBeInTheDocument()
  })

  it('calls onRetry when retry available', () => {
    const onRetry = jest.fn()
    render(
      <RetryableError 
        error={mockError} 
        onRetry={onRetry}
        maxRetries={3}
        currentRetry={1}
      />
    )
    
    fireEvent.click(screen.getByText('Try Again'))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})