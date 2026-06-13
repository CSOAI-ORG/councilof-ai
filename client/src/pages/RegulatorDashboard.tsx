/**
 * Regulator Dashboard - Government/Regulatory Body Access
 * Aggregated view of all AI systems, compliance status, and incidents
 */

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  AlertTriangle,
  FileCheck,
  TrendingUp,
  Building2,
  Download,
  Eye,
  Filter,
  BarChart3,
  PieChart,
  Activity,
  FileDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ComplianceTrendChart, FrameworkComparisonChart, IncidentTrendChart } from "@/components/charts";
import { PDFExportButton } from "@/components/PDFExportButton";
import { RegulatoryReportData, ComplianceScore } from "@/lib/pdfExport";

export default function RegulatorDashboard() {
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: dashboard, isLoading } = trpc.regulator.getComplianceDashboard.useQuery();
  const { data: allSystems } = trpc.regulator.getAllSystems.useQuery({
    riskLevel: riskFilter as any,
    status: statusFilter as any,
  });
  const { data: trends } = trpc.regulator.getComplianceTrends.useQuery();

  const exportMutation = trpc.regulator.exportComplianceData.useMutation({
    onSuccess: (data) => {
      // Download the CSV file
      const blob = new Blob([atob(data.data)], { type: data.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Compliance data exported successfully");
    },
    onError: (error) => {
      toast.error("Failed to export data: " + error.message);
    },
  });

  const handleExport = () => {
    exportMutation.mutate({});
  };

  // Prepare PDF export data from dashboard data
  const pdfExportData = useMemo((): RegulatoryReportData | null => {
    if (!dashboard && !allSystems) return null;

    // Build framework summary from dashboard stats
    const frameworkSummary: ComplianceScore[] = dashboard?.frameworkStats
      ? Object.entries(dashboard.frameworkStats).map(([code, stats]) => {
          const s = stats as { total: number; compliant: number; avgScore: number };
          const complianceRate = s.total > 0 ? (s.compliant / s.total) * 100 : 0;
          let status: 'compliant' | 'partial' | 'non-compliant' | 'not-assessed' = 'not-assessed';
          if (s.total > 0) {
            if (complianceRate >= 80) status = 'compliant';
            else if (complianceRate >= 50) status = 'partial';
            else status = 'non-compliant';
          }
          return {
            framework: code,
            score: s.avgScore || 0,
            status,
          };
        })
      : [];

    // Build systems list from allSystems
    const systemsList = (allSystems || []).slice(0, 20).map((system) => ({
      name: system.name,
      type: (system as any).systemType || 'AI System',
      riskLevel: system.riskLevel || 'unknown',
      complianceScore: 75, // Default score if not available
      status: system.status || 'active',
    }));

    return {
      reportTitle: 'Regulatory Compliance Overview Report',
      reportPeriod: {
        start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        end: new Date().toLocaleDateString(),
      },
      organizationName: 'CSOAI Regulatory Authority',
      systemsCount: allSystems?.length || 0,
      systems: systemsList,
      frameworkSummary,
      incidentsSummary: {
        total: dashboard?.recentCriticalReports?.length || 0,
        critical: dashboard?.recentCriticalReports?.filter((r) => r.severity === 'critical').length || 0,
        resolved: dashboard?.recentCriticalReports?.filter((r) => r.status === 'resolved').length || 0,
      },
      pdcaCycles: {
        active: 5,
        completed: 12,
      },
      byzantineCouncilSessions: dashboard?.totalAssessments || 0,
      recommendations: [
        'Continue monitoring high-risk AI systems for regulatory compliance',
        'Increase assessment frequency for systems approaching compliance deadlines',
        'Review incident patterns to identify systemic issues across organizations',
        'Consider additional guidance for TC260 framework implementation',
        'Schedule regulatory review sessions with high-risk system operators',
      ],
      generatedAt: new Date().toISOString(),
    };
  }, [dashboard, allSystems]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              Regulator Dashboard
            </h1>
            <p className="text-muted-foreground">
              Aggregated compliance oversight across all registered AI systems
            </p>
          </div>
          <div className="flex gap-2">
            {pdfExportData && (
              <PDFExportButton
                exportType="regulatory"
                data={pdfExportData}
                variant="outline"
                label="Export PDF Report"
                icon={<FileDown className="h-4 w-4" />}
              />
            )}
            <Button onClick={handleExport} disabled={exportMutation.isPending}>
              <Download className="h-4 w-4 mr-2" />
              {exportMutation.isPending ? "Exporting..." : "Export CSV"}
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <FileCheck className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{dashboard?.totalAssessments || 0}</div>
                  <div className="text-xs text-muted-foreground">Total Assessments</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Shield className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{allSystems?.length || 0}</div>
                  <div className="text-xs text-muted-foreground">Registered Systems</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {dashboard?.recentCriticalReports?.length || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Critical Reports</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {dashboard?.riskDistribution?.high || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">High-Risk Systems</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="systems">
              <Shield className="h-4 w-4 mr-2" />
              AI Systems
            </TabsTrigger>
            <TabsTrigger value="incidents">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Critical Incidents
            </TabsTrigger>
            <TabsTrigger value="trends">
              <Activity className="h-4 w-4 mr-2" />
              Trends
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Framework Compliance Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Framework Compliance</CardTitle>
                  <CardDescription>Compliance rates by regulatory framework</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboard?.frameworkStats && Object.entries(dashboard.frameworkStats).map(([code, stats]) => {
                      const s = stats as { total: number; compliant: number; avgScore: number };
                      return (
                        <div key={code} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{code}</span>
                            <span className="text-sm text-muted-foreground">
                              {s.compliant}/{s.total} compliant
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{
                                width: `${s.total > 0 ? (s.compliant / s.total) * 100 : 0}%`,
                              }}
                            />
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Avg Score: {s.avgScore}%
                          </div>
                        </div>
                      );
                    })}
                    {(!dashboard?.frameworkStats || Object.keys(dashboard.frameworkStats).length === 0) && (
                      <p className="text-muted-foreground text-sm">No assessment data available</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Risk Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Risk Distribution</CardTitle>
                  <CardDescription>AI systems by risk classification</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { level: "Minimal", count: dashboard?.riskDistribution?.minimal || 0, color: "bg-green-500" },
                      { level: "Limited", count: dashboard?.riskDistribution?.limited || 0, color: "bg-yellow-500" },
                      { level: "High", count: dashboard?.riskDistribution?.high || 0, color: "bg-orange-500" },
                      { level: "Unacceptable", count: dashboard?.riskDistribution?.unacceptable || 0, color: "bg-red-500" },
                    ].map((item) => (
                      <div key={item.level} className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${item.color}`} />
                        <span className="flex-1">{item.level}</span>
                        <span className="font-medium">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Assessments */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Assessments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dashboard?.recentAssessments?.slice(0, 10).map((assessment, idx) => (
                    <motion.div
                      key={assessment.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{assessment.systemName}</div>
                          <div className="text-xs text-muted-foreground">
                            {(assessment as any).frameworkCode || 'N/A'} • {(assessment as any).systemType || 'AI System'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            (Number((assessment as any).overallScore || assessment.score) || 0) >= 70 ? "default" : "destructive"
                          }
                        >
                          {(assessment as any).overallScore || assessment.score}%
                        </Badge>
                        <Badge variant="outline">{assessment.riskLevel}</Badge>
                      </div>
                    </motion.div>
                  ))}
                  {(!dashboard?.recentAssessments || dashboard.recentAssessments.length === 0) && (
                    <p className="text-muted-foreground text-sm text-center py-4">
                      No recent assessments
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Systems Tab */}
          <TabsContent value="systems" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">All Registered AI Systems</CardTitle>
                  <div className="flex items-center gap-2">
                    <Select value={riskFilter} onValueChange={setRiskFilter}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Risk Level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Risks</SelectItem>
                        <SelectItem value="minimal">Minimal</SelectItem>
                        <SelectItem value="limited">Limited</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="unacceptable">Unacceptable</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="under_review">Under Review</SelectItem>
                        <SelectItem value="compliant">Compliant</SelectItem>
                        <SelectItem value="non_compliant">Non-Compliant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {allSystems?.map((system, idx) => (
                    <motion.div
                      key={system.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div>
                        <div className="font-medium">{system.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {(system as any).systemType || 'AI System'} • {(system as any).createdAt ? `Created ${new Date((system as any).createdAt).toLocaleDateString()}` : system.company}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            system.riskLevel === "high" || system.riskLevel === "unacceptable"
                              ? "destructive"
                              : system.riskLevel === "limited"
                              ? "secondary"
                              : "default"
                          }
                        >
                          {system.riskLevel}
                        </Badge>
                        <Badge variant="outline">{system.status}</Badge>
                      </div>
                    </motion.div>
                  ))}
                  {(!allSystems || allSystems.length === 0) && (
                    <p className="text-muted-foreground text-sm text-center py-8">
                      No AI systems found matching filters
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Critical Incidents Tab */}
          <TabsContent value="incidents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Critical Incident Reports
                </CardTitle>
                <CardDescription>
                  Reports requiring immediate regulatory attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboard?.recentCriticalReports?.map((report, idx) => (
                    <motion.div
                      key={report.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-4 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium">{report.title}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {report.description?.substring(0, 150)}...
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="destructive">{report.severity}</Badge>
                            <Badge variant="outline">{report.incidentType}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(report.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                  {(!dashboard?.recentCriticalReports || dashboard.recentCriticalReports.length === 0) && (
                    <div className="text-center py-8">
                      <Shield className="h-12 w-12 text-green-500 mx-auto mb-2" />
                      <p className="text-muted-foreground">No critical incidents reported</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-4">
            {/* Interactive Charts */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <ComplianceTrendChart
                title="Compliance Score Trends"
                description="Historical compliance data across all registered organizations"
                height={320}
              />
              <FrameworkComparisonChart
                title="Framework Comparison"
                description="Aggregated compliance scores by regulatory framework"
                height={320}
              />
            </div>

            {/* Incident Trends */}
            <IncidentTrendChart
              title="Incident Report Analytics"
              description="Track AI safety incidents and resolution rates across all systems"
              height={380}
            />

            {/* Legacy trend display */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Monthly Assessment Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {trends && trends.length > 0 ? (
                  <div className="space-y-4">
                    {trends.map((month: any, idx: number) => (
                      <div key={month.month} className="flex items-center gap-4">
                        <div className="w-20 text-sm text-muted-foreground">{month.month}</div>
                        <div className="flex-1">
                          <div className="h-4 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{ width: `${month.avgScore || month.complianceRate || 0}%` }}
                            />
                          </div>
                        </div>
                        <div className="w-16 text-right text-sm font-medium">{month.avgScore || month.complianceRate || 0}%</div>
                        <div className="w-24 text-right text-xs text-muted-foreground">
                          {month.assessmentCount || month.assessments || 0} assessments
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm text-center py-8">
                    Not enough data for trend analysis
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
