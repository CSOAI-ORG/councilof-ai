/*
 * COAI Reports Page
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

const reports = [
  {
    id: 1,
    title: "Q4 2024 EU AI Act Compliance Report",
    type: "Compliance",
    framework: "EU AI Act",
    generated: "Dec 20, 2024",
    status: "Final",
    pages: 45,
  },
  {
    id: 2,
    title: "NIST AI RMF Assessment - Customer Service Bot",
    type: "Assessment",
    framework: "NIST",
    generated: "Dec 18, 2024",
    status: "Final",
    pages: 28,
  },
  {
    id: 3,
    title: "Risk Classification Report - Hiring Algorithm",
    type: "Risk",
    framework: "Multi-Framework",
    generated: "Dec 15, 2024",
    status: "Draft",
    pages: 32,
  },
  {
    id: 4,
    title: "33-Agent Council Monthly Summary",
    type: "Council",
    framework: "Internal",
    generated: "Dec 1, 2024",
    status: "Final",
    pages: 18,
  },
  {
    id: 5,
    title: "Watchdog Incident Analysis - November 2024",
    type: "Incident",
    framework: "Internal",
    generated: "Nov 30, 2024",
    status: "Final",
    pages: 24,
  },
];

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

// Sample data for generating regulatory report PDF
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
          <div className="flex gap-2">
            <RegulatoryExportButton
              reportData={sampleReportData}
              variant="outline"
              className="gap-2"
            />
            <Button
              onClick={() => toast.info("Feature coming soon", { description: "Generate a new report" })}
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

        {/* Reports List */}
        <div className="space-y-3">
          {reports.map((report, idx) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15, delay: idx * 0.03 }}
            >
              <Card className="bg-card border-border hover:bg-accent/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>

                    {/* Main Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{report.title}</h3>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <span>{report.framework}</span>
                        <span>•</span>
                        <span>{report.pages} pages</span>
                        <span>•</span>
                        <span>{report.generated}</span>
                      </div>
                    </div>

                    {/* Type Badge */}
                    <Badge variant="outline" className={getTypeBadge(report.type)}>
                      {report.type}
                    </Badge>

                    {/* Status */}
                    <Badge
                      variant="outline"
                      className={
                        report.status === "Final"
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                          : "bg-amber-500/10 text-amber-500 border-amber-500/30"
                      }
                    >
                      {report.status}
                    </Badge>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toast.info("Opening report preview")}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toast.info("Downloading report")}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
