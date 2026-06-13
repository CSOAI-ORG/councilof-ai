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

  // Calculate compliance metrics
  const totalSystems = aiSystems?.length || 0;
  const compliantSystems = aiSystems?.filter((s) => s.riskLevel === 'minimal' || s.riskLevel === 'limited').length || 0;
  const highRiskSystems = aiSystems?.filter((s) => s.riskLevel === 'high' || (s.riskLevel as string) === 'unacceptable').length || 0;
  const complianceRate = totalSystems > 0 ? Math.round((compliantSystems / totalSystems) * 100) : 0;

  // PDCA cycle metrics
  const activeCycles = 3;
  const completedCycles = 7;

  // Prepare PDF export data
  const pdfExportData = useMemo((): RegulatoryReportData | null => {
    if (!aiSystems) return null;

    // Build framework summary
    const frameworkSummary: ComplianceScore[] = [
      { framework: 'EU AI Act', score: (stats as any)?.euAiActScore || 82, status: 'partial' as const },
      { framework: 'NIST AI RMF', score: (stats as any)?.nistScore || 88, status: 'compliant' as const },
      { framework: 'TC260', score: (stats as any)?.tc260Score || 75, status: 'partial' as const },
      { framework: 'ISO 42001', score: 90, status: 'compliant' as const },
    ];

    // Build systems list
    const systemsList = aiSystems.slice(0, 20).map((system) => ({
      name: system.name,
      type: system.systemType || 'AI System',
      riskLevel: system.riskLevel || 'minimal',
      complianceScore: system.riskLevel === 'minimal' ? 90 : system.riskLevel === 'limited' ? 75 : 60,
      status: system.riskLevel === 'minimal' || system.riskLevel === 'limited' ? 'Compliant' : 'Under Review',
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
        total: 8,
        critical: highRiskSystems,
        resolved: 6,
      },
      pdcaCycles: {
        active: activeCycles,
        completed: completedCycles,
      },
      byzantineCouncilSessions: 15,
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
                {compliantSystems} compliant, {highRiskSystems} high-risk
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Compliance Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{complianceRate}%</div>
              <p className="text-sm text-gray-600 mt-1">
                {complianceRate >= 80 ? 'Excellent' : complianceRate >= 60 ? 'Good' : 'Needs Improvement'}
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
              <div className="text-3xl font-bold text-blue-600">{activeCycles}</div>
              <p className="text-sm text-gray-600 mt-1">
                {completedCycles} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Overall Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600">{stats?.overallScore || 85}</div>
              <p className="text-sm text-gray-600 mt-1">
                +5% from last month
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

        {/* Compliance Analytics Charts */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <ComplianceTrendChart
            title="Compliance Score Trend"
            description="Track compliance progress across frameworks over time"
            height={320}
          />
          <FrameworkComparisonChart
            title="Framework Comparison"
            description="Compare compliance status across regulatory frameworks"
            height={320}
          />
        </div>

        {/* Incident Analytics */}
        <div className="mb-8">
          <IncidentTrendChart
            title="Incident Tracking"
            description="Monitor incident reports and resolution rates"
            height={350}
          />
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">Compliance assessment completed</p>
                    <p className="text-sm text-gray-600">Customer Service AI - EU AI Act</p>
                  </div>
                </div>
                <Badge variant="outline">2 hours ago</Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="font-medium">Risk level updated</p>
                    <p className="text-sm text-gray-600">ML Pipeline System - High Risk</p>
                  </div>
                </div>
                <Badge variant="outline">5 hours ago</Badge>
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <Target className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium">PDCA cycle initiated</p>
                    <p className="text-sm text-gray-600">Quarterly Safety Review</p>
                  </div>
                </div>
                <Badge variant="outline">1 day ago</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
