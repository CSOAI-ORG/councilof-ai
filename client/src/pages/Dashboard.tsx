/*
 * CSOAI Dashboard Overview Page
 * Real-time metrics, compliance status, SOAI-PDCA loop visualization
 * Connected to backend APIs for live data
 */

import { motion } from "framer-motion";
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  FileCheck,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  BarChart3,
  RefreshCw,
  Loader2,
  Play,
  CheckCircle,
  CircleDot,
  Circle,
  Target,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useLocation, Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { downloadBoardCsv } from "@/lib/boardCsv";
import { useQuery } from "@tanstack/react-query";
import { ComplianceTrendChart } from "@/components/charts";

interface DashboardStats {
  complianceScore: number | null;
  totalSystems: number;
  pendingReviews: number;
  trend?: { date: string; score: number }[];
  council: { totalSessions: number; pendingReview: number; consensusReached: number };
  watchdog: { count: number; reports: { title: string; companyName?: string; createdAt: string; status: string }[] };
  pdca: {
    totalCycles: number;
    activeCycles: number;
    completedCycles: number;
    pausedCycles: number;
    phaseDistribution: { plan: number; do: number; check: number; act: number };
  };
  loi: { total: number; count: number };
  gspc?: { measured_axes: number; quotable_axes: number; public_count?: string };
  cards?: { count: number; signed: number };
}

async function fetchDashboardStats(): Promise<DashboardStats> {
  const r = await fetch("/api/dashboard/stats");
  if (!r.ok) throw new Error("dashboard stats unavailable");
  return r.json();
}

// Framework compliance scores are UNMEASURED for this account — no number is
// invented here. The card renders an honest empty state pointing at the live board.
const frameworkCompliance: { name: string }[] = [
  { name: "EU AI Act" },
  { name: "NIST AI RMF" },
  { name: "TC260" },
];

const quickActions = [
  { label: "My Progress", href: "/dashboard/progress", icon: Target },
  { label: "Register AI System", href: "/ai-systems", icon: Shield },
  { label: "Run Assessment", href: "/compliance", icon: FileCheck },
  { label: "View Council", href: "/agent-council", icon: Users },
  { label: "Check Watchdog", href: "/watchdog", icon: Eye },
];

export default function Dashboard() {
  const [, setLocation] = useLocation();
  
  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: fetchDashboardStats,
    staleTime: 30_000,
  });

  const dashboardStats = stats;
  const councilStats = stats?.council;
  const watchdogReports = stats?.watchdog?.reports ?? [];
  const pdcaStats = stats?.pdca;
  const loiData = stats?.loi;

  // Calculate real metrics
  const metrics = [
    {
      title: "Compliance Score",
      // Honesty: no fabricated fallback. No real stats → an honest empty state,
      // never an invented percentage with an invented trend.
      value: dashboardStats?.complianceScore != null ? `${dashboardStats.complianceScore}%` : "—",
      change: dashboardStats?.complianceScore != null ? "from your measured systems" : "no systems measured yet",
      changeType: dashboardStats?.complianceScore != null ? "positive" : "neutral",
      icon: Shield,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      description: "Overall compliance across frameworks",
    },
    {
      title: "Active AI Systems",
      value: dashboardStats?.totalSystems?.toString() || "0",
      change: `${dashboardStats?.pendingReviews || 0} pending review`,
      changeType: "neutral",
      icon: Activity,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      description: "Registered systems in your organization",
    },
    {
      title: "Watchdog Reports",
      value: (watchdogReports?.length ?? stats?.watchdog?.count ?? 0).toString(),
      change: "Public database",
      changeType: "neutral",
      icon: Eye,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      description: "Public AI safety incidents",
    },
    {
      title: "Council Sessions",
      value: councilStats?.totalSessions?.toString() || "0",
      change: `${councilStats?.pendingReview || 0} pending votes`,
      changeType: "positive",
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      description: "Designed 33-Agent Council decisions",
    },
  ];

  // Recent activity from real data
  const recentActivity = [
    ...(watchdogReports.slice(0, 3).map(report => ({
      action: `Watchdog report: ${report.title.substring(0, 30)}...`,
      system: report.companyName || "Unknown",
      time: new Date(report.createdAt).toLocaleDateString(),
      status: report.status === "resolved" ? "success" : (report.status as any) === "dismissed" ? "error" : "warning",
      icon: Eye,
    })) || []),
    {
      action: "System initialized",
      system: "CSOAI Platform",
      time: "Today",
      status: "success",
      icon: CheckCircle2,
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold font-primary">Dashboard</h1>
            <p className="text-muted-foreground text-sm">
              Your Council OS — governance across every framework, signed to Layer 0
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.label}
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation(action.href)}
                  className="hidden md:flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {action.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric, idx) => {
            const Icon = metric.icon;
            return (
              <motion.div
                key={metric.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.05 }}
              >
                <Card className="bg-card border-border hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground font-medium">
                          {metric.title}
                        </p>
                        <p className="text-3xl font-bold mt-1 tracking-tight">
                          {metric.value}
                        </p>
                        <div className="flex items-center gap-1 mt-2">
                          {metric.changeType === "positive" ? (
                            <ArrowUpRight className="h-3 w-3 text-emerald-600" />
                          ) : metric.changeType === "negative" ? (
                            <ArrowDownRight className="h-3 w-3 text-red-600" />
                          ) : null}
                          <p
                            className={`text-xs ${
                              metric.changeType === "positive"
                                ? "text-emerald-600"
                                : metric.changeType === "negative"
                                ? "text-red-600"
                                : "text-muted-foreground"
                            }`}
                          >
                            {metric.change}
                          </p>
                        </div>
                      </div>
                      <div className={`p-3 rounded-xl ${metric.bgColor}`}>
                        <Icon className={`h-5 w-5 ${metric.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* SOAI-PDCA Loop - Enhanced Visualization */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.2 }}
        >
          <Card className="bg-card border-border overflow-hidden">
            <CardHeader className="pb-3 bg-gradient-to-r from-blue-500/5 to-purple-500/5">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                SOAI-PDCA Continuous Improvement Loop
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  (Safety Of AI - Plan, Do, Check, Act)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {/* Visual PDCA Cycle */}
              <div className="relative">
                {/* Connection lines */}
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-emerald-500 via-amber-500 to-purple-500 -translate-y-1/2 hidden lg:block" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { 
                      phase: "PLAN", 
                      fullName: "Planning Phase",
                      status: pdcaStats?.phaseDistribution?.plan ? "active" : "pending",
                      description: "Define compliance requirements and action items",
                      items: [
                        "Map EU AI Act requirements",
                        "Identify NIST RMF gaps",
                        "Set TC260 compliance targets"
                      ],
                      color: "blue",
                      icon: FileCheck,
                      progress: pdcaStats?.phaseDistribution?.plan ? 100 : 0,
                      count: pdcaStats?.phaseDistribution?.plan || 0,
                    },
                    { 
                      phase: "DO", 
                      fullName: "Implementation Phase",
                      status: pdcaStats?.phaseDistribution?.do ? "active" : "pending",
                      description: "Execute compliance measures and controls",
                      items: [
                        "Implement safety controls",
                        "Deploy monitoring systems",
                        "Train AI systems"
                      ],
                      color: "emerald",
                      icon: Play,
                      progress: pdcaStats?.phaseDistribution?.do ? 65 : 0,
                      count: pdcaStats?.phaseDistribution?.do || 0,
                    },
                    { 
                      phase: "CHECK", 
                      fullName: "Evaluation Phase",
                      status: pdcaStats?.phaseDistribution?.check ? "active" : (watchdogReports?.length ? "active" : "pending"),
                      description: "Monitor via Watchdog reports and designed 33-agent council",
                      items: [
                        `${watchdogReports?.length || 0} Watchdog reports`,
                        `${councilStats?.totalSessions || 0} Council sessions`,
                        "Human analyst review"
                      ],
                      color: "amber",
                      icon: Eye,
                      progress: watchdogReports?.length ? Math.min(100, (watchdogReports.length / 10) * 100) : 0,
                      count: pdcaStats?.phaseDistribution?.check || 0,
                    },
                    { 
                      phase: "ACT", 
                      fullName: "Improvement Phase",
                      status: pdcaStats?.phaseDistribution?.act ? "active" : "pending",
                      description: "Apply improvements based on findings",
                      items: [
                        "Update AI models",
                        "Refine safety measures",
                        `${pdcaStats?.completedCycles || 0} cycles completed`
                      ],
                      color: "purple",
                      icon: RefreshCw,
                      progress: pdcaStats?.completedCycles ? Math.min(100, (pdcaStats.completedCycles / 5) * 100) : 0,
                      count: pdcaStats?.phaseDistribution?.act || 0,
                    },
                  ].map((item, idx) => {
                    const Icon = item.icon;
                    const colorClasses = {
                      blue: { bg: "bg-blue-500", light: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
                      emerald: { bg: "bg-emerald-500", light: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200" },
                      amber: { bg: "bg-amber-500", light: "bg-amber-50", text: "text-amber-600", border: "border-amber-200" },
                      purple: { bg: "bg-purple-500", light: "bg-purple-50", text: "text-purple-600", border: "border-purple-200" },
                    }[item.color];
                    
                    return (
                      <motion.div
                        key={item.phase}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: idx * 0.1 }}
                        className={`relative p-5 rounded-xl border-2 ${colorClasses?.border} ${colorClasses?.light} z-10`}
                      >
                        {/* Phase indicator */}
                        <div className="flex items-center justify-between mb-3">
                          <div className={`w-10 h-10 rounded-full ${colorClasses?.bg} flex items-center justify-center`}>
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex items-center gap-1">
                            {item.status === "active" ? (
                              <CheckCircle className={`h-4 w-4 ${colorClasses?.text}`} />
                            ) : item.status === "pending" ? (
                              <Circle className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <CircleDot className={`h-4 w-4 ${colorClasses?.text}`} />
                            )}
                            <span className={`text-xs font-medium ${item.status === "pending" ? "text-muted-foreground" : colorClasses?.text}`}>
                              {item.status === "active" ? "Active" : item.status === "pending" ? "Pending" : "Complete"}
                            </span>
                          </div>
                        </div>
                        
                        <h3 className={`font-bold text-xl ${colorClasses?.text}`}>{item.phase}</h3>
                        <p className="text-xs text-muted-foreground mb-3">{item.fullName}</p>
                        
                        {/* Progress bar */}
                        <div className="mb-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Progress</span>
                            <span className={`font-medium ${colorClasses?.text}`}>{item.progress}%</span>
                          </div>
                          <Progress value={item.progress} className="h-1.5" />
                        </div>
                        
                        <p className="text-xs text-muted-foreground mb-3">{item.description}</p>
                        
                        <ul className="space-y-1">
                          {item.items.map((task, i) => (
                            <li key={i} className="text-xs flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full ${colorClasses?.bg}`} />
                              {task}
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
              
              {/* Loop indicator with stats */}
              <div className="mt-6 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <RefreshCw className="h-4 w-4" />
                    <span>Continuous improvement cycle powered by SOAI (Safety Of AI)</span>
                  </div>
                  {pdcaStats && (
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-blue-600 font-medium">{pdcaStats.activeCycles} active</span>
                      <span className="text-emerald-600 font-medium">{pdcaStats.completedCycles} completed</span>
                      <span className="text-muted-foreground">{pdcaStats.totalCycles} total cycles</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Compliance Charts — rendered only with real trend data.
            The chart components carry mock DEFAULT_DATA for Storybook/demo;
            shipping that to visitors would be stats theatre, so the empty
            state is explicit when no measured trend exists. */}
        {dashboardStats?.trend?.length ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.25 }}
            >
              <ComplianceTrendChart
                title="Compliance Score Trend"
                description="Track your compliance progress over the past 12 months"
                height={300}
                data={dashboardStats.trend}
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.3 }}
            >
              {/* HONESTY FIX (B3): this used to render <FrameworkComparisonChart>
                  with NO data prop, which silently plotted the component's mock
                  DEFAULT_DATA as if it were this account's measurements. No
                  per-framework comparison is measured for the account yet, so the
                  cell says so — it does not chart example numbers. */}
              <div className="flex h-full flex-col justify-center rounded-xl border border-gray-200 bg-white p-8 text-center">
                <p className="font-semibold text-gray-900">Framework comparison — UNMEASURED</p>
                <p className="mt-1 text-sm text-gray-500">
                  No per-framework scores are measured for this account, so nothing is plotted.
                  Example data is never charted as yours.
                </p>
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
            <p className="text-gray-900 font-semibold">No trend data yet</p>
            <p className="mt-1 text-sm text-gray-500">
              Charts appear once your AI systems have real measurements behind them —
              we don&apos;t plot example data as if it were yours.
            </p>
            <a href="/ai-systems" className="mt-4 inline-block text-sm font-medium text-emerald-600 hover:text-emerald-700">
              Register your first AI system →
            </a>
          </div>
        )}

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Framework Compliance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.35 }}
          >
            <Card className="bg-card border-border h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Multi-Framework Compliance
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setLocation("/compliance")}>
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {frameworkCompliance.map((framework) => (
                  <div key={framework.name} className="flex items-center justify-between">
                    <span className="font-medium text-sm">{framework.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600">
                      UNMEASURED
                    </span>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground pt-1">
                  No compliance score is invented here. Your framework posture is UNMEASURED
                  until an assessment runs — start one at /assess, or read the live measured
                  board at /gspc-scoreboard.
                </p>
                <button
                  type="button"
                  data-testid="dashboard-board-csv"
                  className="text-xs font-semibold text-emerald-700 underline underline-offset-2 hover:text-emerald-800"
                  onClick={async () => {
                    // One number source: the CSV is built from a fresh GET /api/gspc,
                    // never from this dashboard's own cached stats (B3 — no second board).
                    try {
                      const r = await fetch("/api/gspc", { headers: { accept: "application/json" } });
                      if (!r.ok) throw new Error(`HTTP ${r.status}`);
                      downloadBoardCsv(await r.json());
                    } catch {
                      alert("GET /api/gspc did not answer — no CSV is written from cached numbers.");
                    }
                  }}
                >
                  Download the live board as CSV (fetched from /api/gspc on click)
                </button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.3 }}
          >
            <Card className="bg-card border-border h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Recent Activity
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setLocation("/watchdog")}>
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {recentActivity.map((activity, idx) => {
                    const Icon = activity.icon;
                    return (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div
                          className={`mt-0.5 p-1.5 rounded-full ${
                            activity.status === "success"
                              ? "bg-emerald-100 text-emerald-600"
                              : activity.status === "warning"
                              ? "bg-amber-100 text-amber-600"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          <Icon className="h-3 w-3" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{activity.action}</p>
                          <p className="text-muted-foreground text-xs">
                            {activity.system}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {activity.time}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* PDCA Cycles Summary */}
        {pdcaStats && pdcaStats.totalCycles > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.35 }}
          >
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Active PDCA Cycles
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setLocation("/pdca")}>
                    Manage Cycles
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-950">
                    <div className="text-2xl font-bold text-blue-600">{(pdcaStats.phaseDistribution.plan as any)?.count ?? pdcaStats.phaseDistribution.plan}</div>
                    <div className="text-xs text-muted-foreground">Plan Phase</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950">
                    <div className="text-2xl font-bold text-green-600">{(pdcaStats.phaseDistribution.do as any)?.count ?? pdcaStats.phaseDistribution.do}</div>
                    <div className="text-xs text-muted-foreground">Do Phase</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-amber-50 dark:bg-amber-950">
                    <div className="text-2xl font-bold text-amber-600">{(pdcaStats.phaseDistribution.check as any)?.count ?? pdcaStats.phaseDistribution.check}</div>
                    <div className="text-xs text-muted-foreground">Check Phase</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-purple-50 dark:bg-purple-950">
                    <div className="text-2xl font-bold text-purple-600">{(pdcaStats.phaseDistribution.act as any)?.count ?? pdcaStats.phaseDistribution.act}</div>
                    <div className="text-xs text-muted-foreground">Act Phase</div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                  <span>{pdcaStats.activeCycles} active cycles</span>
                  <span>{pdcaStats.completedCycles} completed</span>
                  <span>{pdcaStats.pausedCycles} paused</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* LOI Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.4 }}
        >
          <Card className="bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      Join the AI Safety Movement
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-bold text-primary">{loiData?.total || (loiData as any)?.count || 0}+</span> people have signed up to become Watchdog Analysts.
                      Work from home, earn money, protect humanity.
                    </p>
                  </div>
                </div>
                <Link href="/watchdog-signup">
                  <Button>
                    Sign Up Now
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
