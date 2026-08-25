/**
 * CSOAI Government & Regulator Dashboard
 *
 * Real-time AI compliance monitoring for government bodies and regulators
 * Aligned with EU AI Act, NIST AI RMF, ISO 42001, and TC260 frameworks
 */

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Shield,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  FileText,
  Scale,
  Globe2,
  Activity,
  BarChart3,
  PieChart,
  Download,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Users,
  Bot,
  Zap,
  Bell,
  Filter,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  MapPin,
  Target,
  Layers,
  Gavel,
  FileSearch,
  Network,
  Handshake,
  HelpCircle,
  Mail,
  Phone,
  ArrowRight,
  Radio,
  CircleAlert,
  BookOpen,
  Database,
  Lock,
  RefreshCw,
  Landmark
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Mock data for government dashboard
const complianceFrameworks = [
  {
    id: "eu-ai-act",
    name: "EU AI Act",
    articles: 113,
    requirements: 113,
    compliantCount: 1089,
    totalSystems: 1247,
    complianceRate: 87.3,
    lastUpdated: "2026-01-13",
    region: "European Union",
    icon: Scale,
    color: "blue",
    keyAreas: ["Risk Classification", "Transparency", "Human Oversight", "Data Governance"],
  },
  {
    id: "nist-ai-rmf",
    name: "NIST AI RMF",
    articles: 72,
    requirements: 72,
    compliantCount: 1156,
    totalSystems: 1247,
    complianceRate: 92.7,
    lastUpdated: "2026-01-13",
    region: "United States",
    icon: Shield,
    color: "emerald",
    keyAreas: ["Govern", "Map", "Measure", "Manage"],
  },
  {
    id: "iso-42001",
    name: "ISO 42001",
    articles: 56,
    requirements: 56,
    compliantCount: 1198,
    totalSystems: 1247,
    complianceRate: 96.1,
    lastUpdated: "2026-01-12",
    region: "International",
    icon: Globe2,
    color: "violet",
    keyAreas: ["AI Management System", "Risk Assessment", "Documentation", "Continual Improvement"],
  },
  {
    id: "tc260",
    name: "TC260 AI Safety",
    articles: 48,
    requirements: 48,
    compliantCount: 987,
    totalSystems: 1247,
    complianceRate: 79.1,
    lastUpdated: "2026-01-13",
    region: "China",
    icon: Building2,
    color: "amber",
    keyAreas: ["Safety Assessment", "Algorithm Filing", "Data Security", "Content Review"],
  },
];

// Regional panels: no live national registry feeds exist yet, so figures are
// withheld ("—") rather than invented. Structure stays so panels render.
const regionalData = [
  {
    id: "europe",
    name: "Europe",
    totalSystems: null,
    compliantSystems: null,
    complianceRate: null,
    activeIncidents: null,
    pendingInvestigations: null,
    enforcementActions: null,
    primaryFramework: "EU AI Act",
    countries: ["Germany", "France", "Netherlands", "Italy", "Spain"],
  },
  {
    id: "north-america",
    name: "North America",
    totalSystems: null,
    compliantSystems: null,
    complianceRate: null,
    activeIncidents: null,
    pendingInvestigations: null,
    enforcementActions: null,
    primaryFramework: "NIST AI RMF",
    countries: ["United States", "Canada", "Mexico"],
  },
  {
    id: "asia-pacific",
    name: "Asia-Pacific",
    totalSystems: null,
    compliantSystems: null,
    complianceRate: null,
    activeIncidents: null,
    pendingInvestigations: null,
    enforcementActions: null,
    primaryFramework: "TC260 / ISO 42001",
    countries: ["China", "Japan", "South Korea", "Australia", "Singapore"],
  },
  {
    id: "global",
    name: "Global Overview",
    totalSystems: null,
    compliantSystems: null,
    complianceRate: null,
    activeIncidents: null,
    pendingInvestigations: null,
    enforcementActions: null,
    primaryFramework: "Multi-Framework",
    countries: ["All Jurisdictions"],
  },
];

// DEMONSTRATION DATA — illustrative only. Not real systems, companies, fines,
// investigations, or regulator activities. Covered by the Preview notice strip
// at the top of this page. [Register purge 2026-08-02]
const activeIncidents = {
  pendingInvestigations: [
    {
      id: "INV-2026-0127",
      system: "Demo Scoring Model",
      company: "Demo Vendor A",
      type: "Unacceptable Risk",
      priority: "Critical",
      daysOpen: 3,
      assignedTo: "Demo regulator workspace",
      nextAction: "Council Review Scheduled",
    },
    {
      id: "INV-2026-0124",
      system: "Demo Credit Model",
      company: "Demo Vendor B",
      type: "Bias Detection",
      priority: "High",
      daysOpen: 7,
      assignedTo: "Demo regulator workspace",
      nextAction: "Awaiting Company Response",
    },
    {
      id: "INV-2026-0119",
      system: "Demo Hiring Model",
      company: "Demo Vendor C",
      type: "Discrimination Alert",
      priority: "High",
      daysOpen: 12,
      assignedTo: "Demo regulator workspace",
      nextAction: "Technical Audit in Progress",
    },
    {
      id: "INV-2026-0115",
      system: "Demo Diagnostics Model",
      company: "Demo Vendor D",
      type: "Safety Concern",
      priority: "Medium",
      daysOpen: 18,
      assignedTo: "Demo regulator workspace",
      nextAction: "Remediation Plan Review",
    },
  ],
  enforcementActions: [
    {
      id: "ENF-2026-0089",
      system: "Demo Vision Model",
      company: "Demo Vendor E",
      action: "Deployment Suspension",
      fine: 4200000,
      status: "Active",
      framework: "EU AI Act",
      effectiveDate: "2026-01-10",
    },
    {
      id: "ENF-2026-0085",
      system: "Demo Lending Model",
      company: "Demo Vendor F",
      action: "Mandatory Remediation",
      fine: 1500000,
      status: "Compliance Monitoring",
      framework: "NIST AI RMF",
      effectiveDate: "2026-01-05",
    },
    {
      id: "ENF-2026-0078",
      system: "Demo HR Model",
      company: "Demo Vendor G",
      action: "Cease Operations",
      fine: 2800000,
      status: "Active",
      framework: "EU AI Act",
      effectiveDate: "2025-12-28",
    },
  ],
  appealsInProgress: [
    {
      id: "APL-2026-0034",
      originalCase: "ENF-2025-0412",
      company: "Demo Vendor H",
      appealType: "Fine Reduction",
      originalFine: 3500000,
      requestedReduction: 2100000,
      status: "Under Review",
      hearingDate: "2026-02-15",
    },
    {
      id: "APL-2026-0031",
      originalCase: "ENF-2025-0398",
      company: "Demo Vendor I",
      appealType: "Classification Challenge",
      originalFine: 1800000,
      requestedReduction: 1800000,
      status: "Documentation Phase",
      hearingDate: "2026-02-22",
    },
  ],
};

const councilDesignFeatures = [
  {
    title: "Automated Compliance Monitoring",
    description: "The design calls for 33 agents to monitor registered systems for compliance drift across the mapped frameworks. Independence between agents is measured, not assumed.",
    icon: Eye,
    stats: "Continuous monitoring once a registry is connected",
  },
  {
    title: "Consensus-Based Decisions",
    description: "The designed multi-agent review requires a 23-of-33 supermajority. It is intended to remove a single point of failure; that property is measured, not claimed.",
    icon: Users,
    stats: "Supermajority (23 of 33) required by design",
  },
  {
    title: "Real-Time Alert System",
    description: "Instant notifications to relevant regulatory bodies when violations are detected, with full audit trail and evidence package.",
    icon: Bell,
    stats: "Real-time alert design target",
  },
  {
    title: "Cross-Border Coordination",
    description: "Automatic routing of cases to appropriate jurisdictions with built-in mutual recognition of assessments.",
    icon: Network,
    stats: "Cross-border routing, designed for mutual recognition",
  },
];

const internationalCooperation = [
  {
    name: "G7 AI Process",
    description: "Alignment with Hiroshima AI Process principles and International Code of Conduct for Organizations",
    status: "Active Partner",
    participants: "7 nations + EU",
    icon: Handshake,
  },
  {
    name: "UN Global Dialogue",
    description: "Contributing to the UN Secretary-General's AI Advisory Body and Global Digital Compact",
    status: "Observer Status",
    participants: "193 member states",
    icon: Globe2,
  },
  {
    name: "Council of Europe Framework",
    description: "Supporting the Framework Convention on AI, Human Rights, Democracy and Rule of Law",
    status: "Technical Advisor",
    participants: "46 member states",
    icon: Scale,
  },
  {
    name: "Network of AI Safety Institutes",
    description: "Data sharing and best practice exchange with national AI safety institutes worldwide",
    status: "Founding Member",
    participants: "12 institutes",
    icon: Shield,
  },
];

const faqItems = [
  {
    question: "How do regulators access CSOAI?",
    answer: "Government regulators receive dedicated secure access through our Government Partnership Program. Access is granted after verification of regulatory authority and completion of our security onboarding process. Regulators receive API keys, dedicated support channels, and training on our compliance monitoring tools. Contact our Government Relations team to initiate the onboarding process.",
  },
  {
    question: "What data do we share with regulators?",
    answer: "We provide regulators with real-time compliance status, risk assessments, incident reports, and audit trails for AI systems within their jurisdiction. All data sharing follows strict protocols aligned with GDPR and other data protection frameworks. Regulators can access aggregated compliance metrics, individual system assessments (with appropriate authority), enforcement action histories, and Council decision records.",
  },
  {
    question: "How does cross-border cooperation work?",
    answer: "Our platform is designed for mutual recognition — compliance assessments conducted in one jurisdiction routed so others can recognize them. The Council routes cases to appropriate authorities based on system deployment geography, company headquarters, and affected populations. No bilateral data-sharing agreements are in force yet; this section describes the design, not an operating network.",
  },
  {
    question: "Can regulators initiate investigations?",
    answer: "Yes. Authorized regulators can flag systems for investigation, request detailed compliance audits, and trigger Council reviews. Investigation requests are processed within 24 hours, with critical cases escalated immediately. Regulators can also request emergency halt orders for systems posing immediate harm, subject to Council supermajority approval.",
  },
  {
    question: "How are compliance disputes resolved?",
    answer: "Disputes follow a three-tier resolution process: (1) Internal review by our compliance team within 14 days, (2) Council arbitration with independent assessment within 30 days, (3) External appeals to designated regulatory tribunals. All parties receive full documentation and evidence packages, and decisions are published in our transparency reports.",
  },
  {
    question: "What reporting formats are available?",
    answer: "We support multiple reporting formats including standardized XML/JSON for automated ingestion, PDF reports for formal proceedings, Excel exports for analysis, and real-time API feeds. Reports can be customized to match specific regulatory requirements and are available in all EU official languages plus Mandarin, Japanese, and Korean.",
  },
  {
    question: "How do we integrate with existing regulatory systems?",
    answer: "CSOAI offers REST and GraphQL APIs for seamless integration with existing regulatory technology stacks. We provide pre-built connectors for major regulatory platforms including EU AI Office systems, SEC EDGAR, and national registration databases. Our technical team offers custom integration support at no additional cost to government partners.",
  },
  {
    question: "What training is available for government staff?",
    answer: "We provide comprehensive training programs including: (1) Online self-paced courses on AI compliance fundamentals, (2) Live workshops on using the CSOAI platform, (3) Advanced certification programs for compliance officers, (4) Annual conferences and symposiums. All training is provided free of charge to verified government personnel.",
  },
];

const riskCategories = [
  { level: "Unacceptable", count: 3, color: "bg-red-600", description: "Prohibited systems" },
  { level: "High-Risk", count: 156, color: "bg-orange-500", description: "Requires assessment" },
  { level: "Limited Risk", count: 423, color: "bg-yellow-500", description: "Transparency required" },
  { level: "Minimal Risk", count: 665, color: "bg-green-500", description: "Voluntary codes" },
];

const recentAlerts = [
  {
    id: 1,
    type: "Critical",
    title: "Unacceptable Risk System Detected",
    system: "Demo Scoring Model",
    company: "Demo Vendor A",
    framework: "EU AI Act",
    timestamp: new Date("2026-01-13T14:23:00"),
    status: "action_required",
  },
  {
    id: 2,
    type: "High",
    title: "High-Risk System Missing Documentation",
    system: "Demo Credit Model",
    company: "Demo Vendor B",
    framework: "EU AI Act",
    timestamp: new Date("2026-01-13T12:15:00"),
    status: "investigating",
  },
  {
    id: 3,
    type: "Medium",
    title: "Transparency Violation",
    system: "Demo Chat Model",
    company: "Demo Vendor C",
    framework: "ISO 42001",
    timestamp: new Date("2026-01-13T10:45:00"),
    status: "resolved",
  },
  {
    id: 4,
    type: "High",
    title: "Bias Detection Alert",
    system: "Demo Hiring Model",
    company: "Demo Vendor D",
    framework: "NIST AI RMF",
    timestamp: new Date("2026-01-12T16:30:00"),
    status: "investigating",
  },
];

// DEMONSTRATION DATA — illustrative council decisions, not real measures.
const councilActions = [
  {
    id: 1,
    action: "Emergency Halt Order",
    target: "Demo Scoring Model",
    result: "Approved (31-2)",
    date: new Date("2026-01-13"),
    impact: "Immediate deployment suspension",
  },
  {
    id: 2,
    action: "Remediation Directive",
    target: "Demo Diagnostics Model",
    result: "Approved (31-1)",
    date: new Date("2026-01-11"),
    impact: "Mandatory retraining with diverse dataset",
  },
  {
    id: 3,
    action: "Warning Notice",
    target: "Demo Credit Model",
    result: "Pending Vote",
    date: new Date("2026-01-13"),
    impact: "30-day compliance deadline",
  },
];

export default function GovernmentDashboard() {
  const [selectedFramework, setSelectedFramework] = useState<string>("all");
  const [selectedRegion, setSelectedRegion] = useState<string>("global");
  const [timeRange, setTimeRange] = useState<string>("7d");
  const [activeRegionalTab, setActiveRegionalTab] = useState<string>("europe");

  // No live national registry feeds this dashboard yet — headline figures are
  // shown as "—" rather than invented (see the notice strip below the hero).
  const totalSystems: number | null = null;
  const overallCompliance: number | null = null;
  const activeIncidentCount: number | null = null;
  const pendingActions: number | null = null;

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string; light: string }> = {
      blue: { bg: "bg-blue-600", text: "text-blue-600", border: "border-blue-600", light: "bg-blue-50" },
      emerald: { bg: "bg-emerald-600", text: "text-emerald-600", border: "border-emerald-600", light: "bg-emerald-50" },
      violet: { bg: "bg-violet-600", text: "text-violet-600", border: "border-violet-600", light: "bg-violet-50" },
      amber: { bg: "bg-amber-600", text: "text-amber-600", border: "border-amber-600", light: "bg-amber-50" },
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-green-900 text-white py-20 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="container max-w-7xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-white/20 text-white border-white/30 hover:bg-white/30">
                <Landmark className="h-3 w-3 mr-1" />
                Government & Regulator Portal
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Global AI Compliance
                <span className="text-emerald-300"> Monitoring</span>
              </h1>
              <p className="text-xl text-emerald-100 mb-4 leading-relaxed max-w-xl">
                Real-time oversight capabilities for government regulators. Monitor AI systems
                across jurisdictions, enforce compliance, and protect citizens with unprecedented
                transparency and coordination.
              </p>
              <p className="text-sm text-emerald-200/90 mb-8 leading-relaxed max-w-xl">
                Regulators may verify any published measurement card offline — verification stays
                free forever, with no account.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-white text-emerald-900 hover:bg-emerald-50">
                  <Eye className="mr-2 h-5 w-5" />
                  Access Dashboard
                </Button>
                <Button size="lg" variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white/10">
                  <FileText className="mr-2 h-5 w-5" />
                  Request Access
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
              >
                <Radio className="h-8 w-8 text-emerald-300 mb-3" />
                <div className="text-3xl font-bold mb-1">24/7</div>
                <div className="text-emerald-200 text-sm">Real-Time Monitoring</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
              >
                <Globe2 className="h-8 w-8 text-emerald-300 mb-3" />
                <div className="text-3xl font-bold mb-1">—</div>
                <div className="text-emerald-200 text-sm">Regulatory Partners (none connected yet)</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
              >
                <Shield className="h-8 w-8 text-emerald-300 mb-3" />
                <div className="text-3xl font-bold mb-1">4</div>
                <div className="text-emerald-200 text-sm">Major Frameworks</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
              >
                <Activity className="h-8 w-8 text-emerald-300 mb-3" />
                <div className="text-3xl font-bold mb-1">—</div>
                <div className="text-emerald-200 text-sm">Systems Monitored (no registry connected)</div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Honest capability notice — this dashboard is a preview, not a live registry */}
      <section className="bg-amber-50 border-b border-amber-200 py-3">
        <div className="container max-w-7xl">
          <p className="text-sm text-amber-800">
            <strong>Preview.</strong> No live national AI registry feeds this dashboard yet.
            Headline figures are withheld rather than invented; framework and regional panels
            below show the layout with illustrative example data, clearly not measurements.
          </p>
        </div>
      </section>

      {/* Quick Stats Bar */}
      <section className="bg-emerald-50 border-b border-emerald-100 py-6">
        <div className="container max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4 rounded-lg bg-white shadow-sm border border-emerald-100">
              <div className="text-4xl font-bold text-emerald-700">{totalSystems?.toLocaleString() ?? "—"}</div>
              <div className="text-sm text-emerald-600 font-medium">Monitored Systems</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-white shadow-sm border border-emerald-100">
              <div className="text-4xl font-bold text-emerald-700">{overallCompliance != null ? `${overallCompliance}%` : "—"}</div>
              <div className="text-sm text-emerald-600 font-medium">Overall Compliance</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-white shadow-sm border border-emerald-100">
              <div className="text-4xl font-bold text-amber-600">{activeIncidentCount ?? "—"}</div>
              <div className="text-sm text-amber-700 font-medium">Active Incidents</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-white shadow-sm border border-emerald-100">
              <div className="text-4xl font-bold text-emerald-700">{pendingActions ?? "—"}</div>
              <div className="text-sm text-emerald-600 font-medium">Pending Actions</div>
            </div>
          </div>
        </div>
      </section>

      {/* PLACEHOLDER_GOV_TAIL
