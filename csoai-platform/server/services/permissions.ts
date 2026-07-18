/**
 * COAI Feature Permissions by Subscription Tier
 * 
 * This file defines which features are available at each subscription level.
 * Used by both frontend (to show/hide UI) and backend (to enforce access).
 */

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export interface FeaturePermissions {
  // Core Features
  aiSystemsLimit: number;
  pdcaCyclesLimit: number;
  assessmentsPerMonth: number;
  
  // Compliance Features
  complianceFrameworks: string[];
  complianceReports: boolean;
  complianceReportEmail: boolean;
  customAssessments: boolean;
  
  // Watchdog Features
  watchdogReports: boolean;
  watchdogAnalystAccess: boolean;
  priorityReportReview: boolean;
  
  // Council Features
  councilVoting: boolean;
  councilAnalytics: boolean;
  realTimeVoting: boolean;
  
  // Training & Certification
  trainingModules: boolean;
  certificationExams: boolean;
  teamTraining: boolean;
  
  // API & Integration
  apiAccess: boolean;
  apiKeysLimit: number;
  webhooks: boolean;
  sdkAccess: boolean;
  bulkOperations: boolean;
  
  // Reports & Analytics
  pdfReports: boolean;
  emailReports: boolean;
  advancedAnalytics: boolean;
  trendAnalysis: boolean;
  exportData: boolean;
  
  // Team & Organization
  teamMembers: number;
  organizationSettings: boolean;
  roleManagement: boolean;
  auditLogs: boolean;
  
  // Support
  supportLevel: 'community' | 'email' | 'priority' | 'dedicated';
  slaGuarantee: boolean;
  customIntegrations: boolean;
}

export const TIER_PERMISSIONS: Record<SubscriptionTier, FeaturePermissions> = {
  free: {
    // Core - Limited
    aiSystemsLimit: 3,
    pdcaCyclesLimit: 2,
    assessmentsPerMonth: 5,
    
    // Compliance - Basic
    complianceFrameworks: ['EU_AI_ACT'],
    complianceReports: false,
    complianceReportEmail: false,
    customAssessments: false,
    
    // Watchdog - Full access to submit
    watchdogReports: true,
    watchdogAnalystAccess: false,
    priorityReportReview: false,
    
    // Council - View only
    councilVoting: false,
    councilAnalytics: false,
    realTimeVoting: false,
    
    // Training - Basic
    trainingModules: true,
    certificationExams: true,
    teamTraining: false,
    
    // API - None
    apiAccess: false,
    apiKeysLimit: 0,
    webhooks: false,
    sdkAccess: false,
    bulkOperations: false,
    
    // Reports - None
    pdfReports: false,
    emailReports: false,
    advancedAnalytics: false,
    trendAnalysis: false,
    exportData: false,
    
    // Team - Solo
    teamMembers: 1,
    organizationSettings: false,
    roleManagement: false,
    auditLogs: false,
    
    // Support - Community
    supportLevel: 'community',
    slaGuarantee: false,
    customIntegrations: false,
  },
  
  pro: {
    // Core - Expanded
    aiSystemsLimit: 25,
    pdcaCyclesLimit: 20,
    assessmentsPerMonth: 50,
    
    // Compliance - Full frameworks
    complianceFrameworks: ['EU_AI_ACT', 'NIST_RMF', 'TC260'],
    complianceReports: true,
    complianceReportEmail: true,
    customAssessments: true,
    
    // Watchdog - Full
    watchdogReports: true,
    watchdogAnalystAccess: true,
    priorityReportReview: false,
    
    // Council - Participate
    councilVoting: true,
    councilAnalytics: true,
    realTimeVoting: false,
    
    // Training - Full
    trainingModules: true,
    certificationExams: true,
    teamTraining: true,
    
    // API - Limited
    apiAccess: true,
    apiKeysLimit: 5,
    webhooks: true,
    sdkAccess: true,
    bulkOperations: false,
    
    // Reports - Full
    pdfReports: true,
    emailReports: true,
    advancedAnalytics: true,
    trendAnalysis: false,
    exportData: true,
    
    // Team - Small team
    teamMembers: 10,
    organizationSettings: true,
    roleManagement: false,
    auditLogs: false,
    
    // Support - Email
    supportLevel: 'email',
    slaGuarantee: false,
    customIntegrations: false,
  },
  
  enterprise: {
    // Core - Unlimited
    aiSystemsLimit: -1, // -1 = unlimited
    pdcaCyclesLimit: -1,
    assessmentsPerMonth: -1,
    
    // Compliance - Everything
    complianceFrameworks: ['EU_AI_ACT', 'NIST_RMF', 'TC260', 'ISO_42001', 'CUSTOM'],
    complianceReports: true,
    complianceReportEmail: true,
    customAssessments: true,
    
    // Watchdog - Priority
    watchdogReports: true,
    watchdogAnalystAccess: true,
    priorityReportReview: true,
    
    // Council - Full access
    councilVoting: true,
    councilAnalytics: true,
    realTimeVoting: true,
    
    // Training - Enterprise
    trainingModules: true,
    certificationExams: true,
    teamTraining: true,
    
    // API - Full
    apiAccess: true,
    apiKeysLimit: -1,
    webhooks: true,
    sdkAccess: true,
    bulkOperations: true,
    
    // Reports - Everything
    pdfReports: true,
    emailReports: true,
    advancedAnalytics: true,
    trendAnalysis: true,
    exportData: true,
    
    // Team - Unlimited
    teamMembers: -1,
    organizationSettings: true,
    roleManagement: true,
    auditLogs: true,
    
    // Support - Dedicated
    supportLevel: 'dedicated',
    slaGuarantee: true,
    customIntegrations: true,
  },
};

/**
 * Check if a feature is available for a given tier
 */
export function hasFeature(tier: SubscriptionTier, feature: keyof FeaturePermissions): boolean {
  const permissions = TIER_PERMISSIONS[tier];
  const value = permissions[feature];
  
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (Array.isArray(value)) return value.length > 0;
  return !!value;
}

/**
 * Get the limit for a numeric feature
 */
export function getLimit(tier: SubscriptionTier, feature: keyof FeaturePermissions): number {
  const value = TIER_PERMISSIONS[tier][feature];
  return typeof value === 'number' ? value : 0;
}

/**
 * Check if user has reached their limit
 */
export function isAtLimit(tier: SubscriptionTier, feature: keyof FeaturePermissions, currentCount: number): boolean {
  const limit = getLimit(tier, feature);
  if (limit === -1) return false; // Unlimited
  return currentCount >= limit;
}

/**
 * Get upgrade message for a feature
 */
export function getUpgradeMessage(feature: keyof FeaturePermissions): string {
  const messages: Partial<Record<keyof FeaturePermissions, string>> = {
    apiAccess: 'Upgrade to Pro to access the API and integrate COAI with your systems.',
    bulkOperations: 'Upgrade to Enterprise for bulk AI system registration and management.',
    advancedAnalytics: 'Upgrade to Pro for advanced analytics and trend insights.',
    trendAnalysis: 'Upgrade to Enterprise for industry-wide trend analysis.',
    pdfReports: 'Upgrade to Pro to generate and download PDF compliance reports.',
    emailReports: 'Upgrade to Pro to email reports directly to stakeholders.',
    realTimeVoting: 'Upgrade to Enterprise for real-time council voting participation.',
    teamMembers: 'Upgrade your plan to add more team members.',
    auditLogs: 'Upgrade to Enterprise for comprehensive audit logging.',
    customIntegrations: 'Contact us for Enterprise custom integration options.',
  };
  
  return messages[feature] || 'Upgrade your plan to access this feature.';
}

/**
 * Feature categories for pricing page display
 */
export const FEATURE_CATEGORIES = {
  core: {
    title: 'Core Features',
    features: ['aiSystemsLimit', 'pdcaCyclesLimit', 'assessmentsPerMonth'],
  },
  compliance: {
    title: 'Compliance Management',
    features: ['complianceFrameworks', 'complianceReports', 'complianceReportEmail', 'customAssessments'],
  },
  watchdog: {
    title: 'Watchdog & Safety',
    features: ['watchdogReports', 'watchdogAnalystAccess', 'priorityReportReview'],
  },
  council: {
    title: '33-Agent Council',
    features: ['councilVoting', 'councilAnalytics', 'realTimeVoting'],
  },
  training: {
    title: 'Training & Certification',
    features: ['trainingModules', 'certificationExams', 'teamTraining'],
  },
  api: {
    title: 'API & Integration',
    features: ['apiAccess', 'apiKeysLimit', 'webhooks', 'sdkAccess', 'bulkOperations'],
  },
  reports: {
    title: 'Reports & Analytics',
    features: ['pdfReports', 'emailReports', 'advancedAnalytics', 'trendAnalysis', 'exportData'],
  },
  team: {
    title: 'Team & Organization',
    features: ['teamMembers', 'organizationSettings', 'roleManagement', 'auditLogs'],
  },
  support: {
    title: 'Support',
    features: ['supportLevel', 'slaGuarantee', 'customIntegrations'],
  },
};
