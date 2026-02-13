/**
 * CSOAI V2 — Full E2E Test Suite (Cypress)
 * Comprehensive testing of all routes, navigation, interactions, and visual rendering.
 */

// ─── ALL ROUTES ───
const ALL_ROUTES = [
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

// ─── 1. ROUTE AVAILABILITY ───
describe('Route Availability', () => {
  ALL_ROUTES.forEach((route) => {
    it(`${route} loads without crashing`, () => {
      cy.visit(route, { failOnStatusCode: false });
      // Page should not show a hard error / blank page
      cy.get('body').should('not.be.empty');
      // Should have at least the CSOAI nav
      cy.get('body').should('contain.text', 'CSOAI');
    });
  });

  it('invalid route shows 404 page', () => {
    cy.visit('/this-route-does-not-exist-xyz', { failOnStatusCode: false });
    cy.get('body').should('contain.text', '404').or('contain.text', 'not found');
  });

  it('/public-dashboard redirects to /transparency', () => {
    cy.visit('/public-dashboard');
    cy.url().should('include', '/transparency');
  });
});

// ─── 2. HOMEPAGE ───
describe('Homepage', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('has correct page title', () => {
    cy.title().should('match', /CSOAI/i);
  });

  it('hero section renders with headline', () => {
    cy.contains("Unifying the World's").should('be.visible');
    cy.contains('Response to AI').should('be.visible');
  });

  it('EU AI Act countdown shows next milestone (not all zeros)', () => {
    // After fix: should show "High-Risk AI Obligations" or "Fully Enforced"
    cy.get('body').then(($body) => {
      const hasHighRisk = $body.text().includes('High-Risk AI Obligations');
      const hasFullyEnforced = $body.text().includes('EU AI Act Fully Enforced');
      const hasLiteracy = $body.text().includes('AI Literacy Obligations');
      expect(hasHighRisk || hasFullyEnforced || hasLiteracy).to.be.true;
    });
  });

  it('CTA banners are visible', () => {
    cy.contains('Now Live').should('be.visible');
    cy.contains('100% Free Training').should('be.visible');
  });

  it('no broken images', () => {
    cy.get('img').each(($img) => {
      expect($img[0].naturalWidth).to.be.greaterThan(0);
    });
  });

  it('footer renders with legal links', () => {
    cy.scrollTo('bottom');
    cy.get('footer').should('exist');
    cy.get('footer').contains('Privacy Policy').should('exist');
    cy.get('footer').contains('Terms of Service').should('exist');
  });
});

// ─── 3. FRAMEWORK PAGES (Button asChild Bug Fix) ───
describe('Framework & Guide Pages — React Error Fix Verification', () => {
  const criticalPages = [
    { route: '/frameworks/eu-ai-act', name: 'EU AI Act Framework' },
    { route: '/frameworks/nist', name: 'NIST Framework' },
    { route: '/guides/eu-ai-act', name: 'EU AI Act Guide' },
    { route: '/guides/iso-42001', name: 'ISO 42001 Guide' },
    { route: '/guides/nist-ai-rmf', name: 'NIST AI RMF Guide' },
    { route: '/frameworks/tc260', name: 'TC260 Framework' },
    { route: '/guides/tc260', name: 'TC260 Guide' },
  ];

  criticalPages.forEach(({ route, name }) => {
    it(`${name} (${route}) renders without React.Children.only error`, () => {
      // Capture console errors
      const errors: string[] = [];
      cy.on('uncaught:exception', (err) => {
        errors.push(err.message);
        return false; // Don't fail test on uncaught exception — we check manually
      });

      cy.visit(route);
      cy.wait(2000);

      // Should have meaningful content
      cy.get('body').invoke('text').should('have.length.greaterThan', 100);

      // Should NOT contain React error in body text
      cy.get('body').invoke('text').should('not.contain', 'React.Children.only');

      // Verify no React errors were caught
      cy.wrap(null).then(() => {
        const reactErrors = errors.filter((e) => e.includes('React.Children.only'));
        expect(reactErrors.length).to.equal(0);
      });
    });
  });
});

// ─── 4. NAVIGATION ───
describe('Navigation', () => {
  it('desktop nav has all main sections', () => {
    cy.viewport(1280, 720);
    cy.visit('/');
    const sections = ['Charter', 'Training', 'Certification', 'SOAI-PDCA', 'Watchdog', 'Enterprise', 'Government'];
    sections.forEach((section) => {
      cy.get('nav').contains(section).should('exist');
    });
  });

  it('mobile hamburger menu opens with all sections', () => {
    cy.viewport(375, 812);
    cy.visit('/');
    // Click hamburger
    cy.get('button[aria-label*="menu" i], button svg.lucide-menu', { timeout: 5000 })
      .first()
      .click();
    cy.contains('Training').should('be.visible');
    cy.contains('Certification').should('be.visible');
    cy.contains('Watchdog').should('be.visible');
  });

  it('clicking nav links navigates correctly', () => {
    cy.visit('/');
    cy.contains('a', 'Training').first().click({ force: true });
    cy.url().should('include', '/training');
  });
});

// ─── 5. TRAINING & COURSES ───
describe('Training & Courses', () => {
  beforeEach(() => {
    cy.visit('/courses');
  });

  it('course page loads with header', () => {
    cy.contains('AI Safety & Compliance Training').should('be.visible');
  });

  it('course filter dropdowns exist', () => {
    cy.contains('All Regions').should('be.visible');
    cy.contains('All Levels').should('be.visible');
    cy.contains('All Frameworks').should('be.visible');
  });

  it('individual courses tab shows courses', () => {
    cy.contains('Individual Courses').should('be.visible');
    cy.contains('EU AI Act').should('exist');
  });

  it('course bundles tab switches content', () => {
    cy.contains('Course Bundles').click();
    cy.contains('Bundle Deal').should('be.visible');
  });

  it('region filter dropdown opens', () => {
    cy.contains('All Regions').click();
    cy.contains('European Union').should('be.visible');
    cy.contains('United States').should('be.visible');
  });
});

// ─── 6. AUTHENTICATION ───
describe('Authentication Pages', () => {
  it('login page has email and password fields', () => {
    cy.visit('/login');
    cy.contains('Sign In').should('be.visible');
    cy.get('input[type="email"], input[placeholder*="email" i]').should('exist');
    cy.get('input[type="password"]').should('exist');
  });

  it('signup page has registration form', () => {
    cy.visit('/signup');
    cy.contains('Create Account').should('be.visible');
  });

  it('login page has link to signup', () => {
    cy.visit('/login');
    cy.contains('Sign Up').should('exist');
  });
});

// ─── 7. SEARCH ───
describe('Search Functionality', () => {
  it('search opens and returns results', () => {
    cy.visit('/');
    // Click search icon
    cy.get('button').filter(':has(svg)').contains(/search/i).first().click({ force: true });
    // Alternatively try the search button directly
    cy.get('button[aria-label*="search" i], [data-testid="search"]', { timeout: 3000 })
      .first()
      .click({ force: true });
    cy.get('input[placeholder*="search" i]', { timeout: 3000 }).type('EU AI Act');
    cy.wait(1000);
    // Should show search results
    cy.contains('EU AI Act').should('be.visible');
  });
});

// ─── 8. LEGAL PAGES ───
describe('Legal Pages', () => {
  it('privacy policy has substantial content', () => {
    cy.visit('/privacy-policy');
    cy.contains('Privacy Policy').should('be.visible');
    cy.get('body').invoke('text').should('have.length.greaterThan', 500);
  });

  it('terms of service has content', () => {
    cy.visit('/terms-of-service');
    cy.contains('Terms of Service').should('be.visible');
  });

  it('disclaimers page loads', () => {
    cy.visit('/disclaimers');
    cy.get('body').invoke('text').should('have.length.greaterThan', 200);
  });
});

// ─── 9. INTERACTIVE ELEMENTS ───
describe('Interactive Elements', () => {
  it('FAQ accordion expands on click', () => {
    cy.visit('/');
    cy.scrollTo('bottom', { duration: 1000 });
    cy.contains('What is CSOAI', { timeout: 5000 }).click({ force: true });
    cy.contains('relationship-based AI safety infrastructure', { timeout: 3000 }).should('be.visible');
  });
});

// ─── 10. DASHBOARD PAGES ───
describe('Dashboard Pages', () => {
  it('certification page loads properly', () => {
    cy.visit('/certification');
    cy.contains('Certification').should('be.visible');
  });

  it('SOAI-PDCA framework page loads', () => {
    cy.visit('/soai-pdca');
    cy.contains('PDCA').should('be.visible');
  });

  it('transparency portal loads', () => {
    cy.visit('/transparency');
    cy.contains('Transparency').should('be.visible');
  });

  it('enterprise page loads', () => {
    cy.visit('/enterprise');
    cy.contains('Enterprise').should('be.visible');
  });
});

// ─── 11. PERFORMANCE ───
describe('Performance', () => {
  it('homepage loads within 5 seconds', () => {
    const start = Date.now();
    cy.visit('/');
    cy.get('body').should('not.be.empty').then(() => {
      const loadTime = Date.now() - start;
      expect(loadTime).to.be.lessThan(5000);
    });
  });
});
