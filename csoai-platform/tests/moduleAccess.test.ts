/**
 * Module Access Test
 * 
 * Verify that NIST and ISO modules are accessible through the courses API
 */

import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";

describe("Module Access", () => {
  it("should return NIST course with all 8 modules and comprehensive content", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const caller = appRouter.createCaller({
      db,
      user: null,
      sessionId: "test-session",
      req: {} as any,
      res: {} as any,
    });

    const course = await caller.courses.getCourseDetails({ courseId: 2 });

    expect(course).toBeDefined();
    expect(course.title).toBe('NIST AI RMF Fundamentals');
    expect(course.modules).toBeDefined();
    expect(course.modules).toHaveLength(8);
    
    // Check Module 2 (Trustworthy AI Characteristics) has comprehensive content
    const module2 = course.modules[1];
    expect(module2.title).toBe('Trustworthy AI Characteristics');
    expect(module2.content.length).toBeGreaterThan(4000); // Should be ~4,626 words
    expect(module2.content).toContain('# Trustworthy AI Characteristics');
    
    console.log(`\n✅ NIST Course Verified:`);
    console.log(`   Modules: ${course.modules.length}`);
    console.log(`   Module 2 content length: ${module2.content.length} characters`);
  });

  it("should return ISO 42001 course with all 8 modules and comprehensive content", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const caller = appRouter.createCaller({
      db,
      user: null,
      sessionId: "test-session",
      req: {} as any,
      res: {} as any,
    });

    const course = await caller.courses.getCourseDetails({ courseId: 3 });

    expect(course).toBeDefined();
    expect(course.title).toBe('EU AI Act Conformity Assessment');
    expect(course.modules).toBeDefined();
    expect(course.modules).toHaveLength(8);
    
    // Check Module 2 (AIMS Requirements) has comprehensive content
    const module2 = course.modules[1];
    expect(module2.title).toBe('AIMS Requirements and Structure');
    expect(module2.content.length).toBeGreaterThan(3500); // Should be ~3,911 words
    expect(module2.content).toContain('# AIMS Requirements and Structure');
    
    console.log(`\n✅ ISO 42001 Course Verified:`);
    console.log(`   Modules: ${course.modules.length}`);
    console.log(`   Module 2 content length: ${module2.content.length} characters\n`);
  });
});
