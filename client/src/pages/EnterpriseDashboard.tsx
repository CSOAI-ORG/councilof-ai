/**
 * Enterprise Dashboard
 * Comprehensive portal for enterprise customers showing AI systems, compliance, PDCA cycles, and analytics
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Users,
  Activity,
  FileText,
  BarChart3,
  Clock,
  Target,
  Download,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Link } from 'wouter';
import { ComplianceTrendChart, FrameworkComparisonChart, IncidentTrendChart } from '@/components/charts';
import { PDFExportButton } from '@/components/PDFExportButton';
import { RegulatoryReportData, ComplianceScore } from '@/lib/pdfExport';

export default function EnterpriseDashboard() {
  // Fetch enterprise data
  const { data: aiSystems } = trpc.aiSystems.list.useQuery();
  const { data: stats } = trpc.dashboard.getStats.useQuery();
  const { data: pdcaStats } = trpc.pdca.getStats.useQuery();

  // Calculate compliance metrics
  const totalSystems = aiSystems?.length || 0;
  // Self-declared risk tier, not compliance: a minimal/limited tier is not a measurement.
  const lowerTierSystems = aiSystems?.filter((s) => s.riskLevel === 'minimal' || s.riskLevel === 'limited').length || 0;
  const highRiskSystems = aiSystems?.filter((s) => s.riskLevel === 'high' || (s.riskLevel as string) === 'unacceptable').length || 0;

  // PDCA cycle metrics — real query only; null until measured (never invented).
  const activeCycles = (pdcaStats as any)?.active ?? null;
  const completedCycles = (pdcaStats as any)?.completed ?? null;

  // Prepare PDF export data
  const pdfExportData = useMemo((): RegulatoryReportData | null => {
    if (!aiSystems) return null;

    // Build framework summary
    // 2026-09-26: the fallbacks (82 / 88 / 75 / 90, two of them "compliant") were invented.
    // No framework score is measured for this account, so the report lists none.
    const frameworkSummary: ComplianceScore[] = [];

    // Build systems list
    const systemsList = aiSystems.slice(0, 20).map((system) => ({
      name: system.name,
      type: system.systemType || 'AI System',
      riskLevel: system.riskLevel || 'minimal',
      complianceScore: null,
      status: 'Unmeasured',
    }));

    return {
      reportTitle: 'Enterprise Compliance Dashboard Report',
      reportPeriod: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        end: new Date().toLocaleDateString(),
      },
      organizationName: 'CSOAI Enterprise',
      systemsCount: totalSystems,
      systems: systemsList,
      frameworkSummary,
      incidentsSummary: {
        total: (stats as any)?.totalIncidents ?? 0,
        critical: highRiskSystems,
        resolved: (stats as any)?.resolvedIncidents ?? 0,
      },
      pdcaCycles: {
        active: activeCycles ?? 0,
        completed: completedCycles ?? 0,
      },
      byzantineCouncilSessions: (stats as any)?.councilSessions ?? 0,
      recommendations: [
        'Continue monitoring compliance across all registered AI systems',
        'Schedule quarterly assessments for high-risk systems',
        'Review and update safety protocols based on PDCA cycle findings',
        'Expand training for teams managing AI systems',
        'Consider additional framework certifications for competitive advantage',
      ],
      generatedAt: new Date().toISOString(),
    };
  }, [aiSystems, stats, totalSystems, highRiskSystems, activeCycles, completedCycles]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Enterprise Dashboard</h1>
              <p className="text-green-100 text-lg">
                Comprehensive AI Safety & Compliance Management
              </p>
            </div>
            <div className="flex gap-4">
              {pdfExportData && (
                <PDFExportButton
                  exportType="regulatory"
                  data={pdfExportData}
                  variant="outline"
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                  label="Export Report"
                  icon={<Download className="h-4 w-4" />}
                />
              )}
              <Link href="/ai-systems">
                <Button variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                  <Shield className="mr-2 h-4 w-4" />
                  Manage AI Systems
                </Button>
              </Link>
              <Link href="/pdca">
                <Button variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                  <Activity className="mr-2 h-4 w-4" />
                  PDCA Cycles
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                AI Systems
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{totalSystems}</div>
              <p className="text-sm text-gray-600 mt-1">
                {lowerTierSystems} minimal/limited tier, {highRiskSystems} high-risk (self-declared)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Measured status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-700">UNMEASURED</div>
              <p className="text-sm text-gray-600 mt-1">
                No measured run is recorded for these systems. A risk tier is not a compliance rate.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                PDCA Cycles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{activeCycles ?? "—"}</div>
              <p className="text-sm text-gray-600 mt-1">
                {completedCycles != null ? `${completedCycles} completed` : "no cycles measured yet"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Self-assessment average
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600">{stats?.overallScore ?? "UNMEASURED"}</div>
              <p className="text-sm text-gray-600 mt-1">
                Your own answers, not a CSOAI measurement
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/ai-systems">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Shield className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Register AI System</h3>
                    <p className="text-sm text-gray-600">Add a new AI system for monitoring</p>
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/compliance">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Run Assessment</h3>
                    <p className="text-sm text-gray-600">Start a compliance assessment</p>
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/reports">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">View Reports</h3>
                    <p className="text-sm text-gray-600">Access compliance reports</p>
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>
        </div>

        {/* Compliance Analytics Charts — rendered only with real trend data.
            The chart components carry mock DEFAULT_DATA for demo purposes;
            shipping that to visitors would be stats theatre. */}
        {(stats as any)?.trend?.length ? (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <ComplianceTrendChart
              title="Compliance Score Trend"
              description="Track compliance progress across frameworks over time"
              height={320}
              data={(stats as any).trend}
            />
          </div>
        ) : (
          <Card className="mb-8">
            <CardContent className="p-8 text-center">
              <p className="font-semibold">No trend data yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Charts appear once your AI systems have real measurements behind them —
                we don&apos;t plot example data as if it were yours.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* 2026-09-26: three invented activity rows (a completed assessment, a risk-level
                change, a PDCA start, each with a made-up age) were removed. Nothing here reads
                an activity log, so the honest state is empty. */}
            <p className="text-sm text-gray-600">No activity is recorded for this account yet.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
