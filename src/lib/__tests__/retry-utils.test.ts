import { 
  withRetry, 
  isRetryableError, 
  RetryError, 
  CircuitBreaker, 
  RateLimiter,
  calculateBackoffDelay,
  calculateJitteredBackoffDelay
} from '../retry-utils'

describe('withRetry', () => {
  it('succeeds on first attempt', async () => {
    const fn = jest.fn().mockResolvedValue('success')
    
    const result = await withRetry(fn)
    
    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('retries on failure and eventually succeeds', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValue('success')
    
    const result = await withRetry(fn, { maxRetries: 3, baseDelay: 10 })
    
    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('throws RetryError after max retries', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('Persistent error'))
    
    await expect(
      withRetry(fn, { maxRetries: 2, baseDelay: 10 })
    ).rejects.toThrow(RetryError)
    
    expect(fn).toHaveBeenCalledTimes(3) // Initial + 2 retries
  })

  it('does not retry non-retryable errors', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('Non-retryable error'))
    
    await expect(
      withRetry(fn, { 
        maxRetries: 3, 
        baseDelay: 10,
        retryCondition: () => false 
      })
    ).rejects.toThrow('Non-retryable error')
    
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('respects custom retry condition', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('Custom error'))
    
    await expect(
      withRetry(fn, { 
        maxRetries: 2, 
        baseDelay: 10,
        retryCondition: (error) => error.message === 'Custom error'
      })
    ).rejects.toThrow(RetryError)
    
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('waits between retries', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValue('success')
    
    const startTime = Date.now()
    await withRetry(fn, { maxRetries: 1, baseDelay: 50 })
    const endTime = Date.now()
    
    expect(endTime - startTime).toBeGreaterThanOrEqual(40) // Allow some variance
  })
})

describe('isRetryableError', () => {
  it('identifies network errors as retryable', () => {
    const networkError = new TypeError('fetch failed')
    expect(isRetryableError(networkError)).toBe(true)
  })

  it('identifies timeout errors as retryable', () => {
    const timeoutError = new Error('Request timeout')
    expect(isRetryableError(timeoutError)).toBe(true)
  })

  it('identifies retryable HTTP status codes', () => {
    const serverError = { status: 500 }
    expect(isRetryableError(serverError)).toBe(true)
    
    const badGateway = { status: 502 }
    expect(isRetryableError(badGateway)).toBe(true)
    
    const serviceUnavailable = { status: 503 }
    expect(isRetryableError(serviceUnavailable)).toBe(true)
  })

  it('identifies non-retryable errors', () => {
    const clientError = { status: 400 }
    expect(isRetryableError(clientError)).toBe(false)
    
    const notFound = { status: 404 }
    expect(isRetryableError(notFound)).toBe(false)
    
    const genericError = new Error('Generic error')
    expect(isRetryableError(genericError)).toBe(false)
  })
})

describe('calculateBackoffDelay', () => {
  it('calculates exponential backoff correctly', () => {
    expect(calculateBackoffDelay(0, 1000)).toBe(1000)
    expect(calculateBackoffDelay(1, 1000)).toBe(2000)
    expect(calculateBackoffDelay(2, 1000)).toBe(4000)
    expect(calculateBackoffDelay(3, 1000)).toBe(8000)
  })

  it('respects max delay', () => {
    expect(calculateBackoffDelay(10, 1000, 5000)).toBe(5000)
  })

  it('uses custom backoff factor', () => {
    expect(calculateBackoffDelay(2, 1000, 10000, 3)).toBe(9000)
  })
})

describe('calculateJitteredBackoffDelay', () => {
  it('adds jitter to backoff delay', () => {
    const delay1 = calculateJitteredBackoffDelay(1, 1000)
    const delay2 = calculateJitteredBackoffDelay(1, 1000)
    
    // With jitter, delays should be different
    expect(delay1).not.toBe(delay2)
    
    // But both should be around 2000ms (base delay for attempt 1)
    expect(delay1).toBeGreaterThan(1800)
    expect(delay1).toBeLessThan(2200)
    expect(delay2).toBeGreaterThan(1800)
    expect(delay2).toBeLessThan(2200)
  })
})

describe('CircuitBreaker', () => {
  it('allows requests when circuit is closed', async () => {
    const circuitBreaker = new CircuitBreaker(3, 1000)
    const fn = jest.fn().mockResolvedValue('success')
    
    const result = await circuitBreaker.execute(fn)
    
    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('opens circuit after failure threshold', async () => {
    const circuitBreaker = new CircuitBreaker(2, 1000)
    const fn = jest.fn().mockRejectedValue(new Error('Service error'))
    
    // First two failures
    await expect(circuitBreaker.execute(fn)).rejects.toThrow('Service error')
    await expect(circuitBreaker.execute(fn)).rejects.toThrow('Service error')
    
    // Circuit should now be open
    await expect(circuitBreaker.execute(fn)).rejects.toThrow('Circuit breaker is open')
    
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('transitions to half-open after recovery timeout', async () => {
    const circuitBreaker = new CircuitBreaker(1, 50) // Short timeout for testing
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error('Service error'))
      .mockResolvedValue('success')
    
    // Trigger circuit open
    await expect(circuitBreaker.execute(fn)).rejects.toThrow('Service error')
    
    // Should be open immediately
    await expect(circuitBreaker.execute(fn)).rejects.toThrow('Circuit breaker is open')
    
    // Wait for recovery timeout
    await new Promise(resolve => setTimeout(resolve, 60))
    
    // Should now allow requests (half-open)
    const result = await circuitBreaker.execute(fn)
    expect(result).toBe('success')
  })

  it('resets failure count on success', async () => {
    const circuitBreaker = new CircuitBreaker(2, 1000)
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error('Service error'))
      .mockResolvedValue('success')
    
    // One failure
    await expect(circuitBreaker.execute(fn)).rejects.toThrow('Service error')
    
    // Success should reset count
    await expect(circuitBreaker.execute(fn)).resolves.toBe('success')
    
    // Should still be closed
    expect(circuitBreaker.getState().state).toBe('closed')
    expect(circuitBreaker.getState().failures).toBe(0)
  })
})

describe('RateLimiter', () => {
  it('allows requests within rate limit', async () => {
    const rateLimiter = new RateLimiter(3, 1000)
    const fn = jest.fn().mockResolvedValue('success')
    
    // Should allow 3 requests
    await rateLimiter.execute(fn)
    await rateLimiter.execute(fn)
    await rateLimiter.execute(fn)
    
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('delays requests when rate limit exceeded', async () => {
    const rateLimiter = new RateLimiter(2, 100) // 2 requests per 100ms
    const fn = jest.fn().mockResolvedValue('success')
    
    const startTime = Date.now()
    
    // First two should be immediate
    await rateLimiter.execute(fn)
    await rateLimiter.execute(fn)
    
    // Third should be delayed
    await rateLimiter.execute(fn)
    
    const endTime = Date.now()
    
    expect(endTime - startTime).toBeGreaterThanOrEqual(90) // Allow some variance
    expect(fn).toHaveBeenCalledTimes(3)
  })
})

describe('RetryError', () => {
  it('contains retry information', () => {
    const originalError = new Error('Original error')
    const retryError = new RetryError('Failed after retries', 3, originalError)
    
    expect(retryError.message).toBe('Failed after retries')
    expect(retryError.attempts).toBe(3)
    expect(retryError.lastError).toBe(originalError)
    expect(retryError.name).toBe('RetryError')
  })
})