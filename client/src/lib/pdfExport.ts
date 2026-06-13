/**
 * CSOAI PDF Export Library
 * Professional PDF generation for compliance reports, certificates, and regulatory documentation
 * Uses jsPDF for PDF generation and html2canvas for element capture
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// CSOAI Brand Colors
const BRAND_COLORS = {
  primary: '#0ea5e9', // Cyan-500
  primaryDark: '#0284c7', // Cyan-600
  secondary: '#6366f1', // Indigo-500
  success: '#22c55e', // Green-500
  warning: '#f59e0b', // Amber-500
  danger: '#ef4444', // Red-500
  dark: '#0f172a', // Slate-900
  gray: '#64748b', // Slate-500
  lightGray: '#e2e8f0', // Slate-200
  white: '#ffffff',
};

// Report Types
export type ReportType = 'assessment' | 'certificate' | 'regulatory';

// Common interfaces
export interface ComplianceScore {
  framework: string;
  version?: string;
  score: number;
  status: 'compliant' | 'partial' | 'non-compliant' | 'not-assessed';
  lastAssessment?: string;
}

export interface ComplianceAssessmentData {
  organizationName: string;
  systemName: string;
  systemId: string;
  systemType: string;
  riskLevel: 'minimal' | 'limited' | 'high' | 'unacceptable';
  overallScore: number;
  frameworks: ComplianceScore[];
  recommendations: string[];
  assessmentDate: string;
  validUntil?: string;
  byzantineCouncilStatus?: {
    verified: boolean;
    consensusLevel: number;
    sessionId?: string;
    votingAgents: number;
  };
  assessor?: string;
}

export interface CertificateData {
  recipientName: string;
  certificateType: string;
  issueDate: string;
  expiryDate?: string;
  certificateId: string;
  courseName?: string;
  score?: number;
  byzantineVerified: boolean;
  verificationUrl?: string;
}

export interface RegulatoryReportData {
  reportTitle: string;
  reportPeriod: {
    start: string;
    end: string;
  };
  organizationName: string;
  systemsCount: number;
  systems: Array<{
    name: string;
    type: string;
    riskLevel: string;
    complianceScore: number;
    status: string;
  }>;
  frameworkSummary: ComplianceScore[];
  incidentsSummary: {
    total: number;
    critical: number;
    resolved: number;
  };
  pdcaCycles: {
    active: number;
    completed: number;
  };
  byzantineCouncilSessions: number;
  recommendations: string[];
  generatedAt: string;
}

/**
 * Creates a new PDF document with CSOAI branding
 */
function createBrandedPDF(orientation: 'portrait' | 'landscape' = 'portrait'): jsPDF {
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  });

  return doc;
}

/**
 * Adds CSOAI branded header to the PDF
 */
function addHeader(doc: jsPDF, title: string, subtitle?: string): number {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header background
  doc.setFillColor(15, 23, 42); // Slate-900
  doc.rect(0, 0, pageWidth, 35, 'F');

  // Gradient accent line
  doc.setFillColor(14, 165, 233); // Cyan-500
  doc.rect(0, 35, pageWidth, 2, 'F');

  // Logo placeholder (CSOAI text)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('CSOAI', 15, 18);

  // Tagline
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('AI Safety & Compliance Platform', 15, 25);

  // Report title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(title, pageWidth - 15, 18, { align: 'right' });

  if (subtitle) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, pageWidth - 15, 25, { align: 'right' });
  }

  return 45; // Return Y position after header
}

/**
 * Adds footer with page numbers and timestamp
 */
function addFooter(doc: jsPDF, pageNum: number, totalPages: number): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Footer line
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.setLineWidth(0.5);
  doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);

  // Footer text
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.setFont('helvetica', 'normal');

  // Left: Confidential notice
  doc.text('Confidential - CSOAI Compliance Report', 15, pageHeight - 8);

  // Center: Page number
  doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: 'center' });

  // Right: Generation date
  doc.text(new Date().toISOString().split('T')[0], pageWidth - 15, pageHeight - 8, { align: 'right' });
}

/**
 * Adds a section title
 */
function addSectionTitle(doc: jsPDF, title: string, y: number, icon?: string): number {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Section background
  doc.setFillColor(241, 245, 249); // Slate-100
  doc.roundedRect(15, y, pageWidth - 30, 10, 2, 2, 'F');

  // Title
  doc.setTextColor(15, 23, 42); // Slate-900
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(title.toUpperCase(), 20, y + 7);

  return y + 16;
}

/**
 * Adds a score badge with color based on score
 */
function addScoreBadge(doc: jsPDF, score: number, x: number, y: number, size: 'small' | 'large' = 'large'): void {
  const radius = size === 'large' ? 15 : 8;

  // Determine color based on score
  let color: [number, number, number];
  if (score >= 80) {
    color = [34, 197, 94]; // Green
  } else if (score >= 60) {
    color = [245, 158, 11]; // Amber
  } else {
    color = [239, 68, 68]; // Red
  }

  // Circle background
  doc.setFillColor(color[0], color[1], color[2]);
  doc.circle(x, y, radius, 'F');

  // Score text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(size === 'large' ? 14 : 8);
  doc.setFont('helvetica', 'bold');
  doc.text(`${score}`, x, y + (size === 'large' ? 4 : 2.5), { align: 'center' });
}

/**
 * Adds a progress bar
 */
function addProgressBar(doc: jsPDF, value: number, x: number, y: number, width: number, height: number = 4): void {
  // Background
  doc.setFillColor(226, 232, 240); // Slate-200
  doc.roundedRect(x, y, width, height, height / 2, height / 2, 'F');

  // Progress
  const fillWidth = (value / 100) * width;
  let color: [number, number, number];
  if (value >= 80) {
    color = [34, 197, 94]; // Green
  } else if (value >= 60) {
    color = [245, 158, 11]; // Amber
  } else {
    color = [239, 68, 68]; // Red
  }

  doc.setFillColor(color[0], color[1], color[2]);
  doc.roundedRect(x, y, fillWidth, height, height / 2, height / 2, 'F');
}

/**
 * Gets status color for compliance status
 */
function getStatusColor(status: string): [number, number, number] {
  switch (status) {
    case 'compliant':
      return [34, 197, 94]; // Green
    case 'partial':
      return [245, 158, 11]; // Amber
    case 'non-compliant':
      return [239, 68, 68]; // Red
    default:
      return [100, 116, 139]; // Slate-500
  }
}

/**
 * Generates a compliance assessment PDF
 */
export async function generateComplianceAssessmentPDF(data: ComplianceAssessmentData): Promise<Blob> {
  const doc = createBrandedPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Page 1: Overview
  let y = addHeader(doc, 'Compliance Assessment Report', `Generated: ${data.assessmentDate}`);

  // System Information Section
  y = addSectionTitle(doc, 'AI System Information', y);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);

  const systemInfo = [
    ['Organization:', data.organizationName],
    ['System Name:', data.systemName],
    ['System ID:', data.systemId],
    ['System Type:', data.systemType],
    ['Risk Classification:', data.riskLevel.toUpperCase()],
    ['Assessment Date:', data.assessmentDate],
  ];

  if (data.validUntil) {
    systemInfo.push(['Valid Until:', data.validUntil]);
  }

  systemInfo.forEach(([label, value], idx) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 20, y + (idx * 6));
    doc.setFont('helvetica', 'normal');
    doc.text(value, 60, y + (idx * 6));
  });

  y += systemInfo.length * 6 + 10;

  // Overall Compliance Score
  y = addSectionTitle(doc, 'Overall Compliance Score', y);

  // Large score circle
  addScoreBadge(doc, data.overallScore, 40, y + 20, 'large');

  // Score interpretation
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);

  let scoreLabel = 'Needs Improvement';
  if (data.overallScore >= 90) scoreLabel = 'Excellent';
  else if (data.overallScore >= 80) scoreLabel = 'Good';
  else if (data.overallScore >= 60) scoreLabel = 'Fair';

  doc.text(scoreLabel, 65, y + 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Overall compliance score of ${data.overallScore}% across all frameworks`, 65, y + 26);

  y += 45;

  // Byzantine Council Verification
  if (data.byzantineCouncilStatus) {
    y = addSectionTitle(doc, 'Byzantine Council Verification', y);

    const bcStatus = data.byzantineCouncilStatus;

    // Verification badge
    if (bcStatus.verified) {
      doc.setFillColor(34, 197, 94); // Green
    } else {
      doc.setFillColor(245, 158, 11); // Amber
    }
    doc.roundedRect(20, y, 60, 8, 2, 2, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(bcStatus.verified ? 'VERIFIED' : 'PENDING VERIFICATION', 50, y + 5.5, { align: 'center' });

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    const bcInfo = [
      `Consensus Level: ${bcStatus.consensusLevel}%`,
      `Voting Agents: ${bcStatus.votingAgents}/33`,
    ];

    if (bcStatus.sessionId) {
      bcInfo.push(`Session ID: ${bcStatus.sessionId}`);
    }

    bcInfo.forEach((info, idx) => {
      doc.text(info, 90, y + 5 + (idx * 5));
    });

    y += 25;
  }

  // Framework Breakdown
  y = addSectionTitle(doc, 'Framework Compliance Breakdown', y);

  data.frameworks.forEach((framework, idx) => {
    if (y > pageHeight - 40) {
      doc.addPage();
      y = addHeader(doc, 'Compliance Assessment Report', 'Framework Details');
      y += 5;
    }

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(framework.framework, 20, y);

    if (framework.version) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`v${framework.version}`, 20 + doc.getTextWidth(framework.framework) + 3, y);
    }

    // Score on right
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...getStatusColor(framework.status));
    doc.text(`${framework.score}%`, pageWidth - 35, y, { align: 'right' });

    // Status badge
    doc.setFillColor(...getStatusColor(framework.status));
    doc.roundedRect(pageWidth - 32, y - 4, 17, 6, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(6);
    doc.text(framework.status.toUpperCase().replace('-', ' '), pageWidth - 23.5, y - 0.5, { align: 'center' });

    // Progress bar
    addProgressBar(doc, framework.score, 20, y + 3, pageWidth - 55, 3);

    if (framework.lastAssessment) {
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(`Last assessed: ${framework.lastAssessment}`, 20, y + 9);
    }

    y += 16;
  });

  // Recommendations
  if (data.recommendations.length > 0) {
    if (y > pageHeight - 60) {
      doc.addPage();
      y = addHeader(doc, 'Compliance Assessment Report', 'Recommendations');
      y += 5;
    }

    y = addSectionTitle(doc, 'Recommendations', y);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);

    data.recommendations.forEach((rec, idx) => {
      if (y > pageHeight - 25) {
        doc.addPage();
        y = 25;
      }

      // Bullet point
      doc.setFillColor(14, 165, 233); // Cyan-500
      doc.circle(23, y - 1.5, 1.5, 'F');

      // Wrap long text
      const lines = doc.splitTextToSize(rec, pageWidth - 50);
      doc.text(lines, 28, y);
      y += lines.length * 5 + 3;
    });
  }

  // Add footers to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, i, totalPages);
  }

  return doc.output('blob');
}

/**
 * Generates a certificate PDF
 */
export async function generateCertificatePDF(data: CertificateData): Promise<Blob> {
  const doc = createBrandedPDF('landscape');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Decorative border
  doc.setDrawColor(14, 165, 233); // Cyan-500
  doc.setLineWidth(2);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

  doc.setDrawColor(99, 102, 241); // Indigo-500
  doc.setLineWidth(0.5);
  doc.rect(15, 15, pageWidth - 30, pageHeight - 30);

  // Corner decorations
  const cornerSize = 20;
  doc.setFillColor(14, 165, 233);
  // Top-left
  doc.triangle(10, 10, 10 + cornerSize, 10, 10, 10 + cornerSize, 'F');
  // Top-right
  doc.triangle(pageWidth - 10, 10, pageWidth - 10 - cornerSize, 10, pageWidth - 10, 10 + cornerSize, 'F');
  // Bottom-left
  doc.triangle(10, pageHeight - 10, 10 + cornerSize, pageHeight - 10, 10, pageHeight - 10 - cornerSize, 'F');
  // Bottom-right
  doc.triangle(pageWidth - 10, pageHeight - 10, pageWidth - 10 - cornerSize, pageHeight - 10, pageWidth - 10, pageHeight - 10 - cornerSize, 'F');

  // CSOAI Logo
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('CSOAI', pageWidth / 2, 40, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('AI Safety & Compliance Platform', pageWidth / 2, 48, { align: 'center' });

  // Certificate Title
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(14, 165, 233);
  doc.text('CERTIFICATE', pageWidth / 2, 70, { align: 'center' });

  doc.setFontSize(14);
  doc.setTextColor(100, 116, 139);
  doc.text(`of ${data.certificateType}`, pageWidth / 2, 80, { align: 'center' });

  // Recipient
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text('This is to certify that', pageWidth / 2, 100, { align: 'center' });

  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(data.recipientName, pageWidth / 2, 115, { align: 'center' });

  // Decorative line under name
  doc.setDrawColor(14, 165, 233);
  doc.setLineWidth(0.5);
  const nameWidth = doc.getTextWidth(data.recipientName);
  doc.line((pageWidth - nameWidth) / 2 - 10, 120, (pageWidth + nameWidth) / 2 + 10, 120);

  // Achievement description
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);

  let achievementText = 'has successfully completed the requirements for';
  if (data.courseName) {
    achievementText = `has successfully completed "${data.courseName}"`;
  }
  doc.text(achievementText, pageWidth / 2, 132, { align: 'center' });

  if (data.score !== undefined) {
    doc.text(`with a score of ${data.score}%`, pageWidth / 2, 140, { align: 'center' });
  }

  // Byzantine Council Verification Seal
  if (data.byzantineVerified) {
    const sealX = pageWidth / 2;
    const sealY = 158;

    // Outer circle
    doc.setFillColor(34, 197, 94);
    doc.circle(sealX, sealY, 12, 'F');

    // Inner circle
    doc.setFillColor(255, 255, 255);
    doc.circle(sealX, sealY, 9, 'F');

    // Checkmark (simplified)
    doc.setFillColor(34, 197, 94);
    doc.setFontSize(12);
    doc.setTextColor(34, 197, 94);
    doc.text('33', sealX, sealY + 3, { align: 'center' });

    doc.setFontSize(7);
    doc.text('BYZANTINE VERIFIED', sealX, sealY + 18, { align: 'center' });
  }

  // Certificate details
  const detailsY = 185;

  // Issue date
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Issued:', 60, detailsY);
  doc.setTextColor(15, 23, 42);
  doc.text(data.issueDate, 60, detailsY + 5);

  // Certificate ID
  doc.setTextColor(100, 116, 139);
  doc.text('Certificate ID:', pageWidth / 2, detailsY, { align: 'center' });
  doc.setTextColor(15, 23, 42);
  doc.text(data.certificateId, pageWidth / 2, detailsY + 5, { align: 'center' });

  // Expiry (if applicable)
  if (data.expiryDate) {
    doc.setTextColor(100, 116, 139);
    doc.text('Valid Until:', pageWidth - 60, detailsY, { align: 'right' });
    doc.setTextColor(15, 23, 42);
    doc.text(data.expiryDate, pageWidth - 60, detailsY + 5, { align: 'right' });
  }

  // Verification URL
  if (data.verificationUrl) {
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Verify at: ${data.verificationUrl}`, pageWidth / 2, pageHeight - 20, { align: 'center' });
  }

  return doc.output('blob');
}

/**
 * Generates a regulatory report PDF
 */
export async function generateRegulatoryReportPDF(data: RegulatoryReportData): Promise<Blob> {
  const doc = createBrandedPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Page 1: Executive Summary
  let y = addHeader(doc, 'Regulatory Compliance Report', `${data.reportPeriod.start} - ${data.reportPeriod.end}`);

  // Report Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(data.reportTitle, pageWidth / 2, y, { align: 'center' });

  y += 12;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Prepared for: ${data.organizationName}`, pageWidth / 2, y, { align: 'center' });

  y += 15;

  // Executive Summary Cards
  y = addSectionTitle(doc, 'Executive Summary', y);

  const summaryMetrics = [
    { label: 'AI Systems', value: data.systemsCount.toString(), color: [14, 165, 233] },
    { label: 'Council Sessions', value: data.byzantineCouncilSessions.toString(), color: [99, 102, 241] },
    { label: 'Active PDCA Cycles', value: data.pdcaCycles.active.toString(), color: [34, 197, 94] },
    { label: 'Critical Incidents', value: data.incidentsSummary.critical.toString(), color: [239, 68, 68] },
  ];

  const cardWidth = (pageWidth - 50) / 4;

  summaryMetrics.forEach((metric, idx) => {
    const x = 20 + (idx * (cardWidth + 5));

    // Card background
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(x, y, cardWidth, 25, 2, 2, 'F');

    // Colored top accent
    doc.setFillColor(metric.color[0], metric.color[1], metric.color[2]);
    doc.roundedRect(x, y, cardWidth, 3, 2, 2, 'F');
    doc.rect(x, y + 1, cardWidth, 2, 'F');

    // Value
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(metric.value, x + cardWidth / 2, y + 14, { align: 'center' });

    // Label
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(metric.label, x + cardWidth / 2, y + 21, { align: 'center' });
  });

  y += 35;

  // Framework Compliance Summary
  y = addSectionTitle(doc, 'Framework Compliance Overview', y);

  // Table header
  doc.setFillColor(15, 23, 42);
  doc.rect(20, y, pageWidth - 40, 8, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Framework', 25, y + 5.5);
  doc.text('Score', pageWidth / 2, y + 5.5, { align: 'center' });
  doc.text('Status', pageWidth - 40, y + 5.5, { align: 'right' });

  y += 10;

  data.frameworkSummary.forEach((framework, idx) => {
    const rowY = y + (idx * 10);

    // Alternating row background
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(20, rowY - 2, pageWidth - 40, 10, 'F');
    }

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(framework.framework, 25, rowY + 4);

    // Score with color
    doc.setTextColor(...getStatusColor(framework.status));
    doc.text(`${framework.score}%`, pageWidth / 2, rowY + 4, { align: 'center' });

    // Status badge
    doc.setFillColor(...getStatusColor(framework.status));
    const statusText = framework.status.replace('-', ' ').toUpperCase();
    const statusWidth = 25;
    doc.roundedRect(pageWidth - 45 - statusWidth, rowY, statusWidth, 7, 1, 1, 'F');
    doc.setFontSize(6);
    doc.setTextColor(255, 255, 255);
    doc.text(statusText, pageWidth - 45 - statusWidth / 2, rowY + 4.5, { align: 'center' });
  });

  y += data.frameworkSummary.length * 10 + 10;

  // Incidents Summary
  if (y > pageHeight - 60) {
    doc.addPage();
    y = addHeader(doc, 'Regulatory Compliance Report', 'Incident Analysis');
    y += 5;
  }

  y = addSectionTitle(doc, 'Incident Summary', y);

  const incidentStats = [
    { label: 'Total Incidents', value: data.incidentsSummary.total, color: [100, 116, 139] },
    { label: 'Critical', value: data.incidentsSummary.critical, color: [239, 68, 68] },
    { label: 'Resolved', value: data.incidentsSummary.resolved, color: [34, 197, 94] },
  ];

  incidentStats.forEach((stat, idx) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(stat.label + ':', 25 + (idx * 50), y);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(stat.color[0], stat.color[1], stat.color[2]);
    doc.text(stat.value.toString(), 25 + (idx * 50) + 5, y + 6);
  });

  y += 20;

  // AI Systems List
  if (data.systems.length > 0) {
    doc.addPage();
    y = addHeader(doc, 'Regulatory Compliance Report', 'AI Systems Detail');
    y += 5;

    y = addSectionTitle(doc, 'Registered AI Systems', y);

    // Table header
    doc.setFillColor(15, 23, 42);
    doc.rect(15, y, pageWidth - 30, 8, 'F');

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('System Name', 20, y + 5.5);
    doc.text('Type', 80, y + 5.5);
    doc.text('Risk Level', 120, y + 5.5);
    doc.text('Compliance', 155, y + 5.5);
    doc.text('Status', pageWidth - 25, y + 5.5, { align: 'right' });

    y += 10;

    data.systems.forEach((system, idx) => {
      if (y > pageHeight - 25) {
        doc.addPage();
        y = 25;
      }

      const rowY = y + (idx * 8);

      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(15, rowY - 2, pageWidth - 30, 8, 'F');
      }

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(system.name.substring(0, 25), 20, rowY + 4);
      doc.text(system.type.substring(0, 15), 80, rowY + 4);

      // Risk level with color
      const riskColors: Record<string, [number, number, number]> = {
        minimal: [34, 197, 94],
        limited: [245, 158, 11],
        high: [249, 115, 22],
        unacceptable: [239, 68, 68],
      };
      doc.setTextColor(...(riskColors[system.riskLevel.toLowerCase()] || [100, 116, 139]));
      doc.text(system.riskLevel.toUpperCase(), 120, rowY + 4);

      // Compliance score
      doc.setTextColor(15, 23, 42);
      doc.text(`${system.complianceScore}%`, 155, rowY + 4);

      // Status
      doc.text(system.status, pageWidth - 25, rowY + 4, { align: 'right' });

      y = rowY;
    });

    y += 15;
  }

  // Recommendations
  if (data.recommendations.length > 0) {
    if (y > pageHeight - 60) {
      doc.addPage();
      y = addHeader(doc, 'Regulatory Compliance Report', 'Recommendations');
      y += 5;
    }

    y = addSectionTitle(doc, 'Recommendations & Action Items', y);

    data.recommendations.forEach((rec, idx) => {
      if (y > pageHeight - 25) {
        doc.addPage();
        y = 25;
      }

      doc.setFillColor(14, 165, 233);
      doc.circle(23, y - 1, 1.5, 'F');

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);

      const lines = doc.splitTextToSize(rec, pageWidth - 50);
      doc.text(lines, 28, y);
      y += lines.length * 5 + 4;
    });
  }

  // Add footers to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, i, totalPages);
  }

  return doc.output('blob');
}

/**
 * Captures an HTML element as a PDF
 * Useful for exporting dashboards or complex visualizations
 */
export async function captureElementAsPDF(
  element: HTMLElement,
  filename: string,
  options?: {
    orientation?: 'portrait' | 'landscape';
    title?: string;
    includeHeader?: boolean;
  }
): Promise<Blob> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  });

  const imgData = canvas.toDataURL('image/png');
  const orientation = options?.orientation || 'portrait';
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  let y = 10;

  if (options?.includeHeader && options?.title) {
    y = addHeader(doc, options.title);
  }

  // Calculate image dimensions to fit page
  const imgWidth = pageWidth - 20;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  // Handle multi-page content
  let remainingHeight = imgHeight;
  let sourceY = 0;
  let pageNum = 1;

  while (remainingHeight > 0) {
    const availableHeight = pageHeight - y - 15;
    const drawHeight = Math.min(remainingHeight, availableHeight);

    // Calculate source dimensions
    const sourceHeight = (drawHeight / imgHeight) * canvas.height;

    // Create a temporary canvas for this page section
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = sourceHeight;

    const ctx = tempCanvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(
        canvas,
        0, sourceY, canvas.width, sourceHeight,
        0, 0, canvas.width, sourceHeight
      );

      const pageImgData = tempCanvas.toDataURL('image/png');
      doc.addImage(pageImgData, 'PNG', 10, y, imgWidth, drawHeight);
    }

    remainingHeight -= drawHeight;
    sourceY += sourceHeight;

    if (remainingHeight > 0) {
      doc.addPage();
      pageNum++;
      if (options?.includeHeader && options?.title) {
        y = addHeader(doc, options.title, `Page ${pageNum}`);
      } else {
        y = 10;
      }
    }
  }

  // Add footers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, i, totalPages);
  }

  return doc.output('blob');
}

/**
 * Downloads a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generates and downloads a compliance assessment PDF
 */
export async function downloadComplianceAssessmentPDF(
  data: ComplianceAssessmentData,
  filename?: string
): Promise<void> {
  const blob = await generateComplianceAssessmentPDF(data);
  const defaultFilename = `CSOAI_Compliance_Assessment_${data.systemName.replace(/\s+/g, '_')}_${data.assessmentDate.replace(/\//g, '-')}.pdf`;
  downloadBlob(blob, filename || defaultFilename);
}

/**
 * Generates and downloads a certificate PDF
 */
export async function downloadCertificatePDF(
  data: CertificateData,
  filename?: string
): Promise<void> {
  const blob = await generateCertificatePDF(data);
  const defaultFilename = `CSOAI_Certificate_${data.certificateId}.pdf`;
  downloadBlob(blob, filename || defaultFilename);
}

/**
 * Generates and downloads a regulatory report PDF
 */
export async function downloadRegulatoryReportPDF(
  data: RegulatoryReportData,
  filename?: string
): Promise<void> {
  const blob = await generateRegulatoryReportPDF(data);
  const defaultFilename = `CSOAI_Regulatory_Report_${data.reportPeriod.start.replace(/\//g, '-')}_to_${data.reportPeriod.end.replace(/\//g, '-')}.pdf`;
  downloadBlob(blob, filename || defaultFilename);
}
