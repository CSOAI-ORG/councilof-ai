import { TRPCError } from '@trpc/server';
import { 
  SubscriptionTier, 
  FeaturePermissions, 
  hasFeature, 
  getLimit,
  getUpgradeMessage 
} from '../shared/permissions';

/**
 * Check if user has permission to access a feature
 * Throws TRPCError if access denied
 */
export function checkPermission(
  userTier: SubscriptionTier | null | undefined,
  feature: keyof FeaturePermissions
): void {
  const tier = userTier || 'free';
  
  if (!hasFeature(tier, feature)) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: getUpgradeMessage(feature),
    });
  }
}

/**
 * Check if user is within their limit for a feature
 * Throws TRPCError if at limit
 */
export function checkLimit(
  userTier: SubscriptionTier | null | undefined,
  feature: keyof FeaturePermissions,
  currentCount: number
): void {
  const tier = userTier || 'free';
  const limit = getLimit(tier, feature);
  
  if (limit !== -1 && currentCount >= limit) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `You've reached your ${feature} limit. ${getUpgradeMessage(feature)}`,
    });
  }
}

/**
 * Get user's tier from context
 */
export function getUserTier(user: { subscriptionTier?: string | null } | null): SubscriptionTier {
  if (!user?.subscriptionTier) return 'free';
  return user.subscriptionTier as SubscriptionTier;
}

/**
 * Feature requirements for different operations
 */
export const OPERATION_REQUIREMENTS: Record<string, keyof FeaturePermissions> = {
  // API operations
  'api.createKey': 'apiAccess',
  'api.bulkRegister': 'bulkOperations',
  
  // Report operations
  'report.generatePdf': 'pdfReports',
  'report.sendEmail': 'emailReports',
  
  // Analytics operations
  'analytics.trends': 'trendAnalysis',
  'analytics.advanced': 'advancedAnalytics',
  
  // Council operations
  'council.vote': 'councilVoting',
  'council.realtime': 'realTimeVoting',
  
  // Team operations
  'team.invite': 'teamMembers',
  'team.roles': 'roleManagement',
  'team.audit': 'auditLogs',
};
