/*
 * CSOAI Reports Page
 * Generated compliance reports and documentation
 */

import { motion } from "framer-motion";
import { FileText, Download, Calendar, Filter, Search, Eye, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { PDFExportButton, RegulatoryExportButton } from "@/components/PDFExportButton";
import { RegulatoryReportData } from "@/lib/pdfExport";

// No fabricated report list — reports render here once generated for real.


const getTypeBadge = (type: string) => {
  const colors: Record<string, string> = {
    Compliance: "bg-blue-500/10 text-blue-500 border-blue-500/30",
    Assessment: "bg-purple-500/10 text-purple-500 border-purple-500/30",
    Risk: "bg-amber-500/10 text-amber-500 border-amber-500/30",
    Council: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
    Incident: "bg-red-500/10 text-red-500 border-red-500/30",
  };
  return colors[type] || "bg-gray-500/10 text-gray-500 border-gray-500/30";
};

// Example data for the SAMPLE regulatory report PDF — clearly labelled as a
// sample in the UI. Never presented as the visitor's own report.
const getSampleRegulatoryReportData = (): RegulatoryReportData => ({
  reportTitle: "Quarterly Compliance Status Report",
  reportPeriod: {
    start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    end: new Date().toLocaleDateString(),
  },
  organizationName: "CSOAI Enterprise",
  systemsCount: 5,
  systems: [
    { name: "Customer Service AI", type: "Chatbot", riskLevel: "Limited", complianceScore: 85, status: "Compliant" },
    { name: "Hiring Algorithm v2", type: "Decision System", riskLevel: "High", complianceScore: 72, status: "Partial" },
    { name: "Content Moderation ML", type: "Classification", riskLevel: "Limited", complianceScore: 91, status: "Compliant" },
    { name: "Fraud Detection System", type: "Anomaly Detection", riskLevel: "High", complianceScore: 78, status: "Partial" },
    { name: "Recommendation Engine", type: "ML Pipeline", riskLevel: "Minimal", complianceScore: 95, status: "Compliant" },
  ],
  frameworkSummary: [
    { framework: "EU AI Act", score: 82, status: "partial" },
    { framework: "NIST AI RMF", score: 88, status: "compliant" },
    { framework: "TC260", score: 75, status: "partial" },
    { framework: "ISO 42001", score: 90, status: "compliant" },
  ],
  incidentsSummary: {
    total: 12,
    critical: 2,
    resolved: 10,
  },
  pdcaCycles: {
    active: 3,
    completed: 7,
  },
  byzantineCouncilSessions: 24,
  recommendations: [
    "Continue monitoring high-risk systems for EU AI Act compliance deadlines",
    "Schedule additional training for teams managing the Hiring Algorithm",
    "Implement automated compliance checking for new AI system deployments",
    "Review and update incident response procedures based on recent findings",
    "Consider third-party audit for TC260 framework requirements",
  ],
  generatedAt: new Date().toISOString(),
});

export default function Reports() {
  const sampleReportData = getSampleRegulatoryReportData();

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold font-primary">Reports</h1>
            <p className="text-muted-foreground text-sm">
              Generated compliance reports and documentation
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground mr-1">Example data:</span>
            <RegulatoryExportButton
              reportData={sampleReportData}
              filename="sample-regulatory-report.pdf"
              variant="outline"
              className="gap-2"
            />
            <Button
              disabled
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              Generate Report
            </Button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search reports..." className="pl-9" />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Calendar className="h-4 w-4" />
          </Button>
        </div>

        {/* Reports List — honest empty state until real reports exist */}
        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center">
            <p className="font-semibold">No reports generated yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Reports you generate appear here. We don&apos;t list example reports as if
              you made them.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
