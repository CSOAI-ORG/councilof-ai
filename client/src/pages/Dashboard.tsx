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
  gspc?: { measured_axes: number; quotable_axes: number; public_count?: string; separated_leads?: number | null };
  cards?: { count: number; signed: number };
}

interface ClaimMaintenanceWatch {
  ran_at_utc?: string;
  observed_changes_count?: number;
  review_required_claim_ids?: string[];
  claim_text_review?: {
    moved_claims_reviewed?: number;
    counts?: Record<string, number>;
  };
}

interface ClaimMaintenanceReaction {
  as_of?: string;
  category?: {
    max_single_signal_overlap_fraction?: string;
    full_stack_collision_count?: number;
    direct_name_collision_count_in_snapshot?: number;
  };
  signals?: Array<{ reaction: string; layer_o_route?: string }>;
  claim_ceiling?: { rule?: string; layer_o_route?: string; state?: string; boundary?: string };
  counter_engine?: { packet_count?: number; compare_fields?: string[]; rule?: string };
  layer_o_routing?: { counts?: Record<string, number>; meaning?: string };
}

interface CorrectionsLedger {
  corrections?: unknown[];
}

async function fetchJsonOrNull<T>(url: string): Promise<T | null> {
  const r = await fetch(url, { headers: { accept: "application/json" } });
  if (!r.ok) return null;
  return r.json();
}

/** The estate census, read live. It is deliberately a SEPARATE query from the dashboard stats:
 *  the census is not a dashboard statistic, it is an inventory, and conflating the two is how a
 *  reader comes to believe an inventory count is a measurement count. */
async function fetchEstateIndex(): Promise<{
  merkle_root: string;
  entries: { value: number | null };
  bytes_leaves: { value: number | null };
  record_leaves: { value: number | null };
  signed: boolean;
} | null> {
  const r = await fetch("/api/state");
  if (!r.ok) return null;
  const s = await r.json();
  return s?.estate_index ?? null;
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
  { label: "Open GSPC board", href: "/dashboard?tab=board", icon: Shield },
  { label: "Claim Maintenance", href: "/claim-maintenance", icon: RefreshCw },
  { label: "Verify a card", href: "/gspc-verify", icon: FileCheck },
  { label: "Request measurement", href: "/assess", icon: FileCheck },
  { label: "Open Council chat", href: "/dashboard?tab=home", icon: Users },
  { label: "Check Watchdog", href: "/dashboard?tab=watchdog", icon: Eye },
];

export default function Dashboard() {
  const [, setLocation] = useLocation();
  
  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: fetchDashboardStats,
    staleTime: 30_000,
  });

  const { data: estateIndex } = useQuery({
    queryKey: ["estate-index"],
    queryFn: fetchEstateIndex,
    staleTime: 60_000,
  });

  const { data: claimWatch } = useQuery({
    queryKey: ["claim-maintenance-watch"],
    queryFn: () => fetchJsonOrNull<ClaimMaintenanceWatch>("/api/claim-maintenance-watch"),
    staleTime: 60_000,
  });
  const { data: claimReaction } = useQuery({
    queryKey: ["claim-maintenance-reaction"],
    queryFn: () => fetchJsonOrNull<ClaimMaintenanceReaction>("/api/claim-maintenance-reaction"),
    staleTime: 60_000,
  });
  const { data: corrections } = useQuery({
    queryKey: ["public-corrections-ledger"],
    queryFn: () => fetchJsonOrNull<CorrectionsLedger>("/api/corrections"),
    staleTime: 60_000,
  });

  const dashboardStats = stats;
  const councilStats = stats?.council;
  const watchdogReports = stats?.watchdog?.reports ?? [];
  const pdcaStats = stats?.pdca;
  const gspcStats = stats?.gspc;
  const cardStats = stats?.cards;

  // Calculate real metrics
  const metrics = [
    {
      title: "Measured GSPC axes",
      value: gspcStats?.measured_axes?.toString() ?? "—",
      change: gspcStats ? `${gspcStats.quotable_axes} quotable axes` : "board unavailable",
      changeType: gspcStats ? "positive" : "neutral",
      icon: Shield,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      description: "Named measurements on the public GSPC board",
    },
    {
      title: "Published signed cards",
      value: cardStats?.signed?.toString() ?? "—",
      change: cardStats ? `${cardStats.count} indexed cards` : "card index unavailable",
      changeType: cardStats ? "positive" : "neutral",
      icon: FileCheck,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      description: "Cards reported signed by the card index",
    },
    {
      title: "Estate index (INDEXED, not measured)",
      value: estateIndex?.entries?.value?.toString() ?? "—",
      change: estateIndex
        ? `${estateIndex.bytes_leaves?.value ?? "—"} read, ${estateIndex.record_leaves?.value ?? "—"} recorded elsewhere`
        : "census unavailable",
      changeType: "neutral",
      icon: FileCheck,
      color: "text-slate-600",
      bgColor: "bg-slate-50",
      description:
        "Every artefact we hold, under one unsigned Merkle root. Finding an artefact is not measuring it, and the two leaf counts are never added together.",
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
      title: "Council runtime",
      value: "NOT LIVE",
      change: "33 seats designed · target 23/33",
      changeType: "neutral",
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      description: "0 sessions and 0 votes; independence is not demonstrated",
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
  ];

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Page Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 rounded-3xl border border-emerald-950/10 bg-[linear-gradient(135deg,#ffffff_0%,#f6fbf8_58%,#eef9f2_100%)] p-5 shadow-[0_18px_50px_rgba(6,21,15,0.06)] sm:p-6">
          <div>
            {/* h2, not h1: this page renders inside DashboardWorkspace, which owns the page's
                single <h1> ("What are you working on?" on the home surface). Two <h1>s in one
                document is an accessibility fault, and it broke the shell smoke's strict-mode
                locator on 2026-09-04, blocking every deploy. */}
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-800"><CircleDot className="h-3 w-3" /> Live evidence workspace</div>
            <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Measurement control room</h2>
            <p className="text-muted-foreground text-sm">
              Read the public board, inspect signed evidence, and keep measured, indexed, and operational states separate. Empty values remain UNMEASURED.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              aria-label="Refresh dashboard"
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
                  className="hidden items-center gap-2 rounded-xl border-emerald-950/10 bg-white/80 text-slate-800 shadow-sm hover:border-emerald-200 hover:bg-emerald-50 md:flex"
                >
                  <Icon className="h-4 w-4" />
                  {action.label}
                </Button>
              );
            })}
          </div>
        </div>

        <section
          aria-label="Public evidence status"
          className="grid overflow-hidden rounded-2xl border border-emerald-400/15 bg-[#06150f] text-white shadow-[0_14px_40px_rgba(3,17,11,0.12)] sm:grid-cols-2 xl:grid-cols-4"
        >
          {[
            {
              label: "Public board",
              value: gspcStats?.public_count || (gspcStats ? `${gspcStats.measured_axes} measured axes` : "Board unavailable"),
              note: "Measurement state",
            },
            {
              label: "Signed evidence",
              value: cardStats ? `${cardStats.signed} signed` : "—",
              note: cardStats ? `${cardStats.count} indexed cards` : "Card index unavailable",
            },
            {
              label: "Estate census",
              value: estateIndex?.entries?.value != null ? `${estateIndex.entries.value} indexed` : "—",
              note: "Indexed is not measured",
            },
            {
              label: "Operating rule",
              value: "Measure · sign · verify",
              note: "Never certification",
            },
          ].map((signal) => (
            <div key={signal.label} className="border-white/10 p-4 sm:border-r sm:p-5 xl:last:border-r-0">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-300/70">{signal.label}</p>
              <p className="mt-2 text-base font-bold text-emerald-50">{signal.value}</p>
              <p className="mt-1 text-xs text-emerald-100/55">{signal.note}</p>
            </div>
          ))}
        </section>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {metrics.map((metric, idx) => {
            const Icon = metric.icon;
            return (
              <motion.div
                key={metric.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.05 }}
              >
                <Card className="card-quiet card-quiet-hover h-full bg-card">
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

        <Card data-testid="claim-maintenance-control-loop" className="border-emerald-200/70 bg-emerald-50/40">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <RefreshCw className="h-4 w-4 text-emerald-700" />
                  Claim Maintenance counter engine
                </CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Source changes prompt review; they are never silently upgraded into findings.
                </p>
              </div>
              <Link href="/claim-maintenance">
                <Button variant="outline" size="sm">Open category record</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
              {[
                ["Observed change prompts", claimWatch?.observed_changes_count],
                ["Review required", claimWatch?.review_required_claim_ids?.length],
                ["Category signals", claimReaction?.signals?.length],
                ["Layer O adapter lanes", claimReaction?.layer_o_routing?.counts ? Object.keys(claimReaction.layer_o_routing.counts).length : undefined],
                ["Counter packets", claimReaction?.counter_engine?.packet_count],
                ["Our dated corrections", corrections?.corrections?.length],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-xl border border-emerald-950/10 bg-white px-4 py-3">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
                  <p className="mt-1 text-2xl font-black tabular-nums text-slate-950">
                    {value == null ? "—" : String(value)}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-600">
              <a className="underline underline-offset-2" href="/api/claim-maintenance-watch">latest reread</a>
              <a className="underline underline-offset-2" href="/api/claim-maintenance-reaction">market reaction index</a>
              <a className="underline underline-offset-2" href="/api/corrections">corrections ledger</a>
              <a className="underline underline-offset-2" href="/spec/claim-maintenance/priority.json">priority record</a>
              <a className="underline underline-offset-2" href="/spec/claim-maintenance/priority-witness.json">priority witness</a>
              <a className="underline underline-offset-2" href="/spec/claim-maintenance/priority-snapshots/index.json">priority evolution</a>
              <a className="underline underline-offset-2" href="/spec/claim-maintenance/priority-root.json">priority Merkle root</a>
              <a className="underline underline-offset-2" href="/spec/claim-maintenance/priority-root-witness.json">priority root witness</a>
              <span>
                Closest single-system overlap: {claimReaction?.category?.max_single_signal_overlap_fraction ?? "—"} · full-stack equivalents in snapshot: {claimReaction?.category?.full_stack_collision_count ?? "—"}
              </span>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-600">
              Category overlap is not legal ownership or equivalence. A correction records our own publication history.
              A source digest moving is a review trigger, not a claim that anyone is wrong. Layer O routing says where a
              primitive could be evaluated or ingested; it is not evidence that CSOAI adopted or measured that primitive.
              Claim ceiling: {claimReaction?.claim_ceiling?.rule ?? "no policy input loaded"}. CATEGORY_COLLISION emits a bounded
              comparison packet over public artifacts only; it does not decide legal rights, intent or misconduct.
            </p>
          </CardContent>
        </Card>

        {/* PDCA is account data, not a relabel of public GSPC/card/fleet counts. */}
        {pdcaStats && pdcaStats.totalCycles > 0 ? <motion.div
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
                      description: "Monitor via Watchdog reports and designed 33-seat council",
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
        </motion.div> : (
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <p className="font-semibold">Account PDCA cycles — UNMEASURED</p>
              <p className="mt-1 text-sm text-muted-foreground">
                No account cycle is recorded. Public GSPC axes, signed cards, and fleet nodes are separate facts and are not converted into a cycle.
              </p>
            </CardContent>
          </Card>
        )}

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
              <div className="flex h-full flex-col justify-center rounded-xl border border-border bg-card p-8 text-center">
                <p className="font-semibold text-foreground">Framework comparison — UNMEASURED</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  No per-framework scores are measured for this account, so nothing is plotted.
                  Example data is never charted as yours.
                </p>
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <p className="font-semibold text-foreground">No trend data yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Charts appear once your AI systems have real measurements behind them —
              we don&apos;t plot example data as if it were yours.
            </p>
            <a href="/assess" className="mt-4 inline-block text-sm font-medium text-emerald-600 hover:text-emerald-700">
              Request a measurement →
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
                  No compliance score is invented here. Your framework posture stays UNMEASURED
                  until a completed measurement publishes scoped evidence. /assess currently
                  opens the request path; it does not itself create a measurement. Read the
                  published board at /gspc-scoreboard.
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
                  {recentActivity.length === 0 && (
                    <p className="p-3 text-sm text-muted-foreground">No account activity is recorded.</p>
                  )}
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
                      Public watchdog intake
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Submit a report for evidence review. This path does not promise employment, payment, or a regulatory determination.
                    </p>
                  </div>
                </div>
                <Link href="/public-watchdog">
                  <Button>
                    Open watchdog
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
