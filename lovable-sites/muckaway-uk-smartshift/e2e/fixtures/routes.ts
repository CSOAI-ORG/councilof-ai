/**
 * Routes configuration for visual regression testing
 * Mirrors the e2eRoutes from the main application
 */

export interface VisualTestRoute {
  path: string;
  title: string;
  requiresAuth: boolean;
  category: 'public' | 'dashboard' | 'ai-tools' | 'operations' | 'compliance' | 'stock' | 'reports' | 'admin';
  waitForSelector?: string;
  scrollToBottom?: boolean;
  interactionsBeforeScreenshot?: string[];
}

export const visualTestRoutes: VisualTestRoute[] = [
  // Public pages
  { path: '/', title: 'Home', requiresAuth: false, category: 'public', waitForSelector: 'main' },
  { path: '/pricing', title: 'Pricing', requiresAuth: false, category: 'public', waitForSelector: 'main' },
  { path: '/about', title: 'About', requiresAuth: false, category: 'public', waitForSelector: 'main' },
  { path: '/contact', title: 'Contact', requiresAuth: false, category: 'public', waitForSelector: 'main' },
  { path: '/faq', title: 'FAQ', requiresAuth: false, category: 'public', waitForSelector: 'main' },
  { path: '/privacy', title: 'Privacy', requiresAuth: false, category: 'public', waitForSelector: 'main' },
  { path: '/terms', title: 'Terms', requiresAuth: false, category: 'public', waitForSelector: 'main' },
  { path: '/auth', title: 'Auth', requiresAuth: false, category: 'public', waitForSelector: 'form' },
  
  // Dashboard pages (require auth)
  { path: '/dashboard', title: 'Dashboard', requiresAuth: true, category: 'dashboard', waitForSelector: '[data-testid="dashboard"]' },
  { path: '/profile', title: 'Profile', requiresAuth: true, category: 'dashboard', waitForSelector: 'main' },
  { path: '/notifications', title: 'Notifications', requiresAuth: true, category: 'dashboard', waitForSelector: 'main' },
  
  // AI Tools
  { path: '/ai-tools', title: 'AI Tools', requiresAuth: true, category: 'ai-tools', waitForSelector: 'main' },
  { path: '/ai-classification', title: 'AI Classification', requiresAuth: true, category: 'ai-tools', waitForSelector: 'main' },
  { path: '/ai-insights', title: 'AI Insights', requiresAuth: true, category: 'ai-tools', waitForSelector: 'main' },
  { path: '/ai-chatbot', title: 'AI Chatbot', requiresAuth: true, category: 'ai-tools', waitForSelector: 'main' },
  
  // Operations
  { path: '/fleet', title: 'Fleet Management', requiresAuth: true, category: 'operations', waitForSelector: 'main' },
  { path: '/schedule', title: 'Schedule', requiresAuth: true, category: 'operations', waitForSelector: 'main' },
  { path: '/live-tracking', title: 'Live Tracking', requiresAuth: true, category: 'operations', waitForSelector: 'main' },
  { path: '/depots', title: 'Depots', requiresAuth: true, category: 'operations', waitForSelector: 'main' },
  { path: '/subcontractors', title: 'Subcontractors', requiresAuth: true, category: 'operations', waitForSelector: 'main' },
  { path: '/driver-checks', title: 'Driver Checks', requiresAuth: true, category: 'operations', waitForSelector: 'main' },
  { path: '/weather', title: 'Weather', requiresAuth: true, category: 'operations', waitForSelector: 'main' },
  
  // Compliance
  { path: '/hazardous', title: 'Hazardous', requiresAuth: true, category: 'compliance', waitForSelector: 'main' },
  { path: '/environmental', title: 'Environmental', requiresAuth: true, category: 'compliance', waitForSelector: 'main' },
  { path: '/gdpr-compliance', title: 'GDPR Compliance', requiresAuth: true, category: 'compliance', waitForSelector: 'main' },
  
  // Stock Management
  { path: '/stock-overview', title: 'Stock Overview', requiresAuth: true, category: 'stock', waitForSelector: 'main' },
  { path: '/stock-movements', title: 'Stock Movements', requiresAuth: true, category: 'stock', waitForSelector: 'main' },
  { path: '/materials-catalog', title: 'Materials Catalog', requiresAuth: true, category: 'stock', waitForSelector: 'main' },
  { path: '/aggregate-sales', title: 'Aggregate Sales', requiresAuth: true, category: 'stock', waitForSelector: 'main' },
  { path: '/purchase-orders', title: 'Purchase Orders', requiresAuth: true, category: 'stock', waitForSelector: 'main' },
  { path: '/suppliers', title: 'Suppliers', requiresAuth: true, category: 'stock', waitForSelector: 'main' },
  
  // Reports
  { path: '/reports', title: 'Reports', requiresAuth: true, category: 'reports', waitForSelector: 'main' },
  { path: '/credit-management', title: 'Credit Management', requiresAuth: true, category: 'reports', waitForSelector: 'main' },
  
  // Admin
  { path: '/admin', title: 'Admin', requiresAuth: true, category: 'admin', waitForSelector: 'main' },
];

/**
 * Get routes by category
 */
export function getRoutesByCategory(category: VisualTestRoute['category']): VisualTestRoute[] {
  return visualTestRoutes.filter(route => route.category === category);
}

/**
 * Get public routes (no auth required)
 */
export function getPublicRoutes(): VisualTestRoute[] {
  return visualTestRoutes.filter(route => !route.requiresAuth);
}

/**
 * Get authenticated routes
 */
export function getAuthenticatedRoutes(): VisualTestRoute[] {
  return visualTestRoutes.filter(route => route.requiresAuth);
}
