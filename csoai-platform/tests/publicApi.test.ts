/**
 * Tests for Public API Router - RLMAI and Transparency Endpoints
 */

import { describe, it, expect, vi } from 'vitest';
import { appRouter } from './routers';
import type { TrpcContext } from './_core/context';

// Mock the database
vi.mock('./db', () => ({
  getDb: vi.fn().mockResolvedValue(null),
}));

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: 'https',
      headers: {},
    } as TrpcContext['req'],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext['res'],
  };
}

describe('Public API Router', () => {
  const ctx = createPublicContext();
  const caller = appRouter.createCaller(ctx);

  describe('getIncidentStats', () => {
    it('should return null when DB not available', async () => {
      const result = await caller.publicApi.getIncidentStats();
      expect(result).toBeNull();
    });
  });

  describe('getRecentIncidents', () => {
    it('should return empty array when DB not available', async () => {
      const result = await caller.publicApi.getRecentIncidents({});
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should accept limit parameter', async () => {
      const result = await caller.publicApi.getRecentIncidents({ limit: 5 });
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getCouncilStats', () => {
    it('should return null when DB not available', async () => {
      const result = await caller.publicApi.getCouncilStats();
      expect(result).toBeNull();
    });
  });

  describe('getFrameworkStats', () => {
    it('should return null when DB not available', async () => {
      const result = await caller.publicApi.getFrameworkStats();
      expect(result).toBeNull();
    });
  });

  describe('getIndustryOverview', () => {
    it('should return null when DB not available', async () => {
      const result = await caller.publicApi.getIndustryOverview();
      expect(result).toBeNull();
    });
  });

  describe('getRLMAILearnings', () => {
    it('should return null when DB not available', async () => {
      const result = await caller.publicApi.getRLMAILearnings();
      expect(result).toBeNull();
    });
  });

  describe('getIncidentPatterns', () => {
    it('should return null when DB not available', async () => {
      const result = await caller.publicApi.getIncidentPatterns();
      expect(result).toBeNull();
    });
  });

  describe('getComplianceLeaderboard', () => {
    it('should return empty array when DB not available', async () => {
      const result = await caller.publicApi.getComplianceLeaderboard({});
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should accept limit parameter', async () => {
      const result = await caller.publicApi.getComplianceLeaderboard({ limit: 5 });
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
