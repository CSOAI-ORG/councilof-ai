/**
 * PDF export helpers — stubs for certificate and report generation.
 * The full implementation can be wired to a server-side PDF service or jsPDF.
 */

export type ReportType = "regulatory" | "compliance" | "certificate" | "assessment";

export interface RegulatoryReportData {
  reportTitle?: string;
  title?: string;
  reportPeriod?: { start: string; end: string } | string;
  organizationName?: string;
  frameworks?: string[];
  findings?: string[];
  generatedAt?: string;
  [key: string]: any;
}

export interface ComplianceScore {
  framework: string;
  score: number;
  maxScore?: number;
  status: "compliant" | "partial" | "non-compliant" | "not-assessed";
}

export interface ComplianceAssessmentData {
  reportTitle?: string;
  title?: string;
  framework?: string;
  organizationName?: string;
  systemName?: string;
  systemId?: string;
  scores?: ComplianceScore[];
  findings?: string[];
  generatedAt?: string;
  [key: string]: any;
}

export interface CertificateData {
  recipientName?: string;
  courseName?: string;
  completionDate?: string;
  certificateId?: string;
  certificateType?: string;
  issueDate?: string;
  expiryDate?: string;
  score?: number;
  [key: string]: any;
}

export interface PDFExportOptions {
  filename?: string;
  elementId?: string;
}

export async function exportToPDF(_options: PDFExportOptions = {}): Promise<boolean> {
  console.warn("[pdfExport] PDF export is not fully implemented in this build");
  return false;
}

export async function generateCertificatePDF(_payload: CertificateData): Promise<Blob | null> {
  console.warn("[pdfExport] Certificate PDF generation is not fully implemented");
  return null;
}

export async function downloadComplianceAssessmentPDF(
  _data: ComplianceAssessmentData,
  _filename?: string
): Promise<boolean> {
  console.warn("[pdfExport] Compliance assessment PDF download is not fully implemented");
  return false;
}

export async function downloadCertificatePDF(
  _data: CertificateData,
  _filename?: string
): Promise<boolean> {
  console.warn("[pdfExport] Certificate PDF download is not fully implemented");
  return false;
}

export async function downloadRegulatoryReportPDF(
  _data: RegulatoryReportData,
  _filename?: string
): Promise<boolean> {
  console.warn("[pdfExport] Regulatory report PDF download is not fully implemented");
  return false;
}

export interface CaptureOptions {
  orientation?: "portrait" | "landscape";
  title?: string;
  includeHeader?: boolean;
}

export async function captureElementAsPDF(
  _element: HTMLElement | string,
  _filename?: string,
  _options?: CaptureOptions
): Promise<Blob> {
  console.warn("[pdfExport] Element capture PDF is not fully implemented");
  return new Blob(["PDF export stub"], { type: "application/pdf" });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
