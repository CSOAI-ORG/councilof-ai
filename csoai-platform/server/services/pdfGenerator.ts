/**
 * PDCA Cycle PDF Report Generator
 * Generates professional PDF reports for completed PDCA cycles
 */

import PDFDocument from "pdfkit";

interface PDCACycleData {
  id: number;
  cycleNumber: number;
  phase: string;
  planSummary: string | null;
  doSummary: string | null;
  checkSummary: string | null;
  actSummary: string | null;
  status: string;
  startedAt: Date;
  completedAt: Date | null;
  aiSystemName: string | null;
  aiSystemType: string | null;
  aiSystemRiskLevel: string | null;
}

interface ReportOptions {
  includeTimeline?: boolean;
  includeRiskAssessment?: boolean;
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
};

const PHASE_COLORS = {
  plan: "#3b82f6",    // Blue
  do: "#22c55e",      // Green
  check: "#f59e0b",   // Amber
  act: "#8b5cf6",     // Purple
};

export function generatePDCACyclePDF(
  cycle: PDCACycleData,
  options: ReportOptions = {}
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
        info: {
          Title: `PDCA Cycle Report - Cycle #${cycle.cycleNumber}`,
          Author: "COAI - Council of AIs",
          Subject: "PDCA Cycle Completion Report",
          Keywords: "PDCA, AI Safety, Compliance, Continuous Improvement",
        },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Header with COAI branding
      drawHeader(doc, cycle);

      // Executive Summary
      drawExecutiveSummary(doc, cycle);

      // Phase Details
      drawPhaseSection(doc, "Plan", cycle.planSummary, PHASE_COLORS.plan, "Define objectives, identify problems, and plan improvements");
      drawPhaseSection(doc, "Do", cycle.doSummary, PHASE_COLORS.do, "Implement the planned changes on a small scale");
      drawPhaseSection(doc, "Check", cycle.checkSummary, PHASE_COLORS.check, "Analyze results and compare against expected outcomes");
      drawPhaseSection(doc, "Act", cycle.actSummary, PHASE_COLORS.act, "Standardize improvements or restart the cycle");

      // Timeline section
      if (options.includeTimeline !== false) {
        drawTimeline(doc, cycle);
      }

      // Footer
      drawFooter(doc);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

function drawHeader(doc: PDFKit.PDFDocument, cycle: PDCACycleData) {
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  // COAI Logo/Title
  doc
    .fontSize(24)
    .font("Helvetica-Bold")
    .fillColor(COLORS.primary)
    .text("COAI", 50, 50, { continued: true })
    .fontSize(12)
    .font("Helvetica")
    .fillColor(COLORS.secondary)
    .text("  Council of AIs", { baseline: "bottom" });

  // Report Title
  doc
    .moveDown(1)
    .fontSize(20)
    .font("Helvetica-Bold")
    .fillColor(COLORS.primary)
    .text(`PDCA Cycle Report`, 50);

  doc
    .fontSize(14)
    .font("Helvetica")
    .fillColor(COLORS.secondary)
    .text(`Cycle #${cycle.cycleNumber} - ${cycle.aiSystemName || "Unknown System"}`);

  // Status Badge
  const statusColor = cycle.status === "completed" ? COLORS.success : 
                      cycle.status === "active" ? COLORS.accent : COLORS.warning;
  
  doc
    .moveDown(0.5)
    .fontSize(10)
    .font("Helvetica-Bold")
    .fillColor(statusColor)
    .text(cycle.status.toUpperCase(), 50);

  // Horizontal line
  doc
    .moveDown(1)
    .strokeColor(COLORS.border)
    .lineWidth(1)
    .moveTo(50, doc.y)
    .lineTo(50 + pageWidth, doc.y)
    .stroke();

  doc.moveDown(1);
}

function drawExecutiveSummary(doc: PDFKit.PDFDocument, cycle: PDCACycleData) {
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  doc
    .fontSize(14)
    .font("Helvetica-Bold")
    .fillColor(COLORS.primary)
    .text("Executive Summary", 50);

  doc.moveDown(0.5);

  // Summary box
  const boxY = doc.y;
  const boxHeight = 80;

  doc
    .rect(50, boxY, pageWidth, boxHeight)
    .fillColor(COLORS.lightGray)
    .fill();

  doc
    .fillColor(COLORS.primary)
    .fontSize(10)
    .font("Helvetica");

  // AI System info
  doc.text(`AI System: ${cycle.aiSystemName || "Not specified"}`, 60, boxY + 15);
  doc.text(`System Type: ${formatSystemType(cycle.aiSystemType)}`, 60, boxY + 30);
  doc.text(`Risk Level: ${formatRiskLevel(cycle.aiSystemRiskLevel)}`, 60, boxY + 45);
  doc.text(`Current Phase: ${cycle.phase.toUpperCase()}`, 60, boxY + 60);

  // Dates on right side
  const rightX = 300;
  doc.text(`Started: ${formatDate(cycle.startedAt)}`, rightX, boxY + 15);
  if (cycle.completedAt) {
    doc.text(`Completed: ${formatDate(cycle.completedAt)}`, rightX, boxY + 30);
    const duration = calculateDuration(cycle.startedAt, cycle.completedAt);
    doc.text(`Duration: ${duration}`, rightX, boxY + 45);
  }

  doc.y = boxY + boxHeight + 20;
}

function drawPhaseSection(
  doc: PDFKit.PDFDocument,
  phaseName: string,
  content: string | null,
  color: string,
  description: string
) {
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  // Check if we need a new page
  if (doc.y > doc.page.height - 200) {
    doc.addPage();
  }

  // Phase header with colored indicator
  doc
    .rect(50, doc.y, 4, 20)
    .fillColor(color)
    .fill();

  doc
    .fontSize(12)
    .font("Helvetica-Bold")
    .fillColor(COLORS.primary)
    .text(phaseName, 60, doc.y + 3);

  doc
    .fontSize(9)
    .font("Helvetica")
    .fillColor(COLORS.secondary)
    .text(description, 60);

  doc.moveDown(0.5);

  // Content box
  const contentBoxY = doc.y;
  const contentText = content || "No content recorded for this phase.";
  
  // Calculate height needed for content
  const textHeight = doc.heightOfString(contentText, {
    width: pageWidth - 20,
    align: "left",
  });

  const boxHeight = Math.max(textHeight + 20, 50);

  doc
    .rect(50, contentBoxY, pageWidth, boxHeight)
    .strokeColor(COLORS.border)
    .lineWidth(1)
    .stroke();

  doc
    .fontSize(10)
    .font("Helvetica")
    .fillColor(content ? COLORS.primary : COLORS.secondary)
    .text(contentText, 60, contentBoxY + 10, {
      width: pageWidth - 20,
      align: "left",
    });

  doc.y = contentBoxY + boxHeight + 15;
}

function drawTimeline(doc: PDFKit.PDFDocument, cycle: PDCACycleData) {
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  // Check if we need a new page
  if (doc.y > doc.page.height - 150) {
    doc.addPage();
  }

  doc
    .fontSize(14)
    .font("Helvetica-Bold")
    .fillColor(COLORS.primary)
    .text("Timeline", 50);

  doc.moveDown(0.5);

  // Timeline visualization
  const timelineY = doc.y + 20;
  const phases = ["Plan", "Do", "Check", "Act"];
  const phaseWidth = pageWidth / 4;

  phases.forEach((phase, index) => {
    const x = 50 + (index * phaseWidth);
    const isCompleted = getPhaseIndex(cycle.phase) > index || cycle.status === "completed";
    const isCurrent = phase.toLowerCase() === cycle.phase && cycle.status !== "completed";

    // Circle
    doc
      .circle(x + phaseWidth / 2, timelineY, 12)
      .fillColor(isCompleted ? PHASE_COLORS[phase.toLowerCase() as keyof typeof PHASE_COLORS] : 
                 isCurrent ? COLORS.accent : COLORS.lightGray)
      .fill();

    // Connecting line
    if (index < phases.length - 1) {
      doc
        .moveTo(x + phaseWidth / 2 + 12, timelineY)
        .lineTo(x + phaseWidth - phaseWidth / 2 + 12, timelineY)
        .strokeColor(isCompleted ? COLORS.success : COLORS.border)
        .lineWidth(2)
        .stroke();
    }

    // Label
    doc
      .fontSize(9)
      .font("Helvetica-Bold")
      .fillColor(COLORS.primary)
      .text(phase, x, timelineY + 20, {
        width: phaseWidth,
        align: "center",
      });
  });

  doc.y = timelineY + 50;
}

function drawFooter(doc: PDFKit.PDFDocument) {
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const footerY = doc.page.height - 50;

  doc
    .strokeColor(COLORS.border)
    .lineWidth(1)
    .moveTo(50, footerY - 10)
    .lineTo(50 + pageWidth, footerY - 10)
    .stroke();

  doc
    .fontSize(8)
    .font("Helvetica")
    .fillColor(COLORS.secondary)
    .text(
      `Generated by COAI (Council of AIs) on ${formatDate(new Date())}`,
      50,
      footerY,
      { align: "center", width: pageWidth }
    );

  doc
    .text(
      "This report is part of the SOAI-PDCA continuous improvement framework for AI safety and compliance.",
      50,
      footerY + 12,
      { align: "center", width: pageWidth }
    );
}

// Helper functions
function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatSystemType(type: string | null): string {
  if (!type) return "Not specified";
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

function formatRiskLevel(level: string | null): string {
  if (!level) return "Not assessed";
  const levels: Record<string, string> = {
    minimal: "Minimal Risk",
    limited: "Limited Risk",
    high: "High Risk",
    unacceptable: "Unacceptable Risk",
  };
  return levels[level] || level;
}

function calculateDuration(start: Date | string, end: Date | string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffMs = endDate.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Less than a day";
  if (diffDays === 1) return "1 day";
  if (diffDays < 7) return `${diffDays} days`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks`;
  return `${Math.floor(diffDays / 30)} months`;
}

function getPhaseIndex(phase: string): number {
  const phases = ["plan", "do", "check", "act"];
  return phases.indexOf(phase.toLowerCase());
}
