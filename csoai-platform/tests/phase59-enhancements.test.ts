/**
 * Phase 59 Enhancements Tests
 * Tests for Jobs navigation, notification settings, and resume upload
 */

import { describe, it, expect } from "vitest";
import { appRouter } from "../routers";

// Mock user context
const mockUser = {
  id: "1",
  openId: "test-user",
  name: "Test User",
  email: "test@example.com",
  role: "user" as const,
};

const mockContext = {
  user: mockUser,
  req: {} as any,
  res: {} as any,
};

describe("File Upload Router", () => {
  it("should validate file size limits", async () => {
    const caller = appRouter.createCaller(mockContext);

    try {
      await caller.fileUpload.getUploadUrl({
        filename: "resume.pdf",
        contentType: "application/pdf",
        fileSize: 15 * 1024 * 1024, // 15MB - exceeds limit
      });
      // Should not reach here
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.message).toContain("exceeds 10MB limit");
    }
  });

  it("should validate file types", async () => {
    const caller = appRouter.createCaller(mockContext);

    try {
      await caller.fileUpload.getUploadUrl({
        filename: "resume.exe",
        contentType: "application/x-msdownload",
        fileSize: 1024,
      });
      // Should not reach here
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.message).toContain("Invalid file type");
    }
  });

  it("should accept valid PDF files", async () => {
    const caller = appRouter.createCaller(mockContext);

    const result = await caller.fileUpload.getUploadUrl({
      filename: "resume.pdf",
      contentType: "application/pdf",
      fileSize: 1024 * 1024, // 1MB
    });

    expect(result).toBeDefined();
    expect(result.key).toContain("resumes/1/");
    expect(result.key).toContain("resume.pdf");
  });

  it("should accept DOCX files", async () => {
    const caller = appRouter.createCaller(mockContext);

    const result = await caller.fileUpload.getUploadUrl({
      filename: "resume.docx",
      contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      fileSize: 2 * 1024 * 1024, // 2MB
    });

    expect(result).toBeDefined();
    expect(result.key).toContain("resumes/1/");
  });

  it("should sanitize filenames", async () => {
    const caller = appRouter.createCaller(mockContext);

    const result = await caller.fileUpload.getUploadUrl({
      filename: "my resume (final) v2.pdf",
      contentType: "application/pdf",
      fileSize: 1024,
    });

    expect(result).toBeDefined();
    expect(result.key).toMatch(/resumes\/1\/\d+-my_resume__final__v2.pdf/);
  });

  it("should upload file with base64 data", async () => {
    const caller = appRouter.createCaller(mockContext);

    // Create a small test file (base64 encoded "test content")
    const testData = Buffer.from("test content").toString("base64");

    const result = await caller.fileUpload.uploadFile({
      key: "resumes/1/test-resume.pdf",
      data: testData,
      contentType: "application/pdf",
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.url).toBeDefined();
    expect(result.key).toBe("resumes/1/test-resume.pdf");
  });
});

describe("Notification Settings Integration", () => {
  it("should get notification preferences", async () => {
    const caller = appRouter.createCaller(mockContext);
    const result = await caller.notifications.getPreferences();

    expect(result).toBeDefined();
    if (result) {
      expect(result.emailEnabled).toBeDefined();
      expect(result.slackEnabled).toBeDefined();
      expect(result.complianceAlerts).toBeDefined();
    }
  });

  it("should update email preferences", async () => {
    const caller = appRouter.createCaller(mockContext);

    const result = await caller.notifications.updatePreferences({
      emailEnabled: false,
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);

    // Verify update
    const prefs = await caller.notifications.getPreferences();
    expect(prefs?.emailEnabled).toBe(false);

    // Reset
    await caller.notifications.updatePreferences({
      emailEnabled: true,
    });
  });

  it("should update Slack preferences with webhook URL", async () => {
    const caller = appRouter.createCaller(mockContext);

    const result = await caller.notifications.updatePreferences({
      slackEnabled: true,
      slackWebhookUrl: "https://hooks.slack.com/services/TEST/WEBHOOK/URL",
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);

    // Verify update
    const prefs = await caller.notifications.getPreferences();
    expect(prefs?.slackEnabled).toBe(true);
    expect(prefs?.slackWebhookUrl).toBe("https://hooks.slack.com/services/TEST/WEBHOOK/URL");
  });

  it("should update notification type preferences", async () => {
    const caller = appRouter.createCaller(mockContext);

    const result = await caller.notifications.updatePreferences({
      complianceAlerts: false,
      systemUpdates: true,
      jobApplications: true,
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);

    // Verify update
    const prefs = await caller.notifications.getPreferences();
    expect(prefs?.complianceAlerts).toBe(false);
    expect(prefs?.systemUpdates).toBe(true);
    expect(prefs?.jobApplications).toBe(true);
  });
});

describe("Job Application with Resume", () => {
  it("should accept job application with resume URL", async () => {
    const caller = appRouter.createCaller(mockContext);

    // Get a test job
    const jobs = await caller.jobs.getJobListings({ limit: 1, offset: 0 });
    if (jobs.jobs.length === 0) {
      console.log("Skipping test: no jobs available");
      return;
    }

    const testJob = jobs.jobs[0];

    // Note: This will fail if user already applied
    // In a real test, we'd clean up or use a unique user
    try {
      const result = await caller.jobs.applyToJob({
        jobId: testJob.id,
        coverLetter: "Test application with resume",
        resumeUrl: "https://example.com/resumes/test-resume.pdf",
        yearsExperience: 3,
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.applicationId).toBeGreaterThan(0);
    } catch (error: any) {
      // If already applied, that's okay for this test
      if (error.message.includes("already applied")) {
        expect(error.message).toContain("already applied");
      } else {
        throw error;
      }
    }
  });
});

describe("Integration Tests", () => {
  it("should handle complete job application workflow with resume", async () => {
    const caller = appRouter.createCaller(mockContext);

    // 1. Upload resume
    const testData = Buffer.from("Resume content").toString("base64");
    const uploadResult = await caller.fileUpload.uploadFile({
      key: "resumes/1/integration-test-resume.pdf",
      data: testData,
      contentType: "application/pdf",
    });

    expect(uploadResult.success).toBe(true);
    expect(uploadResult.url).toBeDefined();

    // 2. Get job listings
    const jobs = await caller.jobs.getJobListings({ limit: 1, offset: 0 });
    expect(jobs.jobs.length).toBeGreaterThan(0);

    // 3. Apply to job with resume (may fail if already applied)
    try {
      const applicationResult = await caller.jobs.applyToJob({
        jobId: jobs.jobs[0].id,
        coverLetter: "Integration test application",
        resumeUrl: uploadResult.url,
      });

      expect(applicationResult.success).toBe(true);
    } catch (error: any) {
      // Already applied is acceptable
      expect(error.message).toContain("already applied");
    }
  });

  it("should handle notification preferences workflow", async () => {
    const caller = appRouter.createCaller(mockContext);

    // 1. Get current preferences
    const initialPrefs = await caller.notifications.getPreferences();
    expect(initialPrefs).toBeDefined();

    // 2. Update preferences
    await caller.notifications.updatePreferences({
      emailEnabled: true,
      slackEnabled: false,
      complianceAlerts: true,
    });

    // 3. Verify update
    const updatedPrefs = await caller.notifications.getPreferences();
    expect(updatedPrefs?.emailEnabled).toBe(true);
    expect(updatedPrefs?.slackEnabled).toBe(false);
    expect(updatedPrefs?.complianceAlerts).toBe(true);

    // 4. Test notification
    const testResult = await caller.notifications.testNotification({
      channel: "email",
    });

    expect(testResult.success).toBe(true);
    expect(testResult.message).toContain("email");
  });
});
