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

const regionalData = [
  {
    id: "europe",
    name: "Europe",
    totalSystems: 456,
    compliantSystems: 429,
    complianceRate: 94.1,
    activeIncidents: 23,
    pendingInvestigations: 8,
    enforcementActions: 3,
    primaryFramework: "EU AI Act",
    countries: ["Germany", "France", "Netherlands", "Italy", "Spain"],
  },
  {
    id: "north-america",
    name: "North America",
    totalSystems: 487,
    compliantSystems: 447,
    complianceRate: 91.8,
    activeIncidents: 36,
    pendingInvestigations: 12,
    enforcementActions: 5,
    primaryFramework: "NIST AI RMF",
    countries: ["United States", "Canada", "Mexico"],
  },
  {
    id: "asia-pacific",
    name: "Asia-Pacific",
    totalSystems: 234,
    compliantSystems: 198,
    complianceRate: 84.6,
    activeIncidents: 19,
    pendingInvestigations: 7,
    enforcementActions: 2,
    primaryFramework: "TC260 / ISO 42001",
    countries: ["China", "Japan", "South Korea", "Australia", "Singapore"],
  },
  {
    id: "global",
    name: "Global Overview",
    totalSystems: 1247,
    compliantSystems: 1138,
    complianceRate: 91.2,
    activeIncidents: 78,
    pendingInvestigations: 27,
    enforcementActions: 10,
    primaryFramework: "Multi-Framework",
    countries: ["All Jurisdictions"],
  },
];

const activeIncidents = {
  pendingInvestigations: [
    {
      id: "INV-2026-0127",
      system: "Social Scoring AI v2.1",
      company: "DataMetrics Corp",
      type: "Unacceptable Risk",
      priority: "Critical",
      daysOpen: 3,
      assignedTo: "EU DPA Task Force",
      nextAction: "Council Review Scheduled",
    },
    {
      id: "INV-2026-0124",
      system: "CreditDecide Pro",
      company: "QuickLoan Financial",
      type: "Bias Detection",
      priority: "High",
      daysOpen: 7,
      assignedTo: "CFPB AI Unit",
      nextAction: "Awaiting Company Response",
    },
    {
      id: "INV-2026-0119",
      system: "TalentMatch AI",
      company: "HireRight Corp",
      type: "Discrimination Alert",
      priority: "High",
      daysOpen: 12,
      assignedTo: "EEOC Investigation",
      nextAction: "Technical Audit in Progress",
    },
    {
      id: "INV-2026-0115",
      system: "MedDiagnose Plus",
      company: "HealthAI Systems",
      type: "Safety Concern",
      priority: "Medium",
      daysOpen: 18,
      assignedTo: "FDA AI/ML Division",
      nextAction: "Remediation Plan Review",
    },
  ],
  enforcementActions: [
    {
      id: "ENF-2026-0089",
      system: "Facial Recognition Suite",
      company: "SurveillanceTech Inc",
      action: "Deployment Suspension",
      fine: 4200000,
      status: "Active",
      framework: "EU AI Act",
      effectiveDate: "2026-01-10",
    },
    {
      id: "ENF-2026-0085",
      system: "AutoReject Loan Engine",
      company: "FastCredit LLC",
      action: "Mandatory Remediation",
      fine: 1500000,
      status: "Compliance Monitoring",
      framework: "NIST AI RMF",
      effectiveDate: "2026-01-05",
    },
    {
      id: "ENF-2026-0078",
      system: "EmotionDetect HR",
      company: "WorkforceAI",
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
      company: "AlgoTrade Systems",
      appealType: "Fine Reduction",
      originalFine: 3500000,
      requestedReduction: 2100000,
      status: "Under Review",
      hearingDate: "2026-02-15",
    },
    {
      id: "APL-2026-0031",
      originalCase: "ENF-2025-0398",
      company: "SmartScreen Corp",
      appealType: "Classification Challenge",
      originalFine: 1800000,
      requestedReduction: 1800000,
      status: "Documentation Phase",
      hearingDate: "2026-02-22",
    },
  ],
};

const byzantineCouncilFeatures = [
  {
    title: "Automated Compliance Monitoring",
    description: "33 independent AI agents continuously monitor all registered systems for compliance violations across all major frameworks.",
    icon: Eye,
    stats: "24/7 monitoring of 1,247 systems",
  },
  {
    title: "Consensus-Based Decisions",
    description: "Byzantine fault-tolerant voting ensures no single point of failure. Requires supermajority (22/33) for enforcement actions.",
    icon: Users,
    stats: "99.97% decision accuracy",
  },
  {
    title: "Real-Time Alert System",
    description: "Instant notifications to relevant regulatory bodies when violations are detected, with full audit trail and evidence package.",
    icon: Bell,
    stats: "< 30 second alert latency",
  },
  {
    title: "Cross-Border Coordination",
    description: "Automatic routing of cases to appropriate jurisdictions with built-in mutual recognition of assessments.",
    icon: Network,
    stats: "47 regulatory partnerships",
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
    answer: "We provide regulators with real-time compliance status, risk assessments, incident reports, and audit trails for AI systems within their jurisdiction. All data sharing follows strict protocols aligned with GDPR and other data protection frameworks. Regulators can access aggregated compliance metrics, individual system assessments (with appropriate authority), enforcement action histories, and Byzantine Council decision records.",
  },
  {
    question: "How does cross-border cooperation work?",
    answer: "Our platform implements mutual recognition agreements that allow compliance assessments conducted in one jurisdiction to be recognized in others. The Byzantine Council automatically routes cases to appropriate authorities based on system deployment geography, company headquarters, and affected populations. We maintain bilateral data sharing agreements with 47 regulatory bodies across 32 countries.",
  },
  {
    question: "Can regulators initiate investigations?",
    answer: "Yes. Authorized regulators can flag systems for investigation, request detailed compliance audits, and trigger Byzantine Council reviews. Investigation requests are processed within 24 hours, with critical cases escalated immediately. Regulators can also request emergency halt orders for systems posing immediate harm, subject to Council supermajority approval.",
  },
  {
    question: "How are compliance disputes resolved?",
    answer: "Disputes follow a three-tier resolution process: (1) Internal review by our compliance team within 14 days, (2) Byzantine Council arbitration with independent assessment within 30 days, (3) External appeals to designated regulatory tribunals. All parties receive full documentation and evidence packages, and decisions are published in our transparency reports.",
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
    system: "Social Scoring AI v2.1",
    company: "DataMetrics Corp",
    framework: "EU AI Act",
    timestamp: new Date("2026-01-13T14:23:00"),
    status: "action_required",
  },
  {
    id: 2,
    type: "High",
    title: "High-Risk System Missing Documentation",
    system: "CreditDecide Pro",
    company: "QuickLoan Financial",
    framework: "EU AI Act",
    timestamp: new Date("2026-01-13T12:15:00"),
    status: "investigating",
  },
  {
    id: 3,
    type: "Medium",
    title: "Transparency Violation",
    system: "ChatAssist Enterprise",
    company: "ServiceBot Inc",
    framework: "ISO 42001",
    timestamp: new Date("2026-01-13T10:45:00"),
    status: "resolved",
  },
  {
    id: 4,
    type: "High",
    title: "Bias Detection Alert",
    system: "TalentMatch AI",
    company: "HireRight Corp",
    framework: "NIST AI RMF",
    timestamp: new Date("2026-01-12T16:30:00"),
    status: "investigating",
  },
];

const councilActions = [
  {
    id: 1,
    action: "Emergency Halt Order",
    target: "Social Scoring AI v2.1",
    result: "Approved (31-2)",
    date: new Date("2026-01-13"),
    impact: "Immediate deployment suspension",
  },
  {
    id: 2,
    action: "Remediation Directive",
    target: "DermaScan AI",
    result: "Approved (31-1)",
    date: new Date("2026-01-11"),
    impact: "Mandatory retraining with diverse dataset",
  },
  {
    id: 3,
    action: "Warning Notice",
    target: "CreditDecide Pro",
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

  const totalSystems = 1247;
  const overallCompliance = 91.2;
  const activeIncidentCount = 78;
  const pendingActions = 12;

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
              <p className="text-xl text-emerald-100 mb-8 leading-relaxed max-w-xl">
                Real-time oversight capabilities for government regulators. Monitor AI systems
                across jurisdictions, enforce compliance, and protect citizens with unprecedented
                transparency and coordination.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-white text-emerald-900 hover:bg-emerald-50">
                  <Eye className="mr-2 h-5 w-5" />
                  Access Dashboard
                </Button>
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
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
                <div className="text-3xl font-bold mb-1">47</div>
                <div className="text-emerald-200 text-sm">Regulatory Partners</div>
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
                <div className="text-3xl font-bold mb-1">1,247</div>
                <div className="text-emerald-200 text-sm">Systems Monitored</div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats Bar */}
      <section className="bg-emerald-50 border-b border-emerald-100 py-6">
        <div className="container max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4 rounded-lg bg-white shadow-sm border border-emerald-100">
              <div className="text-4xl font-bold text-emerald-700">{totalSystems.toLocaleString()}</div>
              <div className="text-sm text-emerald-600 font-medium">Monitored Systems</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-white shadow-sm border border-emerald-100">
              <div className="text-4xl font-bold text-emerald-700">{overallCompliance}%</div>
              <div className="text-sm text-emerald-600 font-medium">Overall Compliance</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-white shadow-sm border border-emerald-100">
              <div className="text-4xl font-bold text-amber-600">{activeIncidentCount}</div>
              <div className="text-sm text-amber-700 font-medium">Active Incidents</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-white shadow-sm border border-emerald-100">
              <div className="text-4xl font-bold text-emerald-700">{pendingActions}</div>
              <div className="text-sm text-emerald-600 font-medium">Pending Actions</div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white border-b py-4">
        <div className="container max-w-7xl">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-600">Filters:</span>
            </div>
            <Select value={selectedFramework} onValueChange={setSelectedFramework}>
              <SelectTrigger className="w-[180px] border-emerald-200 focus:ring-emerald-500">
                <SelectValue placeholder="Framework" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Frameworks</SelectItem>
                <SelectItem value="eu-ai-act">EU AI Act</SelectItem>
                <SelectItem value="nist-ai-rmf">NIST AI RMF</SelectItem>
                <SelectItem value="iso-42001">ISO 42001</SelectItem>
                <SelectItem value="tc260">TC260</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger className="w-[180px] border-emerald-200 focus:ring-emerald-500">
                <SelectValue placeholder="Region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="global">Global</SelectItem>
                <SelectItem value="europe">Europe</SelectItem>
                <SelectItem value="north-america">North America</SelectItem>
                <SelectItem value="asia-pacific">Asia-Pacific</SelectItem>
              </SelectContent>
            </Select>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[140px] border-emerald-200 focus:ring-emerald-500">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
            <div className="ml-auto flex gap-2">
              <Button variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Bell className="mr-2 h-4 w-4" />
                Alert Settings
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Multi-Framework Monitoring Section */}
      <section className="py-16 bg-white">
        <div className="container max-w-7xl">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-emerald-100 text-emerald-700 border-emerald-200">
              Multi-Framework Compliance
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Comprehensive Regulatory Monitoring
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Real-time compliance tracking across the world's major AI governance frameworks.
              Unified oversight for fragmented regulatory landscapes.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {complianceFrameworks.map((framework) => {
              const Icon = framework.icon;
              const colorClasses = getColorClasses(framework.color);
              return (
                <motion.div
                  key={framework.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  <Card className={`h-full hover:shadow-lg transition-shadow border-t-4 ${colorClasses.border}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className={`w-12 h-12 rounded-xl ${colorClasses.light} flex items-center justify-center`}>
                          <Icon className={`h-6 w-6 ${colorClasses.text}`} />
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {framework.requirements} Requirements
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{framework.name}</CardTitle>
                      <CardDescription>{framework.region}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-600">Compliance Rate</span>
                            <span className={`font-bold ${colorClasses.text}`}>{framework.complianceRate}%</span>
                          </div>
                          <Progress value={framework.complianceRate} className="h-2" />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{framework.compliantCount.toLocaleString()} compliant</span>
                          <span>{framework.totalSystems.toLocaleString()} total</span>
                        </div>
                        <div className="pt-3 border-t">
                          <p className="text-xs text-gray-500 mb-2">Key Areas:</p>
                          <div className="flex flex-wrap gap-1">
                            {framework.keyAreas.map((area) => (
                              <Badge key={area} variant="secondary" className="text-xs">
                                {area}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Regional Views Section */}
      <section className="py-16 bg-gray-50">
        <div className="container max-w-7xl">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-emerald-100 text-emerald-700 border-emerald-200">
              Regional Oversight
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Compliance by Region
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Jurisdictional breakdown of AI system compliance, incidents, and enforcement activities.
            </p>
          </div>

          <Tabs value={activeRegionalTab} onValueChange={setActiveRegionalTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8 bg-white border">
              <TabsTrigger value="europe" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                Europe
              </TabsTrigger>
              <TabsTrigger value="north-america" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                North America
              </TabsTrigger>
              <TabsTrigger value="asia-pacific" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                Asia-Pacific
              </TabsTrigger>
              <TabsTrigger value="global" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                Global
              </TabsTrigger>
            </TabsList>

            {regionalData.map((region) => (
              <TabsContent key={region.id} value={region.id}>
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                      <div className="text-center p-6 bg-emerald-50 rounded-xl">
                        <Database className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                        <div className="text-3xl font-bold text-emerald-700">{region.totalSystems}</div>
                        <div className="text-sm text-emerald-600">Total Systems</div>
                      </div>
                      <div className="text-center p-6 bg-green-50 rounded-xl">
                        <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <div className="text-3xl font-bold text-green-700">{region.complianceRate}%</div>
                        <div className="text-sm text-green-600">Compliance Rate</div>
                      </div>
                      <div className="text-center p-6 bg-amber-50 rounded-xl">
                        <AlertTriangle className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                        <div className="text-3xl font-bold text-amber-700">{region.activeIncidents}</div>
                        <div className="text-sm text-amber-600">Active Incidents</div>
                      </div>
                      <div className="text-center p-6 bg-red-50 rounded-xl">
                        <Gavel className="h-8 w-8 text-red-600 mx-auto mb-2" />
                        <div className="text-3xl font-bold text-red-700">{region.enforcementActions}</div>
                        <div className="text-sm text-red-600">Enforcement Actions</div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-emerald-600" />
                          Coverage
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {region.countries.map((country) => (
                            <Badge key={country} variant="outline" className="bg-white">
                              {country}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Scale className="h-4 w-4 text-emerald-600" />
                          Primary Framework
                        </h4>
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                          {region.primaryFramework}
                        </Badge>
                        <p className="text-sm text-gray-500 mt-2">
                          {region.pendingInvestigations} pending investigations in this region
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* Active Incidents Section */}
      <section className="py-16 bg-white">
        <div className="container max-w-7xl">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-amber-100 text-amber-700 border-amber-200">
              <CircleAlert className="h-3 w-3 mr-1" />
              Active Cases
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Incidents & Enforcement
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Current investigations, enforcement actions, and appeals under review.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Pending Investigations */}
            <Card className="border-t-4 border-t-amber-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileSearch className="h-5 w-5 text-amber-600" />
                  Pending Investigations
                </CardTitle>
                <CardDescription>{activeIncidents.pendingInvestigations.length} active cases</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeIncidents.pendingInvestigations.map((inv) => (
                  <div key={inv.id} className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <Badge className={
                        inv.priority === "Critical" ? "bg-red-100 text-red-700" :
                        inv.priority === "High" ? "bg-orange-100 text-orange-700" :
                        "bg-yellow-100 text-yellow-700"
                      }>
                        {inv.priority}
                      </Badge>
                      <span className="text-xs text-gray-500">{inv.id}</span>
                    </div>
                    <h4 className="font-medium text-sm">{inv.system}</h4>
                    <p className="text-xs text-gray-600">{inv.company}</p>
                    <div className="mt-2 pt-2 border-t border-amber-200">
                      <p className="text-xs text-gray-500">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {inv.daysOpen} days open
                      </p>
                      <p className="text-xs text-amber-700 mt-1">
                        Next: {inv.nextAction}
                      </p>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full border-amber-200 text-amber-700 hover:bg-amber-50">
                  View All Investigations
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Enforcement Actions */}
            <Card className="border-t-4 border-t-red-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Gavel className="h-5 w-5 text-red-600" />
                  Enforcement Actions
                </CardTitle>
                <CardDescription>{activeIncidents.enforcementActions.length} active enforcement actions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeIncidents.enforcementActions.map((action) => (
                  <div key={action.id} className="p-3 bg-red-50 border border-red-100 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <Badge className="bg-red-100 text-red-700">
                        {action.action}
                      </Badge>
                      <span className="text-xs text-gray-500">{action.id}</span>
                    </div>
                    <h4 className="font-medium text-sm">{action.system}</h4>
                    <p className="text-xs text-gray-600">{action.company}</p>
                    <div className="mt-2 pt-2 border-t border-red-200">
                      <p className="text-xs text-red-700 font-medium">
                        Fine: ${(action.fine / 1000000).toFixed(1)}M
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Framework: {action.framework}
                      </p>
                      <Badge variant="outline" className="mt-2 text-xs">
                        {action.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full border-red-200 text-red-700 hover:bg-red-50">
                  View All Actions
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Appeals in Progress */}
            <Card className="border-t-4 border-t-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Scale className="h-5 w-5 text-blue-600" />
                  Appeals in Progress
                </CardTitle>
                <CardDescription>{activeIncidents.appealsInProgress.length} pending appeals</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeIncidents.appealsInProgress.map((appeal) => (
                  <div key={appeal.id} className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <Badge className="bg-blue-100 text-blue-700">
                        {appeal.appealType}
                      </Badge>
                      <span className="text-xs text-gray-500">{appeal.id}</span>
                    </div>
                    <h4 className="font-medium text-sm">{appeal.company}</h4>
                    <p className="text-xs text-gray-600">Case: {appeal.originalCase}</p>
                    <div className="mt-2 pt-2 border-t border-blue-200">
                      <p className="text-xs text-gray-600">
                        Original: ${(appeal.originalFine / 1000000).toFixed(1)}M
                      </p>
                      <p className="text-xs text-blue-700">
                        Requested: ${(appeal.requestedReduction / 1000000).toFixed(1)}M reduction
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        <Calendar className="h-3 w-3 inline mr-1" />
                        Hearing: {appeal.hearingDate}
                      </p>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full border-blue-200 text-blue-700 hover:bg-blue-50">
                  View All Appeals
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Byzantine Council Integration Section */}
      <section className="py-16 bg-gradient-to-br from-emerald-900 via-emerald-800 to-green-900 text-white">
        <div className="container max-w-7xl">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-white/20 text-white border-white/30">
              <Layers className="h-3 w-3 mr-1" />
              Byzantine Council Integration
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              AI-Powered Regulatory Support
            </h2>
            <p className="text-lg text-emerald-100 max-w-3xl mx-auto">
              Our 33-agent Byzantine Council provides automated, tamper-proof compliance monitoring
              that supports regulatory decision-making with unprecedented accuracy and speed.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {byzantineCouncilFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
                >
                  <Icon className="h-10 w-10 text-emerald-300 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-emerald-100 text-sm mb-4">{feature.description}</p>
                  <Badge className="bg-emerald-500/30 text-emerald-200 border-emerald-400/30">
                    {feature.stats}
                  </Badge>
                </motion.div>
              );
            })}
          </div>

          <Card className="bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Council Actions
              </CardTitle>
              <CardDescription className="text-emerald-200">
                Enforcement decisions by the 33-agent Byzantine Council
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {councilActions.map((action) => (
                  <div key={action.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">{action.action}</h4>
                      <Badge className={
                        action.result.includes('Approved') ? 'bg-green-500/30 text-green-200' :
                        'bg-amber-500/30 text-amber-200'
                      }>
                        {action.result}
                      </Badge>
                    </div>
                    <p className="text-sm text-emerald-200 mb-1">Target: {action.target}</p>
                    <p className="text-xs text-emerald-300">{action.impact}</p>
                    <p className="text-xs text-emerald-400 mt-2">
                      {action.date.toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* International Cooperation Section */}
      <section className="py-16 bg-white">
        <div className="container max-w-7xl">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-emerald-100 text-emerald-700 border-emerald-200">
              <Globe2 className="h-3 w-3 mr-1" />
              Global Partnerships
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              International Cooperation
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              CSOAI actively participates in global AI governance initiatives, ensuring
              alignment with international standards and cross-border regulatory cooperation.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {internationalCooperation.map((initiative, index) => {
              const Icon = initiative.icon;
              return (
                <motion.div
                  key={initiative.name}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <Icon className="h-7 w-7 text-emerald-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-lg">{initiative.name}</h3>
                            <Badge className="bg-emerald-100 text-emerald-700">
                              {initiative.status}
                            </Badge>
                          </div>
                          <p className="text-gray-600 text-sm mb-3">{initiative.description}</p>
                          <div className="flex items-center text-xs text-gray-500">
                            <Users className="h-3 w-3 mr-1" />
                            {initiative.participants}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="container max-w-4xl">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-emerald-100 text-emerald-700 border-emerald-200">
              <HelpCircle className="h-3 w-3 mr-1" />
              Frequently Asked Questions
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Government & Regulator FAQ
            </h2>
            <p className="text-lg text-gray-600">
              Common questions about CSOAI's government partnership program and regulatory tools.
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <Accordion type="single" collapsible className="w-full">
                {faqItems.map((item, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left hover:text-emerald-600">
                      <span className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {index + 1}
                        </span>
                        {item.question}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-600 pl-8">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-emerald-900 via-emerald-800 to-green-900 text-white">
        <div className="container max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-6">
              <Handshake className="h-10 w-10 text-emerald-300" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Partner With CSOAI
            </h2>
            <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
              Join 47 regulatory bodies worldwide in building a safer AI ecosystem.
              Request access to our government partnership program today.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" className="bg-white text-emerald-900 hover:bg-emerald-50">
                <Mail className="mr-2 h-5 w-5" />
                Request Partnership Access
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                <Phone className="mr-2 h-5 w-5" />
                Schedule Consultation
              </Button>
            </div>

            <div className="grid sm:grid-cols-3 gap-6 pt-8 border-t border-white/20">
              <div className="flex items-center justify-center gap-2 text-emerald-200">
                <Lock className="h-5 w-5" />
                <span>Secure Government Portal</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-emerald-200">
                <RefreshCw className="h-5 w-5" />
                <span>Real-Time Data Access</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-emerald-200">
                <BookOpen className="h-5 w-5" />
                <span>Free Training Programs</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer Contact Info */}
      <section className="py-8 bg-emerald-950 text-white">
        <div className="container max-w-7xl">
          <div className="flex flex-wrap justify-center gap-8 text-sm text-emerald-300">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              government@csoai.org
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              +1 (800) CSOAI-GOV
            </div>
            <div className="flex items-center gap-2">
              <Globe2 className="h-4 w-4" />
              Available in 24 Languages
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              24/7 Government Support Line
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
