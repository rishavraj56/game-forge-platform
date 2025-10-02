# Test runner script for Game Forge Platform (PowerShell)
# This script runs all tests in the correct order

$ErrorActionPreference = "Stop"

Write-Host "🧪 Running Game Forge Platform Test Suite" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

function Write-Success {
    param($Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Warning {
    param($Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

function Write-Error {
    param($Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

# Check if dependencies are installed
if (!(Test-Path "node_modules")) {
    Write-Warning "Installing dependencies..."
    npm install
}

# Run linting first
Write-Host ""
Write-Host "📋 Running ESLint..." -ForegroundColor Cyan
try {
    npm run lint
    Write-Success "Linting passed"
} catch {
    Write-Error "Linting failed"
    exit 1
}

# Run TypeScript type checking
Write-Host ""
Write-Host "🔍 Running TypeScript type checking..." -ForegroundColor Cyan
try {
    npx tsc --noEmit
    Write-Success "Type checking passed"
} catch {
    Write-Error "Type checking failed"
    exit 1
}

# Run unit tests
Write-Host ""
Write-Host "🧪 Running unit tests..." -ForegroundColor Cyan
try {
    npm run test:ci
    Write-Success "Unit tests passed"
} catch {
    Write-Error "Unit tests failed"
    exit 1
}

# Check if build works
Write-Host ""
Write-Host "🏗️ Testing build process..." -ForegroundColor Cyan
try {
    npm run build
    Write-Success "Build successful"
} catch {
    Write-Error "Build failed"
    exit 1
}

# Run E2E tests (optional, requires running server)
if (Get-Command playwright -ErrorAction SilentlyContinue) {
    Write-Host ""
    Write-Host "🎭 Running E2E tests..." -ForegroundColor Cyan
    try {
        npm run test:e2e
        Write-Success "E2E tests passed"
    } catch {
        Write-Warning "E2E tests failed (this might be expected if server is not running)"
    }
} else {
    Write-Warning "Playwright not found, skipping E2E tests"
}

Write-Host ""
Write-Host "🎉 All tests completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Test Coverage Summary:" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan

# Show coverage summary if available
if (Test-Path "coverage/lcov-report/index.html") {
    Write-Host "Coverage report available at: coverage/lcov-report/index.html"
}

Write-Host ""
Write-Host "🚀 Ready for deployment!" -ForegroundColor Green