import { test, expect } from '@playwright/test';

/**
 * CSOAI V2 — Full E2E Test Suite (Playwright)
 * Tests all 44 routes, navigation, interactive elements, and visual rendering.
 */

// ─── ALL ROUTES ───
const ROUTES = [
  '/', '/about', '/accreditation', '/agent-council', '/api-docs',
  '/blog', '/careers', '/certification', '/charter', '/cookie-policy',
  '/council', '/disclaimers', '/dpa', '/enterprise',
  '/founding-council-agreement', '/founding-members',
  '/frameworks/eu-ai-act', '/frameworks/nist', '/frameworks/tc260',
  '/government-dashboard',
  '/guides/eu-ai-act', '/guides/iso-42001', '/guides/nist-ai-rmf', '/guides/tc260',
  '/jobs', '/licensing-agreement', '/login',
  '/maternal-covenant', '/membership-agreement', '/pricing',
  '/privacy-policy', '/prosperity-fund',
  '/regulator-dashboard', '/signup', '/sla', '/soai-pdca',
  '/standards', '/terms-of-service', '/training',
  '/transparency', '/watchdog', '/workbench',
];

// Routes that require auth (may redirect to login)
const AUTH_ROUTES = [
  '/agent-council', '/api-docs', '/government-dashboard',
  '/regulator-dashboard', '/workbench',
];

// ─── 1. ROUTE AVAILABILITY ───
test.describe('Route Availability', () => {
  for (const route of ROUTES) {
    test(`GET ${route} returns 200`, async ({ page }) => {
      const response = await page.goto(route, { waitUntil: 'networkidle' });
      expect(response?.status()).toBe(200);
    });
  }

  test('404 page renders for invalid route', async ({ page }) => {
    await page.goto('/this-route-does-not-exist');
    await expect(page.locator('body')).toContainText(/not found|404|page.*exist/i);
  });

  test('/public-dashboard redirects to /transparency', async ({ page }) => {
    await page.goto('/public-dashboard', { waitUntil: 'networkidle' });
    expect(page.url()).toContain('/transparency');
  });
});

// ─── 2. HOMEPAGE ───
test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
  });

  test('has correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/CSOAI/i);
  });

  test('hero section renders', async ({ page }) => {
    await expect(page.locator('text=Unifying the World')).toBeVisible();
    await expect(page.locator('text=Response to AI')).toBeVisible();
  });

  test('EU AI Act countdown shows next milestone (not all zeros)', async ({ page }) => {
    // After fix: should show "High-Risk AI Obligations Begin" with actual countdown
    const countdownSection = page.locator('text=High-Risk AI Obligations Begin');
    // If all milestones have passed, check for the "fully enforced" message instead
    const fullyEnforced = page.locator('text=EU AI Act Fully Enforced');
    const hasCountdown = await countdownSection.isVisible().catch(() => false);
    const hasEnforced = await fullyEnforced.isVisible().catch(() => false);
    expect(hasCountdown || hasEnforced).toBeTruthy();
  });

  test('CTA banners render', async ({ page }) => {
    await expect(page.locator('text=Now Live')).toBeVisible();
    await expect(page.locator('text=100% Free Training')).toBeVisible();
  });

  test('navigation bar has all sections', async ({ page }) => {
    const navItems = ['Charter', 'Training', 'Certification', 'SOAI-PDCA', 'Watchdog', 'Enterprise', 'Government'];
    for (const item of navItems) {
      await expect(page.locator(`nav >> text=${item}`).first()).toBeVisible();
    }
  });

  test('footer renders with links', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    await expect(page.locator('footer')).toBeVisible();
    await expect(page.locator('footer >> text=Privacy Policy')).toBeVisible();
    await expect(page.locator('footer >> text=Terms of Service')).toBeVisible();
  });

  test('no console errors on homepage', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    expect(errors.filter(e => !e.includes('favicon') && !e.includes('analytics'))).toHaveLength(0);
  });

  test('no broken images on homepage', async ({ page }) => {
    const brokenImages = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs.filter(img => img.complete && img.naturalWidth === 0).map(img => img.src);
    });
    expect(brokenImages).toHaveLength(0);
  });
});

// ─── 3. FRAMEWORK/GUIDE PAGES (Button asChild fix) ───
test.describe('Framework & Guide Pages (Bug Fix Verification)', () => {
  const frameworkPages = [
    '/frameworks/eu-ai-act',
    '/frameworks/nist',
    '/guides/eu-ai-act',
    '/guides/iso-42001',
    '/guides/nist-ai-rmf',
    '/guides/tc260',
    '/frameworks/tc260',
  ];

  for (const route of frameworkPages) {
    test(`${route} renders without React error`, async ({ page }) => {
      const errors: string[] = [];
      page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
      page.on('pageerror', err => errors.push(err.message));

      await page.goto(route, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);

      // Should NOT show "React.Children.only" error
      const reactErrors = errors.filter(e => e.includes('React.Children.only'));
      expect(reactErrors).toHaveLength(0);

      // Page should have meaningful content (not blank/error page)
      const bodyText = await page.textContent('body');
      expect(bodyText?.length).toBeGreaterThan(100);
    });
  }
});

// ─── 4. TRAINING & COURSES ───
test.describe('Training & Courses', () => {
  test('courses page loads with course cards', async ({ page }) => {
    await page.goto('/courses', { waitUntil: 'networkidle' });
    await expect(page.locator('text=AI Safety & Compliance Training')).toBeVisible();
  });

  test('course filters work', async ({ page }) => {
    await page.goto('/courses', { waitUntil: 'networkidle' });
    // Region filter should be present
    await expect(page.locator('text=All Regions')).toBeVisible();
    // Framework filter
    await expect(page.locator('text=All Frameworks')).toBeVisible();
  });

  test('course bundles tab switches', async ({ page }) => {
    await page.goto('/courses', { waitUntil: 'networkidle' });
    await page.click('text=Course Bundles');
    await page.waitForTimeout(500);
    await expect(page.locator('text=Bundle Deal')).toBeVisible();
  });
});

// ─── 5. AUTHENTICATION PAGES ───
test.describe('Authentication', () => {
  test('login page renders form', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' });
    await expect(page.locator('text=Sign In')).toBeVisible();
    await expect(page.locator('input[type="email"], input[placeholder*="email" i]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('signup page renders form', async ({ page }) => {
    await page.goto('/signup', { waitUntil: 'networkidle' });
    await expect(page.locator('text=Create Account')).toBeVisible();
  });
});

// ─── 6. SEARCH FUNCTIONALITY ───
test.describe('Search', () => {
  test('search modal opens and returns results', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    // Click the search icon
    await page.click('[aria-label*="search" i], button:has(svg.lucide-search)');
    await page.waitForTimeout(500);
    // Type a search query
    await page.fill('input[placeholder*="search" i]', 'EU AI Act');
    await page.waitForTimeout(1000);
    // Should show results
    const results = page.locator('[role="listbox"] >> text=EU AI Act, a:has-text("EU AI Act")');
    await expect(results.first()).toBeVisible();
  });
});

// ─── 7. LEGAL PAGES ───
test.describe('Legal Pages', () => {
  test('privacy policy has content', async ({ page }) => {
    await page.goto('/privacy-policy', { waitUntil: 'networkidle' });
    await expect(page.locator('text=Privacy Policy')).toBeVisible();
    const content = await page.textContent('body');
    expect(content?.length).toBeGreaterThan(500);
  });

  test('terms of service has content', async ({ page }) => {
    await page.goto('/terms-of-service', { waitUntil: 'networkidle' });
    await expect(page.locator('text=Terms of Service')).toBeVisible();
  });

  test('cookie policy has content', async ({ page }) => {
    await page.goto('/cookie-policy', { waitUntil: 'networkidle' });
    const content = await page.textContent('body');
    expect(content?.length).toBeGreaterThan(200);
  });
});

// ─── 8. INTERACTIVE ELEMENTS ───
test.describe('Interactive Elements', () => {
  test('FAQ accordion expands on click', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    // Scroll to FAQ section
    await page.evaluate(() => {
      const faq = document.querySelector('[class*="faq" i], :has(> :is(h2,h3):has-text("FAQ"))');
      faq?.scrollIntoView({ behavior: 'instant' });
    });
    await page.waitForTimeout(500);
    // Click first FAQ question
    const faqButton = page.locator('button:has-text("What is CSOAI")').first();
    if (await faqButton.isVisible()) {
      await faqButton.click();
      await page.waitForTimeout(500);
      await expect(page.locator('text=relationship-based AI safety infrastructure')).toBeVisible();
    }
  });

  test('mobile menu opens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/', { waitUntil: 'networkidle' });
    // Click hamburger menu
    const menuButton = page.locator('button[aria-label*="menu" i], button:has(svg.lucide-menu)').first();
    await menuButton.click();
    await page.waitForTimeout(500);
    await expect(page.locator('text=Training')).toBeVisible();
    await expect(page.locator('text=Certification')).toBeVisible();
  });
});

// ─── 9. DASHBOARD PAGES ───
test.describe('Dashboard Pages', () => {
  test('certification page loads', async ({ page }) => {
    await page.goto('/certification', { waitUntil: 'networkidle' });
    await expect(page.locator('text=Certification')).toBeVisible();
  });

  test('SOAI-PDCA page loads', async ({ page }) => {
    await page.goto('/soai-pdca', { waitUntil: 'networkidle' });
    await expect(page.locator('text=PDCA')).toBeVisible();
  });

  test('transparency page loads', async ({ page }) => {
    await page.goto('/transparency', { waitUntil: 'networkidle' });
    await expect(page.locator('text=Transparency')).toBeVisible();
  });
});

// ─── 10. PERFORMANCE ───
test.describe('Performance', () => {
  test('homepage loads within 5 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const loadTime = Date.now() - start;
    expect(loadTime).toBeLessThan(5000);
  });

  test('no excessive network requests (< 100 on homepage)', async ({ page }) => {
    let requestCount = 0;
    page.on('request', () => requestCount++);
    await page.goto('/', { waitUntil: 'networkidle' });
    expect(requestCount).toBeLessThan(100);
  });
});
