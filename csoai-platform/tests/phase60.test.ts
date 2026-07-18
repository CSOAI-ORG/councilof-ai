/**
 * Phase 60 Tests - Application Status Tracking & Email Digests
 */

import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "../routers";
import type { Context } from "../_core/trpc";
import { getDb } from "../db";
import { jobApplications, notificationPreferences } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

// Mock context for testing
const mockContext: Context = {
  user: {
    id: "1",
    openId: "test-open-id",
    name: "Test User",
    email: "test@example.com",
    role: "user",
  },
};

const caller = appRouter.createCaller(mockContext);

describe("Phase 60 - Application Status Tracking", () => {
  it("should get user's job applications", async () => {
    const applications = await caller.jobs.getMyApplications();
    expect(Array.isArray(applications)).toBe(true);
  });

  it("should update application status", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create a test application first
    const [testApp] = await db
      .insert(jobApplications)
      .values({
        jobId: 1,
        userId: 1,
        applicantName: "Test User",
        applicantEmail: "test@example.com",
        coverLetter: "Test cover letter",
        status: "submitted",
      })
      .$returningId();

    // Update status
    const result = await caller.jobs.updateApplicationStatus({
      applicationId: testApp.id,
      status: "reviewed",
      employerResponse: "We are reviewing your application",
    });

    expect(result.success).toBe(true);

    // Verify update
    const [updated] = await db
      .select()
      .from(jobApplications)
      .where(eq(jobApplications.id, testApp.id))
      .limit(1);

    expect(updated.status).toBe("reviewing");
    expect(updated.employerResponse).toBe("We are reviewing your application");
    expect(updated.statusUpdatedAt).toBeTruthy();

    // Cleanup
    await db.delete(jobApplications).where(eq(jobApplications.id, testApp.id));
  });
});

describe("Phase 60 - Email Digest Notifications", () => {
  it("should update digest preferences", async () => {
    const result = await caller.notifications.updatePreferences({
      digestEnabled: true,
      digestFrequency: "daily",
    });

    expect(result.success).toBe(true);
  });

  it("should get preferences with digest settings", async () => {
    const prefs = await caller.notifications.getPreferences();
    expect(prefs).toBeTruthy();
    expect(typeof prefs.digestEnabled).toBe("boolean");
    expect(["daily", "weekly"].includes(prefs.digestFrequency || "daily")).toBe(true);
  });

  it("should toggle digest frequency", async () => {
    // Set to daily
    await caller.notifications.updatePreferences({
      digestEnabled: true,
      digestFrequency: "daily",
    });

    let prefs = await caller.notifications.getPreferences();
    expect(prefs.digestFrequency).toBe("daily");

    // Change to weekly
    await caller.notifications.updatePreferences({
      digestFrequency: "weekly",
    });

    prefs = await caller.notifications.getPreferences();
    expect(prefs.digestFrequency).toBe("weekly");
  });
});

describe("Phase 60 - Integration Tests", () => {
  it("should track application status history", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create test application
    const [testApp] = await db
      .insert(jobApplications)
      .values({
        jobId: 1,
        userId: 1,
        applicantName: "Test User",
        applicantEmail: "test@example.com",
        status: "submitted",
      })
      .$returningId();

    // Update to reviewing
    await caller.jobs.updateApplicationStatus({
      applicationId: testApp.id,
      status: "reviewed",
      employerResponse: "Under review",
    });

    // Update to accepted
    await caller.jobs.updateApplicationStatus({
      applicationId: testApp.id,
      status: "accepted",
      employerResponse: "Congratulations! You've been accepted.",
    });

    // Get final state
    const [final] = await db
      .select()
      .from(jobApplications)
      .where(eq(jobApplications.id, testApp.id))
      .limit(1);

    expect(final.status).toBe("accepted");
    expect(final.employerResponse).toBe("Congratulations! You've been accepted.");
    expect(final.statusUpdatedAt).toBeTruthy();

    // Cleanup
    await db.delete(jobApplications).where(eq(jobApplications.id, testApp.id));
  });

  it("should handle My Applications page data structure", async () => {
    const applications = await caller.jobs.getMyApplications();

    if (applications.length > 0) {
      const app = applications[0];
      expect(app).toHaveProperty("id");
      expect(app).toHaveProperty("jobId");
      expect(app).toHaveProperty("status");
      expect(app).toHaveProperty("jobTitle");
      expect(app).toHaveProperty("company");
      expect(app).toHaveProperty("location");
      expect(app).toHaveProperty("appliedAt");
    }
  });
});
