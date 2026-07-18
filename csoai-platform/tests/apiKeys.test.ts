import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database
vi.mock("./db", () => ({
  getDb: vi.fn(() => ({
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => Promise.resolve([])),
          limit: vi.fn(() => Promise.resolve([])),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        $returningId: vi.fn(() => Promise.resolve([{ id: 1 }])),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve()),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => Promise.resolve()),
    })),
  })),
}));

describe("API Keys Router", () => {
  const mockUser = {
    id: 1,
    openId: "test-user-123",
    name: "Test User",
    email: "test@example.com",
    role: "user" as const,
    loginMethod: "oauth" as const,
    lastSignedIn: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const createContext = (user: typeof mockUser | null = mockUser): TrpcContext => ({
    user,
    req: {} as any,
    res: {
      cookie: vi.fn(),
      clearCookie: vi.fn(),
    } as any,
  });

  const caller = (ctx: TrpcContext) => appRouter.createCaller(ctx);

  describe("apiKeys.list", () => {
    it("should return empty array when no API keys exist", async () => {
      const ctx = createContext();
      const result = await caller(ctx).apiKeys.list();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should require authentication", async () => {
      const ctx = createContext(null);
      await expect(caller(ctx).apiKeys.list()).rejects.toThrow();
    });
  });

  describe("apiKeys.create", () => {
    it("should create a new API key with correct structure", async () => {
      const ctx = createContext();
      const result = await caller(ctx).apiKeys.create({
        name: "Test API Key",
        tier: "free",
        expiresInDays: 90,
      });

      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("key");
      expect(result).toHaveProperty("name", "Test API Key");
      expect(result).toHaveProperty("tier", "free");
      expect(result).toHaveProperty("rateLimit", 100);
      expect(result.key).toMatch(/^coai_/);
    });

    it("should set correct rate limit for pro tier", async () => {
      const ctx = createContext();
      const result = await caller(ctx).apiKeys.create({
        name: "Pro API Key",
        tier: "pro",
      });

      expect(result.rateLimit).toBe(500);
    });

    it("should set correct rate limit for enterprise tier", async () => {
      const ctx = createContext();
      const result = await caller(ctx).apiKeys.create({
        name: "Enterprise API Key",
        tier: "enterprise",
      });

      expect(result.rateLimit).toBe(1000);
    });

    it("should require authentication", async () => {
      const ctx = createContext(null);
      await expect(
        caller(ctx).apiKeys.create({
          name: "Test Key",
          tier: "free",
        })
      ).rejects.toThrow();
    });

    it("should validate name is not empty", async () => {
      const ctx = createContext();
      await expect(
        caller(ctx).apiKeys.create({
          name: "",
          tier: "free",
        })
      ).rejects.toThrow();
    });
  });

  describe("apiKeys.revoke", () => {
    it("should require authentication", async () => {
      const ctx = createContext(null);
      await expect(caller(ctx).apiKeys.revoke({ id: 1 })).rejects.toThrow();
    });
  });

  describe("apiKeys.delete", () => {
    it("should require authentication", async () => {
      const ctx = createContext(null);
      await expect(caller(ctx).apiKeys.delete({ id: 1 })).rejects.toThrow();
    });
  });
});

describe("API Key Generation", () => {
  it("should generate keys with coai_ prefix", async () => {
    const ctx: TrpcContext = {
      user: {
        id: 1,
        openId: "test-user-123",
        name: "Test User",
        email: "test@example.com",
        role: "user" as const,
        loginMethod: "oauth" as const,
        lastSignedIn: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      req: {} as any,
      res: {
        cookie: vi.fn(),
        clearCookie: vi.fn(),
      } as any,
    };

    const result = await appRouter.createCaller(ctx).apiKeys.create({
      name: "Test Key",
      tier: "free",
    });

    expect(result.key).toMatch(/^coai_[a-f0-9]{64}$/);
  });

  it("should generate unique keys", async () => {
    const ctx: TrpcContext = {
      user: {
        id: 1,
        openId: "test-user-123",
        name: "Test User",
        email: "test@example.com",
        role: "user" as const,
        loginMethod: "oauth" as const,
        lastSignedIn: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      req: {} as any,
      res: {
        cookie: vi.fn(),
        clearCookie: vi.fn(),
      } as any,
    };

    const result1 = await appRouter.createCaller(ctx).apiKeys.create({
      name: "Key 1",
      tier: "free",
    });

    const result2 = await appRouter.createCaller(ctx).apiKeys.create({
      name: "Key 2",
      tier: "free",
    });

    expect(result1.key).not.toBe(result2.key);
  });
});
