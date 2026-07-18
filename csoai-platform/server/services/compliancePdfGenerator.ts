/**
 * Compliance Report PDF Generator
 * Generates professional PDF reports for compliance assessments across multiple frameworks
 */

import PDFDocument from "pdfkit";

// Types for compliance report data
interface FrameworkData {
  id: number;
  code: string;
  name: string;
  version: string | null;
  jurisdiction: string | null;
  description: string | null;
}

interface RequirementData {
  id: number;
  articleNumber: string | null;
  title: string;
  description: string | null;
  category: string | null;
  isMandatory: boolean;
}

interface AssessmentItemData {
  id: number;
  requirementId: number;
  status: string;
  evidence: string | null;
  notes: string | null;
  requirement?: RequirementData;
}

interface AssessmentData {
  id: number;
  status: string;
  overallScore: string | null;
  findings: string | null;
  recommendations: string | null;
  completedAt: Date | null;
  createdAt: Date;
}

interface AISystemData {
  id: number;
  name: string;
  description: string | null;
  systemType: string;
  riskLevel: string;
  status: string;
}

export interface ComplianceReportData {
  aiSystem: AISystemData;
  framework: FrameworkData;
  assessment: AssessmentData;
  items: AssessmentItemData[];
  generatedBy?: string;
}

interface ReportOptions {
  includeEvidence?: boolean;
  includeRecommendations?: boolean;
}

const COLORS = {
  primary: "#1a1a1a",
  secondary: "#666666",
  accent: "#3b82f6",
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
  lightGray: "#f3f4f6",
  border: "#e5e7eb",
  compliant: "#22c55e",
  nonCompliant: "#ef4444",
  partial: "#f59e0b",
  notApplicable: "#9ca3af",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  compliant: { label: "Compliant", color: COLORS.compliant },
  non_compliant: { label: "Non-Compliant", color: COLORS.nonCompliant },
  in_progress: { label: "In Progress", color: COLORS.warning },
  not_started: { label: "Not Started", color: COLORS.secondary },
  not_applicable: { label: "N/A", color: COLORS.notApplicable },
};

export function generateComplianceReportPDF(
  data: ComplianceReportData,
  options: ReportOptions = {}
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
        info: {
          Title: `Compliance Report - ${data.aiSystem.name} - ${data.framework.name}`,
          Author: "COAI - Council of AIs",
          Subject: "AI Compliance Assessment Report",
          Keywords: `Compliance, ${data.framework.code}, AI Safety, Assessment`,
        },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Page 1: Cover and Executive Summary
      drawCoverPage(doc, data);
      
      // Page 2: Compliance Summary
      doc.addPage();
      drawComplianceSummary(doc, data);

      // Page 3+: Detailed Requirements
      doc.addPage();
      drawRequirementsDetail(doc, data, options);

      // Recommendations Section
      if (options.includeRecommendations !== false && data.assessment.recommendations) {
        drawRecommendations(doc, data);
      }

      // Footer on all pages
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        drawPageFooter(doc, i + 1, pageCount, data.framework.code);
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

function drawCoverPage(doc: PDFKit.PDFDocument, data: ComplianceReportData) {
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const centerX = doc.page.margins.left + pageWidth / 2;

  // COAI Logo/Branding
  doc
    .fontSize(36)
    .font("Helvetica-Bold")
    .fillColor(COLORS.primary)
    .text("COAI", 50, 80, { align: "center", width: pageWidth });

  doc
    .fontSize(14)
    .font("Helvetica")
    .fillColor(COLORS.secondary)
    .text("Council of AIs - AI Safety & Compliance Platform", 50, 125, { align: "center", width: pageWidth });

  // Decorative line
  doc
    .strokeColor(COLORS.accent)
    .lineWidth(3)
    .moveTo(centerX - 100, 160)
    .lineTo(centerX + 100, 160)
    .stroke();

  // Report Title
  doc
    .fontSize(28)
    .font("Helvetica-Bold")
    .fillColor(COLORS.primary)
    .text("Compliance Assessment Report", 50, 220, { align: "center", width: pageWidth });

  // Framework Badge
  const frameworkBadgeY = 280;
  const badgeWidth = 300;
  const badgeX = centerX - badgeWidth / 2;

  doc
    .roundedRect(badgeX, frameworkBadgeY, badgeWidth, 60, 8)
    .fillColor(COLORS.accent)
    .fill();

  doc
    .fontSize(18)
    .font("Helvetica-Bold")
    .fillColor("#ffffff")
    .text(data.framework.name, badgeX, frameworkBadgeY + 12, { align: "center", width: badgeWidth });

  doc
    .fontSize(12)
    .font("Helvetica")
    .text(data.framework.version ? `Version ${data.framework.version}` : "", badgeX, frameworkBadgeY + 38, { align: "center", width: badgeWidth });

  // AI System Info Box
  const infoBoxY = 380;
  const infoBoxHeight = 120;

  doc
    .roundedRect(50, infoBoxY, pageWidth, infoBoxHeight, 8)
    .fillColor(COLORS.lightGray)
    .fill();

  doc
    .fontSize(14)
    .font("Helvetica-Bold")
    .fillColor(COLORS.primary)
    .text("AI System Under Assessment", 70, infoBoxY + 15);

  doc
    .fontSize(12)
    .font("Helvetica")
    .fillColor(COLORS.primary)
    .text(`Name: ${data.aiSystem.name}`, 70, infoBoxY + 40)
    .text(`Type: ${formatSystemType(data.aiSystem.systemType)}`, 70, infoBoxY + 58)
    .text(`Risk Level: ${formatRiskLevel(data.aiSystem.riskLevel)}`, 70, infoBoxY + 76)
    .text(`Status: ${formatStatus(data.aiSystem.status)}`, 70, infoBoxY + 94);

  // Overall Score Circle
  const score = data.assessment.overallScore ? parseFloat(data.assessment.overallScore) : 0;
  const scoreColor = score >= 80 ? COLORS.success : score >= 60 ? COLORS.warning : COLORS.danger;
  const scoreX = pageWidth - 50;
  const scoreY = infoBoxY + 60;

  doc
    .circle(scoreX, scoreY, 35)
    .fillColor(scoreColor)
    .fill();

  doc
    .fontSize(20)
    .font("Helvetica-Bold")
    .fillColor("#ffffff")
    .text(`${Math.round(score)}%`, scoreX - 25, scoreY - 12, { width: 50, align: "center" });

  doc
    .fontSize(8)
    .text("SCORE", scoreX - 25, scoreY + 10, { width: 50, align: "center" });

  // Assessment Details
  const detailsY = 540;

  doc
    .fontSize(11)
    .font("Helvetica")
    .fillColor(COLORS.secondary)
    .text(`Assessment Date: ${formatDate(data.assessment.completedAt || data.assessment.createdAt)}`, 50, detailsY, { align: "center", width: pageWidth })
    .text(`Assessment Status: ${formatAssessmentStatus(data.assessment.status)}`, 50, detailsY + 18, { align: "center", width: pageWidth })
    .text(`Framework Jurisdiction: ${data.framework.jurisdiction || "Global"}`, 50, detailsY + 36, { align: "center", width: pageWidth });

  // Confidentiality Notice
  doc
    .fontSize(9)
    .font("Helvetica-Oblique")
    .fillColor(COLORS.secondary)
    .text(
      "CONFIDENTIAL - This report contains sensitive compliance information. Distribution should be limited to authorized personnel only.",
      50,
      doc.page.height - 100,
      { align: "center", width: pageWidth }
    );
}

function drawComplianceSummary(doc: PDFKit.PDFDocument, data: ComplianceReportData) {
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  // Section Header
  doc
    .fontSize(20)
    .font("Helvetica-Bold")
    .fillColor(COLORS.primary)
    .text("Compliance Summary", 50, 50);

  doc
    .strokeColor(COLORS.border)
    .lineWidth(1)
    .moveTo(50, 80)
    .lineTo(50 + pageWidth, 80)
    .stroke();

  // Calculate statistics
  const stats = calculateComplianceStats(data.items);

  // Stats Cards
  const cardY = 100;
  const cardWidth = (pageWidth - 30) / 4;
  const cardHeight = 80;

  const statsCards = [
    { label: "Compliant", value: stats.compliant, color: COLORS.compliant },
    { label: "Non-Compliant", value: stats.nonCompliant, color: COLORS.nonCompliant },
    { label: "In Progress", value: stats.inProgress, color: COLORS.warning },
    { label: "N/A", value: stats.notApplicable, color: COLORS.notApplicable },
  ];

  statsCards.forEach((card, index) => {
    const x = 50 + index * (cardWidth + 10);

    doc
      .roundedRect(x, cardY, cardWidth, cardHeight, 6)
      .fillColor(COLORS.lightGray)
      .fill();

    doc
      .rect(x, cardY, 4, cardHeight)
      .fillColor(card.color)
      .fill();

    doc
      .fontSize(28)
      .font("Helvetica-Bold")
      .fillColor(COLORS.primary)
      .text(card.value.toString(), x + 15, cardY + 15, { width: cardWidth - 20 });

    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor(COLORS.secondary)
      .text(card.label, x + 15, cardY + 50, { width: cardWidth - 20 });
  });

  // Compliance by Category
  doc
    .fontSize(14)
    .font("Helvetica-Bold")
    .fillColor(COLORS.primary)
    .text("Compliance by Category", 50, 210);

  const categories = groupByCategory(data.items);
  let categoryY = 235;

  Object.entries(categories).forEach(([category, items]) => {
    const catStats = calculateComplianceStats(items);
    const complianceRate = items.length > 0 ? (catStats.compliant / (items.length - catStats.notApplicable)) * 100 : 0;
    const barWidth = pageWidth - 150;

    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor(COLORS.primary)
      .text(category || "General", 50, categoryY, { width: 140 });

    // Progress bar background
    doc
      .roundedRect(200, categoryY, barWidth, 16, 3)
      .fillColor(COLORS.lightGray)
      .fill();

    // Progress bar fill
    const fillWidth = (complianceRate / 100) * barWidth;
    if (fillWidth > 0) {
      doc
        .roundedRect(200, categoryY, Math.max(fillWidth, 6), 16, 3)
        .fillColor(complianceRate >= 80 ? COLORS.success : complianceRate >= 60 ? COLORS.warning : COLORS.danger)
        .fill();
    }

    // Percentage
    doc
      .fontSize(9)
      .font("Helvetica-Bold")
      .fillColor(COLORS.primary)
      .text(`${Math.round(complianceRate)}%`, 200 + barWidth + 10, categoryY + 3);

    categoryY += 28;
  });

  // Findings Summary
  if (data.assessment.findings) {
    const findingsY = Math.max(categoryY + 30, 400);

    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .fillColor(COLORS.primary)
      .text("Key Findings", 50, findingsY);

    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor(COLORS.primary)
      .text(data.assessment.findings, 50, findingsY + 25, {
        width: pageWidth,
        align: "left",
      });
  }
}

function drawRequirementsDetail(doc: PDFKit.PDFDocument, data: ComplianceReportData, options: ReportOptions) {
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  // Section Header
  doc
    .fontSize(20)
    .font("Helvetica-Bold")
    .fillColor(COLORS.primary)
    .text("Detailed Requirements Assessment", 50, 50);

  doc
    .strokeColor(COLORS.border)
    .lineWidth(1)
    .moveTo(50, 80)
    .lineTo(50 + pageWidth, 80)
    .stroke();

  let currentY = 100;

  // Group items by category
  const categories = groupByCategory(data.items);

  Object.entries(categories).forEach(([category, items]) => {
    // Check for page break
    if (currentY > doc.page.height - 150) {
      doc.addPage();
      currentY = 50;
    }

    // Category Header
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .fillColor(COLORS.accent)
      .text(category || "General Requirements", 50, currentY);

    currentY += 25;

    items.forEach((item) => {
      // Check for page break
      if (currentY > doc.page.height - 120) {
        doc.addPage();
        currentY = 50;
      }

      const req = item.requirement;
      const statusInfo = STATUS_LABELS[item.status] || { label: item.status, color: COLORS.secondary };

      // Requirement row
      doc
        .rect(50, currentY, pageWidth, 50)
        .fillColor(COLORS.lightGray)
        .fill();

      // Status indicator
      doc
        .rect(50, currentY, 4, 50)
        .fillColor(statusInfo.color)
        .fill();

      // Article number
      if (req?.articleNumber) {
        doc
          .fontSize(8)
          .font("Helvetica-Bold")
          .fillColor(COLORS.secondary)
          .text(req.articleNumber, 60, currentY + 5);
      }

      // Title
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor(COLORS.primary)
        .text(req?.title || `Requirement #${item.requirementId}`, 60, currentY + (req?.articleNumber ? 18 : 8), {
          width: pageWidth - 120,
        });

      // Status badge
      const badgeX = pageWidth - 30;
      doc
        .roundedRect(badgeX, currentY + 15, 70, 20, 4)
        .fillColor(statusInfo.color)
        .fill();

      doc
        .fontSize(8)
        .font("Helvetica-Bold")
        .fillColor("#ffffff")
        .text(statusInfo.label, badgeX, currentY + 21, { width: 70, align: "center" });

      currentY += 55;

      // Evidence (if included)
      if (options.includeEvidence && item.evidence) {
        doc
          .fontSize(9)
          .font("Helvetica-Oblique")
          .fillColor(COLORS.secondary)
          .text(`Evidence: ${item.evidence}`, 60, currentY, {
            width: pageWidth - 20,
          });

        currentY += doc.heightOfString(`Evidence: ${item.evidence}`, { width: pageWidth - 20 }) + 10;
      }

      // Notes
      if (item.notes) {
        doc
          .fontSize(9)
          .font("Helvetica")
          .fillColor(COLORS.secondary)
          .text(`Notes: ${item.notes}`, 60, currentY, {
            width: pageWidth - 20,
          });

        currentY += doc.heightOfString(`Notes: ${item.notes}`, { width: pageWidth - 20 }) + 10;
      }

      currentY += 5;
    });

    currentY += 15;
  });
}

function drawRecommendations(doc: PDFKit.PDFDocument, data: ComplianceReportData) {
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  // Check if we need a new page
  if (doc.y > doc.page.height - 200) {
    doc.addPage();
  }

  doc
    .fontSize(14)
    .font("Helvetica-Bold")
    .fillColor(COLORS.primary)
    .text("Recommendations & Action Items", 50, doc.y + 30);

  doc.moveDown(0.5);

  // Recommendations box
  const boxY = doc.y;

  doc
    .roundedRect(50, boxY, pageWidth, 150)
    .strokeColor(COLORS.accent)
    .lineWidth(2)
    .stroke();

  doc
    .fontSize(10)
    .font("Helvetica")
    .fillColor(COLORS.primary)
    .text(data.assessment.recommendations || "No specific recommendations provided.", 60, boxY + 15, {
      width: pageWidth - 20,
    });
}

function drawPageFooter(doc: PDFKit.PDFDocument, pageNum: number, totalPages: number, frameworkCode: string) {
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const footerY = doc.page.height - 40;

  doc
    .fontSize(8)
    .font("Helvetica")
    .fillColor(COLORS.secondary)
    .text(`COAI Compliance Report - ${frameworkCode}`, 50, footerY)
    .text(`Page ${pageNum} of ${totalPages}`, 50, footerY, { align: "right", width: pageWidth })
    .text(`Generated: ${formatDate(new Date())}`, 50, footerY + 12, { align: "center", width: pageWidth });
}

// Helper functions
function calculateComplianceStats(items: AssessmentItemData[]) {
  return {
    total: items.length,
    compliant: items.filter((i) => i.status === "compliant").length,
    nonCompliant: items.filter((i) => i.status === "non_compliant").length,
    inProgress: items.filter((i) => i.status === "in_progress").length,
    notStarted: items.filter((i) => i.status === "not_started").length,
    notApplicable: items.filter((i) => i.status === "not_applicable").length,
  };
}

function groupByCategory(items: AssessmentItemData[]): Record<string, AssessmentItemData[]> {
  return items.reduce((acc, item) => {
    const category = item.requirement?.category || "General";
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, AssessmentItemData[]>);
}

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatSystemType(type: string): string {
  const types: Record<string, string> = {
    chatbot: "Chatbot / Conversational AI",
    recommendation: "Recommendation System",
    classification: "Classification / Categorization",
    generation: "Content Generation",
    analysis: "Data Analysis",
    other: "Other",
  };
  return types[type] || type;
}

function formatRiskLevel(level: string): string {
  const levels: Record<string, string> = {
    minimal: "Minimal Risk",
    limited: "Limited Risk",
    high: "High Risk",
    unacceptable: "Unacceptable Risk",
  };
  return levels[level] || level;
}

function formatStatus(status: string): string {
  const statuses: Record<string, string> = {
    draft: "Draft",
    active: "Active",
    under_review: "Under Review",
    compliant: "Compliant",
    non_compliant: "Non-Compliant",
    archived: "Archived",
  };
  return statuses[status] || status;
}

function formatAssessmentStatus(status: string): string {
  const statuses: Record<string, string> = {
    pending: "Pending",
    in_progress: "In Progress",
    completed: "Completed",
    approved: "Approved",
    rejected: "Rejected",
  };
  return statuses[status] || status;
}
