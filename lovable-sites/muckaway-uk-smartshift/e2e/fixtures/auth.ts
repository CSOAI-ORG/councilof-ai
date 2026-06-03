import { Page } from '@playwright/test';

/**
 * Authentication helper for E2E tests
 * Handles login flow for authenticated routes
 */
export async function login(page: Page): Promise<boolean> {
  const email = process.env.CI_TEST_USER_EMAIL;
  const password = process.env.CI_TEST_USER_PASSWORD;

  if (!email || !password) {
    console.warn('CI_TEST_USER_EMAIL or CI_TEST_USER_PASSWORD not set, skipping auth');
    return false;
  }

  try {
    // Navigate to auth page
    await page.goto('/auth');
    
    // Wait for auth form to be visible
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    // Fill in credentials
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    
    // Click sign in button
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard or home
    await page.waitForURL(/\/(dashboard|$)/, { timeout: 15000 });
    
    // Wait for page to stabilize
    await page.waitForLoadState('networkidle');
    
    return true;
  } catch (error) {
    console.error('Login failed:', error);
    return false;
  }
}

/**
 * Check if user is currently authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    // Check for common auth indicators
    const authToken = await page.evaluate(() => {
      return localStorage.getItem('supabase.auth.token') !== null;
    });
    return authToken;
  } catch {
    return false;
  }
}

/**
 * Logout helper
 */
export async function logout(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.removeItem('supabase.auth.token');
  });
  await page.reload();
}
