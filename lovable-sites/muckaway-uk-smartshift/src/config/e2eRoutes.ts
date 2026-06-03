export interface E2ERoute {
  path: string;
  title: string;
  component: string;
  requiresAuth: boolean;
  requiredRole?: 'admin' | 'operator_admin';
  category: 'dashboard' | 'ai' | 'operations' | 'compliance' | 'admin' | 'stock' | 'reports';
}

export const e2eRoutes: E2ERoute[] = [
  // Core Dashboard
  { path: '/dashboard', title: 'Dashboard', component: 'Dashboard', requiresAuth: true, category: 'dashboard' },
  { path: '/profile', title: 'Profile & Settings', component: 'Profile', requiresAuth: true, category: 'dashboard' },
  { path: '/notifications', title: 'Notifications', component: 'Notifications', requiresAuth: true, category: 'dashboard' },
  
  // AI Tools
  { path: '/ai-classification', title: 'AI Classification', component: 'AISpoilClassifier', requiresAuth: true, category: 'ai' },
  { path: '/ai-insights', title: 'AI Insights', component: 'AIInsightsDashboard', requiresAuth: true, requiredRole: 'operator_admin', category: 'ai' },
  { path: '/ai-chatbot', title: 'AI Chatbot', component: 'AIChatbot', requiresAuth: true, category: 'ai' },
  
  // Operations
  { path: '/schedule', title: 'Schedule', component: 'Schedule', requiresAuth: true, category: 'operations' },
  { path: '/live-tracking', title: 'Live Tracking', component: 'LiveTracking', requiresAuth: true, category: 'operations' },
  { path: '/fleet', title: 'Fleet Management', component: 'FleetManagement', requiresAuth: true, requiredRole: 'operator_admin', category: 'operations' },
  { path: '/driver-checks', title: 'Driver Checks', component: 'DriverChecks', requiresAuth: true, category: 'operations' },
  { path: '/maintenance-alerts', title: 'Maintenance Alerts', component: 'PredictiveMaintenanceAlerts', requiresAuth: true, requiredRole: 'operator_admin', category: 'operations' },
  { path: '/weather', title: 'Weather Operations', component: 'Weather', requiresAuth: true, category: 'operations' },
  { path: '/subcontractors', title: 'Subcontractors', component: 'Subcontractors', requiresAuth: true, category: 'operations' },
  { path: '/driver', title: 'Driver App', component: 'DriverPage', requiresAuth: true, category: 'operations' },
  
  // Compliance
  { path: '/hazardous', title: 'Hazardous Notes', component: 'HazardousConsignmentNote', requiresAuth: true, category: 'compliance' },
  { path: '/weighbridge', title: 'Weighbridge OCR', component: 'WeighbridgeOCR', requiresAuth: true, category: 'compliance' },
  { path: '/environmental', title: 'Environmental', component: 'Environmental', requiresAuth: true, category: 'compliance' },
  { path: '/gdpr-compliance', title: 'GDPR Compliance', component: 'GDPRCompliance', requiresAuth: true, requiredRole: 'admin', category: 'compliance' },
  { path: '/data-anonymization', title: 'Data Anonymization', component: 'DataAnonymization', requiresAuth: true, requiredRole: 'admin', category: 'compliance' },
  
  // Stock Management
  { path: '/stock', title: 'Stock Overview', component: 'StockOverview', requiresAuth: true, category: 'stock' },
  { path: '/stock/depots', title: 'Depots & Yards', component: 'DepotsManagement', requiresAuth: true, category: 'stock' },
  { path: '/stock/materials', title: 'Materials Catalog', component: 'MaterialsCatalog', requiresAuth: true, category: 'stock' },
  { path: '/stock/movements', title: 'Stock Movements', component: 'StockMovements', requiresAuth: true, category: 'stock' },
  { path: '/sales', title: 'Aggregate Sales', component: 'AggregateSales', requiresAuth: true, category: 'stock' },
  { path: '/purchases', title: 'Purchase Orders', component: 'PurchaseOrders', requiresAuth: true, category: 'stock' },
  { path: '/suppliers', title: 'Suppliers', component: 'Suppliers', requiresAuth: true, category: 'stock' },
  
  // Reports & Integrations
  { path: '/reports', title: 'Reports', component: 'Reports', requiresAuth: true, category: 'reports' },
  { path: '/integrations', title: 'Integrations', component: 'Integrations', requiresAuth: true, category: 'reports' },
  { path: '/credit-management', title: 'Credit Management', component: 'CreditManagement', requiresAuth: true, category: 'reports' },
  { path: '/customer-portal', title: 'Customer Portal', component: 'CustomerPortal', requiresAuth: true, requiredRole: 'operator_admin', category: 'reports' },
  { path: '/api-docs', title: 'API Documentation', component: 'APIDocumentation', requiresAuth: true, category: 'reports' },
  
  // Admin
  { path: '/admin', title: 'Admin Dashboard', component: 'Admin', requiresAuth: true, requiredRole: 'admin', category: 'admin' },
  { path: '/incident-runbook', title: 'Incident Runbook', component: 'IncidentRunbook', requiresAuth: true, requiredRole: 'admin', category: 'admin' },
];

export const getRoutesByCategory = (category: E2ERoute['category']) => 
  e2eRoutes.filter(route => route.category === category);

export const getCategoryLabel = (category: E2ERoute['category']): string => {
  const labels: Record<E2ERoute['category'], string> = {
    dashboard: 'Dashboard',
    ai: 'AI Tools',
    operations: 'Operations',
    compliance: 'Compliance',
    admin: 'Admin',
    stock: 'Stock Management',
    reports: 'Reports & Integrations',
  };
  return labels[category];
};
