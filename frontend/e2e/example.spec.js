import { test, expect } from '@playwright/test';

test.describe('Banking Frontend - Basic Tests', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page loads
    await expect(page).toHaveTitle(/Banking/);
    
    // Check for basic content
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check that the page is still functional on mobile
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    await page.goto('/');
    
    // Check for basic accessibility
    const main = page.locator('main');
    await expect(main).toBeVisible();
    
    // Check for skip links or navigation
    const nav = page.locator('nav');
    if (await nav.count() > 0) {
      await expect(nav).toBeVisible();
    }
  });
});