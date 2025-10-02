/**
 * Retry utilities for handling failed API requests
 */

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryCondition?: (error: any) => boolean;
}

export class RetryError extends Error {
  constructor(
    message: string,
    public readonly attempts: number,
    public readonly lastError: Error
  ) {
    super(message);
    this.name = 'RetryError';
  }
}

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    retryCondition = (error) => isRetryableError(error)
  } = options;

  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry on the last attempt or if error is not retryable
      if (attempt === maxRetries || !retryCondition(lastError)) {
        break;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        baseDelay * Math.pow(backoffFactor, attempt),
        maxDelay
      );
      
      console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, lastError.message);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new RetryError(
    `Failed after ${maxRetries + 1} attempts: ${lastError!.message}`,
    maxRetries + 1,
    lastError!
  );
}

/**
 * Determine if an error is retryable
 */
export function isRetryableError(error: any): boolean {
  // Network errors
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return true;
  }
  
  // Timeout errors
  if (error.name === 'AbortError' || error.message.includes('timeout')) {
    return true;
  }
  
  // HTTP status codes that are retryable
  if (error.status) {
    const retryableStatuses = [408, 429, 500, 502, 503, 504];
    return retryableStatuses.includes(error.status);
  }
  
  return false;
}

/**
 * Create a retry wrapper for API functions
 */
export function createRetryWrapper(defaultOptions: RetryOptions = {}) {
  return function retryWrapper<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    options?: RetryOptions
  ) {
    return (...args: T): Promise<R> => {
      return withRetry(() => fn(...args), { ...defaultOptions, ...options });
    };
  };
}

/**
 * Exponential backoff delay calculation
 */
export function calculateBackoffDelay(
  attempt: number,
  baseDelay: number = 1000,
  maxDelay: number = 10000,
  backoffFactor: number = 2
): number {
  return Math.min(
    baseDelay * Math.pow(backoffFactor, attempt),
    maxDelay
  );
}

/**
 * Jittered exponential backoff (adds randomness to prevent thundering herd)
 */
export function calculateJitteredBackoffDelay(
  attempt: number,
  baseDelay: number = 1000,
  maxDelay: number = 10000,
  backoffFactor: number = 2,
  jitterFactor: number = 0.1
): number {
  const delay = calculateBackoffDelay(attempt, baseDelay, maxDelay, backoffFactor);
  const jitter = delay * jitterFactor * Math.random();
  return Math.floor(delay + jitter);
}

/**
 * Circuit breaker pattern for preventing cascading failures
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private readonly failureThreshold: number = 5,
    private readonly recoveryTimeout: number = 60000
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'open';
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
    };
  }
}

/**
 * Rate limiter to prevent too many requests
 */
export class RateLimiter {
  private requests: number[] = [];

  constructor(
    private readonly maxRequests: number,
    private readonly windowMs: number
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const now = Date.now();
    
    // Remove old requests outside the window
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.windowMs - (now - oldestRequest);
      
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    this.requests.push(now);
    return fn();
  }
}