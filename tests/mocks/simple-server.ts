// Simple mock server without MSW for testing
export const mockServer = {
  listen: jest.fn(),
  resetHandlers: jest.fn(),
  close: jest.fn(),
  use: jest.fn(),
}

// Mock fetch globally
const originalFetch = global.fetch

export const setupMockFetch = () => {
  global.fetch = jest.fn()
}

export const teardownMockFetch = () => {
  global.fetch = originalFetch
}

export const mockFetchResponse = (data: any, success = true, status = 200) => {
  const response = {
    success,
    data,
    timestamp: new Date().toISOString(),
    ...(success ? {} : { error: { code: 'TEST_ERROR', message: 'Test error' } }),
  }

  ;(global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: success,
    status,
    json: async () => response,
  })
}

export const server = mockServer