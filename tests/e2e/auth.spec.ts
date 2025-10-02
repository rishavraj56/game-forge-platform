import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display login form', async ({ page }) => {
    await page.click('text=Login')
    
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should display registration form', async ({ page }) => {
    await page.click('text=Register')
    
    await expect(page.locator('input[name="username"]')).toBeVisible()
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('select[name="domain"]')).toBeVisible()
  })

  test('should show validation errors for empty login form', async ({ page }) => {
    await page.click('text=Login')
    await page.click('button[type="submit"]')
    
    await expect(page.locator('text=Email is required')).toBeVisible()
    await expect(page.locator('text=Password is required')).toBeVisible()
  })

  test('should show validation errors for empty registration form', async ({ page }) => {
    await page.click('text=Register')
    await page.click('button[type="submit"]')
    
    await expect(page.locator('text=Username is required')).toBeVisible()
    await expect(page.locator('text=Email is required')).toBeVisible()
    await expect(page.locator('text=Password is required')).toBeVisible()
  })

  test('should navigate between login and registration', async ({ page }) => {
    await page.click('text=Login')
    await expect(page.locator('h1:has-text("Login")')).toBeVisible()
    
    await page.click('text=Don\'t have an account? Register')
    await expect(page.locator('h1:has-text("Register")')).toBeVisible()
    
    await page.click('text=Already have an account? Login')
    await expect(page.locator('h1:has-text("Login")')).toBeVisible()
  })

  test('should display domain options in registration', async ({ page }) => {
    await page.click('text=Register')
    await page.click('select[name="domain"]')
    
    await expect(page.locator('option:has-text("Game Development")')).toBeVisible()
    await expect(page.locator('option:has-text("Game Design")')).toBeVisible()
    await expect(page.locator('option:has-text("Game Art")')).toBeVisible()
    await expect(page.locator('option:has-text("AI for Game Development")')).toBeVisible()
    await expect(page.locator('option:has-text("Creative")')).toBeVisible()
  })

  test('should handle login form submission', async ({ page }) => {
    await page.click('text=Login')
    
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    
    await page.click('button[type="submit"]')
    
    // Should show loading state
    await expect(page.locator('text=Signing in...')).toBeVisible()
  })

  test('should handle registration form submission', async ({ page }) => {
    await page.click('text=Register')
    
    await page.fill('input[name="username"]', 'testuser')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.selectOption('select[name="domain"]', 'Game Development')
    
    await page.click('button[type="submit"]')
    
    // Should show loading state
    await expect(page.locator('text=Creating account...')).toBeVisible()
  })
})

test.describe('Protected Routes', () => {
  test('should redirect to login when accessing protected route', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*\/auth\/login/)
  })

  test('should redirect to login when accessing profile', async ({ page }) => {
    await page.goto('/profile')
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*\/auth\/login/)
  })

  test('should redirect to login when accessing admin', async ({ page }) => {
    await page.goto('/admin')
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*\/auth\/login/)
  })
})