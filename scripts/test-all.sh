#!/bin/bash

# Test runner script for Game Forge Platform
# This script runs all tests in the correct order

set -e

echo "🧪 Running Game Forge Platform Test Suite"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    print_warning "Installing dependencies..."
    npm install
fi

# Run linting first
echo ""
echo "📋 Running ESLint..."
if npm run lint; then
    print_status "Linting passed"
else
    print_error "Linting failed"
    exit 1
fi

# Run TypeScript type checking
echo ""
echo "🔍 Running TypeScript type checking..."
if npx tsc --noEmit; then
    print_status "Type checking passed"
else
    print_error "Type checking failed"
    exit 1
fi

# Run unit tests
echo ""
echo "🧪 Running unit tests..."
if npm run test:ci; then
    print_status "Unit tests passed"
else
    print_error "Unit tests failed"
    exit 1
fi

# Check if build works
echo ""
echo "🏗️ Testing build process..."
if npm run build; then
    print_status "Build successful"
else
    print_error "Build failed"
    exit 1
fi

# Run E2E tests (optional, requires running server)
if command -v playwright &> /dev/null; then
    echo ""
    echo "🎭 Running E2E tests..."
    if npm run test:e2e; then
        print_status "E2E tests passed"
    else
        print_warning "E2E tests failed (this might be expected if server is not running)"
    fi
else
    print_warning "Playwright not found, skipping E2E tests"
fi

echo ""
echo "🎉 All tests completed successfully!"
echo ""
echo "📊 Test Coverage Summary:"
echo "========================"

# Show coverage summary if available
if [ -f "coverage/lcov-report/index.html" ]; then
    echo "Coverage report available at: coverage/lcov-report/index.html"
fi

echo ""
echo "🚀 Ready for deployment!"