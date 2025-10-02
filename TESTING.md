# Testing Documentation

## Overview

The Game Forge Platform includes comprehensive testing coverage with unit tests, integration tests, and end-to-end tests to ensure reliability and quality before deployment.

## Test Structure

```
tests/
├── e2e/                    # End-to-end tests (Playwright)
├── integration/            # Integration tests
├── mocks/                  # Mock service workers and handlers
└── utils/                  # Test utilities and helpers

src/
├── components/
│   └── **/__tests__/       # Component unit tests
├── lib/
│   └── **/__tests__/       # Library unit tests
└── contexts/
    └── **/__tests__/       # Context unit tests
```

## Testing Stack

- **Jest**: Unit and integration testing framework
- **React Testing Library**: Component testing utilities
- **MSW (Mock Service Worker)**: API mocking for tests
- **Playwright**: End-to-end testing
- **TypeScript**: Type-safe testing

## Running Tests

### All Tests
```bash
npm run test:all          # Windows (PowerShell)
npm run test:all:unix     # Unix/Linux/macOS
```

### Unit Tests
```bash
npm test                  # Run once
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage report
npm run test:ci           # CI mode (no watch, with coverage)
```

### End-to-End Tests
```bash
npm run test:e2e          # Run E2E tests
npm run test:e2e:ui       # Run with UI mode
```

### Individual Test Categories
```bash
# Component tests
npm test -- --testPathPattern=components

# API tests
npm test -- --testPathPattern=api

# Integration tests
npm test -- --testPathPattern=integration

# Specific test file
npm test -- quest-card.test.tsx
```

## Test Coverage

The project maintains high test coverage with the following targets:

- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

### Coverage Reports

After running tests with coverage:
- HTML report: `coverage/lcov-report/index.html`
- Terminal summary: Displayed after test run
- CI integration: Coverage data sent to CI/CD pipeline

## Test Categories

### 1. Unit Tests

**Location**: `src/**/__tests__/`

Test individual components, functions, and utilities in isolation.

**Examples**:
- Component rendering and props
- User interactions (clicks, form submissions)
- State management
- Utility functions
- Error handling

```typescript
// Example component test
import { render, screen, fireEvent } from '@testing-library/react'
import { QuestCard } from '../quest-card'

test('completes quest when clicked', async () => {
  const onComplete = jest.fn()
  render(<QuestCard quest={mockQuest} onComplete={onComplete} />)
  
  fireEvent.click(screen.getByRole('button'))
  
  expect(onComplete).toHaveBeenCalledWith('quest-1')
})
```

### 2. Integration Tests

**Location**: `tests/integration/`

Test how different parts of the application work together.

**Examples**:
- Context providers with components
- API routes with database
- Authentication flows
- Data fetching and state updates

```typescript
// Example integration test
test('loads gamification data on user login', async () => {
  const { result } = renderHook(() => useGamification(), { wrapper })
  
  await waitFor(() => {
    expect(result.current.dailyQuests).toHaveLength(5)
  })
})
```

### 3. End-to-End Tests

**Location**: `tests/e2e/`

Test complete user workflows in a real browser environment.

**Examples**:
- User registration and login
- Quest completion flow
- Navigation between pages
- Responsive design
- Error scenarios

```typescript
// Example E2E test
test('user can complete a quest', async ({ page }) => {
  await page.goto('/dashboard')
  await page.click('[data-testid="quest-card"]:has-text("Ready to claim!")')
  await expect(page.locator('text=Quest completed!')).toBeVisible()
})
```

## Mock Data and Services

### Mock Service Worker (MSW)

API calls are mocked using MSW for consistent and reliable testing.

**Configuration**: `tests/mocks/handlers.ts`

```typescript
export const handlers = [
  http.get('/api/gamification/quests', () => {
    return HttpResponse.json(createMockApiResponse({ quests: mockQuests }))
  }),
  // ... more handlers
]
```

### Test Utilities

**Location**: `tests/utils/test-utils.tsx`

Provides helper functions and custom render methods:

```typescript
// Custom render with providers
export const renderWithAuth = (ui: ReactElement, user = mockUser) => {
  return customRender(ui, { session: { user, expires: '2024-12-31' } })
}

// Mock data generators
export const generateMockQuests = (count = 3) => { /* ... */ }
```

### Database Testing

**Location**: `tests/utils/db-utils.ts`

Utilities for database testing with cleanup:

```typescript
export const withDatabaseCleanup = (testFn: () => Promise<void>) => {
  return async () => {
    try {
      await TestDatabase.cleanup()
      await testFn()
    } finally {
      await TestDatabase.cleanup()
    }
  }
}
```

## Testing Best Practices

### 1. Test Structure

- **Arrange**: Set up test data and mocks
- **Act**: Perform the action being tested
- **Assert**: Verify the expected outcome

### 2. Naming Conventions

```typescript
describe('ComponentName', () => {
  it('should do something when condition is met', () => {
    // Test implementation
  })
})
```

### 3. Mock Strategy

- Mock external dependencies (APIs, third-party libraries)
- Use real implementations for internal code when possible
- Keep mocks simple and focused

### 4. Async Testing

```typescript
// Wait for async operations
await waitFor(() => {
  expect(screen.getByText('Loaded data')).toBeInTheDocument()
})

// Test async functions
await expect(asyncFunction()).resolves.toBe(expectedValue)
```

### 5. Error Testing

```typescript
// Test error scenarios
it('handles API errors gracefully', async () => {
  mockApiClient.getQuests.mockRejectedValue(new Error('API Error'))
  
  render(<QuestList />)
  
  await waitFor(() => {
    expect(screen.getByText('API Error')).toBeInTheDocument()
  })
})
```

## Continuous Integration

### Pre-commit Hooks

Tests run automatically before commits to ensure code quality:

```json
{
  "scripts": {
    "pretest": "npm run lint",
    "prebuild": "npm run test:ci"
  }
}
```

### CI/CD Pipeline

1. **Lint**: Code style and quality checks
2. **Type Check**: TypeScript compilation
3. **Unit Tests**: Component and utility tests
4. **Integration Tests**: API and context tests
5. **Build**: Production build verification
6. **E2E Tests**: Full application workflows

## Debugging Tests

### Jest Debug Mode

```bash
# Debug specific test
node --inspect-brk node_modules/.bin/jest --runInBand quest-card.test.tsx

# Debug with VS Code
# Add breakpoints and use "Jest Debug" configuration
```

### Playwright Debug Mode

```bash
# Debug E2E tests
npm run test:e2e -- --debug

# Headed mode (see browser)
npm run test:e2e -- --headed
```

### Test Output

```bash
# Verbose output
npm test -- --verbose

# Watch mode with coverage
npm run test:watch -- --coverage

# Run specific test pattern
npm test -- --testNamePattern="should complete quest"
```

## Common Issues and Solutions

### 1. Async Test Timeouts

```typescript
// Increase timeout for slow operations
test('slow operation', async () => {
  // ... test code
}, 10000) // 10 second timeout
```

### 2. Mock Cleanup

```typescript
// Reset mocks between tests
afterEach(() => {
  jest.clearAllMocks()
  server.resetHandlers()
})
```

### 3. Environment Variables

```typescript
// Set test environment variables
process.env.NODE_ENV = 'test'
process.env.NEXTAUTH_SECRET = 'test-secret'
```

## Performance Testing

### Bundle Size Analysis

```bash
# Analyze bundle size
npm run build
npx @next/bundle-analyzer
```

### Load Testing

E2E tests include performance checks:

```typescript
test('page loads within acceptable time', async ({ page }) => {
  const startTime = Date.now()
  await page.goto('/dashboard')
  const loadTime = Date.now() - startTime
  
  expect(loadTime).toBeLessThan(3000) // 3 seconds
})
```

## Deployment Readiness

### Pre-deployment Checklist

- [ ] All tests passing
- [ ] Coverage targets met
- [ ] No TypeScript errors
- [ ] Build completes successfully
- [ ] E2E tests pass
- [ ] Performance benchmarks met

### Test Reports

Generated after test runs:
- Coverage report: `coverage/lcov-report/index.html`
- E2E report: `playwright-report/index.html`
- Jest results: Terminal output and CI logs

## Contributing

When adding new features:

1. Write tests first (TDD approach)
2. Ensure all existing tests pass
3. Add integration tests for new APIs
4. Update E2E tests for new user flows
5. Maintain coverage targets
6. Update test documentation

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [MSW Documentation](https://mswjs.io/docs/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)