/**
 * PDFExportButton - Reusable PDF export button component
 * Provides a clean interface for exporting compliance reports, certificates, and regulatory reports
 */

import { useState } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, Award, Building2, Loader2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import {
  downloadComplianceAssessmentPDF,
  downloadCertificatePDF,
  downloadRegulatoryReportPDF,
  captureElementAsPDF,
  downloadBlob,
  ComplianceAssessmentData,
  CertificateData,
  RegulatoryReportData,
  ReportType,
} from '@/lib/pdfExport';

export type ExportType = 'assessment' | 'certificate' | 'regulatory' | 'element';

export interface PDFExportButtonProps extends Omit<ButtonProps, 'onClick'> {
  /** Type of export */
  exportType: ExportType;
  /** Data for the export (depends on exportType) */
  data?: ComplianceAssessmentData | CertificateData | RegulatoryReportData;
  /** Element to capture (only for 'element' type) */
  elementRef?: React.RefObject<HTMLElement>;
  /** Custom filename for the PDF */
  filename?: string;
  /** Title for element capture */
  elementTitle?: string;
  /** Orientation for element capture */
  orientation?: 'portrait' | 'landscape';
  /** Show dropdown with multiple export options */
  showOptions?: boolean;
  /** Available export types in dropdown (when showOptions is true) */
  availableTypes?: ExportType[];
  /** Callback when export starts */
  onExportStart?: () => void;
  /** Callback when export completes */
  onExportComplete?: () => void;
  /** Callback when export fails */
  onExportError?: (error: Error) => void;
  /** Button label */
  label?: string;
  /** Custom icon */
  icon?: React.ReactNode;
}

/**
 * Get icon for export type
 */
function getExportIcon(type: ExportType): React.ReactNode {
  switch (type) {
    case 'assessment':
      return <FileText className="h-4 w-4" />;
    case 'certificate':
      return <Award className="h-4 w-4" />;
    case 'regulatory':
      return <Building2 className="h-4 w-4" />;
    case 'element':
    default:
      return <Download className="h-4 w-4" />;
  }
}

/**
 * Get label for export type
 */
function getExportLabel(type: ExportType): string {
  switch (type) {
    case 'assessment':
      return 'Compliance Assessment';
    case 'certificate':
      return 'Certificate';
    case 'regulatory':
      return 'Regulatory Report';
    case 'element':
      return 'Current View';
    default:
      return 'PDF';
  }
}

/**
 * PDFExportButton Component
 */
export function PDFExportButton({
  exportType,
  data,
  elementRef,
  filename,
  elementTitle,
  orientation = 'portrait',
  showOptions = false,
  availableTypes = ['assessment', 'certificate', 'regulatory'],
  onExportStart,
  onExportComplete,
  onExportError,
  label,
  icon,
  variant = 'outline',
  size = 'default',
  className,
  disabled,
  ...buttonProps
}: PDFExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  /**
   * Handle export for a specific type
   */
  const handleExport = async (type: ExportType = exportType) => {
    if (isExporting) return;

    setIsExporting(true);
    onExportStart?.();

    try {
      switch (type) {
        case 'assessment':
          if (!data || !('overallScore' in data)) {
            throw new Error('Compliance assessment data is required');
          }
          await downloadComplianceAssessmentPDF(data as ComplianceAssessmentData, filename);
          toast.success('Compliance assessment PDF exported successfully');
          break;

        case 'certificate':
          if (!data || !('certificateId' in data)) {
            throw new Error('Certificate data is required');
          }
          await downloadCertificatePDF(data as CertificateData, filename);
          toast.success('Certificate PDF exported successfully');
          break;

        case 'regulatory':
          if (!data || !('systemsCount' in data)) {
            throw new Error('Regulatory report data is required');
          }
          await downloadRegulatoryReportPDF(data as RegulatoryReportData, filename);
          toast.success('Regulatory report PDF exported successfully');
          break;

        case 'element':
          if (!elementRef?.current) {
            throw new Error('Element reference is required for element capture');
          }
          const blob = await captureElementAsPDF(elementRef.current, filename || 'export.pdf', {
            orientation,
            title: elementTitle,
            includeHeader: !!elementTitle,
          });
          downloadBlob(blob, filename || 'CSOAI_Export.pdf');
          toast.success('PDF exported successfully');
          break;

        default:
          throw new Error(`Unknown export type: ${type}`);
      }

      onExportComplete?.();
    } catch (error) {
      console.error('PDF export error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to export PDF';
      toast.error(errorMessage);
      onExportError?.(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Render dropdown menu with multiple options
   */
  if (showOptions) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            size={size}
            className={className}
            disabled={disabled || isExporting}
            {...buttonProps}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              icon || <Download className="h-4 w-4 mr-2" />
            )}
            {label || 'Export PDF'}
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Export Options</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {availableTypes.map((type) => (
            <DropdownMenuItem
              key={type}
              onClick={() => handleExport(type)}
              disabled={isExporting}
              className="cursor-pointer"
            >
              {getExportIcon(type)}
              <span className="ml-2">{getExportLabel(type)}</span>
            </DropdownMenuItem>
          ))}
          {elementRef && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleExport('element')}
                disabled={isExporting}
                className="cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span className="ml-2">Export Current View</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  /**
   * Render single export button
   */
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      disabled={disabled || isExporting}
      onClick={() => handleExport()}
      {...buttonProps}
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        icon || getExportIcon(exportType)
      )}
      <span className="ml-2">{label || `Export ${getExportLabel(exportType)}`}</span>
    </Button>
  );
}

/**
 * Simplified button specifically for compliance assessments
 */
export interface ComplianceExportButtonProps extends Omit<ButtonProps, 'onClick'> {
  assessmentData: ComplianceAssessmentData;
  filename?: string;
  onExportComplete?: () => void;
  onExportError?: (error: Error) => void;
}

export function ComplianceExportButton({
  assessmentData,
  filename,
  onExportComplete,
  onExportError,
  ...buttonProps
}: ComplianceExportButtonProps) {
  return (
    <PDFExportButton
      exportType="assessment"
      data={assessmentData}
      filename={filename}
      label="Export PDF"
      icon={<Download className="h-4 w-4" />}
      onExportComplete={onExportComplete}
      onExportError={onExportError}
      {...buttonProps}
    />
  );
}

/**
 * Simplified button specifically for certificates
 */
export interface CertificateExportButtonProps extends Omit<ButtonProps, 'onClick'> {
  certificateData: CertificateData;
  filename?: string;
  onExportComplete?: () => void;
  onExportError?: (error: Error) => void;
}

export function CertificateExportButton({
  certificateData,
  filename,
  onExportComplete,
  onExportError,
  ...buttonProps
}: CertificateExportButtonProps) {
  return (
    <PDFExportButton
      exportType="certificate"
      data={certificateData}
      filename={filename}
      label="Download Certificate"
      icon={<Award className="h-4 w-4" />}
      onExportComplete={onExportComplete}
      onExportError={onExportError}
      {...buttonProps}
    />
  );
}

/**
 * Simplified button specifically for regulatory reports
 */
export interface RegulatoryExportButtonProps extends Omit<ButtonProps, 'onClick'> {
  reportData: RegulatoryReportData;
  filename?: string;
  onExportComplete?: () => void;
  onExportError?: (error: Error) => void;
}

export function RegulatoryExportButton({
  reportData,
  filename,
  onExportComplete,
  onExportError,
  ...buttonProps
}: RegulatoryExportButtonProps) {
  return (
    <PDFExportButton
      exportType="regulatory"
      data={reportData}
      filename={filename}
      label="Export Regulatory Report"
      icon={<Building2 className="h-4 w-4" />}
      onExportComplete={onExportComplete}
      onExportError={onExportError}
      {...buttonProps}
    />
  );
}

/**
 * Button for capturing current view as PDF
 */
export interface CaptureViewButtonProps extends Omit<ButtonProps, 'onClick'> {
  elementRef: React.RefObject<HTMLElement>;
  title?: string;
  filename?: string;
  orientation?: 'portrait' | 'landscape';
  onExportComplete?: () => void;
  onExportError?: (error: Error) => void;
}

export function CaptureViewButton({
  elementRef,
  title,
  filename,
  orientation = 'portrait',
  onExportComplete,
  onExportError,
  ...buttonProps
}: CaptureViewButtonProps) {
  return (
    <PDFExportButton
      exportType="element"
      elementRef={elementRef}
      elementTitle={title}
      filename={filename}
      orientation={orientation}
      label="Export View"
      icon={<Download className="h-4 w-4" />}
      onExportComplete={onExportComplete}
      onExportError={onExportError}
      {...buttonProps}
    />
  );
}

export default PDFExportButton;
