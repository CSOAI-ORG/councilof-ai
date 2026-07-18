/**
 * Tests for RLMAI Recommendations Tracking System
 */

import { describe, it, expect, vi } from 'vitest';
import { appRouter } from './routers';
import type { TrpcContext } from './_core/context';

// Mock the database
vi.mock('./db', () => ({
  getDb: vi.fn().mockResolvedValue(null),
}));

type AuthenticatedUser = NonNullable<TrpcContext['user']>;

function createMockContext(authenticated: boolean = false): TrpcContext {
  const user: AuthenticatedUser | null = authenticated ? {
    id: 1,
    openId: 'test-user-123',
    email: 'test@example.com',
    name: 'Test User',
    loginMethod: 'manus',
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  } : null;

  return {
    user,
    req: {
      protocol: 'https',
      headers: {},
    } as TrpcContext['req'],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext['res'],
  };
}

describe('Recommendations Tracking System', () => {
  describe('trackInteraction', () => {
    it('should require authentication', async () => {
      const ctx = createMockContext(false);
      const caller = appRouter.createCaller(ctx);
      
      await expect(caller.recommendations.trackInteraction({
        recommendationId: 'test-rec',
        recommendationType: 'compliance_gap',
        action: 'viewed',
      })).rejects.toThrow();
    });

    it('should require database for mutation (throws when db unavailable)', async () => {
      const ctx = createMockContext(true);
      const caller = appRouter.createCaller(ctx);
      
      // Since db is mocked to return null, this should throw "Database not available"
      await expect(caller.recommendations.trackInteraction({
        recommendationId: 'test-rec-123',
        recommendationType: 'compliance_gap',
        action: 'viewed',
      })).rejects.toThrow('Database not available');
    });
  });

  describe('getInteractionHistory', () => {
    it('should return empty array when no database', async () => {
      const ctx = createMockContext(true);
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.recommendations.getInteractionHistory({});
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should require authentication', async () => {
      const ctx = createMockContext(false);
      const caller = appRouter.createCaller(ctx);
      
      await expect(caller.recommendations.getInteractionHistory({}))
        .rejects.toThrow();
    });
  });

  describe('getDismissedIds', () => {
    it('should return empty arrays when no database', async () => {
      const ctx = createMockContext(true);
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.recommendations.getDismissedIds();
      
      expect(result).toHaveProperty('dismissedIds');
      expect(result).toHaveProperty('snoozedIds');
      expect(Array.isArray(result.dismissedIds)).toBe(true);
      expect(Array.isArray(result.snoozedIds)).toBe(true);
      expect(result.dismissedIds.length).toBe(0);
      expect(result.snoozedIds.length).toBe(0);
    });

    it('should require authentication', async () => {
      const ctx = createMockContext(false);
      const caller = appRouter.createCaller(ctx);
      
      await expect(caller.recommendations.getDismissedIds())
        .rejects.toThrow();
    });
  });

  describe('getStats', () => {
    it('should return null when no database', async () => {
      const ctx = createMockContext(true);
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.recommendations.getStats();
      
      expect(result).toBeNull();
    });

    it('should require authentication', async () => {
      const ctx = createMockContext(false);
      const caller = appRouter.createCaller(ctx);
      
      await expect(caller.recommendations.getStats())
        .rejects.toThrow();
    });
  });

  describe('getPreferences', () => {
    it('should return null when no database', async () => {
      const ctx = createMockContext(true);
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.recommendations.getPreferences();
      
      // Returns null when db is not available
      expect(result).toBeNull();
    });

    it('should require authentication', async () => {
      const ctx = createMockContext(false);
      const caller = appRouter.createCaller(ctx);
      
      await expect(caller.recommendations.getPreferences())
        .rejects.toThrow();
    });
  });

  describe('updatePreferences', () => {
    it('should require authentication', async () => {
      const ctx = createMockContext(false);
      const caller = appRouter.createCaller(ctx);
      
      await expect(caller.recommendations.updatePreferences({
        complianceGapWeight: 80,
      })).rejects.toThrow();
    });

    it('should require database for mutation', async () => {
      const ctx = createMockContext(true);
      const caller = appRouter.createCaller(ctx);
      
      await expect(caller.recommendations.updatePreferences({
        complianceGapWeight: 90,
      })).rejects.toThrow('Database not available');
    });
  });

  describe('getAnalytics', () => {
    it('should return empty array when no database', async () => {
      const ctx = createMockContext(true);
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.recommendations.getAnalytics({
        periodType: 'monthly',
        limit: 6,
      });
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should require authentication', async () => {
      const ctx = createMockContext(false);
      const caller = appRouter.createCaller(ctx);
      
      await expect(caller.recommendations.getAnalytics({}))
        .rejects.toThrow();
    });
  });

  describe('Recommendations with Tracking Integration', () => {
    it('should include dismissedCount and snoozedCount in response', async () => {
      const ctx = createMockContext(true);
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.recommendations.getRecommendations({});
      
      expect(result).toHaveProperty('dismissedCount');
      expect(result).toHaveProperty('snoozedCount');
      expect(typeof result.dismissedCount).toBe('number');
      expect(typeof result.snoozedCount).toBe('number');
    });

    it('should support includeDismissed parameter', async () => {
      const ctx = createMockContext(true);
      const caller = appRouter.createCaller(ctx);
      
      // Without includeDismissed (default false)
      const withoutDismissed = await caller.recommendations.getRecommendations({
        includeDismissed: false,
      });
      
      // With includeDismissed
      const withDismissed = await caller.recommendations.getRecommendations({
        includeDismissed: true,
      });
      
      // Both should return valid responses
      expect(withoutDismissed).toHaveProperty('recommendations');
      expect(withDismissed).toHaveProperty('recommendations');
    });

    it('should return recommendations sorted by priority and category weight', async () => {
      const ctx = createMockContext(true);
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.recommendations.getRecommendations({
        limit: 20,
      });
      
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('summary');
      
      // Verify priority order (critical should come before high, etc.)
      const priorities = result.recommendations.map(r => r.priority);
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      
      for (let i = 1; i < priorities.length; i++) {
        expect(priorityOrder[priorities[i] as keyof typeof priorityOrder])
          .toBeGreaterThanOrEqual(priorityOrder[priorities[i-1] as keyof typeof priorityOrder]);
      }
    });
  });

  describe('Input Validation', () => {
    it('should validate trackInteraction action enum', async () => {
      const ctx = createMockContext(true);
      const caller = appRouter.createCaller(ctx);
      
      // Invalid action should fail validation (before hitting db)
      await expect(caller.recommendations.trackInteraction({
        recommendationId: 'test',
        recommendationType: 'compliance_gap',
        action: 'invalid_action' as any,
      })).rejects.toThrow();
    });

    it('should validate trackInteraction feedback enum', async () => {
      const ctx = createMockContext(true);
      const caller = appRouter.createCaller(ctx);
      
      // Invalid feedback should fail validation
      await expect(caller.recommendations.trackInteraction({
        recommendationId: 'test',
        recommendationType: 'compliance_gap',
        action: 'viewed',
        feedback: 'invalid_feedback' as any,
      })).rejects.toThrow();
    });

    it('should validate snoozeDays range', async () => {
      const ctx = createMockContext(true);
      const caller = appRouter.createCaller(ctx);
      
      // snoozeDays must be between 1 and 90
      await expect(caller.recommendations.trackInteraction({
        recommendationId: 'test',
        recommendationType: 'compliance_gap',
        action: 'snoozed',
        snoozeDays: 0, // Invalid: less than 1
      })).rejects.toThrow();
      
      await expect(caller.recommendations.trackInteraction({
        recommendationId: 'test',
        recommendationType: 'compliance_gap',
        action: 'snoozed',
        snoozeDays: 100, // Invalid: greater than 90
      })).rejects.toThrow();
    });

    it('should validate updatePreferences weight ranges', async () => {
      const ctx = createMockContext(true);
      const caller = appRouter.createCaller(ctx);
      
      // Weights must be between 0 and 100
      await expect(caller.recommendations.updatePreferences({
        complianceGapWeight: -10, // Invalid: less than 0
      })).rejects.toThrow();
      
      await expect(caller.recommendations.updatePreferences({
        complianceGapWeight: 150, // Invalid: greater than 100
      })).rejects.toThrow();
    });

    it('should validate getInteractionHistory limit range', async () => {
      const ctx = createMockContext(true);
      const caller = appRouter.createCaller(ctx);
      
      // Limit must be between 1 and 100
      await expect(caller.recommendations.getInteractionHistory({
        limit: 0, // Invalid: less than 1
      })).rejects.toThrow();
      
      await expect(caller.recommendations.getInteractionHistory({
        limit: 200, // Invalid: greater than 100
      })).rejects.toThrow();
    });

    it('should validate getAnalytics periodType enum', async () => {
      const ctx = createMockContext(true);
      const caller = appRouter.createCaller(ctx);
      
      // Invalid periodType should fail
      await expect(caller.recommendations.getAnalytics({
        periodType: 'yearly' as any, // Invalid
      })).rejects.toThrow();
    });
  });
});
