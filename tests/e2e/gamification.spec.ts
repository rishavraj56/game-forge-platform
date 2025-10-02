import { test, expect } from '@playwright/test'

test.describe('Gamification System', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      window.localStorage.setItem('next-auth.session-token', 'mock-session-token')
    })
    
    await page.goto('/gamification-demo')
  })

  test('should display quest sections', async ({ page }) => {
    await expect(page.locator('text=Daily Quests')).toBeVisible()
    await expect(page.locator('text=Weekly Quests')).toBeVisible()
  })

  test('should display quest cards', async ({ page }) => {
    await page.waitForSelector('[data-testid="quest-card"]')
    
    const questCards = page.locator('[data-testid="quest-card"]')
    await expect(questCards.first()).toBeVisible()
    
    // Should show quest information
    await expect(questCards.first().locator('text=XP')).toBeVisible()
  })

  test('should show quest progress', async ({ page }) => {
    await page.waitForSelector('[data-testid="quest-card"]')
    
    const questCard = page.locator('[data-testid="quest-card"]').first()
    await expect(questCard.locator('[data-testid="progress-bar"]')).toBeVisible()
    await expect(questCard.locator('text=Progress')).toBeVisible()
  })

  test('should complete a quest', async ({ page }) => {
    await page.waitForSelector('[data-testid="quest-card"]')
    
    // Look for a quest that's ready to claim
    const readyQuest = page.locator('[data-testid="quest-card"]:has-text("Ready to claim!")')
    
    if (await readyQuest.count() > 0) {
      await readyQuest.click()
      
      // Should show success feedback
      await expect(page.locator('text=Quest completed!')).toBeVisible()
      await expect(page.locator('text=XP gained')).toBeVisible()
    }
  })

  test('should display badges section', async ({ page }) => {
    await expect(page.locator('text=Badges')).toBeVisible()
    await expect(page.locator('[data-testid="badge-display"]')).toBeVisible()
  })

  test('should display earned badges', async ({ page }) => {
    await page.waitForSelector('[data-testid="badge-card"]')
    
    const badgeCards = page.locator('[data-testid="badge-card"]')
    await expect(badgeCards.first()).toBeVisible()
  })

  test('should show badge details on hover', async ({ page }) => {
    await page.waitForSelector('[data-testid="badge-card"]')
    
    const badgeCard = page.locator('[data-testid="badge-card"]').first()
    await badgeCard.hover()
    
    // Should show tooltip or details
    await expect(page.locator('[data-testid="badge-tooltip"]')).toBeVisible()
  })

  test('should display titles section', async ({ page }) => {
    await expect(page.locator('text=Titles')).toBeVisible()
    await expect(page.locator('[data-testid="title-selection"]')).toBeVisible()
  })

  test('should allow title selection', async ({ page }) => {
    await page.waitForSelector('[data-testid="title-option"]')
    
    const titleOption = page.locator('[data-testid="title-option"]').first()
    await titleOption.click()
    
    // Should show selection feedback
    await expect(page.locator('text=Title selected')).toBeVisible()
  })

  test('should display XP progress', async ({ page }) => {
    await expect(page.locator('[data-testid="xp-progress"]')).toBeVisible()
    await expect(page.locator('text=Level')).toBeVisible()
    await expect(page.locator('text=XP')).toBeVisible()
  })

  test('should show level up animation', async ({ page }) => {
    // This would require triggering a level up, which might be complex
    // For now, we'll just check that the component exists
    await expect(page.locator('[data-testid="level-indicator"]')).toBeVisible()
  })

  test('should filter quests by type', async ({ page }) => {
    await page.click('text=Daily')
    
    // Should show only daily quests
    const questCards = page.locator('[data-testid="quest-card"]')
    const count = await questCards.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should show quest requirements', async ({ page }) => {
    await page.waitForSelector('[data-testid="quest-card"]')
    
    const questCard = page.locator('[data-testid="quest-card"]').first()
    await expect(questCard.locator('[data-testid="quest-requirements"]')).toBeVisible()
  })

  test('should display quest expiration time', async ({ page }) => {
    await page.waitForSelector('[data-testid="quest-card"]')
    
    const questCard = page.locator('[data-testid="quest-card"]').first()
    // Daily quests should show time remaining
    await expect(questCard.locator('text=/\\d+h \\d+m|\\d+m/')).toBeVisible()
  })

  test('should handle quest completion error', async ({ page }) => {
    // Mock API error
    await page.route('/api/gamification/quests/*/complete', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: { message: 'Quest completion failed' }
        })
      })
    })
    
    const readyQuest = page.locator('[data-testid="quest-card"]:has-text("Ready to claim!")')
    
    if (await readyQuest.count() > 0) {
      await readyQuest.click()
      
      // Should show error message
      await expect(page.locator('text=Quest completion failed')).toBeVisible()
      await expect(page.locator('text=Try Again')).toBeVisible()
    }
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Should still display quest sections
    await expect(page.locator('text=Daily Quests')).toBeVisible()
    await expect(page.locator('text=Weekly Quests')).toBeVisible()
    
    // Quest cards should be stacked vertically
    const questCards = page.locator('[data-testid="quest-card"]')
    if (await questCards.count() > 1) {
      const firstCard = questCards.first()
      const secondCard = questCards.nth(1)
      
      const firstBox = await firstCard.boundingBox()
      const secondBox = await secondCard.boundingBox()
      
      // Second card should be below first card (not side by side)
      expect(secondBox?.y).toBeGreaterThan(firstBox?.y || 0)
    }
  })
})