import { test, expect } from '@playwright/test';
import { login, isAuthenticated } from './fixtures/auth';
import { visualTestRoutes, getPublicRoutes, getAuthenticatedRoutes } from './fixtures/routes';

/**
 * Visual Regression Test Suite
 * 
 * Captures screenshots of all application routes and compares against baselines.
 * Runs on every PR to detect visual regressions before deployment.
 */

// Test configuration
const SCREENSHOT_TIMEOUT = 30000;
const PAGE_LOAD_TIMEOUT = 15000;

test.describe('Visual Regression Tests - Public Pages', () => {
  const publicRoutes = getPublicRoutes();

  for (const route of publicRoutes) {
    test(`${route.title} (${route.path})`, async ({ page }) => {
      // Navigate to the route
      await page.goto(route.path, { waitUntil: 'networkidle', timeout: PAGE_LOAD_TIMEOUT });

      // Wait for specific selector if defined
      if (route.waitForSelector) {
        await page.waitForSelector(route.waitForSelector, { timeout: SCREENSHOT_TIMEOUT });
      }

      // Wait for fonts and images to load
      await page.waitForLoadState('load');
      await page.evaluate(() => document.fonts.ready);

      // Hide dynamic elements that change between runs
      await page.addStyleTag({
        content: `
          [data-testid="timestamp"], 
          [data-testid="dynamic-content"],
          .animate-pulse,
          .animate-spin,
          time,
          [data-radix-popper-content-wrapper] { 
            visibility: hidden !important; 
          }
        `
      });

      // Wait for animations to complete
      await page.waitForTimeout(500);

      // Take screenshot and compare
      await expect(page).toHaveScreenshot(`${route.path.replace(/\//g, '-') || 'home'}.png`, {
        fullPage: true,
        animations: 'disabled',
        mask: [
          page.locator('[data-testid="timestamp"]'),
          page.locator('[data-testid="dynamic-content"]'),
        ],
      });
    });
  }
});

test.describe('Visual Regression Tests - Authenticated Pages', () => {
  const authRoutes = getAuthenticatedRoutes();

  test.beforeEach(async ({ page }) => {
    // Skip auth tests if credentials not provided
    const hasCredentials = process.env.CI_TEST_USER_EMAIL && process.env.CI_TEST_USER_PASSWORD;
    
    if (!hasCredentials) {
      test.skip(!hasCredentials, 'CI_TEST_USER credentials not configured');
      return;
    }

    // Login before each test
    const loggedIn = await login(page);
    if (!loggedIn) {
      test.skip(true, 'Login failed');
    }
  });

  for (const route of authRoutes) {
    test(`${route.title} (${route.path})`, async ({ page }) => {
      // Check if we're authenticated
      const authed = await isAuthenticated(page);
      if (!authed) {
        test.skip(true, 'Not authenticated');
        return;
      }

      // Navigate to the route
      await page.goto(route.path, { waitUntil: 'networkidle', timeout: PAGE_LOAD_TIMEOUT });

      // Wait for specific selector if defined
      if (route.waitForSelector) {
        try {
          await page.waitForSelector(route.waitForSelector, { timeout: SCREENSHOT_TIMEOUT });
        } catch {
          // If selector not found, wait for main content
          await page.waitForSelector('main, [role="main"], #root > div', { timeout: SCREENSHOT_TIMEOUT });
        }
      }

      // Wait for data to load
      await page.waitForLoadState('networkidle');
      await page.evaluate(() => document.fonts.ready);

      // Hide dynamic elements
      await page.addStyleTag({
        content: `
          [data-testid="timestamp"], 
          [data-testid="dynamic-content"],
          [data-testid="user-avatar"],
          .animate-pulse,
          .animate-spin,
          time,
          [data-radix-popper-content-wrapper] { 
            visibility: hidden !important; 
          }
        `
      });

      // Wait for animations to complete
      await page.waitForTimeout(500);

      // Scroll to bottom if needed
      if (route.scrollToBottom) {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(300);
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(300);
      }

      // Take screenshot and compare
      await expect(page).toHaveScreenshot(`${route.path.replace(/\//g, '-')}.png`, {
        fullPage: true,
        animations: 'disabled',
        mask: [
          page.locator('[data-testid="timestamp"]'),
          page.locator('[data-testid="dynamic-content"]'),
          page.locator('[data-testid="user-avatar"]'),
        ],
      });
    });
  }
});

test.describe('Visual Regression Tests - Critical Flows', () => {
  test('Login Flow', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForSelector('form', { timeout: PAGE_LOAD_TIMEOUT });
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('auth-login-form.png', {
      animations: 'disabled',
    });
  });

  test('Mobile Navigation', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Open mobile menu
    const menuButton = page.locator('[data-testid="mobile-menu-button"], button[aria-label*="menu"]');
    if (await menuButton.count() > 0) {
      await menuButton.click();
      await page.waitForTimeout(300);
    }
    
    await expect(page).toHaveScreenshot('mobile-navigation.png', {
      animations: 'disabled',
    });
  });

  test('Dark Mode Toggle', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Find and click theme toggle
    const themeToggle = page.locator('[data-testid="theme-toggle"], button[aria-label*="theme"]');
    if (await themeToggle.count() > 0) {
      await themeToggle.click();
      await page.waitForTimeout(500);
    }
    
    await expect(page).toHaveScreenshot('dark-mode-home.png', {
      animations: 'disabled',
    });
  });
});

test.describe('Visual Regression Tests - Error States', () => {
  test('404 Page', async ({ page }) => {
    await page.goto('/non-existent-page-12345');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('404-error-page.png', {
      animations: 'disabled',
    });
  });
});
