/**
 * Tests for RLMAI Recommendations Router
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

describe('Recommendations Router', () => {
  describe('getRecommendations', () => {
    it('should return recommendations for authenticated user', async () => {
      const ctx = createMockContext(true);
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.recommendations.getRecommendations({});
      
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('totalCount');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('generatedAt');
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.summary).toHaveProperty('critical');
      expect(result.summary).toHaveProperty('high');
      expect(result.summary).toHaveProperty('medium');
      expect(result.summary).toHaveProperty('low');
    });

    it('should filter by category when specified', async () => {
      const ctx = createMockContext(true);
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.recommendations.getRecommendations({
        category: 'compliance_gap',
      });
      
      expect(result).toHaveProperty('recommendations');
      // All recommendations should be of the specified category
      result.recommendations.forEach(rec => {
        expect(rec.category).toBe('compliance_gap');
      });
    });

    it('should filter by priority when specified', async () => {
      const ctx = createMockContext(true);
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.recommendations.getRecommendations({
        priority: 'critical',
      });
      
      expect(result).toHaveProperty('recommendations');
      // All recommendations should be of the specified priority
      result.recommendations.forEach(rec => {
        expect(rec.priority).toBe('critical');
      });
    });

    it('should respect limit parameter', async () => {
      const ctx = createMockContext(true);
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.recommendations.getRecommendations({
        limit: 5,
      });
      
      expect(result.recommendations.length).toBeLessThanOrEqual(5);
    });

    it('should require authentication', async () => {
      const ctx = createMockContext(false);
      const caller = appRouter.createCaller(ctx);
      
      await expect(caller.recommendations.getRecommendations({}))
        .rejects.toThrow();
    });
  });

  describe('getCategories', () => {
    it('should return recommendation categories for authenticated user', async () => {
      const ctx = createMockContext(true);
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.recommendations.getCategories();
      
      expect(result).toHaveProperty('categories');
      expect(result).toHaveProperty('systemCount');
      expect(Array.isArray(result.categories)).toBe(true);
      expect(result.categories.length).toBeGreaterThan(0);
      
      // Check category structure
      const category = result.categories[0];
      expect(category).toHaveProperty('id');
      expect(category).toHaveProperty('name');
      expect(category).toHaveProperty('description');
      expect(category).toHaveProperty('icon');
    });

    it('should include all expected category types', async () => {
      const ctx = createMockContext(true);
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.recommendations.getCategories();
      
      const categoryIds = result.categories.map(c => c.id);
      expect(categoryIds).toContain('compliance_gap');
      expect(categoryIds).toContain('incident_prevention');
      expect(categoryIds).toContain('governance_improvement');
      expect(categoryIds).toContain('risk_mitigation');
      expect(categoryIds).toContain('best_practice');
      expect(categoryIds).toContain('regulatory_update');
    });

    it('should require authentication', async () => {
      const ctx = createMockContext(false);
      const caller = appRouter.createCaller(ctx);
      
      await expect(caller.recommendations.getCategories())
        .rejects.toThrow();
    });
  });

  describe('getPublicRecommendations', () => {
    it('should return public recommendations without authentication', async () => {
      const ctx = createMockContext(false);
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.recommendations.getPublicRecommendations({});
      
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('generatedAt');
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should respect limit parameter', async () => {
      const ctx = createMockContext(false);
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.recommendations.getPublicRecommendations({
        limit: 3,
      });
      
      expect(result.recommendations.length).toBeLessThanOrEqual(3);
    });

    it('should return recommendations with correct structure', async () => {
      const ctx = createMockContext(false);
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.recommendations.getPublicRecommendations({});
      
      if (result.recommendations.length > 0) {
        const rec = result.recommendations[0];
        expect(rec).toHaveProperty('id');
        expect(rec).toHaveProperty('title');
        expect(rec).toHaveProperty('description');
        expect(rec).toHaveProperty('priority');
        expect(rec).toHaveProperty('category');
        expect(rec).toHaveProperty('actionItems');
        expect(rec).toHaveProperty('basedOn');
        expect(rec).toHaveProperty('estimatedEffort');
        expect(rec).toHaveProperty('potentialImpact');
        expect(rec).toHaveProperty('createdAt');
        expect(Array.isArray(rec.actionItems)).toBe(true);
      }
    });

    it('should return incident prevention category recommendations', async () => {
      const ctx = createMockContext(false);
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.recommendations.getPublicRecommendations({});
      
      // Public recommendations are based on incident patterns
      result.recommendations.forEach(rec => {
        expect(rec.category).toBe('incident_prevention');
      });
    });
  });

  describe('Recommendation Structure', () => {
    it('should have valid priority values', async () => {
      const ctx = createMockContext(true);
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.recommendations.getRecommendations({});
      
      const validPriorities = ['critical', 'high', 'medium', 'low'];
      result.recommendations.forEach(rec => {
        expect(validPriorities).toContain(rec.priority);
      });
    });

    it('should have valid category values', async () => {
      const ctx = createMockContext(true);
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.recommendations.getRecommendations({});
      
      const validCategories = [
        'compliance_gap',
        'incident_prevention',
        'governance_improvement',
        'risk_mitigation',
        'best_practice',
        'regulatory_update',
      ];
      result.recommendations.forEach(rec => {
        expect(validCategories).toContain(rec.category);
      });
    });

    it('should have valid effort and impact values', async () => {
      const ctx = createMockContext(true);
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.recommendations.getRecommendations({});
      
      const validLevels = ['low', 'medium', 'high'];
      result.recommendations.forEach(rec => {
        expect(validLevels).toContain(rec.estimatedEffort);
        expect(validLevels).toContain(rec.potentialImpact);
      });
    });

    it('should have non-empty action items', async () => {
      const ctx = createMockContext(true);
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.recommendations.getRecommendations({});
      
      result.recommendations.forEach(rec => {
        expect(rec.actionItems.length).toBeGreaterThan(0);
        rec.actionItems.forEach(item => {
          expect(typeof item).toBe('string');
          expect(item.length).toBeGreaterThan(0);
        });
      });
    });
  });
});
