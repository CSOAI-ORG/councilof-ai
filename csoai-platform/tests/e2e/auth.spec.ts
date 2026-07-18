import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should display login page correctly', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('Sign In to CSOAI')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should display signup page correctly', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.getByText('Create Your Free Account')).toBeVisible();
    await expect(page.locator('input#name')).toBeVisible();
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
    await expect(page.locator('input#confirmPassword')).toBeVisible();
  });

  test('should login with demo credentials', async ({ page }) => {
    await page.goto('/login');
    await page.click('text=Demo Login');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should navigate to signup from login', async ({ page }) => {
    await page.goto('/login');
    await page.click('text=Create Free Account');
    await expect(page).toHaveURL(/.*signup/);
  });

  test('should navigate to login from signup', async ({ page }) => {
    await page.goto('/signup');
    await page.click('text=Sign In Instead');
    await expect(page).toHaveURL(/.*login/);
  });
});
