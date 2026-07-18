/**
 * Shared Permissions Module
 * Defines role-based access control for the CSOAI platform
 */

// User roles in the system
export type UserRole =
  | 'user'
  | 'admin'
  | 'watchdog_analyst'
  | 'regulator'
  | 'enterprise_admin'
  | 'compliance_officer';

// Available features/permissions
export type Permission =
  | 'view:dashboard'
  | 'view:ai_systems'
  | 'create:ai_systems'
  | 'edit:ai_systems'
  | 'delete:ai_systems'
  | 'view:compliance'
  | 'start:assessment'
  | 'view:watchdog'
  | 'submit:report'
  | 'investigate:reports'
  | 'view:council'
  | 'trigger:voting'
  | 'view:training'
  | 'enroll:courses'
  | 'view:certification'
  | 'take:exams'
  | 'view:jobs'
  | 'apply:jobs'
  | 'post:jobs'
  | 'view:analytics'
  | 'manage:users'
  | 'manage:system'
  | 'view:billing'
  | 'manage:billing'
  | 'view:api_keys'
  | 'manage:api_keys';

// Role to permissions mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  user: [
    'view:dashboard',
    'view:ai_systems',
    'view:compliance',
    'view:watchdog',
    'submit:report',
    'view:council',
    'view:training',
    'enroll:courses',
    'view:certification',
    'take:exams',
    'view:jobs',
    'apply:jobs',
  ],
  watchdog_analyst: [
    'view:dashboard',
    'view:ai_systems',
    'view:compliance',
    'view:watchdog',
    'submit:report',
    'investigate:reports',
    'view:council',
    'view:training',
    'enroll:courses',
    'view:certification',
    'take:exams',
    'view:jobs',
    'apply:jobs',
    'view:analytics',
  ],
  regulator: [
    'view:dashboard',
    'view:ai_systems',
    'view:compliance',
    'view:watchdog',
    'submit:report',
    'investigate:reports',
    'view:council',
    'trigger:voting',
    'view:training',
    'view:certification',
    'view:jobs',
    'view:analytics',
  ],
  enterprise_admin: [
    'view:dashboard',
    'view:ai_systems',
    'create:ai_systems',
    'edit:ai_systems',
    'delete:ai_systems',
    'view:compliance',
    'start:assessment',
    'view:watchdog',
    'submit:report',
    'view:council',
    'view:training',
    'enroll:courses',
    'view:certification',
    'take:exams',
    'view:jobs',
    'post:jobs',
    'view:billing',
    'manage:billing',
    'view:api_keys',
    'manage:api_keys',
  ],
  compliance_officer: [
    'view:dashboard',
    'view:ai_systems',
    'create:ai_systems',
    'edit:ai_systems',
    'view:compliance',
    'start:assessment',
    'view:watchdog',
    'submit:report',
    'view:council',
    'view:training',
    'enroll:courses',
    'view:certification',
    'take:exams',
    'view:jobs',
    'apply:jobs',
    'view:billing',
    'view:api_keys',
  ],
  admin: [
    'view:dashboard',
    'view:ai_systems',
    'create:ai_systems',
    'edit:ai_systems',
    'delete:ai_systems',
    'view:compliance',
    'start:assessment',
    'view:watchdog',
    'submit:report',
    'investigate:reports',
    'view:council',
    'trigger:voting',
    'view:training',
    'enroll:courses',
    'view:certification',
    'take:exams',
    'view:jobs',
    'apply:jobs',
    'post:jobs',
    'view:analytics',
    'manage:users',
    'manage:system',
    'view:billing',
    'manage:billing',
    'view:api_keys',
    'manage:api_keys',
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

/**
 * Check if a role can access a feature
 */
export function canAccess(role: UserRole, feature: string): boolean {
  const viewPermission = `view:${feature}` as Permission;
  return hasPermission(role, viewPermission);
}

/**
 * Subscription tiers and their features
 */
export type SubscriptionTier = 'free' | 'professional' | 'enterprise';

export const TIER_FEATURES: Record<SubscriptionTier, string[]> = {
  free: [
    'dashboard_basic',
    'watchdog_view',
    'watchdog_submit',
    'training_browse',
    'certification_view',
    'jobs_browse',
  ],
  professional: [
    'dashboard_basic',
    'dashboard_advanced',
    'ai_systems_5',
    'compliance_tracking',
    'watchdog_view',
    'watchdog_submit',
    'training_browse',
    'training_enroll',
    'certification_view',
    'certification_take',
    'jobs_browse',
    'jobs_apply',
    'api_basic',
  ],
  enterprise: [
    'dashboard_basic',
    'dashboard_advanced',
    'dashboard_analytics',
    'ai_systems_unlimited',
    'compliance_tracking',
    'compliance_automation',
    'council_access',
    'watchdog_view',
    'watchdog_submit',
    'watchdog_investigate',
    'training_browse',
    'training_enroll',
    'training_enterprise',
    'certification_view',
    'certification_take',
    'jobs_browse',
    'jobs_apply',
    'jobs_post',
    'api_full',
    'sso',
    'audit_logs',
    'dedicated_support',
  ],
};

/**
 * Check if a subscription tier has a feature
 */
export function tierHasFeature(tier: SubscriptionTier, feature: string): boolean {
  return TIER_FEATURES[tier]?.includes(feature) ?? false;
}

// Alias for backward compatibility
export const hasFeature = tierHasFeature;

// Feature permissions type (for backward compat)
export type FeaturePermissions = Permission;

// Tier permissions alias
export const TIER_PERMISSIONS = TIER_FEATURES;

// Feature limits by tier
const FEATURE_LIMITS: Record<SubscriptionTier, Record<string, number>> = {
  free: {
    ai_systems: 1,
    reports_per_month: 5,
    api_calls_per_day: 100,
  },
  professional: {
    ai_systems: 5,
    reports_per_month: 50,
    api_calls_per_day: 10000,
  },
  enterprise: {
    ai_systems: -1, // unlimited
    reports_per_month: -1,
    api_calls_per_day: -1,
  },
};

/**
 * Get the limit for a feature in a tier (-1 = unlimited)
 */
export function getLimit(tier: SubscriptionTier, feature: string): number {
  return FEATURE_LIMITS[tier]?.[feature] ?? 0;
}

/**
 * Check if a user is at their limit for a feature
 */
export function isAtLimit(tier: SubscriptionTier, feature: string, current: number): boolean {
  const limit = getLimit(tier, feature);
  if (limit === -1) return false; // unlimited
  return current >= limit;
}

/**
 * Get upgrade message for a feature
 */
export function getUpgradeMessage(tier: SubscriptionTier, feature: string): string {
  if (tier === 'free') {
    return 'Upgrade to Professional to unlock this feature';
  }
  if (tier === 'professional') {
    return 'Upgrade to Enterprise for unlimited access';
  }
  return '';
}
