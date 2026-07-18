/**
 * PDCA Template Generator
 * Generates PDF templates for SOAI-PDCA Framework phases
 */

import PDFDocument from "pdfkit";
import { Writable } from "stream";

// Template structure
interface PDCATemplate {
  title: string;
  phase: "Plan" | "Do" | "Check" | "Act";
  description: string;
  sections: {
    title: string;
    content: string[];
    hasTable?: boolean;
    tableHeaders?: string[];
    tableRows?: string[][];
  }[];
}

// PDCA Templates
const TEMPLATES: Record<string, PDCATemplate> = {
  "plan-risk-assessment": {
    title: "Risk Assessment Template",
    phase: "Plan",
    description: "Identify and assess AI-related risks for your organization",
    sections: [
      {
        title: "Risk Identification",
        content: [
          "List all AI systems and their purposes",
          "Identify potential risks for each system",
          "Categorize risks by type (technical, ethical, legal, operational)",
        ],
      },
      {
        title: "Risk Assessment Matrix",
        content: [],
        hasTable: true,
        tableHeaders: ["Risk", "Likelihood", "Impact", "Priority", "Mitigation"],
        tableRows: [
          ["Bias in ML model", "Medium", "High", "High", "Regular audits"],
          ["Data privacy breach", "Low", "Critical", "High", "Encryption"],
          ["Model drift", "High", "Medium", "Medium", "Monitoring"],
        ],
      },
    ],
  },
  "do-implementation": {
    title: "Implementation Checklist",
    phase: "Do",
    description: "Execute AI governance implementation steps",
    sections: [
      {
        title: "Pre-Implementation",
        content: [
          "Review and approve implementation plan",
          "Allocate necessary resources",
          "Assign roles and responsibilities",
          "Set up monitoring infrastructure",
        ],
      },
      {
        title: "Implementation Steps",
        content: [
          "Deploy AI governance policies",
          "Train staff on new procedures",
          "Implement technical controls",
          "Document all changes",
        ],
      },
    ],
  },
  "check-monitoring": {
    title: "Monitoring Dashboard Template",
    phase: "Check",
    description: "Monitor and evaluate AI system performance and compliance",
    sections: [
      {
        title: "Key Performance Indicators",
        content: [
          "Model accuracy and performance metrics",
          "Bias detection scores",
          "Compliance status indicators",
          "Incident count and severity",
        ],
      },
      {
        title: "Review Schedule",
        content: [],
        hasTable: true,
        tableHeaders: ["Review Type", "Frequency", "Owner", "Status"],
        tableRows: [
          ["Model performance", "Weekly", "ML Team", "Active"],
          ["Compliance audit", "Monthly", "GRC Team", "Active"],
          ["Risk assessment", "Quarterly", "Risk Team", "Scheduled"],
        ],
      },
    ],
  },
  "act-improvement": {
    title: "Continuous Improvement Plan",
    phase: "Act",
    description: "Document and implement improvements based on learnings",
    sections: [
      {
        title: "Lessons Learned",
        content: [
          "Document findings from Check phase",
          "Identify root causes of issues",
          "Prioritize improvement opportunities",
        ],
      },
      {
        title: "Action Items",
        content: [
          "Define corrective actions",
          "Assign owners and deadlines",
          "Track implementation progress",
          "Measure effectiveness of changes",
        ],
      },
    ],
  },
};

/**
 * Generate a PDCA template PDF
 */
export async function generatePDCATemplate(
  templateId: string,
  outputStream: Writable
): Promise<void> {
  const template = TEMPLATES[templateId];
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(outputStream);

  // Header
  doc
    .fontSize(24)
    .fillColor("#1a365d")
    .text("CSOAI SOAI-PDCA Framework", { align: "center" });

  doc.moveDown(0.5);

  // Phase badge
  const phaseColors: Record<string, string> = {
    Plan: "#3182ce",
    Do: "#38a169",
    Check: "#d69e2e",
    Act: "#e53e3e",
  };

  doc
    .fontSize(14)
    .fillColor(phaseColors[template.phase] || "#666")
    .text(`${template.phase} Phase`, { align: "center" });

  doc.moveDown(1);

  // Title
  doc.fontSize(18).fillColor("#2d3748").text(template.title, { align: "center" });

  doc.moveDown(0.5);

  // Description
  doc
    .fontSize(11)
    .fillColor("#4a5568")
    .text(template.description, { align: "center" });

  doc.moveDown(2);

  // Sections
  template.sections.forEach((section) => {
    doc.fontSize(14).fillColor("#2d3748").text(section.title);
    doc.moveDown(0.5);

    if (section.hasTable && section.tableHeaders && section.tableRows) {
      // Simple table rendering
      const tableTop = doc.y;
      const colWidth = 80;

      // Table headers
      doc.fontSize(9).font("Helvetica-Bold");
      section.tableHeaders.forEach((header, i) => {
        doc.text(header, 50 + i * colWidth, tableTop, { width: colWidth - 5 });
      });

      doc.moveDown(1);

      // Table rows
      doc.font("Helvetica");
      section.tableRows.forEach((row) => {
        const rowTop = doc.y;
        row.forEach((cell, i) => {
          doc.text(cell, 50 + i * colWidth, rowTop, { width: colWidth - 5 });
        });
        doc.moveDown(1.5);
      });
    } else {
      // Regular content
      doc.fontSize(10).font("Helvetica").fillColor("#333333");
      section.content.forEach((line) => {
        doc.text(`• ${line}`);
        doc.moveDown(0.3);
      });
    }

    doc.moveDown(1);
  });

  // Footer
  const pageCount = doc.bufferedPageRange().count;
  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);
    doc
      .fontSize(8)
      .fillColor("#999999")
      .text(
        `CSOAI SOAI-PDCA Framework | ${template.phase} Phase | Page ${i + 1} of ${pageCount}`,
        50,
        doc.page.height - 50,
        { align: "center" }
      );
  }

  doc.end();
}

/**
 * List available PDCA templates
 */
export function listAvailableTemplates() {
  return Object.keys(TEMPLATES).map((key) => ({
    id: key,
    title: TEMPLATES[key].title,
    phase: TEMPLATES[key].phase,
    description: TEMPLATES[key].description,
  }));
}

export { TEMPLATES };
