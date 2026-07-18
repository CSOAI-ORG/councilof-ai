import { describe, it, expect, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
}));

// Mock the LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{
      message: {
        content: "Test response"
      }
    }]
  }),
}));

// Mock notification
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(undefined),
}));

// Helper to create mock context
function createMockContext(user?: { id: number; role: string }): TrpcContext {
  return {
    user: user || null,
    req: {} as any,
    res: {
      clearCookie: vi.fn(),
    } as any,
  };
}

describe("PDCA Router", () => {
  describe("list", () => {
    it("should return empty array when database is not available", async () => {
      const ctx = createMockContext({ id: 1, role: "user" });
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.pdca.list();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });

    it("should accept status filter parameter", async () => {
      const ctx = createMockContext({ id: 1, role: "user" });
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.pdca.list({ status: "active" });
      expect(Array.isArray(result)).toBe(true);
    });

    it("should accept aiSystemId filter parameter", async () => {
      const ctx = createMockContext({ id: 1, role: "user" });
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.pdca.list({ aiSystemId: 1 });
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getById", () => {
    it("should return null when database is not available", async () => {
      const ctx = createMockContext({ id: 1, role: "user" });
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.pdca.getById({ id: 1 });
      expect(result).toBeNull();
    });

    it("should require authentication", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);
      
      await expect(caller.pdca.getById({ id: 1 })).rejects.toThrow();
    });
  });

  describe("create", () => {
    it("should require authentication", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);
      
      await expect(
        caller.pdca.create({
          aiSystemId: 1,
          planSummary: "Test plan summary for PDCA cycle",
        })
      ).rejects.toThrow();
    });

    it("should throw when database is not available", async () => {
      const ctx = createMockContext({ id: 1, role: "user" });
      const caller = appRouter.createCaller(ctx);
      
      await expect(
        caller.pdca.create({
          aiSystemId: 1,
          planSummary: "Test plan summary for PDCA cycle",
        })
      ).rejects.toThrow("Database not available");
    });

    it("should validate minimum plan summary length", async () => {
      const ctx = createMockContext({ id: 1, role: "user" });
      const caller = appRouter.createCaller(ctx);
      
      await expect(
        caller.pdca.create({
          aiSystemId: 1,
          planSummary: "Short",
        })
      ).rejects.toThrow();
    });
  });

  describe("updatePhase", () => {
    it("should require authentication", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);
      
      await expect(
        caller.pdca.updatePhase({
          id: 1,
          phase: "plan",
          summary: "Updated plan summary content",
        })
      ).rejects.toThrow();
    });

    it("should throw when database is not available", async () => {
      const ctx = createMockContext({ id: 1, role: "user" });
      const caller = appRouter.createCaller(ctx);
      
      await expect(
        caller.pdca.updatePhase({
          id: 1,
          phase: "plan",
          summary: "Updated plan summary content",
        })
      ).rejects.toThrow("Database not available");
    });

    it("should accept valid phase values", async () => {
      const ctx = createMockContext({ id: 1, role: "user" });
      const caller = appRouter.createCaller(ctx);
      
      // Test that all phase values are accepted by the schema
      const phases = ["plan", "do", "check", "act"] as const;
      for (const phase of phases) {
        await expect(
          caller.pdca.updatePhase({
            id: 1,
            phase,
            summary: "Updated summary content here",
          })
        ).rejects.toThrow("Database not available");
      }
    });
  });

  describe("advancePhase", () => {
    it("should require authentication", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);
      
      await expect(caller.pdca.advancePhase({ id: 1 })).rejects.toThrow();
    });

    it("should throw when database is not available", async () => {
      const ctx = createMockContext({ id: 1, role: "user" });
      const caller = appRouter.createCaller(ctx);
      
      await expect(
        caller.pdca.advancePhase({ id: 1 })
      ).rejects.toThrow("Database not available");
    });
  });

  describe("pause", () => {
    it("should require authentication", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);
      
      await expect(caller.pdca.pause({ id: 1 })).rejects.toThrow();
    });

    it("should throw when database is not available", async () => {
      const ctx = createMockContext({ id: 1, role: "user" });
      const caller = appRouter.createCaller(ctx);
      
      await expect(caller.pdca.pause({ id: 1 })).rejects.toThrow("Database not available");
    });
  });

  describe("resume", () => {
    it("should require authentication", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);
      
      await expect(caller.pdca.resume({ id: 1 })).rejects.toThrow();
    });

    it("should throw when database is not available", async () => {
      const ctx = createMockContext({ id: 1, role: "user" });
      const caller = appRouter.createCaller(ctx);
      
      await expect(caller.pdca.resume({ id: 1 })).rejects.toThrow("Database not available");
    });
  });

  describe("delete", () => {
    it("should require authentication", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);
      
      await expect(caller.pdca.delete({ id: 1 })).rejects.toThrow();
    });

    it("should throw when database is not available", async () => {
      const ctx = createMockContext({ id: 1, role: "user" });
      const caller = appRouter.createCaller(ctx);
      
      await expect(caller.pdca.delete({ id: 1 })).rejects.toThrow("Database not available");
    });
  });

  describe("getStats", () => {
    it("should require authentication", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);
      
      await expect(caller.pdca.getStats()).rejects.toThrow();
    });

    it("should return null when database is not available", async () => {
      const ctx = createMockContext({ id: 1, role: "user" });
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.pdca.getStats();
      expect(result).toBeNull();
    });
  });

  describe("generateReport", () => {
    it("should require authentication", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);
      
      await expect(caller.pdca.generateReport({ id: 1 })).rejects.toThrow();
    });

    it("should throw when database is not available", async () => {
      const ctx = createMockContext({ id: 1, role: "user" });
      const caller = appRouter.createCaller(ctx);
      
      await expect(
        caller.pdca.generateReport({ id: 1 })
      ).rejects.toThrow("Database not available");
    });

    it("should require a valid cycle ID", async () => {
      const ctx = createMockContext({ id: 1, role: "user" });
      const caller = appRouter.createCaller(ctx);
      
      await expect(
        caller.pdca.generateReport({ id: -1 })
      ).rejects.toThrow();
    });
  });

  describe("sendReport", () => {
    it("should require authentication", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);
      
      await expect(
        caller.pdca.sendReport({ id: 1, email: "test@example.com" })
      ).rejects.toThrow();
    });

    it("should throw when database is not available", async () => {
      const ctx = createMockContext({ id: 1, role: "user" });
      const caller = appRouter.createCaller(ctx);
      
      await expect(
        caller.pdca.sendReport({ id: 1, email: "test@example.com" })
      ).rejects.toThrow("Database not available");
    });

    it("should validate email format", async () => {
      const ctx = createMockContext({ id: 1, role: "user" });
      const caller = appRouter.createCaller(ctx);
      
      await expect(
        caller.pdca.sendReport({ id: 1, email: "invalid-email" })
      ).rejects.toThrow();
    });

    it("should require a valid cycle ID", async () => {
      const ctx = createMockContext({ id: 1, role: "user" });
      const caller = appRouter.createCaller(ctx);
      
      await expect(
        caller.pdca.sendReport({ id: -1, email: "test@example.com" })
      ).rejects.toThrow();
    });
  });
});
