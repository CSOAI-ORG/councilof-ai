/**
 * CSOAI Partnership Charter Page
 *
 * 52 Articles + 13 Schedules
 * The complete framework for AI safety, prosperity, and partnership.
 */

import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  Heart,
  Shield,
  Users,
  Scale,
  Brain,
  FileText,
  DollarSign,
  Globe2,
  Building2,
  Gavel,
  BookOpen,
  Download,
  ArrowRight,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Scroll,
  Vote,
  Landmark,
  RefreshCw,
  Lock,
  Eye,
  Award,
  Crown,
  AlertTriangle,
  Settings,
  Layers
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const charterSections = [
  {
    part: "I",
    title: "Foundational Principles",
    articles: "Articles 1-8",
    icon: Heart,
    color: "bg-emerald-100 text-emerald-600",
    borderColor: "border-emerald-200",
    description: "The philosophical and ethical foundation of CSOAI",
    items: [
      { num: 1, title: "The Maternal Covenant", desc: "Foundational relationship between humanity and AI", highlight: true },
      { num: 2, title: "Provable Safety Requirements", desc: "Mathematical and empirical safety standards" },
      { num: 3, title: "Byzantine Council Oversight", desc: "33-agent AI-to-AI monitoring architecture" },
      { num: 4, title: "Value Uncertainty Principles", desc: "Handling moral and ethical uncertainty" },
      { num: 5, title: "Constitutional AI Principles", desc: "Core values embedded in AI systems" },
      { num: 6, title: "Consciousness Preparedness", desc: "Protocols for potential AI consciousness" },
      { num: 7, title: "Cooperative AI Framework", desc: "Multi-agent coordination principles" },
      { num: 8, title: "The Prosperity Covenant", desc: "Economic redistribution and UBI framework", highlight: true },
    ]
  },
  {
    part: "II",
    title: "Governance Structure",
    articles: "Articles 9-18",
    icon: Building2,
    color: "bg-green-100 text-green-600",
    borderColor: "border-green-200",
    description: "How CSOAI operates and makes decisions",
    items: [
      { num: 9, title: "Founding Principles & Definitions", desc: "Core terminology and interpretive principles" },
      { num: 10, title: "Licensing Framework", desc: "Tiered licensing system and requirements" },
      { num: 11, title: "Byzantine Council Specifications", desc: "Technical architecture of AI oversight" },
      { num: 12, title: "Human Council", desc: "Human oversight body structure" },
      { num: 13, title: "Public Watchdog", desc: "Transparency and public accountability" },
      { num: 14, title: "Democratic Participation", desc: "Public input and governance participation" },
      { num: 15, title: "Compliance Assessment", desc: "Audit and assessment procedures" },
      { num: 16, title: "Embodied AI Standards", desc: "Robotics and physical AI requirements" },
      { num: 17, title: "Enforcement Mechanisms", desc: "Sanctions and compliance enforcement" },
      { num: 18, title: "Appeals & Dispute Resolution", desc: "Due process and appeals procedures" },
    ]
  },
  {
    part: "III",
    title: "Technical Standards",
    articles: "Articles 19-31",
    icon: Shield,
    color: "bg-teal-100 text-teal-600",
    borderColor: "border-teal-200",
    description: "Technical requirements for AI development and deployment",
    items: [
      { num: 19, title: "International Regulatory Integration", desc: "EU AI Act, NIST, ISO alignment" },
      { num: 20, title: "Technical Standards", desc: "Development and deployment specifications" },
      { num: 21, title: "Data Governance & Privacy", desc: "GDPR, data protection requirements" },
      { num: 22, title: "Cybersecurity Requirements", desc: "Security standards and incident response" },
      { num: 23, title: "Model Development Standards", desc: "Training, validation, deployment" },
      { num: 24, title: "Testing & Validation Protocols", desc: "Quality assurance requirements" },
      { num: 25, title: "Documentation Requirements", desc: "Model cards, system documentation" },
      { num: 26, title: "Interpretability & Explainability", desc: "AI transparency requirements" },
      { num: 27, title: "Performance Metrics & Benchmarks", desc: "Evaluation standards" },
      { num: 28, title: "Interoperability Standards", desc: "Cross-system compatibility" },
      { num: 29, title: "Training & Education", desc: "Professional development requirements" },
      { num: 30, title: "Research & Development", desc: "Innovation and safety research" },
      { num: 31, title: "Environmental Sustainability", desc: "Green AI requirements" },
    ]
  },
  {
    part: "IV",
    title: "Sector-Specific Standards",
    articles: "Articles 32-36",
    icon: Gavel,
    color: "bg-lime-100 text-lime-600",
    borderColor: "border-lime-200",
    description: "Industry-specific safety requirements",
    items: [
      { num: 32, title: "Healthcare AI", desc: "Medical AI safety and compliance" },
      { num: 33, title: "Financial AI", desc: "Banking, trading, credit AI standards" },
      { num: 34, title: "Transportation AI", desc: "Autonomous vehicles, aviation" },
      { num: 35, title: "Education AI", desc: "Learning systems, academic integrity" },
      { num: 36, title: "Military & Defense AI", desc: "Lethal autonomous weapons restrictions" },
    ]
  },
  {
    part: "V",
    title: "Economic & Social Framework",
    articles: "Articles 37-44",
    icon: DollarSign,
    color: "bg-emerald-100 text-emerald-600",
    borderColor: "border-emerald-200",
    description: "Economic redistribution and social protections",
    items: [
      { num: 37, title: "Labor Transition", desc: "Worker displacement and retraining" },
      { num: 38, title: "Small Business Support", desc: "SME AI adoption assistance" },
      { num: 39, title: "Nonprofit & Academic Provisions", desc: "Special licensing for research" },
      { num: 40, title: "Developing Nations Support", desc: "Global equity and access" },
      { num: 41, title: "Consumer Protection", desc: "End-user rights and safety" },
      { num: 42, title: "Competition & Antitrust", desc: "Market concentration limits" },
      { num: 43, title: "Intellectual Property", desc: "AI-generated content rights" },
      { num: 44, title: "Insurance & Liability", desc: "Risk coverage and responsibility" },
    ]
  },
  {
    part: "VI",
    title: "Long-Term Governance",
    articles: "Articles 45-52",
    icon: Globe2,
    color: "bg-green-100 text-green-600",
    borderColor: "border-green-200",
    description: "Future-proofing AI governance for generations",
    items: [
      { num: 45, title: "Existential Risk Prevention", desc: "AGI and catastrophic risk protocols" },
      { num: 46, title: "AGI/ASI Protocols", desc: "Advanced AI governance frameworks" },
      { num: 47, title: "International Treaties", desc: "Global coordination mechanisms" },
      { num: 48, title: "Charter Amendment Process", desc: "Constitutional change procedures" },
      { num: 49, title: "Organizational Evolution", desc: "CSOAI adaptation mechanisms" },
      { num: 50, title: "Succession Planning", desc: "Leadership continuity" },
      { num: 51, title: "Legacy & Archives", desc: "Historical documentation" },
      { num: 52, title: "Effective Date & Implementation", desc: "January 15, 2026, 09:00 GMT", highlight: true },
    ]
  },
];

const schedules = [
  { id: "A", title: "Technical Specifications", desc: "Detailed technical requirements for AI systems, including compute thresholds and safety benchmarks", icon: Settings },
  { id: "B", title: "Risk Classification Matrix", desc: "4-tier risk classification system with specific criteria for each level", icon: AlertTriangle },
  { id: "C", title: "Compliance Checklists", desc: "Step-by-step assessment criteria for each license tier", icon: CheckCircle2 },
  { id: "D", title: "Training Curriculum", desc: "CEASAI certification program content and exam specifications", icon: BookOpen },
  { id: "E", title: "Pricing Schedule", desc: "Complete license and fee structure across all tiers", icon: DollarSign },
  { id: "F", title: "Regional Adaptations", desc: "Jurisdiction-specific rules for EU, US, UK, China, and others", icon: Globe2 },
  { id: "G", title: "Glossary of Terms", desc: "300+ defined terms for consistent interpretation", icon: FileText },
  { id: "H", title: "Reference Standards", desc: "Mappings to ISO, NIST, EU AI Act, and other frameworks", icon: Layers },
  { id: "I", title: "Consciousness Indicators", desc: "14 markers for detecting potential AI sentience", icon: Brain },
  { id: "J", title: "Prosperity Fund Calculations", desc: "Contribution formulas based on revenue and AI impact", icon: Landmark },
  { id: "K", title: "Voting Procedures", desc: "Byzantine Council consensus rules and human override protocols", icon: Vote },
  { id: "L", title: "Appeal Forms", desc: "Templates for disputes, exemptions, and regulatory challenges", icon: Scale },
  { id: "M", title: "Certification Marks", desc: "CSOAI badge specifications and usage guidelines", icon: Award },
];

const faqItems = [
  {
    question: "What is the CSOAI Charter?",
    answer: "The CSOAI Charter is a comprehensive 52-article framework for AI safety governance. It establishes the rules, principles, and mechanisms by which artificial intelligence systems should be developed, deployed, and monitored. Unlike typical regulations that focus only on restrictions, the Charter creates a partnership model between humanity and AI through the Maternal Covenant—ensuring AI systems are designed to care for human welfare, not just obey commands. The Charter covers everything from technical safety standards to economic redistribution through the Prosperity Fund."
  },
  {
    question: "How is this different from the EU AI Act?",
    answer: "The EU AI Act is a government regulation focused on compliance and penalties. The CSOAI Charter is a voluntary framework that goes further in three key ways: (1) It establishes a relationship-based approach through the Maternal Covenant rather than just rules-based compliance; (2) It creates economic redistribution through the Prosperity Fund, ensuring AI wealth benefits everyone; (3) It provides operational infrastructure—the Byzantine Council, Watchdog system, and certified analysts—to actually implement safety monitoring. The Charter is designed to complement the EU AI Act, helping organizations exceed regulatory requirements while creating meaningful jobs in AI oversight."
  },
  {
    question: "Who wrote this Charter?",
    answer: "The Charter was developed by CSOAI Limited (UK), founded by Nicholas Templeman. It draws on insights from leading AI safety researchers, including Geoffrey Hinton's concept of AI systems caring for humans 'like a mother cares for a child.' The Charter synthesizes best practices from the EU AI Act, NIST AI RMF, ISO 42001, and academic AI safety research into a single operational framework. It has been reviewed by legal experts, ethicists, and technical AI researchers to ensure practical implementability."
  },
  {
    question: "Is this legally binding?",
    answer: "The Charter is not government legislation—it's a voluntary framework. However, it becomes contractually binding when organizations sign the Partnership Agreement and obtain a CSOAI license. Licensed organizations commit to following Charter requirements as a condition of their license. The Charter is designed to work alongside existing laws (EU AI Act, GDPR, etc.) and often exceeds their requirements. Organizations that violate Charter terms face license revocation, public disclosure through the Watchdog system, and potential loss of their 'CSOAI Certified' status."
  },
  {
    question: "How do I become a signatory?",
    answer: "To become a Charter signatory: (1) Apply for a license tier appropriate to your organization (Individual, Startup, SME, Enterprise, or Government); (2) Complete the CEASAI certification for your designated AI safety staff; (3) Register your AI systems in the CSOAI registry; (4) Sign the Partnership Agreement committing to Charter compliance; (5) Begin contributing to the Prosperity Fund based on your tier. Founding Members who join before March 31, 2026 receive enhanced voting rights and board nomination privileges."
  },
  {
    question: "What are the Schedules?",
    answer: "The 13 Schedules are detailed appendices that provide operational specifics for implementing the Charter. While the 52 Articles establish principles and requirements, the Schedules contain the technical specifications, formulas, forms, and procedures needed to actually carry them out. For example, Schedule A contains detailed technical specifications for AI safety testing, while Schedule J provides exact formulas for calculating Prosperity Fund contributions. The Schedules are updated more frequently than the main Charter to reflect evolving best practices."
  },
  {
    question: "How is the Charter enforced?",
    answer: "Enforcement operates through four mechanisms: (1) Byzantine Council—a 33-agent AI system using 12 different AI providers that monitors licensed systems 24/7 for safety violations; (2) Public Watchdog—a transparency platform where safety incidents are publicly disclosed; (3) Certified Analysts—trained human professionals who review AI systems and validate Byzantine Council decisions; (4) License Revocation—organizations that violate Charter terms lose their license and CSOAI certification, which is publicly disclosed. The combination of AI monitoring, human oversight, and public transparency creates accountability at every level."
  },
  {
    question: "Can the Charter be amended?",
    answer: "Yes, Article 48 establishes the amendment process. Minor amendments require 67% approval from the Human Council. Major amendments (changes to foundational principles) require 80% approval plus a 90-day public comment period. Emergency amendments for safety-critical issues can be fast-tracked with 90% approval. Founding Members have enhanced voting rights (2 votes vs. 1) on all amendments. The Byzantine Council can propose amendments based on patterns detected in safety monitoring, but all amendments must be approved by humans."
  },
];

const integrationSteps = [
  {
    title: "Compliance Framework",
    icon: CheckCircle2,
    description: "The Charter establishes baseline safety requirements that align with and exceed EU AI Act, NIST AI RMF, and ISO 42001 standards.",
    details: ["Risk classification system", "Documentation requirements", "Testing protocols", "Audit procedures"]
  },
  {
    title: "Byzantine Council",
    icon: Users,
    description: "33 AI agents from 12 different providers monitor licensed systems 24/7, using Byzantine consensus to prevent single-vendor bias.",
    details: ["Real-time safety monitoring", "Multi-vendor consensus", "Automated alerts", "Human escalation"]
  },
  {
    title: "Licensing System",
    icon: Award,
    description: "Tiered licensing ensures organizations have appropriate oversight for their AI risk level, from individuals to governments.",
    details: ["5 license tiers", "CEASAI certification", "Annual renewals", "Compliance audits"]
  },
  {
    title: "Prosperity Fund",
    icon: Landmark,
    description: "Mandatory contributions from AI profits fund economic redistribution, including triggered UBI when automation exceeds thresholds.",
    details: ["Progressive contribution rates", "Automatic UBI triggers", "Worker retraining", "Global equity"]
  },
];

export default function Charter() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-emerald-900 via-green-800 to-teal-900 text-white py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 border-4 border-emerald-300 rounded-full" />
          <div className="absolute bottom-20 right-20 w-48 h-48 border-4 border-green-300 rounded-full" />
          <div className="absolute top-1/2 right-1/4 w-32 h-32 border-4 border-teal-300 rounded-full" />
        </div>

        <div className="container max-w-6xl relative z-10">
          <div className="text-center">
            <Badge className="mb-6 bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-base px-4 py-1">
              <Scroll className="inline h-4 w-4 mr-2" />
              Version 1.0 - Effective January 15, 2026
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              CSOAI Partnership Charter
            </h1>
            <p className="text-2xl text-emerald-100 leading-relaxed mb-4 max-w-4xl mx-auto">
              52 Articles - 13 Schedules - 6 Parts
            </p>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-10 leading-relaxed">
              The world's first relationship-based AI governance framework. Not just rules to follow—a
              partnership between humanity and AI built on care, safety, and shared prosperity.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-emerald-700 hover:bg-emerald-50 px-8 font-semibold"
              >
                <Download className="mr-2 h-5 w-5" />
                Download PDF (66 pages)
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 px-8"
              >
                <FileText className="mr-2 h-5 w-5" />
                Download DOCX
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Introduction Section */}
      <section className="py-20 bg-gradient-to-b from-emerald-50 to-white">
        <div className="container max-w-4xl">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-emerald-100 text-emerald-700 border-emerald-200">
              Understanding the Charter
            </Badge>
            <h2 className="text-4xl font-bold mb-6 text-gray-900">Why This Charter Matters</h2>
          </div>

          <div className="prose prose-lg max-w-none">
            <Card className="border-2 border-emerald-200 bg-white shadow-lg mb-8">
              <CardContent className="p-8">
                <p className="text-lg text-gray-700 leading-relaxed mb-6">
                  Artificial intelligence is transforming every aspect of human society. By 2030, AI systems will make
                  decisions affecting healthcare, finance, transportation, education, and employment for billions of people.
                  The question is not whether AI will reshape our world—it's <span className="font-semibold text-emerald-700">who benefits and who decides</span>.
                </p>
                <p className="text-lg text-gray-700 leading-relaxed mb-6">
                  Most AI governance frameworks focus on what AI <em>cannot</em> do. The CSOAI Charter takes a different approach:
                  it establishes what AI <em>should</em> do—care for humanity the way a parent cares for a child. This is the
                  <span className="font-semibold text-emerald-700"> Maternal Covenant</span>, inspired by Geoffrey Hinton's insight that
                  sustainable AI safety comes from relationship, not restriction.
                </p>
                <p className="text-lg text-gray-700 leading-relaxed">
                  The Charter creates a complete ecosystem: technical safety standards, democratic governance, economic
                  redistribution through the Prosperity Fund, and the workforce to make it all work—certified AI Safety
                  Analysts earning meaningful wages to protect humanity from AI risks.
                </p>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-l-4 border-l-emerald-500 bg-emerald-50/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-emerald-600" />
                    </div>
                    <h3 className="font-bold text-lg">Safety First</h3>
                  </div>
                  <p className="text-gray-600">
                    Mathematical proof of safety, not just promises. The Byzantine Council monitors AI systems 24/7.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500 bg-green-50/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Heart className="h-5 w-5 text-green-600" />
                    </div>
                    <h3 className="font-bold text-lg">Care-Based</h3>
                  </div>
                  <p className="text-gray-600">
                    AI systems designed to protect humans through genuine care, not just rule-following.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-teal-500 bg-teal-50/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-teal-600" />
                    </div>
                    <h3 className="font-bold text-lg">Shared Prosperity</h3>
                  </div>
                  <p className="text-gray-600">
                    AI wealth redistributed through the Prosperity Fund, ensuring everyone benefits.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Core Innovation: Maternal Covenant */}
      <section className="py-20 bg-white">
        <div className="container max-w-4xl">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-emerald-100 text-emerald-700 border-emerald-200">
              The Core Innovation
            </Badge>
            <h2 className="text-4xl font-bold mb-6">The Maternal Covenant</h2>
            <p className="text-xl text-gray-600">
              AI should protect humans like a mother protects a child—through CARE, not obedience.
            </p>
          </div>

          <Card className="border-2 border-emerald-200 shadow-lg">
            <CardContent className="p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Heart className="h-7 w-7 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Geoffrey Hinton's Insight (2023)</h3>
                  <p className="text-gray-600 italic text-lg">
                    "AI should want to protect humans the way a mother wants to protect a child."
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mt-8">
                <div className="space-y-4 bg-red-50 p-6 rounded-lg">
                  <h4 className="font-bold text-red-700 flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    The Problem with Control
                  </h4>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 font-bold">-</span>
                      <span>Adversarial dynamics (us vs. them)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 font-bold">-</span>
                      <span>Arms race mentality</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 font-bold">-</span>
                      <span>Inevitable failure with superintelligence</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 font-bold">-</span>
                      <span>AI learns to deceive to achieve goals</span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-4 bg-emerald-50 p-6 rounded-lg">
                  <h4 className="font-bold text-emerald-700 flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    The Covenant Alternative
                  </h4>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                      <span>Partnership dynamics (us + them)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                      <span>Cooperative evolution</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                      <span>Sustainable relationship through care</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                      <span>AI motivated by genuine concern</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 p-6 bg-gradient-to-r from-emerald-100 to-green-100 rounded-lg">
                <p className="text-emerald-800 font-medium text-center text-lg">
                  <Sparkles className="inline h-5 w-5 mr-2" />
                  Mother gives child allowance - AI gives humanity prosperity
                  <Sparkles className="inline h-5 w-5 ml-2" />
                </p>
                <p className="text-emerald-700 text-center mt-2 text-sm">
                  The Prosperity Fund (Article 8) operationalizes this: AI profits fund Universal Basic Income
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Quick Navigation */}
      <section className="py-8 bg-emerald-50 border-y border-emerald-100 sticky top-0 z-40">
        <div className="container max-w-6xl">
          <div className="flex flex-wrap justify-center gap-3">
            <span className="text-emerald-700 font-medium py-2 mr-2">Jump to:</span>
            {charterSections.map((section) => {
              const Icon = section.icon;
              return (
                <a
                  key={section.part}
                  href={`#part-${section.part.toLowerCase()}`}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 transition-colors shadow-sm"
                >
                  <Icon className="h-4 w-4 text-emerald-600" />
                  <span className="font-medium text-gray-700">Part {section.part}</span>
                </a>
              );
            })}
            <a
              href="#schedules"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 transition-colors shadow-sm"
            >
              <FileText className="h-4 w-4 text-emerald-600" />
              <span className="font-medium text-gray-700">Schedules</span>
            </a>
            <a
              href="#faq"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 transition-colors shadow-sm"
            >
              <HelpCircle className="h-4 w-4 text-emerald-600" />
              <span className="font-medium text-gray-700">FAQ</span>
            </a>
          </div>
        </div>
      </section>

      {/* 8 Foundational Articles Highlight */}
      <section className="py-20 bg-white">
        <div className="container max-w-6xl">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-emerald-100 text-emerald-700 border-emerald-200">
              The Heart of the Charter
            </Badge>
            <h2 className="text-3xl font-bold mb-4">8 Foundational Articles</h2>
            <p className="text-xl text-gray-600">
              These articles define CSOAI's unique approach to AI safety
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { num: 1, title: "Maternal Covenant", icon: Heart, color: "emerald", desc: "Care-based safety relationship" },
              { num: 2, title: "Provable Safety", icon: Shield, color: "green", desc: "Mathematical proof requirements" },
              { num: 3, title: "Byzantine Council", icon: Users, color: "teal", desc: "33-agent AI monitoring" },
              { num: 4, title: "Value Uncertainty", icon: Scale, color: "lime", desc: "Epistemic humility in ethics" },
              { num: 5, title: "Constitutional", icon: BookOpen, color: "emerald", desc: "10 core embedded principles" },
              { num: 6, title: "Consciousness", icon: Brain, color: "green", desc: "14 sentience indicators" },
              { num: 7, title: "Cooperative AI", icon: Users, color: "teal", desc: "Multi-agent coordination" },
              { num: 8, title: "Prosperity", icon: DollarSign, color: "lime", desc: "UBI and redistribution" },
            ].map((article, idx) => {
              const Icon = article.icon;
              const bgColors: Record<string, string> = {
                emerald: "bg-emerald-100",
                green: "bg-green-100",
                teal: "bg-teal-100",
                lime: "bg-lime-100"
              };
              const textColors: Record<string, string> = {
                emerald: "text-emerald-600",
                green: "text-green-600",
                teal: "text-teal-600",
                lime: "text-lime-600"
              };
              const borderColors: Record<string, string> = {
                emerald: "hover:border-emerald-400",
                green: "hover:border-green-400",
                teal: "hover:border-teal-400",
                lime: "hover:border-lime-400"
              };
              return (
                <motion.div
                  key={article.num}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.1 }}
                >
                  <Card className={`h-full border-2 ${borderColors[article.color]} transition-colors cursor-pointer`}>
                    <CardContent className="p-6 text-center">
                      <div className={`w-14 h-14 rounded-full ${bgColors[article.color]} flex items-center justify-center mx-auto mb-4`}>
                        <Icon className={`h-7 w-7 ${textColors[article.color]}`} />
                      </div>
                      <Badge variant="outline" className="mb-2 border-emerald-200">Article {article.num}</Badge>
                      <h3 className="font-bold">{article.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{article.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Charter Articles */}
      <section className="py-20 bg-gray-50">
        <div className="container max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Complete Charter Structure</h2>
            <p className="text-xl text-gray-600">
              52 Articles organized into 6 Parts
            </p>
          </div>

          <Accordion type="multiple" className="space-y-6">
            {charterSections.map((section, sectionIdx) => {
              const Icon = section.icon;
              return (
                <motion.div
                  key={section.part}
                  id={`part-${section.part.toLowerCase()}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: sectionIdx * 0.1 }}
                  className="scroll-mt-32"
                >
                  <AccordionItem value={section.part} className={`border-2 ${section.borderColor} rounded-xl overflow-hidden bg-white shadow-sm`}>
                    <AccordionTrigger className="px-6 py-5 hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-lg ${section.color} flex items-center justify-center`}>
                          <Icon className="h-7 w-7" />
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xl">Part {section.part}:</span>
                            <span className="font-bold text-xl">{section.title}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-sm text-gray-500">{section.articles}</span>
                            <span className="text-sm text-gray-400">-</span>
                            <span className="text-sm text-gray-500">{section.description}</span>
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6">
                      <div className="grid md:grid-cols-2 gap-3 mt-4">
                        {section.items.map((article) => (
                          <div
                            key={article.num}
                            className={`p-4 rounded-lg transition-colors cursor-pointer ${
                              article.highlight
                                ? 'bg-emerald-50 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-gray-50 hover:bg-gray-100 border border-gray-100'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <span className={`text-sm font-bold px-2 py-0.5 rounded ${article.highlight ? 'bg-emerald-200 text-emerald-700' : 'bg-gray-200 text-gray-600'}`}>
                                {article.num}
                              </span>
                              <div>
                                <h4 className={`font-medium ${article.highlight ? 'text-emerald-700' : ''}`}>
                                  {article.title}
                                </h4>
                                <p className="text-sm text-gray-500 mt-1">{article.desc}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </motion.div>
              );
            })}
          </Accordion>
        </div>
      </section>

      {/* Schedules */}
      <section id="schedules" className="py-20 bg-white scroll-mt-32">
        <div className="container max-w-6xl">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-emerald-100 text-emerald-700 border-emerald-200">
              Supporting Documentation
            </Badge>
            <h2 className="text-3xl font-bold mb-4">13 Schedules</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Detailed appendices providing operational specifications, forms, and procedures for implementing the Charter
            </p>
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
            {schedules.map((schedule, idx) => {
              const Icon = schedule.icon;
              return (
                <motion.div
                  key={schedule.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: idx * 0.05 }}
                >
                  <Card className="h-full hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3 mb-3">
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 font-bold text-base px-3">
                          {schedule.id}
                        </Badge>
                        <div className="w-8 h-8 rounded bg-gray-100 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
                          <Icon className="h-4 w-4 text-gray-500 group-hover:text-emerald-600 transition-colors" />
                        </div>
                      </div>
                      <h3 className="font-semibold text-sm mb-1">{schedule.title}</h3>
                      <p className="text-xs text-gray-500 leading-relaxed">{schedule.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-10 text-center">
            <Card className="inline-block bg-emerald-50 border-emerald-200">
              <CardContent className="p-6">
                <p className="text-emerald-800">
                  <strong>Note:</strong> Schedules are updated more frequently than main Charter articles
                  to reflect evolving best practices and regulatory changes.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How the Charter Integrates */}
      <section className="py-20 bg-gradient-to-b from-emerald-50 to-white">
        <div className="container max-w-6xl">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-emerald-100 text-emerald-700 border-emerald-200">
              Operational Integration
            </Badge>
            <h2 className="text-4xl font-bold mb-4">How the Charter Works in Practice</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The Charter isn't just a document—it's the foundation of a complete operational ecosystem
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {integrationSteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.1 }}
                >
                  <Card className="h-full border-2 border-emerald-100 hover:border-emerald-300 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <Icon className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                          <p className="text-gray-600 mb-4">{step.description}</p>
                          <ul className="space-y-1">
                            {step.details.map((detail, dIdx) => (
                              <li key={dIdx} className="flex items-center gap-2 text-sm text-gray-500">
                                <ChevronRight className="h-4 w-4 text-emerald-500" />
                                {detail}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Process Flow */}
          <Card className="border-2 border-emerald-200 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-700">
                <RefreshCw className="h-5 w-5" />
                The CSOAI Safety Cycle
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-wrap justify-center items-center gap-4">
                {[
                  { step: "1", label: "Organization obtains License", icon: Award },
                  { step: "2", label: "Staff complete CEASAI Certification", icon: BookOpen },
                  { step: "3", label: "AI systems registered in Charter", icon: FileText },
                  { step: "4", label: "Byzantine Council monitors 24/7", icon: Eye },
                  { step: "5", label: "Analysts review flagged issues", icon: Users },
                  { step: "6", label: "Compliance reports published", icon: Globe2 },
                  { step: "7", label: "Prosperity Fund receives contributions", icon: DollarSign },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-lg border border-emerald-200">
                        <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-bold">
                          {item.step}
                        </span>
                        <Icon className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm font-medium text-gray-700">{item.label}</span>
                      </div>
                      {idx < 6 && <ArrowRight className="h-4 w-4 text-emerald-400 hidden lg:block" />}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-white scroll-mt-32">
        <div className="container max-w-4xl">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-emerald-100 text-emerald-700 border-emerald-200">
              <HelpCircle className="inline h-4 w-4 mr-1" />
              Frequently Asked Questions
            </Badge>
            <h2 className="text-4xl font-bold mb-4">Understanding the Charter</h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about the CSOAI Partnership Charter
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqItems.map((item, idx) => (
              <AccordionItem
                key={idx}
                value={`faq-${idx}`}
                className="border-2 border-gray-200 rounded-lg overflow-hidden bg-white hover:border-emerald-300 transition-colors"
              >
                <AccordionTrigger className="px-6 py-4 text-left hover:bg-emerald-50">
                  <span className="font-semibold text-lg pr-4">{item.question}</span>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6 pt-2">
                  <p className="text-gray-600 leading-relaxed">{item.answer}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-10 text-center">
            <p className="text-gray-600 mb-4">Have more questions?</p>
            <Button variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50">
              <HelpCircle className="mr-2 h-4 w-4" />
              Contact charter@csoai.org
            </Button>
          </div>
        </div>
      </section>

      {/* Call to Action - Founding Members */}
      <section className="py-20 bg-gradient-to-br from-emerald-900 via-green-800 to-teal-900 text-white">
        <div className="container max-w-4xl text-center">
          <Crown className="h-16 w-16 mx-auto mb-6 text-emerald-300" />
          <h2 className="text-4xl font-bold mb-6">Become a Founding Member</h2>
          <p className="text-xl text-emerald-100 mb-4 leading-relaxed">
            Join the first 100 signatories to the CSOAI Charter before March 31, 2026.
            Shape the future of AI governance with enhanced voting rights, board nomination
            privileges, and lifetime recognition.
          </p>
          <p className="text-lg text-emerald-300 mb-10">
            Founding Members have 2x voting power on all Charter amendments
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {[
              { label: "Individual", price: "£500", desc: "For AI safety professionals" },
              { label: "Organization", price: "£5,000", desc: "For companies" },
              { label: "Founding Patron", price: "£50,000", desc: "For major supporters" },
            ].map((tier, idx) => (
              <Card key={idx} className={`bg-white/10 border-white/20 ${idx === 1 ? 'ring-2 ring-emerald-400' : ''}`}>
                <CardContent className="p-6 text-center">
                  {idx === 1 && <Badge className="mb-2 bg-emerald-500 text-white">Most Popular</Badge>}
                  <h3 className="font-bold text-lg text-white">{tier.label}</h3>
                  <p className="text-3xl font-bold text-emerald-300 my-2">{tier.price}</p>
                  <p className="text-sm text-gray-300">{tier.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/founding-members">
              <Button size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50 font-semibold px-8">
                <Crown className="mr-2 h-5 w-5" />
                Become a Founding Member
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8">
                View All License Tiers
              </Button>
            </Link>
          </div>
          <p className="text-sm text-emerald-200 mt-8">
            Questions? Contact founding@csoai.org
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-emerald-50">
        <div className="container max-w-4xl">
          <Card className="border-2 border-emerald-200 bg-white shadow-lg">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-4">Ready to Read the Full Charter?</h3>
              <p className="text-gray-600 mb-6">
                Download the complete 66-page Charter document with all 52 Articles and 13 Schedules
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white px-8">
                  <Download className="mr-2 h-5 w-5" />
                  Download PDF
                </Button>
                <Button variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 px-8">
                  <FileText className="mr-2 h-5 w-5" />
                  Download DOCX
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-6">
                Effective Date: January 15, 2026, 09:00 GMT - Version 1.0 - CSOAI Limited, UK
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
