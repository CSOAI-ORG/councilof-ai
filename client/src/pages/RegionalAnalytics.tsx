import { useEffect } from "react";
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Award, DollarSign, BookOpen, CheckCircle } from 'lucide-react';

const REGIONAL_FRAMEWORKS = [
  { id: 1, code: 'EU_AI_ACT', name: 'EU AI Act', color: '#3b82f6' },
  { id: 2, code: 'NIST_RMF', name: 'NIST AI RMF', color: '#10b981' },
  { id: 3, code: 'UK_AI_SAFETY', name: 'UK AI Safety Institute', color: '#f59e0b' },
  { id: 4, code: 'CANADA_AIDA', name: 'Canada AIDA', color: '#ef4444' },
  { id: 5, code: 'AUSTRALIA_AI_ETHICS', name: 'Australia AI Ethics', color: '#8b5cf6' },
  { id: 6, code: 'ISO_42001', name: 'ISO 42001', color: '#ec4899' },
  { id: 7, code: 'CHINA_TC260', name: 'China TC260', color: '#06b6d4' },
];

export default function RegionalAnalytics() {
  useEffect(() => { document.title = "RegionalAnalytics | CSOAI"; }, []);
  const [selectedRegion, setSelectedRegion] = useState<number | undefined>();
  const [selectedCourse, setSelectedCourse] = useState<number | undefined>();

  const { data: regionalComparison, isLoading: loadingComparison } = 
    trpc.regionalAnalytics.getRegionalComparison.useQuery();

  const { data: enrollmentStats } = trpc.regionalAnalytics.getEnrollmentStats.useQuery({
    regionId: selectedRegion,
    courseId: selectedCourse,
  });

  const { data: certificateStats } = trpc.regionalAnalytics.getCertificateStats.useQuery({
    regionId: selectedRegion,
  });

  const { data: enrollments } = trpc.regionalAnalytics.getCourseEnrollments.useQuery({
    regionId: selectedRegion,
    courseId: selectedCourse,
  });

  const { data: certificateIssuances } = trpc.regionalAnalytics.getCertificateIssuances.useQuery({
    regionId: selectedRegion,
    courseId: selectedCourse,
  });

  // Prepare chart data
  const regionalChartData = regionalComparison?.map(region => {
    const framework = REGIONAL_FRAMEWORKS.find(f => f.id === region.regionId);
    return {
      name: framework?.name || `Region ${region.regionId}`,
      enrollments: Number(region.totalEnrollments) || 0,
      completions: Number(region.totalCompletions) || 0,
      certificates: Number(region.totalCertificates) || 0,
      revenue: Number(region.totalRevenue) || 0,
      completionRate: Number(region.completionRate) || 0,
      color: framework?.color || '#3b82f6',
    };
  }) || [];

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Regional Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Track enrollment, completion, and certification metrics across 7 regional frameworks
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter analytics by region and course</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Select value={selectedRegion?.toString()} onValueChange={(v) => setSelectedRegion(v ? Number(v) : undefined)}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="All Regions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              {REGIONAL_FRAMEWORKS.map(framework => (
                <SelectItem key={framework.id} value={framework.id.toString()}>
                  {framework.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enrollmentStats?.totalEnrollments || 0}</div>
            <p className="text-xs text-muted-foreground">
              {enrollmentStats?.activeEnrollments || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completions</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enrollmentStats?.completedEnrollments || 0}</div>
            <p className="text-xs text-muted-foreground">
              {enrollmentStats?.averageProgress?.toFixed(1) || 0}% avg progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certificates Issued</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{certificateStats?.totalIssued || 0}</div>
            <p className="text-xs text-muted-foreground">
              Avg score: {certificateStats?.averageScore?.toFixed(1) || 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certificate Downloads</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{certificateStats?.totalDownloads || 0}</div>
            <p className="text-xs text-muted-foreground">
              {certificateStats?.totalVerifications || 0} verifications
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="comparison" className="space-y-4">
        <TabsList>
          <TabsTrigger value="comparison">Regional Comparison</TabsTrigger>
          <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
        </TabsList>

        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Enrollment by Region</CardTitle>
              <CardDescription>Compare enrollment metrics across all 7 regional frameworks</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingComparison ? (
                <div className="h-80 flex items-center justify-center">
                  <p className="text-muted-foreground">Loading data...</p>
                </div>
              ) : regionalChartData.length === 0 ? (
                // Honest empty slot: the tRPC analytics backend is not reachable from
                // this static deployment, and recharts throws (decimal.js-light on a
                // NaN auto-domain) when handed empty data. Empty state, never a crash.
                <div className="h-80 flex items-center justify-center px-6 text-center">
                  <p className="text-muted-foreground">No live analytics — the metrics backend is unreachable from this deployment.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={regionalChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="enrollments" fill="#3b82f6" name="Enrollments" />
                    <Bar dataKey="completions" fill="#10b981" name="Completions" />
                    <Bar dataKey="certificates" fill="#f59e0b" name="Certificates" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Completion Rate by Region</CardTitle>
              <CardDescription>Percentage of enrolled students who completed the course</CardDescription>
            </CardHeader>
            <CardContent>
              {regionalChartData.length === 0 ? (
                <div className="h-60 flex items-center justify-center px-6 text-center">
                  <p className="text-muted-foreground">No live analytics — the metrics backend is unreachable from this deployment.</p>
                </div>
              ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={regionalChartData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" width={150} />
                  <Tooltip />
                  <Bar dataKey="completionRate" fill="#8b5cf6" name="Completion Rate (%)" />
                </BarChart>
              </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="enrollments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Enrollments</CardTitle>
              <CardDescription>Latest course enrollments for selected region</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {enrollments && enrollments.length > 0 ? (
                  enrollments.slice(0, 10).map((enrollment) => (
                    <div key={enrollment.id} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="font-medium">Course ID: {enrollment.courseId}</p>
                        <p className="text-sm text-muted-foreground">
                          Enrolled: {new Date(enrollment.enrolledAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{enrollment.status}</p>
                        <p className="text-sm text-muted-foreground">{enrollment.progressPercent}% complete</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">No enrollments found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certificates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Certificate Issuances</CardTitle>
              <CardDescription>Latest certificates issued for selected region</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {certificateIssuances && certificateIssuances.length > 0 ? (
                  certificateIssuances.slice(0, 10).map((cert) => (
                    <div key={cert.id} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="font-medium">{cert.certificateType}</p>
                        <p className="text-sm text-muted-foreground">
                          {cert.frameworkCode} • {cert.certificateNumber}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">Score: {cert.score}%</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(cert.issuedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">No certificates found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
