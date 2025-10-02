import { test, expect } from '@playwright/test'

test.describe('Dashboard (Main Anvil)', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      window.localStorage.setItem('next-auth.session-token', 'mock-session-token')
    })
    
    await page.goto('/dashboard')
  })

  test('should display dashboard layout', async ({ page }) => {
    await expect(page.locator('h1:has-text("Main Anvil")')).toBeVisible()
    await expect(page.locator('[data-testid="dashboard-grid"]')).toBeVisible()
  })

  test('should display welcome widget', async ({ page }) => {
    await expect(page.locator('[data-testid="welcome-widget"]')).toBeVisible()
    await expect(page.locator('text=Welcome back')).toBeVisible()
  })

  test('should display my quests widget', async ({ page }) => {
    await expect(page.locator('[data-testid="my-quests-widget"]')).toBeVisible()
    await expect(page.locator('text=My Quests')).toBeVisible()
  })

  test('should display leaderboard widget', async ({ page }) => {
    await expect(page.locator('[data-testid="leaderboard-widget"]')).toBeVisible()
    await expect(page.locator('text=Forge Masters')).toBeVisible()
  })

  test('should display upcoming events widget', async ({ page }) => {
    await expect(page.locator('[data-testid="upcoming-events-widget"]')).toBeVisible()
    await expect(page.locator('text=Upcoming Events')).toBeVisible()
  })

  test('should display activity feed', async ({ page }) => {
    await expect(page.locator('[data-testid="activity-feed"]')).toBeVisible()
    await expect(page.locator('text=Recent Activity')).toBeVisible()
  })

  test('should show loading states initially', async ({ page }) => {
    // Reload to see loading states
    await page.reload()
    
    // Should show loading spinners
    await expect(page.locator('[data-testid="loading-spinner"]').first()).toBeVisible()
  })

  test('should navigate to quest details when quest clicked', async ({ page }) => {
    await page.waitForSelector('[data-testid="quest-card"]')
    await page.click('[data-testid="quest-card"]')
    
    // Should show quest details or navigate to quests page
    await expect(page.locator('text=Quest Details')).toBeVisible()
  })

  test('should navigate to leaderboard when view all clicked', async ({ page }) => {
    await page.click('text=View Full Leaderboard')
    
    await expect(page).toHaveURL(/.*\/leaderboard/)
  })

  test('should navigate to events when view all clicked', async ({ page }) => {
    await page.click('text=View All Events')
    
    await expect(page).toHaveURL(/.*\/events/)
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Dashboard should still be visible and functional
    await expect(page.locator('h1:has-text("Main Anvil")')).toBeVisible()
    await expect(page.locator('[data-testid="dashboard-grid"]')).toBeVisible()
  })

  test('should update quest progress', async ({ page }) => {
    await page.waitForSelector('[data-testid="quest-card"]')
    
    // Find a quest that can be completed
    const questCard = page.locator('[data-testid="quest-card"]:has-text("Ready to claim!")')
    
    if (await questCard.count() > 0) {
      await questCard.click()
      
      // Should show completion animation or success message
      await expect(page.locator('text=Quest completed!')).toBeVisible()
    }
  })

  test('should show user stats', async ({ page }) => {
    await expect(page.locator('[data-testid="user-stats"]')).toBeVisible()
    await expect(page.locator('text=Level')).toBeVisible()
    await expect(page.locator('text=XP')).toBeVisible()
  })

  test('should display user avatar and username', async ({ page }) => {
    await expect(page.locator('[data-testid="user-avatar"]')).toBeVisible()
    await expect(page.locator('[data-testid="username"]')).toBeVisible()
  })
})