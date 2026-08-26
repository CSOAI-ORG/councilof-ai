import {
  Shield,
  Lock,
  Server,
  CheckCircle2,
  AlertCircle,
  Globe,
  Eye,
  Zap,
  Award,
  AlertTriangle,
  Book,
  BarChart3,
  Cpu,
  Key,
  Activity,
  MapPin,
  RotateCcw,
  Maximize2,
  MessageSquare,
  Mail,
  Plus,
  Minus,
} from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import FaqBlock from "@/components/FaqBlock";
import SpotInfographic from "@/components/SpotInfographic";
import { LANE4 } from "@/data/lane4Content";

const L4 = LANE4["trust-center"];

interface AccordionItem {
  id: string;
  title: string;
  content: string;
  icon: React.ReactNode;
}

interface CertificationItem {
  name: string;
  icon: React.ReactNode;
  status: "Certified" | "Compliant" | "Self-assessed" | "In Progress";
  description: string;
}

export default function TrustCenter() {
  const [expandedAccordion, setExpandedAccordion] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("certifications");

  const certifications: CertificationItem[] = [
    {
      name: "ISO 27001",
      icon: <Shield className="h-8 w-8" />,
      status: "In Progress",
      description: "Information Security Management System",
    },
    {
      name: "ISO 42001",
      icon: <Cpu className="h-8 w-8" />,
      status: "In Progress",
      description: "AI Management System",
    },
    {
      name: "SOC 2 Type II",
      icon: <Lock className="h-8 w-8" />,
      status: "In Progress",
      description: "Security, Availability, and Confidentiality",
    },
    {
      name: "GDPR",
      icon: <Globe className="h-8 w-8" />,
      status: "Self-assessed",
      description: "European Data Protection Regulation — our own assessment of our posture. No third-party audit or certification underlies this row.",
    },
  ];

  const dataProtectionFeatures = [
    {
      title: "Encryption at Rest",
      description: "AES-256 encryption for all data stored in databases and file systems",
      icon: <Lock className="h-6 w-6" />,
    },
    {
      title: "Encryption in Transit",
      description: "TLS 1.3 for all data transmitted between clients and servers",
      icon: <Zap className="h-6 w-6" />,
    },
    {
      title: "Data Residency",
      description:
        "Site served from Cloudflare's global edge network; the measurement backend is first-party, self-hosted UK/EU. Per-region residency selection is designed, not yet offered",
      icon: <MapPin className="h-6 w-6" />,
    },
    {
      title: "Data Retention",
      description: "Configurable retention policies with automatic deletion after specified periods",
      icon: <RotateCcw className="h-6 w-6" />,
    },
    {
      title: "Right to Erasure",
      description: "Erasure on request under GDPR Article 17, actioned within the statutory one-month window",
      icon: <Maximize2 className="h-6 w-6" />,
    },
    {
      title: "Access Controls",
      description: "Role-based access control (RBAC) with MFA and audit logging",
      icon: <Key className="h-6 w-6" />,
    },
  ];

  const infrastructureFeatures = [
    {
      title: "Cloud Infrastructure",
      description:
        "Static-first deployment on Cloudflare's global edge network, with always-free Oracle nodes for measurement workloads",
      detail: "Edge-cached worldwide | Signed artefacts | Fail-closed measurement",
    },
    {
      title: "DDoS Protection",
      description: "DDoS mitigation via Cloudflare's network layer",
      detail: "Automatic traffic filtering | Layer 3-7 protection | 24/7 monitoring",
    },
    {
      title: "Web Application Firewall",
      description: "Network-layer filtering via Cloudflare on all public endpoints",
      detail: "Managed rules | Rate limiting | DDoS mitigation",
    },
    {
      title: "Penetration Testing",
      description: "No third-party penetration test has been performed yet. When one exists, its letter will be published in the Security Pack below",
      detail: "Planned, not performed | Letter will be published | No fake claims",
    },
    {
      title: "Bug Bounty Program",
      description:
        "No paid bug-bounty programme exists today. We run a published vulnerability disclosure policy instead",
      detail: "Responsible disclosure | security.txt (RFC 9116) | Coordinated timelines",
    },
    {
      title: "Incident Response",
      description: "Incident response follows the published protocol below and the honest incident log on /status. There is no staffed 24/7 security operations center today",
      detail: "Published protocol | Public incident log | Root cause analysis",
    },
  ];

  const complianceFrameworks = [
    {
      name: "EU AI Act",
      description: "Full compliance with risk-based regulation of AI systems",
      status: "In Scope",
      icon: <Award className="h-6 w-6" />,
    },
    {
      name: "NIST AI Risk Management Framework",
      description: "Governance, measurement, and control aligned with NIST RMF 1.0",
      status: "Aligned",
      icon: <BarChart3 className="h-6 w-6" />,
    },
    {
      name: "OECD AI Principles",
      description: "Inclusive growth, sustainable development, and well-being oriented",
      status: "Aligned",
      icon: <Globe className="h-6 w-6" />,
    },
    {
      name: "UNESCO AI Recommendation",
      description: "Human-centered and human-supervised AI systems",
      status: "Aligned",
      icon: <Users className="h-6 w-6" />,
    },
  ];

  const privacyItems = [
    {
      title: "Privacy Policy",
      description:
        "Transparent privacy policy outlining data collection, use, and retention practices",
      icon: <Book className="h-5 w-5" />,
    },
    {
      title: "Cookie Policy",
      description: "Clear cookie disclosure with user-controlled consent management",
      icon: <AlertCircle className="h-5 w-5" />,
    },
    {
      title: "Data Processing Agreements",
      description: "Standard DPA templates available for enterprise customers (GDPR Article 28)",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: "Sub-processor List",
      description: "Complete list of third-party data processors with links to their privacy policies",
      icon: <Users className="h-5 w-5" />,
    },
  ];

  const securityFAQs: AccordionItem[] = [
    {
      id: "encryption",
      title: "What encryption standards do you use?",
      content:
        "We use AES-256 for data at rest and TLS 1.3 for data in transit, with keys managed on first-party infrastructure. Customer-managed keys (CMK) are a roadmap item, not a shipped feature — we do not claim key-management controls that are not deployed.",
      icon: <Lock className="h-5 w-5" />,
    },
    {
      id: "compliance-list",
      title: "What compliance certifications do you have?",
      content:
        "ISO 27001 (Information Security), ISO 42001 (AI Management System) and SOC 2 Type II are on our certification roadmap — marked 'In Progress' above because they are genuinely in progress, not attained. We do not claim certifications we have not been awarded. Our GDPR posture is described in the Data Processing Agreement. As a measurement body, we hold ourselves to the same rule we score others by: a claim you cannot show the artifact for is not a claim you ship.",
      icon: <Award className="h-5 w-5" />,
    },
    {
      id: "data-location",
      title: "Where is my data stored?",
      content:
        "The public site is served from Cloudflare's global edge network, and the measurement backend (the measurement API) is first-party infrastructure in the UK/EU. Per-region residency selection (EU/US/APAC) is designed but not yet offered — when it ships, this answer will name the regions and the safeguards.",
      icon: <MapPin className="h-5 w-5" />,
    },
    {
      id: "incident-response",
      title: "What is your incident response process?",
      content:
        "There is no staffed 24/7 security operations center today. Public probes on /status surface failures as they happen. In case of a confirmed security incident: (1) affected users are notified within 24 hours, (2) root cause analysis is completed within 72 hours, (3) a public incident report is published on /status. Response-time figures elsewhere on this page are design targets, not measurements.",
      icon: <AlertTriangle className="h-5 w-5" />,
    },
    {
      id: "penetration-testing",
      title: "How often do you conduct security assessments?",
      content:
        "No external penetration test has been conducted yet — we say so rather than imply one. Continuous vulnerability scanning runs on the dependency tree, and when a third-party assessment exists, its letter will be published on this page and listed in the Security Pack.",
      icon: <Shield className="h-5 w-5" />,
    },
    {
      id: "data-deletion",
      title: "Can you permanently delete my data?",
      content:
        "Yes, we fully support the right to erasure under GDPR Article 17. You can request permanent deletion of your account and all associated data through your dashboard or by contacting privacy@csoai.ai. Data is deleted within 30 days, and we provide a deletion certificate confirming completion. Backups are purged according to our backup retention policy (90-day maximum).",
      icon: <RotateCcw className="h-5 w-5" />,
    },
    {
      id: "sub-processors",
      title: "Who are your sub-processors?",
      content:
        "The named register is published on this page — see the Subprocessors section above. It covers Cloudflare (hosting/edge), Stripe (payments), Vercel (legacy hosting, being retired), GitHub (code), Hugging Face (public dataset hosting), our first-party measurement gateway the measurement API, and our email provider. We notify customers before adding any new processor.",
      icon: <Users className="h-5 w-5" />,
    },
    {
      id: "uptime",
      title: "What is your uptime guarantee?",
      content:
        "Our service-level target is 99.9% availability, measured from the public status page — the same page that reports outages when they happen. Live component status is publicly visible at csoai.org/status. We do not quote historical uptime percentages we cannot show the log for.",
      icon: <Activity className="h-5 w-5" />,
    },
  ];

  const incidentResponseDetails = [
    {
      metric: "Monitoring — designed",
      description: "Automated health probes run against the public status page; no staffed 24/7 operations center exists today",
    },
    {
      metric: "Detection — target 15 min",
      description: "Design target for detecting a probe failure — not yet a measured figure",
    },
    {
      metric: "Containment — target 1 hour",
      description: "Design target to contain and isolate affected systems — not yet a measured figure",
    },
    {
      metric: "24-Hour Notification",
      description: "Maximum time to notify affected users of security incidents",
    },
    {
      metric: "Uptime",
      description: "Not measured publicly — see /status for live availability of probed services",
    },
  ];

  // Subprocessor register. Vendors verified against this repository (wrangler.jsonc,
  // vercel.json, package.json, BuiltOnFooter, GitHub org). Where a vendor could not
  // be verified from the repo it is marked in a source comment only.
  const subprocessors = [
    {
      vendor: "Cloudflare",
      purpose: "Hosting, edge network, DNS and DDoS protection for csoai.org",
      data: "Site traffic logs, IP addresses, cached page content",
      location: "Global edge network (US/EU)",
      safeguard: "Cloudflare DPA; SCCs / UK IDTA for international transfers",
    },
    {
      vendor: "Stripe",
      purpose: "Payment processing",
      data: "Billing name, email and payment metadata — card numbers never touch our servers",
      location: "United States / Ireland",
      safeguard: "Stripe DPA; SCCs / UK IDTA",
    },
    {
      vendor: "Vercel",
      purpose: "Legacy hosting — being retired",
      data: "Historical deployment and access logs only",
      location: "United States",
      safeguard: "Vercel DPA; SCCs / UK IDTA",
    },
    {
      vendor: "GitHub",
      purpose: "Source code hosting and CI",
      data: "Code, issues and contributor metadata; no production personal data",
      location: "United States",
      safeguard: "GitHub DPA; SCCs / UK IDTA",
    },
    {
      vendor: "Hugging Face",
      purpose: "Hosting of public datasets and models",
      data: "Public, non-personal datasets only",
      location: "United States",
      safeguard: "Public data only — no personal data is processed",
    },
    {
      vendor: "the measurement API (first-party)",
      purpose: "Council inference and governance gateway",
      data: "Governance and inference requests",
      location: "Self-hosted, UK/EU",
      safeguard: "First-party infrastructure — not a subprocessor; listed for transparency",
    },
    {
      vendor: "Email provider",
      purpose: "Support and transactional email",
      data: "Contact details and correspondence",
      location: "See DPA",
      safeguard: "Confirmed in the Data Processing Agreement",
    },
  ];
  // confirm before publication: verify the actual email provider (Google Workspace vs
  // other) against billing/MX records before the email row above ships.

  const securityPackPublic = [
    {
      title: "Vulnerability Disclosure Policy",
      description: "How to report a security issue responsibly, and what you can expect back from us.",
      href: "/vulnerability-disclosure",
    },
    {
      title: "security.txt",
      description: "Machine-readable security contact and policy pointers (RFC 9116).",
      href: "/.well-known/security.txt",
    },
    {
      title: "Data Processing Agreement",
      description: "Our standard GDPR Article 28 DPA, including the subprocessor register.",
      href: "/legal/dpa",
    },
    {
      title: "Service Level Agreement",
      description: "Availability targets and support response commitments, in plain terms.",
      href: "/sla",
    },
    {
      title: "Live Status Page",
      description: "Real-time probe of the Council gateway, plus our honest incident log.",
      href: "/status",
    },
  ];

  const securityPackNda = [
    "Executed DPA with customer-specific annexes",
    "Infrastructure architecture diagrams and data-flow maps",
    "Incident response runbook (current revision)",
    "Penetration-test summaries and audit letters — none are claimed today; when an assessment exists, its letter will be listed here",
  ];

  const toggleAccordion = (id: string) => {
    setExpandedAccordion(expandedAccordion === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 text-white py-24">
        <div className="container max-w-5xl">
          <Badge className="mb-6 bg-blue-500/20 text-blue-300 border-blue-500/30">
            Security & Compliance
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-8 leading-tight">
            Trust Built Into Every Layer
          </h1>
          <p className="text-xl text-gray-300 leading-relaxed mb-8">
            CSOAI is built on security, transparency, and compliance. Our controls are described
            honestly — what is attained is marked attained, what is in progress is marked in
            progress, and we do not claim audits we have not undergone.
          </p>
          <p className="text-lg text-gray-400 leading-relaxed">
            From encryption to incident response, this page states where each control actually
            stands. We hold no ISO certification today; the rows below say so.
          </p>
        </div>
      </div>

      {/* Security Certifications */}
      <div className="container py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-50 text-blue-600 border-blue-200">Certifications</Badge>
            <h2 className="text-4xl font-bold mb-6">Certification Status, Marked Honestly</h2>
            <p className="text-xl text-gray-600">
              Frameworks below are marked &ldquo;In Progress&rdquo; because they are genuinely in
              progress. Nothing on this page is claimed as attained until an assessor&rsquo;s letter
              exists — and when one does, it will be published here.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {certifications.map((cert, index) => (
              <Card key={index} className="p-8 border-2 hover:border-blue-300 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-blue-600">{cert.icon}</div>
                  <Badge
                    className={
                      cert.status === "Certified"
                        ? "bg-green-100 text-green-700 border-green-300"
                        : cert.status === "In Progress"
                        ? "bg-amber-100 text-amber-700 border-amber-300"
                        : cert.status === "Self-assessed"
                        ? "bg-slate-100 text-slate-700 border-slate-300"
                        : "bg-emerald-100 text-emerald-700 border-emerald-300"
                    }
                  >
                    {cert.status}
                  </Badge>
                </div>
                <h3 className="text-2xl font-bold mb-2">{cert.name}</h3>
                <p className="text-gray-600">{cert.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Data Protection Section */}
      <div className="bg-gray-50 py-20">
        <div className="container max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-emerald-50 text-emerald-600 border-emerald-200">
              Data Protection
            </Badge>
            <h2 className="text-4xl font-bold mb-6">Enterprise-Grade Data Protection</h2>
            <p className="text-xl text-gray-600">
              Your data is protected with industry-standard encryption (AES-256 at rest, TLS 1.3 in
              transit) and compliance with global data protection regulations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {dataProtectionFeatures.map((feature, index) => (
              <Card key={index} className="p-6 border-1">
                <div className="flex items-start gap-4">
                  <div className="text-emerald-600 mt-1">{feature.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Data Residency — honest status */}
          <Card className="mt-12 p-8 bg-white border-2 border-emerald-100">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <MapPin className="h-6 w-6 text-emerald-600" />
              Data Residency — Current Status
            </h3>
            <p className="text-gray-600 mt-2">
              The public site is served from Cloudflare&rsquo;s global edge network; the measurement
              backend (the measurement API) runs on first-party infrastructure in the UK/EU. A per-region
              residency choice (EU / US / APAC) is designed but <strong>not yet offered</strong> —
              this card will name regions and safeguards on the day it ships, not before.
            </p>
          </Card>
        </div>
      </div>

      {/* Infrastructure Security */}
      <div className="container py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-purple-50 text-purple-600 border-purple-200">
              Infrastructure
            </Badge>
            <h2 className="text-4xl font-bold mb-6">Infrastructure Security</h2>
            <p className="text-xl text-gray-600">
              Multi-layered security architecture protecting against evolving threats.
            </p>
          </div>

          <div className="space-y-6">
            {infrastructureFeatures.map((feature, index) => (
              <Card key={index} className="p-8 border-1 hover:border-purple-300 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-2xl font-bold text-gray-900">{feature.title}</h3>
                  <Shield className="h-6 w-6 text-purple-600 flex-shrink-0" />
                </div>
                <p className="text-gray-600 mb-4">{feature.description}</p>
                <div className="flex flex-wrap gap-2">
                  {feature.detail.split(" | ").map((item, i) => (
                    <Badge key={i} variant="outline" className="bg-purple-50 text-purple-700">
                      {item}
                    </Badge>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Compliance Frameworks */}
      <div className="bg-slate-50 py-20">
        <div className="container max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-indigo-50 text-indigo-600 border-indigo-200">
              Global Compliance
            </Badge>
            <h2 className="text-4xl font-bold mb-6">Aligned With Global Frameworks</h2>
            <p className="text-xl text-gray-600">
              CSOAI is designed with compliance for international AI governance frameworks built in
              from the ground up.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {complianceFrameworks.map((framework, index) => (
              <Card key={index} className="p-8 border-2 border-indigo-100">
                <div className="flex items-start gap-4">
                  <div className="text-indigo-600 mt-1">{framework.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-bold">{framework.name}</h3>
                      <Badge className="bg-indigo-100 text-indigo-700 border-indigo-300">
                        {framework.status}
                      </Badge>
                    </div>
                    <p className="text-gray-600">{framework.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Privacy & Data */}
      <div className="container py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-teal-50 text-teal-600 border-teal-200">Privacy</Badge>
            <h2 className="text-4xl font-bold mb-6">Privacy & Data Management</h2>
            <p className="text-xl text-gray-600">
              Complete transparency and control over your data with accessible policies and
              agreements.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {privacyItems.map((item, index) => (
              <Card key={index} className="p-6 border-1">
                <div className="flex items-start gap-4">
                  <div className="text-teal-600 mt-1">{item.icon}</div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                    <p className="text-gray-600 text-sm">{item.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Quick Links */}
          <Card className="p-8 bg-teal-50 border-2 border-teal-200">
            <h3 className="text-2xl font-bold mb-6">Important Links</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <a href="/privacy-policy" className="justify-start gap-2 h-auto py-3">
                <Book className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-semibold">Privacy Policy</div>
                  <div className="text-xs text-gray-600">View our complete privacy policy</div>
                </div>
              </a>
              <a href="/cookie-policy" className="justify-start gap-2 h-auto py-3">
                <Eye className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-semibold">Cookie Policy</div>
                  <div className="text-xs text-gray-600">Manage your cookie preferences</div>
                </div>
              </a>
              <a href="/legal/dpa">
                <Button variant="outline" className="justify-start gap-2 h-auto py-3 w-full">
                  <FileText className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-semibold">DPA Template</div>
                    <div className="text-xs text-gray-600">Standard Data Processing Agreement</div>
                  </div>
                </Button>
              </a>
              <a href="#subprocessors">
                <Button variant="outline" className="justify-start gap-2 h-auto py-3 w-full">
                  <Users className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-semibold">Sub-processor List</div>
                    <div className="text-xs text-gray-600">View all third-party processors</div>
                  </div>
                </Button>
              </a>
            </div>
          </Card>
        </div>
      </div>

      {/* Subprocessors */}
      <div id="subprocessors" className="bg-gray-50 py-20">
        <div className="container max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-slate-100 text-slate-600 border-slate-300">
              Subprocessors
            </Badge>
            <h2 className="text-4xl font-bold mb-6">Who Processes Your Data</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Every third party that touches data on our behalf, named. If a vendor is not on
              this list, it does not process your data. We notify customers before adding any
              new processor.
            </p>
          </div>

          <Card className="overflow-hidden border-2">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-900 text-white text-left">
                    <th className="px-6 py-4 font-semibold">Vendor</th>
                    <th className="px-6 py-4 font-semibold">Purpose</th>
                    <th className="px-6 py-4 font-semibold">Data categories</th>
                    <th className="px-6 py-4 font-semibold">Location</th>
                    <th className="px-6 py-4 font-semibold">Safeguard</th>
                  </tr>
                </thead>
                <tbody>
                  {subprocessors.map((sp, index) => (
                    <tr
                      key={index}
                      className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}
                    >
                      <td className="px-6 py-4 font-semibold text-gray-900 align-top whitespace-nowrap">
                        {sp.vendor}
                      </td>
                      <td className="px-6 py-4 text-gray-600 align-top">{sp.purpose}</td>
                      <td className="px-6 py-4 text-gray-600 align-top">{sp.data}</td>
                      <td className="px-6 py-4 text-gray-600 align-top">{sp.location}</td>
                      <td className="px-6 py-4 text-gray-600 align-top">{sp.safeguard}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <p className="text-sm text-gray-500 mt-6 text-center">
            Questions about a specific vendor, or need this register as part of an executed DPA?{" "}
            <a href="mailto:legal@csoai.ai" className="text-blue-600 hover:text-blue-500 font-semibold">
              legal@csoai.ai
            </a>
          </p>
        </div>
      </div>

      {/* Security Pack */}
      <div id="security-pack" className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-20">
        <div className="container max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
              Security Pack
            </Badge>
            <h2 className="text-4xl font-bold mb-6">What&rsquo;s Public Today vs What&rsquo;s Shared Under NDA</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Everything in the first column is a real artifact you can open right now. Everything
              in the second column exists only where we say it does — and is shared under NDA on
              request. We do not list pen-test letters or certificates we cannot show you.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-8 bg-white/5 border-2 border-emerald-500/20">
              <h3 className="text-2xl font-bold text-emerald-300 mb-6">Public today</h3>
              <div className="space-y-5">
                {securityPackPublic.map((item, index) => (
                  <a key={index} href={item.href} className="block group">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-white group-hover:text-emerald-300 transition-colors">
                          {item.title}
                        </div>
                        <div className="text-sm text-gray-400">{item.description}</div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </Card>

            <Card className="p-8 bg-white/5 border-2 border-slate-600">
              <h3 className="text-2xl font-bold text-slate-200 mb-6">Shared under NDA</h3>
              <div className="space-y-5">
                {securityPackNda.map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Lock className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-gray-300">{item}</div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-400 mt-8">
                Request NDA materials via{" "}
                <a
                  href="mailto:security@csoai.ai"
                  className="text-blue-400 hover:text-blue-300 font-semibold"
                >
                  security@csoai.ai
                </a>
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* Incident Response & Uptime */}
      <div className="bg-gradient-to-br from-blue-900 via-slate-900 to-slate-800 text-white py-20">
        <div className="container max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-500/20 text-blue-300 border-blue-500/30">
              Operations
            </Badge>
            <h2 className="text-4xl font-bold mb-6">Monitoring & Incident Response</h2>
            <p className="text-xl text-gray-300">
              The figures below are design targets, marked as such. Live component status and the
              honest incident log are public at csoai.org/status.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold mb-6">Response SLA</h3>
              {incidentResponseDetails.slice(0, 3).map((item, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mt-1">
                    <Zap className="h-5 w-5 text-blue-300" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{item.metric}</h4>
                    <p className="text-gray-300 text-sm">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <h3 className="text-2xl font-bold mb-6">Availability</h3>
              {incidentResponseDetails.slice(3).map((item, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mt-1">
                    <Activity className="h-5 w-5 text-blue-300" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{item.metric}</h4>
                    <p className="text-gray-300 text-sm">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Communication Protocol */}
          <Card className="mt-12 p-8 bg-white/5 border-2 border-blue-500/20">
            <h3 className="text-2xl font-bold text-white mb-6">Incident Communication Protocol</h3>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-300 mb-2">1</div>
                <h4 className="font-semibold mb-2">Detection</h4>
                <p className="text-sm text-gray-300">Automated probes surface failures on /status</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-300 mb-2">2</div>
                <h4 className="font-semibold mb-2">Verification</h4>
                <p className="text-sm text-gray-300">Confirm incident and assess impact</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-300 mb-2">3</div>
                <h4 className="font-semibold mb-2">Notification</h4>
                <p className="text-sm text-gray-300">Notify affected users within 24 hours</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-300 mb-2">4</div>
                <h4 className="font-semibold mb-2">Resolution</h4>
                <p className="text-sm text-gray-300">Root cause analysis within 72 hours</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="container py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-slate-100 text-slate-600 border-slate-300">
              Common Questions
            </Badge>
            <h2 className="text-4xl font-bold mb-6">Security FAQ</h2>
            <p className="text-xl text-gray-600">
              Answers to common questions about CSOAI's security and compliance practices.
            </p>
          </div>

          <div className="space-y-4">
            {securityFAQs.map((faq) => (
              <Card
                key={faq.id}
                className="border-1 overflow-hidden cursor-pointer hover:border-slate-300 transition-colors"
                onClick={() => toggleAccordion(faq.id)}
              >
                <div className="p-6 flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="text-slate-600 mt-1">{faq.icon}</div>
                    <h3 className="text-lg font-bold text-gray-900 flex-1">{faq.title}</h3>
                  </div>
                  {expandedAccordion === faq.id ? (
                    <Minus className="h-5 w-5 text-slate-400 flex-shrink-0" />
                  ) : (
                    <Plus className="h-5 w-5 text-slate-400 flex-shrink-0" />
                  )}
                </div>

                {expandedAccordion === faq.id && (
                  <div className="px-6 pb-6 pt-0 border-t-1">
                    <p className="text-gray-600 leading-relaxed">{faq.content}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Security Contact Section */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-20">
        <div className="container max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-slate-700/50 text-slate-300 border-slate-600">
              Get in Touch
            </Badge>
            <h2 className="text-4xl font-bold mb-6">Security & Compliance Inquiries</h2>
            <p className="text-xl text-gray-300 mb-12">
              Have questions about our security practices, certifications, or compliance? Our security
              team is ready to help.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card className="p-8 bg-white/5 border-2 border-slate-600">
              <div className="flex items-center gap-3 mb-4">
                <Mail className="h-6 w-6 text-slate-300" />
                <h3 className="text-xl font-bold">Email Us</h3>
              </div>
              <p className="text-gray-300 mb-4">
                For detailed security questions and certification inquiries:
              </p>
              <a
                href="mailto:security@csoai.ai"
                className="text-blue-400 hover:text-blue-300 font-semibold break-all"
              >
                security@csoai.ai
              </a>
            </Card>

            <Card className="p-8 bg-white/5 border-2 border-slate-600">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-red-400" />
                <h3 className="text-xl font-bold">Security Report</h3>
              </div>
              <p className="text-gray-300 mb-4">
                Responsible disclosure of security vulnerabilities:
              </p>
              <a
                href="mailto:security@csoai.ai"
                className="text-blue-400 hover:text-blue-300 font-semibold"
              >
                Follow our responsible disclosure policy
              </a>
            </Card>
          </div>

          <Card className="p-8 bg-white/5 border-2 border-slate-600">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Shield className="h-6 w-6" />
              Privacy Questions
            </h3>
            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div>
                <h4 className="font-semibold text-slate-200 mb-2">Data Privacy Requests</h4>
                <p className="text-gray-300 text-sm mb-3">
                  GDPR data access, deletion, or portability requests
                </p>
                <a
                  href="mailto:privacy@csoai.ai"
                  className="text-blue-400 hover:text-blue-300 font-semibold"
                >
                  privacy@csoai.ai
                </a>
              </div>
              <div>
                <h4 className="font-semibold text-slate-200 mb-2">DPA & Compliance</h4>
                <p className="text-gray-300 text-sm mb-3">
                  Data Processing Agreements and compliance documentation
                </p>
                <a
                  href="mailto:legal@csoai.ai"
                  className="text-blue-400 hover:text-blue-300 font-semibold"
                >
                  legal@csoai.ai
                </a>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-white border-t-1 py-16">
        <div className="container max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Get measured</h2>
          <p className="text-xl text-gray-600 mb-8">
            Describe the system. Get a signed card. Not a certificate. We do not remediate. Verify stays free.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/assess">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Get measured
              </Button>
            </a>
            <a href="/gspc-verify">
              <Button size="lg" variant="outline">
                Verify a record
              </Button>
            </a>
          </div>
        </div>
      </div>

      <SpotInfographic title={L4.spotTitle} stats={L4.spotStats} source={L4.spotSource} />
      <FaqBlock title={L4.faqTitle} intro={L4.faqIntro} items={L4.faq} />

      {/* Footer Note */}
      <div className="bg-slate-50 border-t-1 py-8">
        <div className="container max-w-4xl mx-auto">
          <div className="text-center text-sm text-gray-600">
            <p>
              Last updated: July 2026. For the most current security and certification status,
              please contact security@csoai.ai. Certifications marked &ldquo;In Progress&rdquo; are
              being pursued; where a certification is held, it is verified by an accredited third-party auditor.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Icon component for FileText (if not available in lucide-react)
function FileText(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="12" y1="13" x2="12" y2="17"></line>
      <line x1="10" y1="15" x2="14" y2="15"></line>
    </svg>
  );
}

// Icon component for Users (if not available)
function Users(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  );
}
