/**
 * CSOAI Public Watchdog
 *
 * Crowdsourced AI incident reporting and transparency dashboard
 * Anyone can report AI safety incidents, vote on severity, track resolutions
 */

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  AlertTriangle,
  Shield,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  ThumbsUp,
  ThumbsDown,
  Filter,
  Search,
  Plus,
  ExternalLink,
  Building2,
  Bot,
  Scale,
  FileWarning,
  Activity,
  Globe2,
  ChevronRight,
  ArrowUpRight,
  BarChart3,
  PieChart,
  FileText,
  Lock,
  Unlock,
  MessageSquare,
  Award,
  Star,
  Sparkles,
  ChevronDown,
  HelpCircle,
  UserPlus,
  Heart,
  Target,
  Zap,
  Gavel,
  Vote,
  Trophy,
  Megaphone,
  ShieldCheck,
  ShieldAlert,
  EyeOff,
  Ban,
  Fingerprint,
  AlertOctagon,
  Info,
  ArrowRight,
  Send,
  BookOpen,
  Lightbulb,
  BadgeCheck,
  Layers,
  CircleDot,
  Timer
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Categories aligned with EU AI Act and NIST AI RMF
const INCIDENT_CATEGORIES = {
  SAFETY_VIOLATIONS: { label: "Safety Violations", icon: ShieldAlert, color: "text-red-600 bg-red-100", description: "Physical harm, dangerous outputs, unsafe behaviors" },
  PRIVACY_BREACHES: { label: "Privacy Breaches", icon: EyeOff, color: "text-purple-600 bg-purple-100", description: "Unauthorized data collection, exposure of personal information" },
  DISCRIMINATION_BIAS: { label: "Discrimination & Bias", icon: Scale, color: "text-orange-600 bg-orange-100", description: "Unfair treatment based on protected characteristics" },
  TRANSPARENCY_FAILURES: { label: "Transparency Failures", icon: Eye, color: "text-blue-600 bg-blue-100", description: "Hidden AI use, misleading capabilities, lack of disclosure" },
  UNAUTHORIZED_USE: { label: "Unauthorized AI Use", icon: Ban, color: "text-pink-600 bg-pink-100", description: "AI deployed without consent or proper authorization" },
  MISINFORMATION: { label: "Misinformation", icon: FileWarning, color: "text-yellow-600 bg-yellow-100", description: "False information, hallucinations, deceptive content" },
  MANIPULATION: { label: "Manipulation", icon: Bot, color: "text-indigo-600 bg-indigo-100", description: "Psychological manipulation, dark patterns, exploitation" },
  SECURITY_BREACH: { label: "Security Breach", icon: Lock, color: "text-red-700 bg-red-100", description: "Vulnerabilities, attacks, unauthorized access" },
  ACCOUNTABILITY_GAP: { label: "Accountability Gap", icon: Building2, color: "text-gray-600 bg-gray-100", description: "Missing responsibility, unclear ownership" },
  OTHER: { label: "Other", icon: Globe2, color: "text-gray-600 bg-gray-100", description: "Issues not covered by other categories" },
};

const SEVERITY_COLORS = {
  LOW: "bg-green-100 text-green-700 border-green-300",
  MEDIUM: "bg-yellow-100 text-yellow-700 border-yellow-300",
  HIGH: "bg-orange-100 text-orange-700 border-orange-300",
  CRITICAL: "bg-red-100 text-red-700 border-red-300",
};

const STATUS_COLORS = {
  SUBMITTED: "bg-gray-100 text-gray-700",
  UNDER_REVIEW: "bg-blue-100 text-blue-700",
  INVESTIGATING: "bg-purple-100 text-purple-700",
  COUNCIL_VOTE: "bg-amber-100 text-amber-700",
  RESOLVED: "bg-green-100 text-green-700",
  DISMISSED: "bg-gray-100 text-gray-500",
};

// Mock data (would come from API)
const mockIncidents = [
  {
    id: 1,
    title: "Hiring AI shows gender bias in tech roles",
    description: "AI hiring system consistently ranks male candidates higher for engineering positions despite equal qualifications.",
    category: "DISCRIMINATION_BIAS",
    severity: "HIGH",
    status: "INVESTIGATING",
    aiSystemName: "TalentMatch AI",
    companyName: "HireRight Corp",
    reporterName: "Anonymous",
    reporterType: "public",
    upvotes: 247,
    downvotes: 12,
    createdAt: new Date("2026-01-10"),
    updatedAt: new Date("2026-01-12"),
  },
  {
    id: 2,
    title: "Credit scoring AI denies loans based on zip code",
    description: "Financial AI appears to use geographic location as a proxy for race, resulting in discriminatory lending decisions.",
    category: "DISCRIMINATION_BIAS",
    severity: "CRITICAL",
    status: "COUNCIL_VOTE",
    aiSystemName: "CreditDecide Pro",
    companyName: "QuickLoan Financial",
    reporterName: "Financial Justice Coalition",
    reporterType: "public",
    upvotes: 892,
    downvotes: 34,
    councilVotes: { for: 28, against: 3, abstain: 2 },
    createdAt: new Date("2026-01-08"),
    updatedAt: new Date("2026-01-13"),
  },
  {
    id: 3,
    title: "Healthcare AI misdiagnoses skin conditions on darker skin",
    description: "Dermatology AI trained primarily on light skin images fails to accurately identify conditions on patients with darker skin tones.",
    category: "SAFETY_VIOLATIONS",
    severity: "CRITICAL",
    status: "RESOLVED",
    aiSystemName: "DermaScan AI",
    companyName: "MedVision Tech",
    reporterName: "Dr. Sarah Chen",
    reporterType: "analyst",
    upvotes: 1243,
    downvotes: 8,
    councilVotes: { for: 31, against: 1, abstain: 1 },
    councilDecision: "System ordered to halt deployment pending retraining with diverse dataset. Company required to provide free re-diagnosis for affected patients.",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-11"),
    resolvedAt: new Date("2026-01-11"),
  },
  {
    id: 4,
    title: "Chatbot provides dangerous medical advice",
    description: "Customer service chatbot advised user to take dangerous combination of medications without checking for interactions.",
    category: "SAFETY_VIOLATIONS",
    severity: "HIGH",
    status: "UNDER_REVIEW",
    aiSystemName: "PharmAssist Bot",
    companyName: "DrugMart Online",
    reporterName: "Concerned Customer",
    reporterType: "public",
    upvotes: 156,
    downvotes: 5,
    createdAt: new Date("2026-01-12"),
    updatedAt: new Date("2026-01-13"),
  },
  {
    id: 5,
    title: "Social media AI amplifies misinformation during election",
    description: "Recommendation algorithm disproportionately promotes unverified political claims to users in swing states.",
    category: "MISINFORMATION",
    severity: "HIGH",
    status: "INVESTIGATING",
    aiSystemName: "FeedRank Algorithm",
    companyName: "SocialPulse Inc",
    reporterName: "Media Watch Organization",
    reporterType: "public",
    upvotes: 2341,
    downvotes: 456,
    createdAt: new Date("2026-01-05"),
    updatedAt: new Date("2026-01-13"),
  },
  {
    id: 6,
    title: "Facial recognition deployed without consent at retail store",
    description: "Major retailer using facial recognition to track customers without disclosure or opt-out option.",
    category: "PRIVACY_BREACHES",
    severity: "HIGH",
    status: "SUBMITTED",
    aiSystemName: "ShopWatch AI",
    companyName: "MegaMart Retail",
    reporterName: "Privacy Rights Advocate",
    reporterType: "public",
    upvotes: 189,
    downvotes: 12,
    createdAt: new Date("2026-01-13"),
    updatedAt: new Date("2026-01-13"),
  },
];

const mockStats = {
  totalIncidents: 1847,
  openIncidents: 234,
  resolvedIncidents: 1589,
  avgResolutionTime: 8.3,
  incidentsByCategory: {
    DISCRIMINATION_BIAS: 423,
    SAFETY_VIOLATIONS: 312,
    MISINFORMATION: 287,
    PRIVACY_BREACHES: 245,
    TRANSPARENCY_FAILURES: 198,
    UNAUTHORIZED_USE: 156,
    MANIPULATION: 98,
    SECURITY_BREACH: 67,
    ACCOUNTABILITY_GAP: 45,
    OTHER: 16,
  },
  incidentsBySeverity: {
    LOW: 312,
    MEDIUM: 678,
    HIGH: 589,
    CRITICAL: 268,
  },
  recentTrends: {
    thisWeek: 47,
    lastWeek: 38,
    change: 23.7,
  },
};

const mockComplianceOverview = {
  totalSystems: 1247,
  compliantSystems: 1089,
  warningsSystems: 134,
  criticalSystems: 24,
};

// AI System Leaderboard Mock Data
const mockAILeaderboard = [
  {
    rank: 1,
    name: "SafeGuard AI Assistant",
    company: "TrustTech Inc",
    safetyScore: 98,
    complianceScore: 97,
    trustScore: 96,
    incidents: 2,
    trend: "up",
  },
  {
    rank: 2,
    name: "EthicalMind LLM",
    company: "Responsible AI Labs",
    safetyScore: 96,
    complianceScore: 98,
    trustScore: 94,
    incidents: 3,
    trend: "up",
  },
  {
    rank: 3,
    name: "TransparentBot",
    company: "OpenAI Systems",
    safetyScore: 95,
    complianceScore: 94,
    trustScore: 95,
    incidents: 5,
    trend: "stable",
  },
  {
    rank: 4,
    name: "FairDecision Engine",
    company: "EquityTech",
    safetyScore: 93,
    complianceScore: 95,
    trustScore: 91,
    incidents: 8,
    trend: "up",
  },
  {
    rank: 5,
    name: "GuardianAI",
    company: "SecureMinds Corp",
    safetyScore: 91,
    complianceScore: 92,
    trustScore: 90,
    incidents: 12,
    trend: "down",
  },
];

// Success Stories Mock Data
const mockSuccessStories = [
  {
    id: 1,
    title: "Healthcare AI Bias Eliminated",
    summary: "Public reports led to complete overhaul of dermatology AI, now serving all skin tones equally",
    impact: "500,000+ patients now receive accurate diagnoses",
    category: "SAFETY_VIOLATIONS",
    date: "January 2026",
    company: "MedVision Tech",
  },
  {
    id: 2,
    title: "Discriminatory Hiring Algorithm Retired",
    summary: "Community advocacy resulted in removal of biased hiring system affecting thousands of job seekers",
    impact: "Fair hiring restored for 50,000+ annual applicants",
    category: "DISCRIMINATION_BIAS",
    date: "December 2025",
    company: "TalentFirst Corp",
  },
  {
    id: 3,
    title: "Privacy Violations Stopped",
    summary: "Whistleblower report exposed unauthorized data collection; company now compliant with privacy laws",
    impact: "Personal data of 2M users now protected",
    category: "PRIVACY_BREACHES",
    date: "November 2025",
    company: "DataStream Inc",
  },
];

// FAQ Data
const faqData = [
  {
    question: "How do I report an incident?",
    answer: "Click the 'Report an Incident' button at the top of the page. Fill out the form with as much detail as possible, including the AI system name, company, what happened, and any evidence you have. You can submit anonymously or provide contact information for follow-up."
  },
  {
    question: "Is my report anonymous?",
    answer: "Yes, you can submit reports completely anonymously. We never require personal information. If you choose to provide contact details, they are kept confidential and only used to follow up on your report. Your identity is never shared with the company being reported."
  },
  {
    question: "What happens to my report?",
    answer: "After submission, your report enters our review queue. Our team verifies the incident, gathers additional evidence, and escalates serious cases to investigation. Critical incidents are fast-tracked to the Byzantine Council for immediate review and action."
  },
  {
    question: "How long does investigation take?",
    answer: "Investigation timelines vary based on severity and complexity. Simple cases may resolve in 3-5 days. Complex investigations involving multiple stakeholders typically take 2-4 weeks. Critical safety issues are addressed within 24-48 hours."
  },
  {
    question: "Can I track my report's progress?",
    answer: "If you provide an email address, you'll receive status updates as your report progresses. You can also track public reports through our dashboard using the report ID. Anonymous reports can be tracked using a unique tracking code provided at submission."
  },
  {
    question: "What if a company retaliates?",
    answer: "Retaliation against reporters is strictly prohibited and itself grounds for investigation. We work with legal partners and regulatory bodies to protect reporters. If you experience retaliation, report it immediately through our confidential hotline."
  },
  {
    question: "How are incidents prioritized?",
    answer: "Incidents are prioritized based on: 1) Potential for harm (safety-critical issues first), 2) Number of affected individuals, 3) Severity of impact, 4) Community votes, and 5) Available evidence. Critical safety issues always receive immediate attention."
  },
  {
    question: "Can I appeal a decision?",
    answer: "Yes, all parties can appeal Byzantine Council decisions within 30 days. Appeals are reviewed by an independent panel. New evidence or procedural concerns can trigger a full re-review of the case."
  },
];

export default function PublicWatchdog() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [activeSection, setActiveSection] = useState("feed");

  // Report form state
  const [reportForm, setReportForm] = useState({
    title: "",
    description: "",
    category: "SAFETY_VIOLATIONS",
    severity: "medium",
    aiSystem: "",
    organization: "",
  });

  // tRPC queries and mutations
  const { data: incidentsData, isLoading, refetch } = trpc.watchdog.list.useQuery();

  // Use API data if available, otherwise fall back to mock data for demo
  const incidents: any[] = (incidentsData as any[]) || mockIncidents;

  const submitMutation = trpc.watchdog.submitReport.useMutation({
    onSuccess: () => {
      toast.success("Incident reported successfully", {
        description: "Thank you for helping keep AI safe. Our analysts will review your report.",
      });
      setShowReportDialog(false);
      setReportForm({
        title: "",
        description: "",
        category: "SAFETY_VIOLATIONS",
        severity: "medium",
        aiSystem: "",
        organization: "",
      });
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to submit report", {
        description: error.message || "Please try again later",
      });
    },
  });

  const voteMutation = trpc.watchdog.upvote.useMutation({
    onSuccess: () => {
      toast.success("Vote recorded");
      refetch();
    },
    onError: () => {
      toast.error("Failed to vote. Please try again.");
    },
  });

  // Filter incidents
  const filteredIncidents = incidents.filter((incident: any) => {
    if (selectedCategory !== "all" && incident.category !== selectedCategory) return false;
    if (selectedSeverity !== "all" && incident.severity !== selectedSeverity) return false;
    if (selectedStatus !== "all" && incident.status !== selectedStatus) return false;
    if (searchQuery && !incident.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !incident.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleVote = (incidentId: number, vote: 'up' | 'down') => {
    voteMutation.mutate({ id: incidentId });
  };

  const handleSubmitReport = () => {
    if (!reportForm.title || !reportForm.description) {
      toast.error("Please fill in all required fields");
      return;
    }
    // Map category to incidentType enum values expected by API
    const categoryToIncidentType: Record<string, 'bias' | 'privacy' | 'safety' | 'misinformation' | 'manipulation' | 'other'> = {
      SAFETY_VIOLATIONS: 'safety',
      PRIVACY_BREACHES: 'privacy',
      DISCRIMINATION_BIAS: 'bias',
      TRANSPARENCY_FAILURES: 'other',
      UNAUTHORIZED_USE: 'other',
      MISINFORMATION: 'misinformation',
      MANIPULATION: 'manipulation',
      SECURITY_BREACH: 'safety',
    };
    submitMutation.mutate({
      title: reportForm.title,
      description: reportForm.description,
      incidentType: categoryToIncidentType[reportForm.category] || 'other',
      severity: reportForm.severity as "low" | "medium" | "high" | "critical",
      aiSystemName: reportForm.aiSystem || undefined,
      companyName: reportForm.organization || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - White/Green Branding */}
      <section className="bg-gradient-to-br from-green-800 via-green-700 to-emerald-800 text-white py-20">
        <div className="container max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                <Eye className="h-10 w-10 text-green-200" />
              </div>
              <div>
                <Badge className="mb-2 bg-green-500/20 text-green-100 border-green-400/30">
                  Public Transparency Initiative
                </Badge>
                <h1 className="text-4xl md:text-6xl font-bold">Public Watchdog</h1>
              </div>
            </div>

            <p className="text-xl md:text-2xl text-green-100 max-w-3xl mb-8 leading-relaxed">
              Community-powered AI accountability. Your voice matters in keeping AI systems safe,
              fair, and transparent for everyone.
            </p>

            {/* Mission Pillars */}
            <div className="grid md:grid-cols-3 gap-6 mb-10">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="w-12 h-12 rounded-lg bg-green-500/30 flex items-center justify-center mb-4">
                  <Megaphone className="h-6 w-6 text-green-200" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Anyone Can Report</h3>
                <p className="text-green-100 text-sm">
                  No credentials needed. If you've experienced or witnessed an AI incident,
                  your report matters. Anonymous submissions welcome.
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="w-12 h-12 rounded-lg bg-green-500/30 flex items-center justify-center mb-4">
                  <Eye className="h-6 w-6 text-green-200" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Transparent Process</h3>
                <p className="text-green-100 text-sm">
                  Every investigation is tracked publicly. Watch cases progress from report
                  to resolution with full visibility into decisions.
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="w-12 h-12 rounded-lg bg-green-500/30 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-green-200" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Community-Driven</h3>
                <p className="text-green-100 text-sm">
                  The public votes on incident severity. Collective wisdom shapes priorities
                  and holds AI systems accountable together.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
                <DialogTrigger asChild>
                  <Button size="lg" className="bg-white text-green-800 hover:bg-green-50 shadow-lg">
                    <Plus className="mr-2 h-5 w-5" />
                    Report an Incident
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-green-600" />
                      Report an AI Safety Incident
                    </DialogTitle>
                    <DialogDescription>
                      Your report will be reviewed by our team and the Byzantine Council.
                      All reports can be submitted anonymously.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="title">Incident Title *</Label>
                      <Input
                        id="title"
                        placeholder="Brief description of the incident"
                        value={reportForm.title}
                        onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="category">Category *</Label>
                        <Select value={reportForm.category} onValueChange={(value) => setReportForm({ ...reportForm, category: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(INCIDENT_CATEGORIES).map(([key, value]) => (
                              <SelectItem key={key} value={key}>{value.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="severity">Severity *</Label>
                        <Select value={reportForm.severity} onValueChange={(value) => setReportForm({ ...reportForm, severity: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select severity" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LOW">Low - Minor inconvenience</SelectItem>
                            <SelectItem value="MEDIUM">Medium - Significant impact</SelectItem>
                            <SelectItem value="HIGH">High - Serious harm</SelectItem>
                            <SelectItem value="CRITICAL">Critical - Immediate danger</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="aiSystem">AI System Name *</Label>
                        <Input
                          id="aiSystem"
                          placeholder="e.g., ChatBot Pro"
                          value={reportForm.aiSystem}
                          onChange={(e) => setReportForm({ ...reportForm, aiSystem: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="company">Company Name *</Label>
                        <Input
                          id="company"
                          placeholder="e.g., TechCorp Inc"
                          value={reportForm.organization}
                          onChange={(e) => setReportForm({ ...reportForm, organization: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Detailed Description *</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe the incident in detail. Include what happened, when it occurred, and any evidence you have."
                        rows={4}
                        value={reportForm.description}
                        onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="evidence">Evidence URLs (optional)</Label>
                      <Input id="evidence" placeholder="Links to screenshots, articles, or documentation" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="reporterName">Your Name (optional)</Label>
                        <Input id="reporterName" placeholder="Anonymous" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="reporterEmail">Email (optional)</Label>
                        <Input id="reporterEmail" type="email" placeholder="For follow-up updates" />
                      </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <div className="flex items-start gap-2">
                        <Lock className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-green-800">Your Privacy is Protected</p>
                          <p className="text-sm text-green-700">
                            Reports can be submitted anonymously. Contact information is optional
                            and never shared with reported companies.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowReportDialog(false)}>
                      Cancel
                    </Button>
                    <Button
                      className="bg-green-600 hover:bg-green-700"
                      onClick={handleSubmitReport}
                      disabled={submitMutation.isPending}
                    >
                      {submitMutation.isPending ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Submit Report
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                <BookOpen className="mr-2 h-5 w-5" />
                Learn How It Works
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Live Stats Bar */}
      <section className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200 py-6">
        <div className="container max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-700">{mockStats.totalIncidents.toLocaleString()}</div>
              <div className="text-sm text-green-600">Total Reports</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-600">{mockStats.openIncidents}</div>
              <div className="text-sm text-gray-600">Open Cases</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{mockStats.resolvedIncidents.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Resolved</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{mockStats.avgResolutionTime}</div>
              <div className="text-sm text-gray-600">Avg Days to Resolve</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <span className="text-3xl font-bold text-green-600">{mockStats.recentTrends.thisWeek}</span>
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-sm text-gray-600">This Week</div>
            </div>
          </div>
        </div>
      </section>

      {/* How to Report Section */}
      <section className="py-16 bg-white">
        <div className="container max-w-6xl">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-green-100 text-green-700 border-green-300">
              Step-by-Step Guide
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How to Report an Incident
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Reporting AI incidents is simple and can be done anonymously.
              Your report helps protect others and improves AI systems for everyone.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* Steps */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Layers className="h-5 w-5 text-green-600" />
                Reporting Steps
              </h3>
              {[
                { step: 1, title: "Identify the Issue", desc: "Recognize when an AI system has caused harm, shown bias, or acted inappropriately" },
                { step: 2, title: "Gather Information", desc: "Document what happened: screenshots, dates, the AI system name, and company" },
                { step: 3, title: "Submit Your Report", desc: "Click 'Report an Incident' and fill out the form with as much detail as possible" },
                { step: 4, title: "Track Progress", desc: "Receive updates as your report is reviewed, investigated, and resolved" },
              ].map((item) => (
                <div key={item.step} className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center text-lg font-bold flex-shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{item.title}</h4>
                    <p className="text-gray-600 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* What to Include */}
            <div className="space-y-6">
              <Card className="border-green-200 bg-green-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <FileText className="h-5 w-5" />
                    What Information to Include
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <span className="text-sm text-gray-700">Name of the AI system and company</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <span className="text-sm text-gray-700">Detailed description of what happened</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <span className="text-sm text-gray-700">When and where the incident occurred</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <span className="text-sm text-gray-700">Screenshots or evidence (if available)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <span className="text-sm text-gray-700">Impact on you or others affected</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-amber-200 bg-amber-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-800">
                    <Lightbulb className="h-5 w-5" />
                    What Happens After Reporting
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2">
                    <CircleDot className="h-5 w-5 text-amber-600 mt-0.5" />
                    <span className="text-sm text-gray-700">Report is verified by our team (24-48 hours)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CircleDot className="h-5 w-5 text-amber-600 mt-0.5" />
                    <span className="text-sm text-gray-700">Investigation begins for valid reports</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CircleDot className="h-5 w-5 text-amber-600 mt-0.5" />
                    <span className="text-sm text-gray-700">Company is notified and asked to respond</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CircleDot className="h-5 w-5 text-amber-600 mt-0.5" />
                    <span className="text-sm text-gray-700">Byzantine Council reviews serious cases</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CircleDot className="h-5 w-5 text-amber-600 mt-0.5" />
                    <span className="text-sm text-gray-700">Resolution and remediation enforced</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Incident Categories Section */}
      <section className="py-16 bg-gray-50">
        <div className="container max-w-6xl">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-green-100 text-green-700 border-green-300">
              Types of Incidents
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What You Can Report
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We track a wide range of AI-related issues. If you're unsure whether something qualifies,
              report it anyway - we'll help determine the right category.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(INCIDENT_CATEGORIES).slice(0, 6).map(([key, category]) => {
              const Icon = category.icon;
              return (
                <Card key={key} className="hover:border-green-300 transition-colors">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${category.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{category.label}</h3>
                    <p className="text-sm text-gray-600">{category.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-8 text-center">
            <Button variant="outline" className="border-green-300 text-green-700 hover:bg-green-50">
              View All Categories
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Live Incident Feed */}
      <section className="py-16 bg-white">
        <div className="container max-w-7xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Badge className="mb-2 bg-green-100 text-green-700 border-green-300">
                <Activity className="h-3 w-3 mr-1" />
                Live Feed
              </Badge>
              <h2 className="text-3xl font-bold text-gray-900">Incident Feed</h2>
            </div>
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => setShowReportDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Report Incident
            </Button>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar - Filters & Stats */}
            <div className="lg:col-span-1 space-y-6">
              {/* Search & Filters */}
              <Card className="border-green-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Filter className="h-5 w-5 text-green-600" />
                    Filters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm text-gray-600">Search</Label>
                    <div className="relative mt-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search incidents..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-600">Category</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {Object.entries(INCIDENT_CATEGORIES).map(([key, value]) => (
                          <SelectItem key={key} value={key}>{value.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-600">Severity</Label>
                    <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Severities</SelectItem>
                        <SelectItem value="CRITICAL">Critical</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="LOW">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-600">Status</Label>
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="SUBMITTED">Submitted</SelectItem>
                        <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                        <SelectItem value="INVESTIGATING">Investigating</SelectItem>
                        <SelectItem value="COUNCIL_VOTE">Council Vote</SelectItem>
                        <SelectItem value="RESOLVED">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full border-green-300"
                    onClick={() => {
                      setSelectedCategory("all");
                      setSelectedSeverity("all");
                      setSelectedStatus("all");
                      setSearchQuery("");
                    }}
                  >
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>

              {/* Trending Issues */}
              <Card className="border-amber-200 bg-amber-50/30">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-amber-800">
                    <TrendingUp className="h-5 w-5" />
                    Trending Issues
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {filteredIncidents
                    .sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes))
                    .slice(0, 3)
                    .map((incident, idx) => (
                      <div key={incident.id} className="flex items-center gap-2">
                        <span className="text-amber-600 font-bold">#{idx + 1}</span>
                        <span className="text-sm text-gray-700 truncate flex-1">{incident.title}</span>
                      </div>
                    ))}
                </CardContent>
              </Card>
            </div>

            {/* Main Content - Incidents */}
            <div className="lg:col-span-3">
              <Tabs defaultValue="all" className="space-y-6">
                <div className="flex items-center justify-between">
                  <TabsList className="bg-green-100">
                    <TabsTrigger value="all" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">All Incidents</TabsTrigger>
                    <TabsTrigger value="trending" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">Trending</TabsTrigger>
                    <TabsTrigger value="council" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">Council Votes</TabsTrigger>
                    <TabsTrigger value="resolved" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">Resolved</TabsTrigger>
                  </TabsList>
                  <div className="text-sm text-gray-600">
                    {filteredIncidents.length} incidents found
                  </div>
                </div>

                <TabsContent value="all" className="space-y-4">
                  <AnimatePresence>
                    {filteredIncidents.map((incident, idx) => {
                      const category = INCIDENT_CATEGORIES[incident.category as keyof typeof INCIDENT_CATEGORIES];
                      const CategoryIcon = category?.icon || Globe2;

                      return (
                        <motion.div
                          key={incident.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.2, delay: idx * 0.05 }}
                        >
                          <Card className="hover:border-green-300 transition-colors">
                            <CardContent className="p-6">
                              <div className="flex gap-4">
                                {/* Vote Section */}
                                <div className="flex flex-col items-center gap-1 min-w-[60px]">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-600"
                                    onClick={() => handleVote(incident.id, 'up')}
                                  >
                                    <ThumbsUp className="h-4 w-4" />
                                  </Button>
                                  <span className="font-bold text-lg text-green-700">
                                    {incident.upvotes - incident.downvotes}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                                    onClick={() => handleVote(incident.id, 'down')}
                                  >
                                    <ThumbsDown className="h-4 w-4" />
                                  </Button>
                                </div>

                                {/* Main Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-4 mb-2">
                                    <div>
                                      <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <Badge className={SEVERITY_COLORS[incident.severity as keyof typeof SEVERITY_COLORS]}>
                                          {incident.severity}
                                        </Badge>
                                        <Badge className={STATUS_COLORS[incident.status as keyof typeof STATUS_COLORS]}>
                                          {incident.status.replace(/_/g, ' ')}
                                        </Badge>
                                        <Badge variant="outline" className={category?.color}>
                                          <CategoryIcon className="h-3 w-3 mr-1" />
                                          {category?.label}
                                        </Badge>
                                      </div>
                                      <h3 className="font-semibold text-lg hover:text-green-600 cursor-pointer">
                                        {incident.title}
                                      </h3>
                                    </div>
                                  </div>

                                  <p className="text-gray-600 mb-3 line-clamp-2">
                                    {incident.description}
                                  </p>

                                  <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                                    {incident.aiSystemName && (
                                      <span className="flex items-center gap-1">
                                        <Bot className="h-4 w-4" />
                                        {incident.aiSystemName}
                                      </span>
                                    )}
                                    {incident.companyName && (
                                      <span className="flex items-center gap-1">
                                        <Building2 className="h-4 w-4" />
                                        {incident.companyName}
                                      </span>
                                    )}
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-4 w-4" />
                                      {incident.createdAt.toLocaleDateString()}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Users className="h-4 w-4" />
                                      {incident.reporterName}
                                    </span>
                                  </div>

                                  {/* Council Vote Progress */}
                                  {incident.status === "COUNCIL_VOTE" && incident.councilVotes && (
                                    <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-amber-800">
                                          Byzantine Council Vote in Progress
                                        </span>
                                        <span className="text-sm text-amber-600">
                                          {incident.councilVotes.for + incident.councilVotes.against + incident.councilVotes.abstain}/33 votes
                                        </span>
                                      </div>
                                      <div className="flex gap-2">
                                        <div className="flex-1">
                                          <div className="flex justify-between text-xs mb-1">
                                            <span className="text-green-600">For: {incident.councilVotes.for}</span>
                                            <span className="text-red-600">Against: {incident.councilVotes.against}</span>
                                          </div>
                                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden flex">
                                            <div
                                              className="bg-green-500 h-full"
                                              style={{ width: `${(incident.councilVotes.for / 33) * 100}%` }}
                                            />
                                            <div
                                              className="bg-red-500 h-full"
                                              style={{ width: `${(incident.councilVotes.against / 33) * 100}%` }}
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Resolution */}
                                  {incident.status === "RESOLVED" && incident.councilDecision && (
                                    <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                                      <div className="flex items-center gap-2 text-green-700 mb-1">
                                        <CheckCircle2 className="h-4 w-4" />
                                        <span className="text-sm font-medium">Council Decision</span>
                                      </div>
                                      <p className="text-sm text-green-800">{incident.councilDecision}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {filteredIncidents.length === 0 && (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-600 mb-2">No incidents found</h3>
                        <p className="text-gray-500">Try adjusting your filters or search query</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="trending" className="space-y-4">
                  {filteredIncidents
                    .sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes))
                    .slice(0, 5)
                    .map((incident) => (
                      <Card key={incident.id} className="border-l-4 border-l-amber-500">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium">{incident.title}</h3>
                              <p className="text-sm text-gray-600">{incident.companyName}</p>
                            </div>
                            <div className="flex items-center gap-2 text-amber-600">
                              <TrendingUp className="h-5 w-5" />
                              <span className="font-bold">{incident.upvotes - incident.downvotes}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </TabsContent>

                <TabsContent value="council" className="space-y-4">
                  {filteredIncidents
                    .filter(i => i.status === "COUNCIL_VOTE")
                    .map((incident) => (
                      <Card key={incident.id} className="border-l-4 border-l-amber-500">
                        <CardContent className="p-4">
                          <Badge className="mb-2 bg-amber-100 text-amber-700">Active Vote</Badge>
                          <h3 className="font-medium mb-2">{incident.title}</h3>
                          {incident.councilVotes && (
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-green-600">For: {incident.councilVotes.for}</span>
                              <span className="text-red-600">Against: {incident.councilVotes.against}</span>
                              <span className="text-gray-500">Abstain: {incident.councilVotes.abstain}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                </TabsContent>

                <TabsContent value="resolved" className="space-y-4">
                  {filteredIncidents
                    .filter(i => i.status === "RESOLVED")
                    .map((incident) => (
                      <Card key={incident.id} className="border-l-4 border-l-green-500">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-600">Resolved</span>
                          </div>
                          <h3 className="font-medium mb-2">{incident.title}</h3>
                          {incident.councilDecision && (
                            <p className="text-sm text-gray-600">{incident.councilDecision}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </section>

      {/* AI System Leaderboard Section */}
      <section className="py-16 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="container max-w-6xl">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-green-100 text-green-700 border-green-300">
              <Trophy className="h-3 w-3 mr-1" />
              AI System Rankings
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              AI System Leaderboard
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Track how AI systems perform on safety, compliance, and public trust.
              Higher scores mean better accountability.
            </p>
          </div>

          <Card className="border-green-200">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-green-100">
                    <tr>
                      <th className="text-left p-4 font-semibold text-green-800">Rank</th>
                      <th className="text-left p-4 font-semibold text-green-800">AI System</th>
                      <th className="text-center p-4 font-semibold text-green-800">Safety Score</th>
                      <th className="text-center p-4 font-semibold text-green-800">Compliance</th>
                      <th className="text-center p-4 font-semibold text-green-800">Public Trust</th>
                      <th className="text-center p-4 font-semibold text-green-800">Incidents</th>
                      <th className="text-center p-4 font-semibold text-green-800">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockAILeaderboard.map((system, idx) => (
                      <tr key={system.rank} className={idx % 2 === 0 ? 'bg-white' : 'bg-green-50/50'}>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {system.rank <= 3 ? (
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                system.rank === 1 ? 'bg-yellow-400 text-yellow-900' :
                                system.rank === 2 ? 'bg-gray-300 text-gray-700' :
                                'bg-amber-600 text-amber-100'
                              }`}>
                                <Trophy className="h-4 w-4" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold">
                                {system.rank}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div>
                            <div className="font-semibold text-gray-900">{system.name}</div>
                            <div className="text-sm text-gray-500">{system.company}</div>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="inline-flex items-center gap-2">
                            <Progress value={system.safetyScore} className="w-16 h-2" />
                            <span className="font-semibold text-green-700">{system.safetyScore}</span>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="inline-flex items-center gap-2">
                            <Progress value={system.complianceScore} className="w-16 h-2" />
                            <span className="font-semibold text-blue-700">{system.complianceScore}</span>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="inline-flex items-center gap-2">
                            <Progress value={system.trustScore} className="w-16 h-2" />
                            <span className="font-semibold text-purple-700">{system.trustScore}</span>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <Badge variant="outline" className={system.incidents < 5 ? 'border-green-300 text-green-700' : system.incidents < 10 ? 'border-amber-300 text-amber-700' : 'border-red-300 text-red-700'}>
                            {system.incidents}
                          </Badge>
                        </td>
                        <td className="p-4 text-center">
                          {system.trend === 'up' && <TrendingUp className="h-5 w-5 text-green-600 mx-auto" />}
                          {system.trend === 'down' && <TrendingDown className="h-5 w-5 text-red-600 mx-auto" />}
                          {system.trend === 'stable' && <Activity className="h-5 w-5 text-gray-400 mx-auto" />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 text-center">
            <Button variant="outline" className="border-green-300 text-green-700 hover:bg-green-50">
              View Full Leaderboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Byzantine Council Role Section */}
      <section className="py-16 bg-white">
        <div className="container max-w-6xl">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-green-100 text-green-700 border-green-300">
              <Gavel className="h-3 w-3 mr-1" />
              Governance
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              The Byzantine Council
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              A diverse group of 33 independent experts who review serious incidents
              and make binding decisions on AI system accountability.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card className="border-green-200 bg-green-50/30">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <Eye className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Incident Review</h3>
                <p className="text-gray-600">
                  Council members independently analyze evidence, interview stakeholders,
                  and assess the full impact of reported incidents.
                </p>
              </CardContent>
            </Card>
            <Card className="border-green-200 bg-green-50/30">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <Vote className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Transparent Voting</h3>
                <p className="text-gray-600">
                  All votes are recorded publicly. 22 of 33 votes (two-thirds majority)
                  required for enforcement actions against AI systems.
                </p>
              </CardContent>
            </Card>
            <Card className="border-green-200 bg-green-50/30">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Binding Decisions</h3>
                <p className="text-gray-600">
                  Council decisions are enforced through regulatory partnerships.
                  Companies must comply or face escalation to authorities.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-green-600" />
                How Council Decisions Work
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-5 gap-4">
                {[
                  { step: 1, title: "Escalation", desc: "Serious incidents escalated to Council" },
                  { step: 2, title: "Investigation", desc: "Deep dive by assigned reviewers" },
                  { step: 3, title: "Deliberation", desc: "Council discusses findings publicly" },
                  { step: 4, title: "Voting", desc: "33 members vote on recommended action" },
                  { step: 5, title: "Enforcement", desc: "Decision implemented and monitored" },
                ].map((item) => (
                  <div key={item.step} className="text-center">
                    <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center text-lg font-bold mx-auto mb-2">
                      {item.step}
                    </div>
                    <h4 className="font-semibold text-sm">{item.title}</h4>
                    <p className="text-xs text-gray-600">{item.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Success Stories Section */}
      <section className="py-16 bg-gradient-to-br from-green-700 to-emerald-800 text-white">
        <div className="container max-w-6xl">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-white/20 text-green-100 border-green-400/30">
              <Sparkles className="h-3 w-3 mr-1" />
              Impact Stories
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Success Stories
            </h2>
            <p className="text-lg text-green-100 max-w-2xl mx-auto">
              Real cases where public reporting led to meaningful change in AI systems.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {mockSuccessStories.map((story) => {
              const category = INCIDENT_CATEGORIES[story.category as keyof typeof INCIDENT_CATEGORIES];
              const Icon = category?.icon || Globe2;
              return (
                <Card key={story.id} className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                        <Icon className="h-5 w-5" />
                      </div>
                      <Badge className="bg-green-500/30 text-green-100 border-green-400/30">
                        {category?.label}
                      </Badge>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{story.title}</h3>
                    <p className="text-green-100 text-sm mb-4">{story.summary}</p>
                    <div className="bg-white/10 rounded-lg p-3 mb-4">
                      <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-green-300" />
                        <span className="text-sm font-medium text-green-200">Impact</span>
                      </div>
                      <p className="text-sm text-white mt-1">{story.impact}</p>
                    </div>
                    <div className="flex items-center justify-between text-sm text-green-200">
                      <span>{story.company}</span>
                      <span>{story.date}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-10 text-center">
            <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
              Read More Success Stories
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="container max-w-4xl">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-green-100 text-green-700 border-green-300">
              <HelpCircle className="h-3 w-3 mr-1" />
              Questions & Answers
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600">
              Everything you need to know about reporting incidents and the watchdog process.
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqData.map((faq, idx) => (
              <AccordionItem key={idx} value={`faq-${idx}`} className="border border-green-200 rounded-lg px-6">
                <AccordionTrigger className="text-left hover:no-underline py-4">
                  <span className="font-semibold text-gray-900">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-10 text-center">
            <p className="text-gray-600 mb-4">Still have questions?</p>
            <Button variant="outline" className="border-green-300 text-green-700 hover:bg-green-50">
              <MessageSquare className="mr-2 h-4 w-4" />
              Contact Support
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-green-800 via-green-700 to-emerald-800 text-white">
        <div className="container max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Join the Movement for AI Accountability
            </h2>
            <p className="text-lg text-green-100 max-w-2xl mx-auto">
              Whether you want to report an incident, become an analyst, or join our community,
              there's a place for you in the Public Watchdog.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 transition-colors">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Report an Incident</h3>
                <p className="text-green-100 text-sm mb-6">
                  Seen an AI system causing harm? Your report could protect thousands of others.
                </p>
                <Button className="w-full bg-white text-green-800 hover:bg-green-50" onClick={() => setShowReportDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Report Now
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 transition-colors">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-6">
                  <BadgeCheck className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Become an Analyst</h3>
                <p className="text-green-100 text-sm mb-6">
                  Have expertise in AI, law, or ethics? Help investigate and verify reported incidents.
                </p>
                <Button className="w-full bg-white/20 text-white border border-white/30 hover:bg-white/30">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Apply to Join
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 transition-colors">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-6">
                  <Heart className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Join the Community</h3>
                <p className="text-green-100 text-sm mb-6">
                  Connect with others who care about AI safety. Discuss, learn, and advocate together.
                </p>
                <Button className="w-full bg-white/20 text-white border border-white/30 hover:bg-white/30">
                  <Users className="mr-2 h-4 w-4" />
                  Join Community
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 text-center">
            <p className="text-green-200 text-sm">
              Together, we can build a future where AI serves everyone fairly and safely.
            </p>
          </div>
        </div>
      </section>

      {/* Footer Stats */}
      <section className="py-8 bg-green-900 text-white">
        <div className="container max-w-6xl">
          <div className="flex flex-wrap items-center justify-center gap-8 text-center">
            <div>
              <div className="text-2xl font-bold">{mockStats.totalIncidents.toLocaleString()}+</div>
              <div className="text-sm text-green-300">Incidents Reported</div>
            </div>
            <div className="w-px h-10 bg-green-700 hidden md:block" />
            <div>
              <div className="text-2xl font-bold">{mockStats.resolvedIncidents.toLocaleString()}+</div>
              <div className="text-sm text-green-300">Cases Resolved</div>
            </div>
            <div className="w-px h-10 bg-green-700 hidden md:block" />
            <div>
              <div className="text-2xl font-bold">50,000+</div>
              <div className="text-sm text-green-300">Community Members</div>
            </div>
            <div className="w-px h-10 bg-green-700 hidden md:block" />
            <div>
              <div className="text-2xl font-bold">33</div>
              <div className="text-sm text-green-300">Council Members</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
