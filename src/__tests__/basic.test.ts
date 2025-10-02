/**
 * Basic test to verify Jest setup is working
 */

describe('Basic Test Suite', () => {
  it('should pass a basic test', () => {
    expect(1 + 1).toBe(2)
  })

  it('should handle async operations', async () => {
    const result = await Promise.resolve('test')
    expect(result).toBe('test')
  })

  it('should work with mock functions', () => {
    const mockFn = jest.fn()
    mockFn('test')
    expect(mockFn).toHaveBeenCalledWith('test')
  })
})

describe('Environment Setup', () => {
  it('should have access to process.env', () => {
    expect(process.env.NODE_ENV).toBeDefined()
  })

  it('should have Jest globals available', () => {
    expect(typeof describe).toBe('function')
    expect(typeof it).toBe('function')
    expect(typeof expect).toBe('function')
    expect(typeof jest).toBe('object')
  })
})