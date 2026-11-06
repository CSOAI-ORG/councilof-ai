import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Users, Award, BookOpen, CheckCircle } from "lucide-react";

const REGIONAL_FRAMEWORKS = [
  { id: 1, code: "EU_AI_ACT", name: "EU AI Act", color: "#3b82f6" },
  { id: 2, code: "NIST_RMF", name: "NIST AI RMF", color: "#10b981" },
  {
    id: 3,
    code: "UK_AI_SAFETY",
    name: "UK AI Safety Institute",
    color: "#f59e0b",
  },
  { id: 4, code: "CANADA_AIDA", name: "Canada AIDA", color: "#ef4444" },
  {
    id: 5,
    code: "AUSTRALIA_AI_ETHICS",
    name: "Australia AI Ethics",
    color: "#8b5cf6",
  },
  { id: 6, code: "ISO_42001", name: "ISO 42001", color: "#ec4899" },
  { id: 7, code: "CHINA_TC260", name: "China TC260", color: "#06b6d4" },
];

type QueryRead = {
  data?: unknown;
  isLoading: boolean;
  error?: unknown;
  refetch?: () => unknown;
};
function numeric(value: unknown): number | null {
  if (typeof value !== "number" && !(typeof value === "string" && value.trim()))
    return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}
function metric(
  query: QueryRead,
  value: unknown,
  digits?: number,
  suffix = "",
): string {
  if (query.error) return "Unavailable";
  if (query.isLoading) return "Loading…";
  const number = numeric(value);
  if (number === null) return "Not reported";
  return (
    number.toLocaleString(
      "en-GB",
      digits === undefined
        ? {}
        : { minimumFractionDigits: digits, maximumFractionDigits: digits },
    ) + suffix
  );
}
function QueryFeedback({
  query,
  label,
  empty,
}: {
  query: QueryRead;
  label: string;
  empty: string;
}) {
  if (query.isLoading)
    return (
      <p role="status" className="py-6 text-sm text-muted-foreground">
        Reading {label}…
      </p>
    );
  if (query.error || query.data === undefined || query.data === null)
    return (
      <div
        role="alert"
        className="rounded-xl border border-amber-700/30 bg-amber-50 p-4 text-sm text-amber-950"
      >
        <p>{label} could not be loaded. No current count is available.</p>
        {query.refetch ? (
          <button
            type="button"
            onClick={() => {
              void query.refetch?.();
            }}
            className="mt-2 min-h-11 rounded-lg border border-amber-800/30 px-3 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-800"
          >
            Retry {label}
          </button>
        ) : null}
      </div>
    );
  return <p className="py-6 text-sm text-muted-foreground">{empty}</p>;
}

export default function RegionalAnalytics() {
  const [selectedRegion, setSelectedRegion] = useState<number | undefined>();
  const selectedCourse = undefined;
  const comparison = trpc.regionalAnalytics.getRegionalComparison.useQuery();
  const enrollment = trpc.regionalAnalytics.getEnrollmentStats.useQuery({
    regionId: selectedRegion,
    courseId: selectedCourse,
  });
  const certificates = trpc.regionalAnalytics.getCertificateStats.useQuery({
    regionId: selectedRegion,
  });
  const enrollmentList = trpc.regionalAnalytics.getCourseEnrollments.useQuery({
    regionId: selectedRegion,
    courseId: selectedCourse,
  });
  const issuanceList = trpc.regionalAnalytics.getCertificateIssuances.useQuery({
    regionId: selectedRegion,
    courseId: selectedCourse,
  });
  const enrollmentStats = enrollment.data;
  const certificateStats = certificates.data;
  const canReadComparison =
    !comparison.error &&
    !comparison.isLoading &&
    Array.isArray(comparison.data);
  const regionalChartData = canReadComparison
    ? comparison.data!.map((region) => {
        const framework = REGIONAL_FRAMEWORKS.find(
          (entry) => entry.id === region.regionId,
        );
        return {
          name: framework?.name || `Region ${region.regionId}`,
          enrollments: numeric(region.totalEnrollments),
          completions: numeric(region.totalCompletions),
          certificates: numeric(region.totalCertificates),
          completionRate: numeric(region.completionRate),
        };
      })
    : [];
  const enrollmentChartData = regionalChartData.filter((row) =>
    [row.enrollments, row.completions, row.certificates].some(
      (value) => value !== null,
    ),
  );
  const completionChartData = regionalChartData.filter(
    (row) => row.completionRate !== null && row.completionRate <= 100,
  );
  const enrollments =
    !enrollmentList.error &&
    !enrollmentList.isLoading &&
    Array.isArray(enrollmentList.data)
      ? enrollmentList.data
      : [];
  const issuances =
    !issuanceList.error &&
    !issuanceList.isLoading &&
    Array.isArray(issuanceList.data)
      ? issuanceList.data
      : [];

  return (
    <div className="container mx-auto space-y-8 px-4 py-8">
      <div>
        <h1 className="text-3xl font-bold">Regional Analytics Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Track enrollment, completion, and certification metrics across 7
          regional frameworks
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter analytics by region</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedRegion?.toString() ?? "all"}
            onValueChange={(value) => {
              const region = REGIONAL_FRAMEWORKS.find(
                (entry) => entry.id.toString() === value,
              );
              setSelectedRegion(region?.id);
            }}
          >
            <SelectTrigger
              aria-label="Region"
              className="min-h-11 w-full sm:w-64"
            >
              <SelectValue placeholder="All Regions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              {REGIONAL_FRAMEWORKS.map((framework) => (
                <SelectItem key={framework.id} value={framework.id.toString()}>
                  {framework.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      {enrollment.error ? (
        <QueryFeedback query={enrollment} label="Enrollment metrics" empty="" />
      ) : null}
      {certificates.error ? (
        <QueryFeedback
          query={certificates}
          label="Certificate metrics"
          empty=""
        />
      ) : null}
      <div
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        aria-label="Regional metrics"
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Enrollments
            </CardTitle>
            <Users
              className="h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold"
              data-testid="regional-total-enrollments"
            >
              {metric(enrollment, enrollmentStats?.totalEnrollments)}
            </div>
            <p className="text-xs text-muted-foreground">
              Active: {metric(enrollment, enrollmentStats?.activeEnrollments)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completions</CardTitle>
            <CheckCircle
              className="h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold"
              data-testid="regional-completions"
            >
              {metric(enrollment, enrollmentStats?.completedEnrollments)}
            </div>
            <p className="text-xs text-muted-foreground">
              Average progress:{" "}
              {metric(enrollment, enrollmentStats?.averageProgress, 1, "%")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Certificates Issued
            </CardTitle>
            <Award
              className="h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold"
              data-testid="regional-certificates"
            >
              {metric(certificates, certificateStats?.totalIssued)}
            </div>
            <p className="text-xs text-muted-foreground">
              Average score:{" "}
              {metric(certificates, certificateStats?.averageScore, 1, "%")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Certificate Downloads
            </CardTitle>
            <BookOpen
              className="h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold"
              data-testid="regional-downloads"
            >
              {metric(certificates, certificateStats?.totalDownloads)}
            </div>
            <p className="text-xs text-muted-foreground">
              Verifications:{" "}
              {metric(certificates, certificateStats?.totalVerifications)}
            </p>
          </CardContent>
        </Card>
      </div>
      <Tabs defaultValue="comparison" className="space-y-4">
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="comparison">Regional Comparison</TabsTrigger>
          <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
        </TabsList>
        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Enrollment by Region</CardTitle>
              <CardDescription>
                Compare enrollment metrics across all 7 regional frameworks
              </CardDescription>
            </CardHeader>
            <CardContent>
              {enrollmentChartData.length ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={enrollmentChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="enrollments"
                      fill="#3b82f6"
                      name="Enrollments"
                    />
                    <Bar
                      dataKey="completions"
                      fill="#10b981"
                      name="Completions"
                    />
                    <Bar
                      dataKey="certificates"
                      fill="#f59e0b"
                      name="Certificates"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <QueryFeedback
                  query={comparison}
                  label="Regional comparison"
                  empty="No enrollment metrics were reported for these regions."
                />
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Completion Rate by Region</CardTitle>
              <CardDescription>
                Percentage of enrolled students who completed the course
              </CardDescription>
            </CardHeader>
            <CardContent>
              {completionChartData.length ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={completionChartData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" width={150} />
                    <Tooltip />
                    <Bar
                      dataKey="completionRate"
                      fill="#8b5cf6"
                      name="Completion Rate (%)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <QueryFeedback
                  query={comparison}
                  label="Regional comparison"
                  empty="No completion rates were reported for these regions."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="enrollments">
          <Card>
            <CardHeader>
              <CardTitle>Recent Enrollments</CardTitle>
              <CardDescription>
                Latest course enrollments for selected region
              </CardDescription>
            </CardHeader>
            <CardContent>
              {enrollments.length ? (
                <div className="space-y-4">
                  {enrollments.slice(0, 10).map((row) => (
                    <div
                      key={row.id}
                      className="flex flex-wrap items-center justify-between gap-3 border-b pb-2"
                    >
                      <div>
                        <p className="font-medium">Course ID: {row.courseId}</p>
                        <p className="text-sm text-muted-foreground">
                          Enrolled:{" "}
                          {new Date(row.enrolledAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{row.status}</p>
                        <p className="text-sm text-muted-foreground">
                          Progress:{" "}
                          {metric(
                            enrollmentList,
                            row.progressPercent,
                            undefined,
                            "% complete",
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <QueryFeedback
                  query={enrollmentList}
                  label="Recent enrollments"
                  empty="No enrollments found for this selection."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="certificates">
          <Card>
            <CardHeader>
              <CardTitle>Recent Certificate Issuances</CardTitle>
              <CardDescription>
                Latest certificates issued for selected region
              </CardDescription>
            </CardHeader>
            <CardContent>
              {issuances.length ? (
                <div className="space-y-4">
                  {issuances.slice(0, 10).map((row) => (
                    <div
                      key={row.id}
                      className="flex flex-wrap items-center justify-between gap-3 border-b pb-2"
                    >
                      <div>
                        <p className="font-medium">{row.certificateType}</p>
                        <p className="break-words text-sm text-muted-foreground">
                          {row.frameworkCode} • {row.certificateNumber}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          Score:{" "}
                          {metric(issuanceList, row.score, undefined, "%")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(row.issuedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <QueryFeedback
                  query={issuanceList}
                  label="Recent certificate issuances"
                  empty="No certificates found for this selection."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
