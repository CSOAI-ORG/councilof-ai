/**
 * Enterprise Landing Page
 * Targeting CISOs and compliance teams with comprehensive AI compliance solutions
 */

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Zap,
  Building2,
  ArrowRight,
  AlertCircle,
  ClipboardCheck,
  Eye,
  Award,
  Globe,
  Server,
  FileText,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Lock,
  BarChart3,
  Upload,
  Repeat,
  HelpCircle,
  BookOpen,
  Users,
  Calendar
} from 'lucide-react';
import { Link } from 'wouter';

// FAQ Data
const faqData = [
  {
    question: "What frameworks does CSOAI cover?",
    answer: "CSOAI provides comprehensive coverage for EU AI Act compliance, NIST AI RMF alignment, ISO 42001 certification support, and TC260 (China's AI governance standard). Our platform also offers cross-framework mapping, allowing you to see how compliance in one framework translates to others."
  },
  {
    question: "How does automated assessment work?",
    answer: "Our 33-Agent Byzantine Council uses 12 different AI providers to independently assess your AI systems. Each agent evaluates your system against the selected frameworks, and consensus is reached through Byzantine fault-tolerant voting. This ensures unbiased, accurate assessments without single-vendor conflicts of interest."
  },
  {
    question: "Is my data secure?",
    answer: "Absolutely. CSOAI employs enterprise-grade security including end-to-end encryption, SOC 2 Type II compliance, and data residency options for EU and US. Your AI system documentation never leaves our secure infrastructure, and we never use your data to train models."
  },
  {
    question: "Can I use CSOAI for ISO 42001 certification?",
    answer: "Yes. CSOAI provides complete ISO 42001 certification support including gap analysis, documentation templates, control implementation guidance, and audit preparation. Our platform generates certification-ready documentation that auditors accept."
  },
  {
    question: "What happens if we fail compliance?",
    answer: "If your AI system doesn't meet compliance requirements, our platform provides detailed remediation recommendations prioritized by risk level. You'll receive specific action items, implementation guidance, and the ability to re-assess once changes are made. Our goal is to help you achieve compliance, not just identify gaps."
  },
  {
    question: "How does the Byzantine Council monitor us?",
    answer: "After initial assessment, the Byzantine Council performs continuous monitoring based on your subscription tier. This includes periodic re-assessments, real-time alerts for regulatory changes affecting your systems, and proactive notifications when your systems may be drifting out of compliance."
  },
  {
    question: "What reports do we receive?",
    answer: "You receive comprehensive compliance reports including executive summaries for leadership, detailed technical reports for your team, framework-specific compliance certificates, risk heat maps, and audit-ready documentation. Reports can be exported in PDF, JSON, or integrated directly via API."
  },
  {
    question: "How do we register multiple AI systems?",
    answer: "Enterprise customers can use our bulk import feature via CSV/JSON upload or API integration. Each AI system gets its own compliance profile, but you can manage them collectively through our dashboard. System grouping, tagging, and batch operations make managing large portfolios efficient."
  }
];

export default function Enterprise() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-white py-24">
          <div className="container max-w-6xl space-y-4">
            <Skeleton className="h-8 w-48 bg-white/10" />
            <Skeleton className="h-16 w-full bg-white/10" />
            <Skeleton className="h-24 w-3/4 bg-white/10" />
          </div>
        </div>
        <div className="container py-20 space-y-12">
          <Skeleton className="h-96 w-full" />
          <div className="grid md:grid-cols-3 gap-8">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <Card className="p-8 max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Failed to Load Content</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - CISO Focused */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-white py-24">
        <div className="container max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-6 bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                For CISOs & Compliance Teams
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Avoid €35M Fines. Ensure AI Compliance Across Every Framework.
              </h1>
              <p className="text-xl text-gray-300 leading-relaxed mb-8">
                The EU AI Act is here with fines up to €35M or 7% of global revenue. CSOAI's Byzantine Council
                automates compliance across EU AI Act, NIST AI RMF, ISO 42001, and TC260—all from one platform.
              </p>

              {/* Key Stats */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-3xl font-bold text-emerald-400">€35M</div>
                  <div className="text-sm text-gray-300">Max EU AI Act Fine</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-3xl font-bold text-emerald-400">4+</div>
                  <div className="text-sm text-gray-300">Frameworks Supported</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-3xl font-bold text-emerald-400">33</div>
                  <div className="text-sm text-gray-300">AI Agents in Council</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-3xl font-bold text-emerald-400">87%</div>
                  <div className="text-sm text-gray-300">Cost Reduction</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/enterprise-onboarding">
                  <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    Request Demo
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                    View Pricing
                  </Button>
                </Link>
              </div>
            </div>

            <Card className="p-8 bg-white/10 backdrop-blur-sm border-white/20">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="h-8 w-8 text-emerald-400" />
                <h3 className="text-2xl font-bold text-white">Compliance Dashboard</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-emerald-500/20 rounded-lg">
                  <span className="text-gray-200">EU AI Act</span>
                  <Badge className="bg-emerald-500 text-white">Compliant</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-emerald-500/20 rounded-lg">
                  <span className="text-gray-200">NIST AI RMF</span>
                  <Badge className="bg-emerald-500 text-white">Aligned</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-emerald-500/20 rounded-lg">
                  <span className="text-gray-200">ISO 42001</span>
                  <Badge className="bg-emerald-500 text-white">Certified</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-yellow-500/20 rounded-lg">
                  <span className="text-gray-200">TC260</span>
                  <Badge className="bg-yellow-500 text-white">In Progress</Badge>
                </div>
                <div className="pt-4 border-t border-white/20">
                  <div className="text-sm text-gray-400 mb-2">Overall Risk Score</div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-white/10 rounded-full h-3">
                      <div className="bg-emerald-500 h-3 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                    <span className="text-emerald-400 font-bold">85/100</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="container py-20 max-w-6xl">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-emerald-50 text-emerald-600 border-emerald-200">How It Works</Badge>
          <h2 className="text-4xl font-bold mb-4">Enterprise AI Compliance in 5 Steps</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From registration to certification, CSOAI guides your organization through every step of AI compliance.
          </p>
        </div>

        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-24 left-[10%] right-[10%] h-1 bg-gradient-to-r from-emerald-200 via-emerald-400 to-emerald-200 rounded-full" />

          <div className="grid md:grid-cols-5 gap-6">
            {/* Step 1 */}
            <div className="relative">
              <Card className="p-6 text-center h-full border-2 border-emerald-100 hover:border-emerald-300 transition-colors">
                <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold relative z-10">
                  1
                </div>
                <ClipboardCheck className="h-10 w-10 text-emerald-600 mx-auto mb-3" />
                <h3 className="font-bold text-lg mb-2">Register AI Systems</h3>
                <p className="text-sm text-gray-600">
                  Import your AI systems via dashboard, CSV, or API. Define system purpose, risk level, and data flows.
                </p>
              </Card>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <Card className="p-6 text-center h-full border-2 border-emerald-100 hover:border-emerald-300 transition-colors">
                <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold relative z-10">
                  2
                </div>
                <Zap className="h-10 w-10 text-emerald-600 mx-auto mb-3" />
                <h3 className="font-bold text-lg mb-2">Automated Assessment</h3>
                <p className="text-sm text-gray-600">
                  33-Agent Byzantine Council evaluates your systems against selected compliance frameworks.
                </p>
              </Card>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <Card className="p-6 text-center h-full border-2 border-emerald-100 hover:border-emerald-300 transition-colors">
                <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold relative z-10">
                  3
                </div>
                <FileText className="h-10 w-10 text-emerald-600 mx-auto mb-3" />
                <h3 className="font-bold text-lg mb-2">Get Recommendations</h3>
                <p className="text-sm text-gray-600">
                  Receive prioritized action items, remediation guidance, and implementation templates.
                </p>
              </Card>
            </div>

            {/* Step 4 */}
            <div className="relative">
              <Card className="p-6 text-center h-full border-2 border-emerald-100 hover:border-emerald-300 transition-colors">
                <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold relative z-10">
                  4
                </div>
                <Eye className="h-10 w-10 text-emerald-600 mx-auto mb-3" />
                <h3 className="font-bold text-lg mb-2">Ongoing Monitoring</h3>
                <p className="text-sm text-gray-600">
                  Byzantine Council continuously monitors compliance status and alerts you to regulatory changes.
                </p>
              </Card>
            </div>

            {/* Step 5 */}
            <div className="relative">
              <Card className="p-6 text-center h-full border-2 border-emerald-100 hover:border-emerald-300 transition-colors">
                <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold relative z-10">
                  5
                </div>
                <Award className="h-10 w-10 text-emerald-600 mx-auto mb-3" />
                <h3 className="font-bold text-lg mb-2">Certification & Badges</h3>
                <p className="text-sm text-gray-600">
                  Earn compliance badges, generate audit-ready reports, and showcase your commitment to AI safety.
                </p>
              </Card>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <Link href="/enterprise-onboarding">
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Start Your Compliance Journey
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Multi-Framework Coverage */}
      <div className="bg-gradient-to-br from-slate-50 to-emerald-50 py-20">
        <div className="container max-w-6xl">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-emerald-50 text-emerald-600 border-emerald-200">Global Coverage</Badge>
            <h2 className="text-4xl font-bold mb-4">One Platform, Every Framework</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Stop managing multiple compliance tools. CSOAI covers all major AI governance frameworks with intelligent cross-framework mapping.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* EU AI Act */}
            <Card className="p-8 border-2 border-blue-200 hover:border-blue-400 transition-colors">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Globe className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">EU AI Act</h3>
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200">Required by 2025</Badge>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                Complete compliance coverage for Europe's landmark AI regulation. Risk classification, conformity assessments, and documentation.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Risk level classification
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Conformity assessment
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Technical documentation
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Transparency requirements
                </li>
              </ul>
            </Card>

            {/* NIST AI RMF */}
            <Card className="p-8 border-2 border-purple-200 hover:border-purple-400 transition-colors">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Shield className="h-8 w-8 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">NIST AI RMF</h3>
                  <Badge className="bg-purple-100 text-purple-700 border-purple-200">US Standard</Badge>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                Align with the US National Institute of Standards and Technology's AI Risk Management Framework for federal contracts and best practices.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  GOVERN function mapping
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  MAP function analysis
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  MEASURE assessments
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  MANAGE recommendations
                </li>
              </ul>
            </Card>

            {/* ISO 42001 */}
            <Card className="p-8 border-2 border-emerald-200 hover:border-emerald-400 transition-colors">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-emerald-100 rounded-xl">
                  <Award className="h-8 w-8 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">ISO 42001</h3>
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Certification</Badge>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                Full support for AI Management System certification. Gap analysis, control implementation, and audit preparation.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Gap analysis reports
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Control implementation
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Documentation templates
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Audit preparation
                </li>
              </ul>
            </Card>

            {/* TC260 */}
            <Card className="p-8 border-2 border-red-200 hover:border-red-400 transition-colors">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-red-100 rounded-xl">
                  <FileCheck className="h-8 w-8 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">TC260</h3>
                  <Badge className="bg-red-100 text-red-700 border-red-200">China Standard</Badge>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                Coverage for China's National Information Security Standardization Technical Committee AI governance requirements.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Security assessments
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Data governance
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Algorithm auditing
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Compliance reporting
                </li>
              </ul>
            </Card>

            {/* Cross-Framework Mapping */}
            <Card className="p-8 border-2 border-orange-200 hover:border-orange-400 transition-colors md:col-span-2 lg:col-span-2">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-orange-100 rounded-xl">
                  <RefreshCw className="h-8 w-8 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Cross-Framework Mapping</h3>
                  <Badge className="bg-orange-100 text-orange-700 border-orange-200">Intelligent Sync</Badge>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                CSOAI automatically maps compliance requirements across frameworks. Meet EU AI Act requirements and see how they align with NIST, ISO, and TC260—reducing duplicate work and ensuring consistent governance.
              </p>
              <div className="grid md:grid-cols-3 gap-4 mt-6">
                <div className="bg-orange-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-orange-600">85%</div>
                  <div className="text-sm text-gray-600">Requirement Overlap</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-orange-600">1 Assessment</div>
                  <div className="text-sm text-gray-600">Multiple Frameworks</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-orange-600">Real-time</div>
                  <div className="text-sm text-gray-600">Sync Updates</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Integration Section */}
      <div className="container py-20 max-w-6xl">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-emerald-50 text-emerald-600 border-emerald-200">Enterprise Integration</Badge>
          <h2 className="text-4xl font-bold mb-4">Built for Enterprise Workflows</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Seamlessly integrate AI compliance into your existing infrastructure with our enterprise-grade tools.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* API Access */}
          <Card className="p-8 border-2 border-slate-200 hover:border-emerald-300 transition-colors">
            <Server className="h-12 w-12 text-emerald-600 mb-4" />
            <h3 className="text-2xl font-bold mb-3">API Access</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              RESTful API with comprehensive documentation. Integrate compliance checks directly into your CI/CD pipeline, automate assessments, and retrieve reports programmatically.
            </p>
            <div className="bg-slate-900 text-emerald-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
              <code>POST /api/v1/assessments</code><br />
              <code>GET /api/v1/systems/:id/compliance</code><br />
              <code>GET /api/v1/reports/export</code>
            </div>
            <Link href="/api-docs">
              <Button variant="outline" className="mt-4">
                View API Docs
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </Card>

          {/* Bulk Import */}
          <Card className="p-8 border-2 border-slate-200 hover:border-emerald-300 transition-colors">
            <Upload className="h-12 w-12 text-emerald-600 mb-4" />
            <h3 className="text-2xl font-bold mb-3">Bulk Import</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Import hundreds of AI systems at once via CSV, JSON, or direct database integration. Template files provided for easy migration from spreadsheets or other compliance tools.
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="outline">CSV Import</Badge>
              <Badge variant="outline">JSON Upload</Badge>
              <Badge variant="outline">Database Sync</Badge>
              <Badge variant="outline">CMDB Integration</Badge>
            </div>
            <p className="text-sm text-gray-500">
              Supports custom field mapping and validation rules for enterprise data structures.
            </p>
          </Card>

          {/* Automated Reporting */}
          <Card className="p-8 border-2 border-slate-200 hover:border-emerald-300 transition-colors">
            <BarChart3 className="h-12 w-12 text-emerald-600 mb-4" />
            <h3 className="text-2xl font-bold mb-3">Automated Reporting</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Schedule compliance reports to be generated and delivered automatically. Executive summaries, detailed technical reports, and audit documentation—all on your timeline.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                PDF, JSON, and CSV export formats
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Email, Slack, and webhook delivery
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Custom report templates
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Scheduled and on-demand generation
              </li>
            </ul>
          </Card>

          {/* PDCA Cycle Management */}
          <Card className="p-8 border-2 border-slate-200 hover:border-emerald-300 transition-colors">
            <Repeat className="h-12 w-12 text-emerald-600 mb-4" />
            <h3 className="text-2xl font-bold mb-3">PDCA Cycle Management</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Built-in Plan-Do-Check-Act workflow management for continuous compliance improvement. Track remediation tasks, measure progress, and demonstrate ongoing governance.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 p-3 rounded-lg text-center">
                <div className="font-bold text-blue-700">Plan</div>
                <div className="text-xs text-gray-600">Define objectives</div>
              </div>
              <div className="bg-emerald-50 p-3 rounded-lg text-center">
                <div className="font-bold text-emerald-700">Do</div>
                <div className="text-xs text-gray-600">Implement changes</div>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg text-center">
                <div className="font-bold text-orange-700">Check</div>
                <div className="text-xs text-gray-600">Monitor results</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg text-center">
                <div className="font-bold text-purple-700">Act</div>
                <div className="text-xs text-gray-600">Standardize success</div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="bg-gradient-to-br from-slate-50 to-emerald-50 py-20">
        <div className="container max-w-6xl">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-emerald-50 text-emerald-600 border-emerald-200">Pricing</Badge>
            <h2 className="text-4xl font-bold mb-4">Transparent, Predictable Pricing</h2>
            <p className="text-xl text-gray-600">
              No hidden fees. No per-user charges. Scale your AI compliance confidently.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Starter Tier */}
            <Card className="p-8 border-2 border-gray-200 bg-white">
              <h3 className="text-2xl font-bold mb-2">Starter</h3>
              <div className="text-4xl font-bold mb-2">$2,000<span className="text-lg text-gray-500 font-normal">/system/year</span></div>
              <p className="text-gray-600 mb-6">Perfect for startups and small teams beginning their compliance journey.</p>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>Up to 10 AI systems</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>33-Agent Council assessments</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>EU AI Act + NIST coverage</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>Quarterly compliance reports</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>Email support</span>
                </li>
              </ul>

              <Link href="/enterprise-onboarding">
                <Button className="w-full" variant="outline">Get Started</Button>
              </Link>
            </Card>

            {/* Professional Tier */}
            <Card className="p-8 border-4 border-emerald-500 bg-white relative">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white">
                Most Popular
              </Badge>
              <h3 className="text-2xl font-bold mb-2">Professional</h3>
              <div className="text-4xl font-bold mb-2">$1,500<span className="text-lg text-gray-500 font-normal">/system/year</span></div>
              <p className="text-gray-600 mb-6">For growing companies scaling their AI portfolio.</p>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>Up to 50 AI systems</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>Everything in Starter</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>All frameworks (ISO, TC260)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>Monthly reports + API access</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>Bulk import tools</span>
                </li>
              </ul>

              <Link href="/enterprise-onboarding">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">Get Started</Button>
              </Link>
            </Card>

            {/* Enterprise Tier */}
            <Card className="p-8 border-2 border-gray-200 bg-white">
              <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
              <div className="text-4xl font-bold mb-2">Custom</div>
              <p className="text-gray-600 mb-6">For large organizations with complex compliance needs.</p>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>Unlimited AI systems</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>Everything in Professional</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>Real-time monitoring</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>Dedicated account manager</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>Custom SLAs & integrations</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>On-premise deployment option</span>
                </li>
              </ul>

              <Link href="/enterprise-onboarding">
                <Button className="w-full" variant="outline">Contact Sales</Button>
              </Link>
            </Card>
          </div>

          <div className="text-center mt-8">
            <Link href="/pricing" className="text-emerald-600 hover:text-emerald-700 font-medium">
              View detailed pricing comparison
              <ArrowRight className="inline ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Case Studies Section */}
      <div className="container py-20 max-w-6xl">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-emerald-50 text-emerald-600 border-emerald-200">Case Studies</Badge>
          <h2 className="text-4xl font-bold mb-4">Trusted by Leading Enterprises</h2>
          <p className="text-xl text-gray-600">
            See how organizations across industries achieve AI compliance with CSOAI.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Financial Services Case Study */}
          <Card className="p-8 border-2 border-emerald-100 hover:border-emerald-300 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-emerald-100 rounded-xl">
                <Building2 className="h-8 w-8 text-emerald-600" />
              </div>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Financial Services</Badge>
            </div>
            <h3 className="text-xl font-bold mb-3">Global Bank Achieves EU AI Act Compliance</h3>
            <p className="text-gray-600 mb-4">
              Fortune 500 bank with 47 AI systems reduced compliance costs by 74% while achieving full regulatory compliance.
            </p>
            <div className="flex justify-between text-center pt-4 border-t border-gray-100">
              <div>
                <div className="text-2xl font-bold text-emerald-600">$2.3M</div>
                <div className="text-xs text-gray-500">Annual Savings</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-600">6 weeks</div>
                <div className="text-xs text-gray-500">Faster Reviews</div>
              </div>
            </div>
            <Button variant="link" className="mt-4 p-0 text-emerald-600">
              Read Case Study
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Card>

          {/* Healthcare Case Study */}
          <Card className="p-8 border-2 border-blue-100 hover:border-blue-300 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Zap className="h-8 w-8 text-blue-600" />
              </div>
              <Badge className="bg-blue-50 text-blue-700 border-blue-200">Healthcare Tech</Badge>
            </div>
            <h3 className="text-xl font-bold mb-3">MedTech Startup Earns ISO 42001</h3>
            <p className="text-gray-600 mb-4">
              Medical AI startup achieved ISO 42001 certification in 3 months—6 months faster than traditional consulting.
            </p>
            <div className="flex justify-between text-center pt-4 border-t border-gray-100">
              <div>
                <div className="text-2xl font-bold text-blue-600">$135K</div>
                <div className="text-xs text-gray-500">Consulting Saved</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">3 months</div>
                <div className="text-xs text-gray-500">To Certification</div>
              </div>
            </div>
            <Button variant="link" className="mt-4 p-0 text-blue-600">
              Read Case Study
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Card>

          {/* SaaS Case Study */}
          <Card className="p-8 border-2 border-purple-100 hover:border-purple-300 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <Badge className="bg-purple-50 text-purple-700 border-purple-200">Enterprise SaaS</Badge>
            </div>
            <h3 className="text-xl font-bold mb-3">SaaS Platform Scales AI 10x</h3>
            <p className="text-gray-600 mb-4">
              B2B SaaS company scaled from 5 to 50 AI features with automated compliance checks via API integration.
            </p>
            <div className="flex justify-between text-center pt-4 border-t border-gray-100">
              <div>
                <div className="text-2xl font-bold text-purple-600">10x</div>
                <div className="text-xs text-gray-500">AI Features</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">2 hours</div>
                <div className="text-xs text-gray-500">Per Assessment</div>
              </div>
            </div>
            <Button variant="link" className="mt-4 p-0 text-purple-600">
              Read Case Study
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Card>
        </div>

        {/* More Case Studies Coming */}
        <Card className="mt-8 p-8 bg-slate-50 border-2 border-dashed border-slate-300 text-center">
          <BookOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2 text-slate-700">More Case Studies Coming Soon</h3>
          <p className="text-gray-600 mb-4">
            We're documenting success stories from retail, manufacturing, government, and more sectors.
          </p>
          <Link href="/enterprise-onboarding">
            <Button variant="outline">
              Become a Case Study
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </Card>
      </div>

      {/* FAQ Section */}
      <div className="bg-gradient-to-br from-slate-50 to-emerald-50 py-20">
        <div className="container max-w-4xl">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-emerald-50 text-emerald-600 border-emerald-200">FAQ</Badge>
            <h2 className="text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about CSOAI enterprise solutions.
            </p>
          </div>

          <div className="space-y-4">
            {faqData.map((faq, index) => (
              <Card
                key={index}
                className={`overflow-hidden transition-all duration-200 ${
                  expandedFaq === index ? 'border-emerald-300 shadow-md' : 'border-gray-200'
                }`}
              >
                <button
                  className="w-full p-6 text-left flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
                  onClick={() => toggleFaq(index)}
                  aria-expanded={expandedFaq === index}
                >
                  <div className="flex items-center gap-3">
                    <HelpCircle className={`h-5 w-5 flex-shrink-0 ${
                      expandedFaq === index ? 'text-emerald-600' : 'text-gray-400'
                    }`} />
                    <span className="font-semibold text-lg">{faq.question}</span>
                  </div>
                  {expandedFaq === index ? (
                    <ChevronUp className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                {expandedFaq === index && (
                  <div className="px-6 pb-6 pt-0">
                    <div className="pl-8 text-gray-600 leading-relaxed border-l-2 border-emerald-200">
                      {faq.answer}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">Still have questions?</p>
            <Link href="/enterprise-onboarding">
              <Button variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50">
                Contact Our Team
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-white py-24">
        <div className="container max-w-4xl text-center">
          <Lock className="h-16 w-16 text-emerald-400 mx-auto mb-6" />
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Secure Your AI Compliance Today
          </h2>
          <p className="text-xl text-gray-300 mb-8 leading-relaxed max-w-2xl mx-auto">
            Don't wait for regulatory deadlines. Join hundreds of enterprises using CSOAI to stay ahead of AI governance requirements while reducing costs by up to 87%.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/enterprise-onboarding">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8">
                Request Demo
                <Calendar className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/enterprise-onboarding">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-white/20">
            <div>
              <div className="text-3xl font-bold text-emerald-400">500+</div>
              <div className="text-sm text-gray-400">AI Systems Monitored</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-emerald-400">99.9%</div>
              <div className="text-sm text-gray-400">Uptime SLA</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-emerald-400">SOC 2</div>
              <div className="text-sm text-gray-400">Type II Certified</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-emerald-400">24/7</div>
              <div className="text-sm text-gray-400">Enterprise Support</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
