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

interface AccordionItem {
  id: string;
  title: string;
  content: string;
  icon: React.ReactNode;
}

interface CertificationItem {
  name: string;
  icon: React.ReactNode;
  status: "Certified" | "Compliant";
  description: string;
}

export default function TrustCenter() {
  const [expandedAccordion, setExpandedAccordion] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("certifications");

  const certifications: CertificationItem[] = [
    {
      name: "ISO 27001",
      icon: <Shield className="h-8 w-8" />,
      status: "Certified",
      description: "Information Security Management System",
    },
    {
      name: "ISO 42001",
      icon: <Cpu className="h-8 w-8" />,
      status: "Certified",
      description: "AI Management System",
    },
    {
      name: "SOC 2 Type II",
      icon: <Lock className="h-8 w-8" />,
      status: "Certified",
      description: "Security, Availability, and Confidentiality",
    },
    {
      name: "GDPR Compliant",
      icon: <Globe className="h-8 w-8" />,
      status: "Compliant",
      description: "European Data Protection Regulation",
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
      description: "Choose storage location: EU (Frankfurt), US (us-east-1), or APAC (Singapore)",
      icon: <MapPin className="h-6 w-6" />,
    },
    {
      title: "Data Retention",
      description: "Configurable retention policies with automatic deletion after specified periods",
      icon: <RotateCcw className="h-6 w-6" />,
    },
    {
      title: "Right to Erasure",
      description: "Full compliance with GDPR Article 17 - instant data deletion upon request",
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
        "Multi-region deployment across AWS and Azure with automatic failover and disaster recovery",
      detail: "99.99% SLA | Redundant infrastructure | Real-time replication",
    },
    {
      title: "DDoS Protection",
      description: "Enterprise-grade DDoS mitigation with AWS Shield Advanced",
      detail: "Automatic traffic filtering | Layer 3-7 protection | 24/7 monitoring",
    },
    {
      title: "Web Application Firewall",
      description: "AWS WAF deployed on all public endpoints to block malicious requests",
      detail: "Custom rules | IP reputation lists | Rate limiting",
    },
    {
      title: "Penetration Testing",
      description: "Regular security assessments by third-party security firms",
      detail: "Quarterly assessments | Red team exercises | Vulnerability remediation",
    },
    {
      title: "Bug Bounty Program",
      description:
        "Open bug bounty program with competitive rewards for responsible disclosure",
      detail: "Hosted on HackerOne | Up to $50,000 rewards | 90-day disclosure policy",
    },
    {
      title: "Incident Response",
      description: "24/7 security operations center with incident response protocols",
      detail: "15-minute detection | 1-hour containment | Root cause analysis",
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
        "We use AES-256 for data at rest and TLS 1.3 for data in transit. All encryption keys are managed through AWS KMS with regular rotation. We also support customer-managed keys (CMK) for enterprise clients who require additional key management control.",
      icon: <Lock className="h-5 w-5" />,
    },
    {
      id: "compliance-list",
      title: "What compliance certifications do you have?",
      content:
        "CSOAI maintains ISO 27001 (Information Security), ISO 42001 (AI Management System), SOC 2 Type II (Security, Availability, Confidentiality), and is fully GDPR compliant. We also comply with CCPA, HIPAA (for health data), and industry-specific regulations. Certification details and audit reports are available upon request under NDA.",
      icon: <Award className="h-5 w-5" />,
    },
    {
      id: "data-location",
      title: "Where is my data stored?",
      content:
        "You can choose your data residency location during account setup: EU (Frankfurt), US (us-east-1), or APAC (Singapore). Data is always encrypted and never replicated across regions without explicit permission. We maintain separate infrastructure per region to ensure compliance with local data protection laws.",
      icon: <MapPin className="h-5 w-5" />,
    },
    {
      id: "incident-response",
      title: "What is your incident response process?",
      content:
        "We maintain 24/7 security monitoring with automated threat detection. In case of a security incident: (1) Detection and containment within 15 minutes, (2) Notification to affected users within 24 hours, (3) Root cause analysis within 72 hours, (4) Public incident report within 30 days. We also maintain cyber insurance coverage.",
      icon: <AlertTriangle className="h-5 w-5" />,
    },
    {
      id: "penetration-testing",
      title: "How often do you conduct security assessments?",
      content:
        "We conduct quarterly external penetration testing by certified third-party security firms. Additionally, we perform monthly internal security audits and continuous vulnerability scanning. Red team exercises are conducted bi-annually. All findings are tracked in our vulnerability management system with SLA-based remediation timelines.",
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
        "Our main sub-processors include: AWS (cloud infrastructure), Auth0 (authentication), Stripe (payments), SendGrid (email), Datadog (monitoring), and CrowdStrike (endpoint protection). A complete list with processing purposes is available at csoai.ai/sub-processors. We notify customers 30 days before adding any new processor.",
      icon: <Users className="h-5 w-5" />,
    },
    {
      id: "uptime",
      title: "What is your uptime guarantee?",
      content:
        "We maintain a 99.99% uptime SLA (52 minutes of acceptable downtime per year). Historical uptime for the past 12 months is 99.97%. We use multi-region deployment, automatic failover, and load balancing to ensure service availability. Service status and incident history are publicly visible at status.csoai.ai.",
      icon: <Activity className="h-5 w-5" />,
    },
  ];

  const incidentResponseDetails = [
    {
      metric: "24/7 Monitoring",
      description: "Continuous security monitoring with AI-powered threat detection",
    },
    {
      metric: "15-Minute Detection",
      description: "Average time to detect and confirm security incidents",
    },
    {
      metric: "1-Hour Containment",
      description: "Target time to contain and isolate affected systems",
    },
    {
      metric: "24-Hour Notification",
      description: "Maximum time to notify affected users of security incidents",
    },
    {
      metric: "99.99% Uptime",
      description: "Historical uptime SLA for platform availability",
    },
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
            CSOAI is built on security, transparency, and compliance. We're independently certified
            and audited to ensure your data and AI systems are protected by the highest industry
            standards.
          </p>
          <p className="text-lg text-gray-400 leading-relaxed">
            From encryption to incident response, from ISO certifications to compliance frameworks—we
            take security seriously so you don't have to.
          </p>
        </div>
      </div>

      {/* Security Certifications */}
      <div className="container py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-50 text-blue-600 border-blue-200">Certifications</Badge>
            <h2 className="text-4xl font-bold mb-6">Industry-Leading Certifications</h2>
            <p className="text-xl text-gray-600">
              CSOAI maintains the highest level of security and compliance certifications, verified by
              independent auditors.
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
              Your data is protected with military-grade encryption and compliance with global data
              protection regulations.
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

          {/* Data Residency Details */}
          <Card className="mt-12 p-8 bg-white border-2 border-emerald-100">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <MapPin className="h-6 w-6 text-emerald-600" />
              Data Residency Options
            </h3>
            <div className="grid md:grid-cols-3 gap-6 mt-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-bold text-blue-900 mb-2">EU Region</h4>
                <p className="text-sm text-blue-700">Frankfurt, Germany - GDPR optimized</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-lg">
                <h4 className="font-bold text-amber-900 mb-2">US Region</h4>
                <p className="text-sm text-amber-700">us-east-1, Virginia - Lowest latency for Americas</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <h4 className="font-bold text-purple-900 mb-2">APAC Region</h4>
                <p className="text-sm text-purple-700">Singapore - Optimized for Asia-Pacific</p>
              </div>
            </div>
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
              <Button variant="outline" className="justify-start gap-2 h-auto py-3">
                <Book className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-semibold">Privacy Policy</div>
                  <div className="text-xs text-gray-600">View our complete privacy policy</div>
                </div>
              </Button>
              <Button variant="outline" className="justify-start gap-2 h-auto py-3">
                <Eye className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-semibold">Cookie Policy</div>
                  <div className="text-xs text-gray-600">Manage your cookie preferences</div>
                </div>
              </Button>
              <Button variant="outline" className="justify-start gap-2 h-auto py-3">
                <FileText className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-semibold">DPA Template</div>
                  <div className="text-xs text-gray-600">Standard Data Processing Agreement</div>
                </div>
              </Button>
              <Button variant="outline" className="justify-start gap-2 h-auto py-3">
                <Users className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-semibold">Sub-processor List</div>
                  <div className="text-xs text-gray-600">View all third-party processors</div>
                </div>
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Incident Response & Uptime */}
      <div className="bg-gradient-to-br from-blue-900 via-slate-900 to-slate-800 text-white py-20">
        <div className="container max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-500/20 text-blue-300 border-blue-500/30">
              Operations
            </Badge>
            <h2 className="text-4xl font-bold mb-6">24/7 Monitoring & Incident Response</h2>
            <p className="text-xl text-gray-300">
              Our security operations center provides round-the-clock monitoring and rapid response to
              any security events.
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
                <p className="text-sm text-gray-300">Automated threat detection within 15 minutes</p>
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
          <h2 className="text-3xl font-bold mb-4">Ready to Build With Confidence?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Deploy AI systems on a platform designed with security and compliance from day one.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline">
              Schedule Security Review
            </Button>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="bg-slate-50 border-t-1 py-8">
        <div className="container max-w-4xl mx-auto">
          <div className="text-center text-sm text-gray-600">
            <p>
              Last updated: February 2026. For the most current security information and certifications,
              please contact security@csoai.ai. CSOAI's security certifications are independently
              verified by accredited third-party auditors.
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
