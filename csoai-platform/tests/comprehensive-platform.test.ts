/**
 * Comprehensive Platform Test Suite
 * Tests all major features: Training, AI Council, Compliance, Jobs, Bulk Import, Notifications
 */

import { describe, it, expect } from "vitest";
import { appRouter } from "../routers";
import type { AppRouter } from "../routers";
import type { inferProcedureInput } from "@trpc/server";

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

const caller = appRouter.createCaller(mockContext);

describe("Comprehensive Platform Tests", () => {

  describe("Training System", () => {
    it("should fetch all training modules", async () => {
      const modules = await caller.training.getModules();
      expect(modules).toBeDefined();
      expect(Array.isArray(modules)).toBe(true);
      expect(modules.length).toBeGreaterThan(0);
    });

    it("should start a training module", async () => {
      const modules = await caller.training.getModules();
      const firstModule = modules[0];
      
      const result = await caller.training.startModule({ moduleId: firstModule.id });
      expect(result.success).toBe(true);
    });

    it("should track training progress", async () => {
      const progress = await caller.training.getProgress();
      expect(progress).toBeDefined();
      expect(Array.isArray(progress)).toBe(true);
    });
  });

  describe("AI Council System", () => {
    it("should create AI council decision", async () => {
      const input: inferProcedureInput<AppRouter["aiCouncil"]["createDecision"]> = {
        systemId: 1,
        incidentDescription: "Test incident for council review",
        severity: "high",
      };

      const decision = await caller.aiCouncil.createDecision(input);
      expect(decision).toBeDefined();
      expect(decision.id).toBeDefined();
      expect(decision.status).toBe("pending");
    });

    it("should fetch council decisions", async () => {
      const decisions = await caller.aiCouncil.getDecisions();
      expect(decisions).toBeDefined();
      expect(Array.isArray(decisions)).toBe(true);
    });
  });

  describe("Compliance Monitoring", () => {
    it("should fetch AI systems for compliance", async () => {
      const systems = await caller.compliance.getSystems();
      expect(systems).toBeDefined();
      expect(Array.isArray(systems)).toBe(true);
    });

    it("should run compliance assessment", async () => {
      const systems = await caller.compliance.getSystems();
      if (systems.length > 0) {
        const assessment = await caller.compliance.runAssessment({
          systemId: systems[0].id,
          framework: "eu_ai_act",
        });
        expect(assessment).toBeDefined();
        expect(assessment.score).toBeGreaterThanOrEqual(0);
        expect(assessment.score).toBeLessThanOrEqual(100);
      }
    });
  });

  describe("Job Board System", () => {
    it("should fetch job listings", async () => {
      const jobs = await caller.jobs.list({});
      expect(jobs).toBeDefined();
      expect(Array.isArray(jobs)).toBe(true);
    });

    it("should apply to a job", async () => {
      const jobs = await caller.jobs.list({});
      if (jobs.length > 0) {
        const application = await caller.jobs.apply({
          jobId: jobs[0].id,
          coverLetter: "Test application for comprehensive testing",
          resumeUrl: "https://example.com/resume.pdf",
        });
        expect(application).toBeDefined();
        expect(application.id).toBeDefined();
      }
    });

    it("should fetch user applications", async () => {
      const applications = await caller.jobs.getMyApplications();
      expect(applications).toBeDefined();
      expect(Array.isArray(applications)).toBe(true);
    });
  });

  describe("Bulk Import System", () => {
    it("should validate CSV data", async () => {
      const csvData = `name,description,systemType,deploymentDate
Test System,Test Description,general_purpose,2024-01-01`;

      const result = await caller.bulkImport.validateCSV({ csvData });
      expect(result.valid).toBe(true);
      expect(result.rowCount).toBe(1);
    });

    it("should import AI systems from CSV", async () => {
      const csvData = `name,description,systemType,deploymentDate
Bulk Test System,Automated test system,general_purpose,2024-01-01`;

      const result = await caller.bulkImport.importSystems({ csvData });
      expect(result.success).toBe(true);
      expect(result.imported).toBe(1);
    });
  });

  describe("Notification System", () => {
    it("should fetch user notifications", async () => {
      const notifications = await caller.notifications.getAll();
      expect(notifications).toBeDefined();
      expect(Array.isArray(notifications)).toBe(true);
    });

    it("should fetch notification preferences", async () => {
      const prefs = await caller.notifications.getPreferences();
      expect(prefs).toBeDefined();
    });

    it("should update notification preferences", async () => {
      const result = await caller.notifications.updatePreferences({
        emailEnabled: true,
        slackEnabled: false,
        digestEnabled: true,
        digestFrequency: "daily",
      });
      expect(result.success).toBe(true);
    });

    it("should mark notification as read", async () => {
      const notifications = await caller.notifications.getAll();
      if (notifications.length > 0) {
        const result = await caller.notifications.markAsRead({
          notificationId: notifications[0].id,
        });
        expect(result.success).toBe(true);
      }
    });
  });

  describe("Platform Integration", () => {
    it("should have consistent user context across all features", async () => {
      const progress = await caller.training.getProgress();
      const applications = await caller.jobs.getMyApplications();
      const notifications = await caller.notifications.getAll();

      // All should execute without authentication errors
      expect(progress).toBeDefined();
      expect(applications).toBeDefined();
      expect(notifications).toBeDefined();
    });
  });
});
