/**
 * Module Population Test
 * 
 * Test to populate NIST and ISO module content into database
 */

import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";

describe("Module Population", () => {
  it("should populate NIST and ISO module content", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const caller = appRouter.createCaller({
      db,
      user: null,
      sessionId: "test-session",
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.modulePopulation.populateModules();

    expect(result.success).toBe(true);
    expect(result.stats.nistModulesUpdated).toBe(7);
    expect(result.stats.isoModulesUpdated).toBe(7);
    expect(result.stats.totalWords).toBe(47402);
    
    console.log('\n✅ Module Population Complete!');
    console.log(`   NIST AI RMF: ${result.stats.nistModulesUpdated} modules (${result.stats.nistWords} words)`);
    console.log(`   ISO 42001: ${result.stats.isoModulesUpdated} modules (${result.stats.isoWords} words)`);
    console.log(`   Total: ${result.stats.totalWords} words\n`);
  }, 60000); // 60 second timeout for file reading and DB operations
});
