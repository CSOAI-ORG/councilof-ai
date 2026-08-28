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
import CouncilOsInnerNav from '@/components/os/CouncilOsInnerNav';
import EnterpriseMeasureCta from '@/components/coliseum/EnterpriseMeasureCta';
import { openLobby } from '@/lib/lobbyLink';
import { POSITIONING } from '@/lib/positioning';

// FAQ Data — measurement body, not a certification shop
const faqData = [
  {
    question: "What frameworks does CSOAI cover?",
    answer: "Eunomia routes governance instruments across EU AI Act, NIST AI RMF, ISO 42001 control language, and TC260 — plus law, benchmarks, and compute. We measure and sign what happened; we do not issue ISO certificates or act as a notified body. Crosswalks show overlap so you reuse evidence, not rebuild it."
  },
  {
    question: "How does automated assessment work?",
    answer: "Scoped measurement runs against frozen, published instruments. Results land on a signed card (~3KB, Ed25519) you can re-check without an account. Live board counts stay on GET /api/gspc. Empty cells stay empty — we never invent a score to close a deal."
  },
  {
    question: "Is my data secure?",
    answer: "Enterprise engagements use encrypted transport and agreed residency. We do not train models on your systems. Measurement evidence is yours to hold; verify stays free."
  },
  {
    question: "Can I use CSOAI for ISO 42001 certification?",
    answer: "No — we are not a certification body and we do not speak for any auditor. We measure ISO-aligned controls and issue signed evidence your auditor (or insurer) can recompute. Gap analysis and documentation support that work; the certificate comes from them, not us."
  },
  {
    question: "What if measurement shows gaps?",
    answer: "You get a signed card with per-axis results, sample sizes, and intervals — then you choose who fixes. Per the firewall charter we never operate the fixer. Re-attest after remediation; the delta card is append-only history."
  },
  {
    question: "How does ongoing monitoring work?",
    answer: "Corpus-watch and scheduled re-measure keep evidence current as law and models move. Subscription tiers buy re-attest cadence and portfolio workspace — not a conformity badge that quietly goes stale."
  },
  {
    question: "What do we receive?",
    answer: "Signed measurement cards, executive summaries, technical axis detail, risk heat from measured cells only, and API/JSON export. No framework 'compliance certificates' from CSOAI — that would be a lie about our register."
  },
  {
    question: "How do we register multiple AI systems?",
    answer: "Enterprise workspace supports CSV/JSON bulk import and API. Each system gets its own measurement profile; batch re-attest keeps the portfolio honest without fusing scores."
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
      <CouncilOsInnerNav title="Enterprise" subtitle="Portfolio measurement — training loop, not certification" />
      {/* Hero Section - CISO Focused */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-white py-24">
        <div className="container max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-6 bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                For CISOs · insurers · boards — {POSITIONING.router.short} + {POSITIONING.harness.short}
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Prove how your AI behaves — before the €35M question lands.
              </h1>
              <p className="text-xl text-gray-300 leading-relaxed mb-4">
                {POSITIONING.subhead} Portfolio measurement across EU AI Act, NIST AI RMF, ISO 42001
                controls, and TC260 — signed cards you can re-check. Measurement, not certification.
              </p>
              <p className="text-sm text-gray-400 leading-relaxed mb-8">
                Embed signed verdicts under{" "}
                <Link href="/powered-by" className="text-emerald-300 underline hover:text-emerald-200">
                  Option A — Powered by Council OS
                </Link>
                ; white-label licensing stays in the opinion/measurement lane.
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
                  <div className="text-3xl font-bold text-emerald-400">14</div>
                  <div className="text-sm text-gray-300">Board slots, 13 measured</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-3xl font-bold text-emerald-400">Free</div>
                  <div className="text-sm text-gray-300">Verification, no account</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <EnterpriseMeasureCta label="Start measurement in Council OS" className="inline-flex items-center justify-center" />
                <Link href="/workspace">
                  <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    My systems workspace
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
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
                <h3 className="text-2xl font-bold text-white">Measurement portfolio</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-emerald-500/20 rounded-lg">
                  <span className="text-gray-200">EU AI Act instruments</span>
                  <Badge className="bg-emerald-500 text-white">MEASURED</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-emerald-500/20 rounded-lg">
                  <span className="text-gray-200">NIST AI RMF map</span>
                  <Badge className="bg-emerald-500 text-white">ROUTED</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-emerald-500/20 rounded-lg">
                  <span className="text-gray-200">ISO 42001 controls</span>
                  <Badge className="bg-emerald-500 text-white">EVIDENCE</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-yellow-500/20 rounded-lg">
                  <span className="text-gray-200">TC260</span>
                  <Badge className="bg-yellow-500 text-white">PARTIAL</Badge>
                </div>
                <div className="pt-4 border-t border-white/20">
                  <div className="text-sm text-gray-400 mb-2">GSPC board (live)</div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-white/10 rounded-full h-3">
                      <div className="bg-emerald-500 h-3 rounded-full" style={{ width: '93%' }}></div>
                    </div>
                    <span className="text-emerald-400 font-bold">13/14 measured</span>
                  </div>
                  <button
                    type="button"
                    className="mt-4 w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-500"
                    onClick={() => openLobby({ task: 'enterprise-start' })}
                  >
                    {POSITIONING.os.cta}
                  </button>
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
                  A designed multi-provider Council of AI evaluates your systems against selected compliance frameworks.
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
                  Council continuously monitors compliance status and alerts you to regulatory changes.
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
                <h3 className="font-bold text-lg mb-2">Signed cards & re-attest</h3>
                <p className="text-sm text-gray-600">
                  Hold Ed25519-signed measurement cards, export audit-ready evidence, and re-measure when the rules or the model move. No conformity badge from us.
                </p>
              </Card>
            </div>
          </div>
        </div>

        <div className="text-center mt-12 flex flex-wrap justify-center gap-3">
          <Link href="/enterprise-onboarding">
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Start portfolio measurement
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Button
            size="lg"
            variant="outline"
            className="border-emerald-600 text-emerald-700"
            onClick={() => openLobby({ task: 'enterprise-start' })}
          >
            {POSITIONING.os.cta}
          </Button>
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
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200">Transparency live 2 Aug 2026 · high-risk deferred to 2 Dec 2027</Badge>
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
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Measured evidence</Badge>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                Control-language measurement and gap evidence your auditor can recompute. We prepare the signed record — we do not issue the certificate.
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
                  <div className="text-2xl font-bold text-orange-600">Real-time</di