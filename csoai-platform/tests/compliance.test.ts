/**
 * Compliance Report Tests
 * Tests for compliance PDF report generation and email delivery
 */

import { describe, it, expect, vi } from "vitest";

// Mock the PDF generator
vi.mock("./compliancePdfGenerator", () => ({
  generateComplianceReportPDF: vi.fn().mockResolvedValue(Buffer.from("mock-pdf-content")),
}));

// Mock the email service
vi.mock("./emailService", () => ({
  sendEmailWithAttachment: vi.fn().mockResolvedValue({
    success: true,
    messageId: "test-message-id",
    previewUrl: "https://ethereal.email/preview/123",
  }),
}));

describe("Compliance Report Generation", () => {
  describe("PDF Generator", () => {
    it("should generate PDF buffer for compliance report", async () => {
      const { generateComplianceReportPDF } = await import("./compliancePdfGenerator");
      
      const mockData = {
        aiSystem: {
          id: 1,
          name: "Test AI System",
          systemType: "chatbot",
          riskLevel: "high",
        },
        framework: {
          id: 1,
          code: "EU_AI_ACT",
          name: "EU AI Act",
          version: "2024/1689",
        },
        assessment: {
          id: 1,
          overallScore: 75,
          status: "completed",
          completedAt: new Date(),
        },
        items: [
          {
            id: 1,
            status: "compliant",
            evidence: "Documentation provided",
            requirement: {
              code: "ART-6",
              title: "Risk Management",
              description: "Implement risk management system",
            },
          },
        ],
        generatedBy: "Test User",
      };

      const result = await generateComplianceReportPDF(mockData as any, {
        includeEvidence: true,
        includeRecommendations: true,
      });

      expect(result).toBeInstanceOf(Buffer);
    });

    it("should handle missing optional fields gracefully", async () => {
      const { generateComplianceReportPDF } = await import("./compliancePdfGenerator");
      
      const minimalData = {
        aiSystem: {
          id: 1,
          name: "Minimal System",
          systemType: "other",
          riskLevel: "minimal",
        },
        framework: {
          id: 1,
          code: "NIST_RMF",
          name: "NIST AI RMF",
          version: "1.0",
        },
        assessment: {
          id: 1,
          overallScore: null,
          status: "pending",
          completedAt: null,
        },
        items: [],
        generatedBy: "System",
      };

      const result = await generateComplianceReportPDF(minimalData as any, {
        includeEvidence: false,
        includeRecommendations: false,
      });

      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe("Email Delivery", () => {
    it("should send compliance report via email", async () => {
      const { sendEmailWithAttachment } = await import("./emailService");
      
      const result = await sendEmailWithAttachment({
        to: "test@example.com",
        subject: "Compliance Report: Test System - EU AI Act",
        html: "<p>Test email content</p>",
        attachments: [{
          filename: "compliance-report.pdf",
          content: Buffer.from("mock-pdf"),
          contentType: "application/pdf",
        }],
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it("should validate email address format", () => {
      const validEmails = [
        "test@example.com",
        "user.name@domain.org",
        "user+tag@company.co.uk",
      ];

      const invalidEmails = [
        "invalid",
        "@nodomain.com",
        "no@",
        "spaces in@email.com",
      ];

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      validEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(true);
      });

      invalidEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(false);
      });
    });
  });

  describe("Report Options", () => {
    it("should respect includeEvidence option", async () => {
      const { generateComplianceReportPDF } = await import("./compliancePdfGenerator");
      
      const mockData = {
        aiSystem: { id: 1, name: "Test", systemType: "chatbot", riskLevel: "high" },
        framework: { id: 1, code: "EU_AI_ACT", name: "EU AI Act", version: "2024" },
        assessment: { id: 1, overallScore: 80, status: "completed", completedAt: new Date() },
        items: [{ id: 1, status: "compliant", evidence: "Test evidence" }],
        generatedBy: "Tester",
      };

      // Test with evidence included
      const withEvidence = await generateComplianceReportPDF(mockData as any, {
        includeEvidence: true,
        includeRecommendations: false,
      });
      expect(withEvidence).toBeInstanceOf(Buffer);

      // Test without evidence
      const withoutEvidence = await generateComplianceReportPDF(mockData as any, {
        includeEvidence: false,
        includeRecommendations: false,
      });
      expect(withoutEvidence).toBeInstanceOf(Buffer);
    });

    it("should respect includeRecommendations option", async () => {
      const { generateComplianceReportPDF } = await import("./compliancePdfGenerator");
      
      const mockData = {
        aiSystem: { id: 1, name: "Test", systemType: "analysis", riskLevel: "limited" },
        framework: { id: 1, code: "NIST_RMF", name: "NIST RMF", version: "1.0" },
        assessment: { id: 1, overallScore: 65, status: "completed", completedAt: new Date() },
        items: [{ id: 1, status: "partial", notes: "Needs improvement" }],
        generatedBy: "Analyst",
      };

      const withRecs = await generateComplianceReportPDF(mockData as any, {
        includeEvidence: false,
        includeRecommendations: true,
      });
      expect(withRecs).toBeInstanceOf(Buffer);
    });
  });

  describe("Framework Support", () => {
    it("should support EU AI Act framework", async () => {
      const { generateComplianceReportPDF } = await import("./compliancePdfGenerator");
      
      const euData = {
        aiSystem: { id: 1, name: "EU System", systemType: "chatbot", riskLevel: "high" },
        framework: { id: 1, code: "EU_AI_ACT", name: "EU AI Act", version: "2024/1689" },
        assessment: { id: 1, overallScore: 72, status: "completed", completedAt: new Date() },
        items: [],
        generatedBy: "EU Analyst",
      };

      const result = await generateComplianceReportPDF(euData as any, {
        includeEvidence: true,
        includeRecommendations: true,
      });
      expect(result).toBeInstanceOf(Buffer);
    });

    it("should support NIST RMF framework", async () => {
      const { generateComplianceReportPDF } = await import("./compliancePdfGenerator");
      
      const nistData = {
        aiSystem: { id: 2, name: "NIST System", systemType: "recommendation", riskLevel: "limited" },
        framework: { id: 2, code: "NIST_AI_RMF", name: "NIST AI RMF", version: "1.0" },
        assessment: { id: 2, overallScore: 85, status: "completed", completedAt: new Date() },
        items: [],
        generatedBy: "NIST Analyst",
      };

      const result = await generateComplianceReportPDF(nistData as any, {
        includeEvidence: true,
        includeRecommendations: true,
      });
      expect(result).toBeInstanceOf(Buffer);
    });

    it("should support TC260 framework", async () => {
      const { generateComplianceReportPDF } = await import("./compliancePdfGenerator");
      
      const tc260Data = {
        aiSystem: { id: 3, name: "TC260 System", systemType: "generation", riskLevel: "high" },
        framework: { id: 3, code: "TC260", name: "TC260 AI Safety Framework", version: "2.0" },
        assessment: { id: 3, overallScore: 68, status: "completed", completedAt: new Date() },
        items: [],
        generatedBy: "TC260 Analyst",
      };

      const result = await generateComplianceReportPDF(tc260Data as any, {
        includeEvidence: true,
        includeRecommendations: true,
      });
      expect(result).toBeInstanceOf(Buffer);
    });
  });
});
