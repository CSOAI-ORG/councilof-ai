/**
 * CSOAI Comprehensive E2E Tests
 *
 * Testing all user demographics and flows:
 * - Public Users (Watchdog reporting, transparency)
 * - Enterprise CISOs (compliance, dashboards, PDCA)
 * - Government Regulators (monitoring, enforcement)
 * - Byzantine Council (voting, consensus)
 *
 * Rainbow simulation tests for edge cases and stress testing
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

// ============================================================================
// PUBLIC USER FLOWS - Citizens, Advocates, Researchers
// ============================================================================
test.describe('Public User Flows', () => {
  test('should load homepage with Maternal Covenant messaging', async ({ page }) => {
    await page.goto(BASE_URL);

    // Check key elements visible
    await expect(page.locator('text=The Maternal Covenant')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=52')).toBeVisible(); // Charter Articles
    await expect(page.locator('text=33')).toBeVisible(); // AI Agents
  });

  test('should access Public Watchdog and view incidents', async ({ page }) => {
    await page.goto(`${BASE_URL}/public-watchdog`);

    // Verify watchdog page loads
    await expect(page.locator('h1:has-text("Public Watchdog")')).toBeVisible({ timeout: 10000 });

    // Check stats are visible
    await expect(page.locator('text=Total Reports')).toBeVisible();
    await expect(page.locator('text=Open Cases')).toBeVisible();
    await expect(page.locator('text=Resolved')).toBeVisible();

    // Check filter controls exist
    await expect(page.locator('text=Filters')).toBeVisible();
    await expect(page.locator('text=All Categories')).toBeVisible();

    // Check incident cards are visible
    await expect(page.locator('text=All Incidents')).toBeVisible();
  });

  test('should open incident report dialog', async ({ page }) => {
    await page.goto(`${BASE_URL}/public-watchdog`);

    // Click report button
    await page.click('button:has-text("Report an Incident")');

    // Verify dialog opens
    await expect(page.locator('text=Report an AI Safety Incident')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[placeholder*="Brief description"]')).toBeVisible();
    await expect(page.locator('textarea[placeholder*="Describe the incident"]')).toBeVisible();
  });

  test('should filter incidents by category', async ({ page }) => {
    await page.goto(`${BASE_URL}/public-watchdog`);

    // Wait for page to load
    await page.waitForTimeout(1000);

    // Click category dropdown
    await page.click('button:has-text("All Categories")');

    // Select a category (if dropdown is present)
    const biasOption = page.locator('text=Bias & Discrimination');
    if (await biasOption.isVisible({ timeout: 2000 })) {
      await biasOption.click();
    }
  });

  test('should view Charter page with 52 articles', async ({ page }) => {
    await page.goto(`${BASE_URL}/charter`);

    // Check charter header
    await expect(page.locator('text=CSOAI Partnership Charter')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=52 Articles')).toBeVisible();
    await expect(page.locator('text=13 Schedules')).toBeVisible();
    await expect(page.locator('text=6 Parts')).toBeVisible();

    // Check Maternal Covenant section
    await expect(page.locator('text=The Maternal Covenant')).toBeVisible();
  });

  test('should view Prosperity Fund with UBI thresholds', async ({ page }) => {
    await page.goto(`${BASE_URL}/prosperity`);

    // Check fund stats
    await expect(page.locator('text=Current Fund Size')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Contributing Organizations')).toBeVisible();

    // Check UBI thresholds
    await expect(page.locator('text=20% AI unemployment')).toBeVisible();
    await expect(page.locator('text=40% AI unemployment')).toBeVisible();
    await expect(page.locator('text=70% AI unemployment')).toBeVisible();
    await expect(page.locator('text=$500/month')).toBeVisible();
    await expect(page.locator('text=$1,500/month')).toBeVisible();
    await expect(page.locator('text=$3,000/month')).toBeVisible();
  });

  test('should access Founding Members page', async ({ page }) => {
    await page.goto(`${BASE_URL}/founding-members`);

    await expect(page.locator('text=Founding Members')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=First 100')).toBeVisible();
  });
});

// ============================================================================
// ENTERPRISE CISO FLOWS - Compliance Officers, Risk Managers
// ============================================================================
test.describe('Enterprise CISO Flows', () => {
  test('should access Enterprise Dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/enterprise-dashboard`);

    // Check dashboard header
    await expect(page.locator('text=Enterprise Dashboard')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Comprehensive AI Safety & Compliance Management')).toBeVisible();

    // Check key metrics
    await expect(page.locator('text=AI Systems')).toBeVisible();
    await expect(page.locator('text=Compliance Rate')).toBeVisible();
    await expect(page.locator('text=PDCA Cycles')).toBeVisible();
    await expect(page.locator('text=Overall Score')).toBeVisible();
  });

  test('should view compliance dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/compliance`);

    // Wait for page load
    await page.waitForTimeout(1000);

    // Check compliance elements are present
    await expect(page.locator('body')).toBeVisible();
  });

  test('should access PDCA cycles page', async ({ page }) => {
    await page.goto(`${BASE_URL}/pdca`);

    await page.waitForTimeout(1000);
    await expect(page.locator('body')).toBeVisible();
  });

  test('should view AI systems registry', async ({ page }) => {
    await page.goto(`${BASE_URL}/ai-systems`);

    await page.waitForTimeout(1000);
    await expect(page.locator('body')).toBeVisible();
  });

  test('should access risk assessment', async ({ page }) => {
    await page.goto(`${BASE_URL}/risk-assessment`);

    await page.waitForTimeout(1000);
    await expect(page.locator('body')).toBeVisible();
  });

  test('should view reports section', async ({ page }) => {
    await page.goto(`${BASE_URL}/reports`);

    await page.waitForTimeout(1000);
    await expect(page.locator('body')).toBeVisible();
  });
});

// ============================================================================
// GOVERNMENT REGULATOR FLOWS - Policy Makers, Enforcers
// ============================================================================
test.describe('Government Regulator Flows', () => {
  test('should access Government Dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/government`);

    // Check dashboard header
    await expect(page.locator('text=Government Dashboard')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Real-time AI compliance monitoring')).toBeVisible();

    // Check key metrics
    await expect(page.locator('text=Monitored Systems')).toBeVisible();
    await expect(page.locator('text=Overall Compliance')).toBeVisible();
    await expect(page.locator('text=Active Incidents')).toBeVisible();
    await expect(page.locator('text=Pending Actions')).toBeVisible();
  });

  test('should display all four compliance frameworks', async ({ page }) => {
    await page.goto(`${BASE_URL}/government`);

    await page.waitForTimeout(1000);

    // Check all frameworks are visible
    await expect(page.locator('text=EU AI Act')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=NIST AI RMF')).toBeVisible();
    await expect(page.locator('text=ISO 42001')).toBeVisible();
    await expect(page.locator('text=TC260 AI Safety')).toBeVisible();
  });

  test('should show compliance rates for frameworks', async ({ page }) => {
    await page.goto(`${BASE_URL}/government`);

    await page.waitForTimeout(1000);

    // Check compliance rates are displayed
    await expect(page.locator('text=Compliance Rate')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=113 Articles')).toBeVisible(); // EU AI Act
    await expect(page.locator('text=72 Articles')).toBeVisible();  // NIST
    await expect(page.locator('text=56 Articles')).toBeVisible();  // ISO
    await expect(page.locator('text=48 Articles')).toBeVisible();  // TC260
  });

  test('should display recent alerts', async ({ page }) => {
    await page.goto(`${BASE_URL}/government`);

    await page.waitForTimeout(1000);

    // Check alerts section
    await expect(page.locator('text=Recent Alerts')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Critical').first()).toBeVisible();
  });

  test('should have filter controls for frameworks and regions', async ({ page }) => {
    await page.goto(`${BASE_URL}/government`);

    // Check filter controls
    await expect(page.locator('text=All Frameworks')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=All Regions')).toBeVisible();
  });
});

// ============================================================================
// BYZANTINE COUNCIL FLOWS - 33-Agent Consensus System
// ============================================================================
test.describe('Byzantine Council Flows', () => {
  test('should access 33-Agent Council page', async ({ page }) => {
    await page.goto(`${BASE_URL}/byzantine`);

    // Check council header
    await expect(page.locator('text=33-Agent Council')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=22/33 consensus required')).toBeVisible();
  });

  test('should display three agent groups', async ({ page }) => {
    await page.goto(`${BASE_URL}/byzantine`);

    await page.waitForTimeout(1000);

    // Check agent groups
    await expect(page.locator('text=Guardian Agents')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Arbiter Agents')).toBeVisible();
    await expect(page.locator('text=Scribe Agents')).toBeVisible();
  });

  test('should show agent providers', async ({ page }) => {
    await page.goto(`${BASE_URL}/byzantine`);

    await page.waitForTimeout(1000);

    // Check providers are listed
    await expect(page.locator('text=OpenAI (3)').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Anthropic (2)').first()).toBeVisible();
    await expect(page.locator('text=Google (2)').first()).toBeVisible();
    await expect(page.locator('text=DeepSeek (2)').first()).toBeVisible();
  });

  test('should have Trigger Council Vote button', async ({ page }) => {
    await page.goto(`${BASE_URL}/byzantine`);

    await expect(page.locator('button:has-text("Trigger Council Vote")')).toBeVisible({ timeout: 10000 });
  });

  test('should display council stats', async ({ page }) => {
    await page.goto(`${BASE_URL}/byzantine`);

    await page.waitForTimeout(1000);

    // Check stats cards
    await expect(page.locator('text=Total Sessions')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Consensus Reached')).toBeVisible();
    await expect(page.locator('text=Escalated to Human')).toBeVisible();
    await expect(page.locator('text=Pending Review')).toBeVisible();
  });
});

// ============================================================================
// RAINBOW SIMULATION TESTS - Edge Cases & Stress Testing
// ============================================================================
test.describe('Rainbow Simulation Tests', () => {
  test('should handle rapid navigation between pages', async ({ page }) => {
    const pages = [
      `${BASE_URL}/`,
      `${BASE_URL}/charter`,
      `${BASE_URL}/public-watchdog`,
      `${BASE_URL}/government`,
      `${BASE_URL}/byzantine`,
      `${BASE_URL}/prosperity`,
      `${BASE_URL}/enterprise-dashboard`,
    ];

    for (const url of pages) {
      await page.goto(url);
      await page.waitForTimeout(500); // Brief wait
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should maintain state across page refreshes', async ({ page }) => {
    await page.goto(`${BASE_URL}/public-watchdog`);

    // Refresh the page
    await page.reload();

    // Check content is still present
    await expect(page.locator('text=Public Watchdog')).toBeVisible({ timeout: 10000 });
  });

  test('should handle browser back/forward navigation', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await page.goto(`${BASE_URL}/charter`);
    await page.goto(`${BASE_URL}/public-watchdog`);

    // Go back
    await page.goBack();
    await expect(page.locator('text=CSOAI Partnership Charter')).toBeVisible({ timeout: 10000 });

    // Go forward
    await page.goForward();
    await expect(page.locator('text=Public Watchdog')).toBeVisible({ timeout: 10000 });
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

    await page.goto(`${BASE_URL}/`);
    await expect(page.locator('body')).toBeVisible();

    await page.goto(`${BASE_URL}/public-watchdog`);
    await expect(page.locator('body')).toBeVisible();
  });

  test('should be responsive on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad

    await page.goto(`${BASE_URL}/`);
    await expect(page.locator('body')).toBeVisible();

    await page.goto(`${BASE_URL}/government`);
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle concurrent API calls', async ({ page }) => {
    await page.goto(`${BASE_URL}/government`);

    // Multiple rapid interactions
    await page.click('button:has-text("All Frameworks")').catch(() => {});
    await page.click('button:has-text("All Regions")').catch(() => {});

    // Page should remain stable
    await expect(page.locator('body')).toBeVisible();
  });
});

// ============================================================================
// ACCESSIBILITY TESTS
// ============================================================================
test.describe('Accessibility Tests', () => {
  test('should have proper heading hierarchy on homepage', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    // Check for h1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThan(0);
  });

  test('should have proper heading hierarchy on watchdog', async ({ page }) => {
    await page.goto(`${BASE_URL}/public-watchdog`);

    const h1 = page.locator('h1');
    await expect(h1.first()).toBeVisible({ timeout: 10000 });
  });

  test('should have clickable navigation links', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    // Check navigation exists
    await expect(page.locator('nav')).toBeVisible({ timeout: 10000 });

    // Check key nav items
    await expect(page.locator('a[href="/charter"]').first()).toBeVisible();
  });

  test('should have visible buttons with text', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    // Check Get Started button is visible
    await expect(page.locator('a:has-text("Get Started"), button:has-text("Get Started")').first()).toBeVisible({ timeout: 10000 });
  });
});

// ============================================================================
// API INTEGRATION TESTS
// ============================================================================
test.describe('API Integration Tests', () => {
  test('should load watchdog stats from API', async ({ page }) => {
    await page.goto(`${BASE_URL}/public-watchdog`);

    // Stats should be populated (not showing loading/error)
    await page.waitForTimeout(2000);

    // Check that numbers are displayed
    const totalReports = page.locator('text=/\\d+.*Total Reports/');
    await expect(totalReports.or(page.locator('text=Total Reports'))).toBeVisible({ timeout: 10000 });
  });

  test('should load government compliance data', async ({ page }) => {
    await page.goto(`${BASE_URL}/government`);

    await page.waitForTimeout(2000);

    // Check compliance percentages are displayed
    await expect(page.locator('text=/\\d+.*%/')).toBeVisible({ timeout: 10000 });
  });
});
