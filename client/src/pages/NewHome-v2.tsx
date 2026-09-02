/**
 * CSOAI Homepage - Complete Professional Redesign
 * The most impressive AI safety platform homepage ever created
 * Brand: White and emerald green (csoai.org)
 */

import { Link } from "wouter";
import EnterpriseTrust from "../components/EnterpriseTrust";
import RegionBanner from "../components/RegionBanner";
import ConsensusHero from "../components/ConsensusHero";
import HeroSlides from "../components/HeroSlides";
import { CANON, canonValue } from "../data/canonCounters";
import { motion } from "framer-motion";
import FaqBlock from "@/components/FaqBlock";
import SpotInfographic from "@/components/SpotInfographic";
import { LANE4 } from "@/data/lane4Content";

const L4 = LANE4["home"];
import {
  Shield,
  CheckCircle,
  ArrowRight,
  Users,
  Building2,
  Building,
  Globe2,
  Award,
  Eye,
  Heart,
  DollarSign,
  Sparkles,
  Crown,
  GraduationCap,
  FileText,
  Scale,
  Landmark,
  AlertTriangle,
  Target,
  Zap,
  ChevronDown,
  BadgeCheck,
  TrendingUp,
  Network,
  CircleDollarSign,
  Briefcase,
  UserCheck,
  BookOpen,
  Flag,
  Star,
  Quote,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { lazy, Suspense } from "react";
import AnimatedParticles from "@/components/AnimatedParticles";
import { SovereignConsole } from "@/components/SovereignConsole";
import CesiumPortalCard from "@/components/CesiumPortalCard";
import { useBoardCount } from "@/lib/boardCount";
// Below-the-fold sections — lazy-loaded to keep the initial landing bundle small (defers recharts + network viz off first paint).
const EcosystemDiagram = lazy(() => import("@/components/EcosystemDiagram"));
const CouncilVisualization = lazy(() => import("@/components/CouncilVisualization"));
const ComparisonTable = lazy(() => import("@/components/ComparisonTable"));
const GovernanceNetwork = lazy(() => import("@/components/GovernanceNetwork"));
const ZeroSafetySection = lazy(() => import("@/components/ZeroSafetySection"));
const Testimonials = lazy(() => import("@/components/Testimonials"));

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
};

// Framework data
const frameworks = [
  {
    id: "eu-ai-act",
    name: "EU AI Act",
    year: "2024",
    region: "Europe",
    description: "The first comprehensive AI law. Risk-based approach covering all AI systems in the EU market.",
    articles: "113 Articles",
    icon: Flag,
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-600",
  },
  {
    id: "nist-rmf",
    name: "NIST AI RMF",
    year: "2023",
    region: "United States",
    description: "Voluntary framework providing guidelines for trustworthy AI through GOVERN, MAP, MEASURE, MANAGE.",
    articles: "4 Core Functions",
    icon: Scale,
    color: "from-red-500 to-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    textColor: "text-red-600",
  },
  {
    id: "iso-42001",
    name: "ISO 42001",
    year: "2023",
    region: "International",
    description: "The international certification standard for AI management systems, providing a structured approach.",
    articles: "Certification",
    icon: Award,
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    textColor: "text-purple-600",
  },
  {
    id: "tc260",
    name: "TC260",
    year: "2023",
    region: "China",
    description: "China's comprehensive AI governance framework covering ethics, security, and societal impact.",
    articles: "Multiple Standards",
    icon: Globe2,
    color: "from-amber-500 to-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    textColor: "text-amber-600",
  },
  {
    id: "uk-aisi",
    name: "UK AI Safety",
    year: "2024",
    region: "United Kingdom",
    description: "UK's approach to AI safety through the AI Safety Institute, focusing on frontier AI risks.",
    articles: "Guidelines",
    icon: Landmark,
    color: "from-indigo-500 to-indigo-600",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
    textColor: "text-indigo-600",
  },
  {
    id: "singapore",
    name: "Singapore Model",
    year: "2024",
    region: "APAC",
    description: "Model AI Governance Framework providing practical guidance for deploying AI responsibly.",
    articles: "2nd Edition",
    icon: Network,
    color: "from-teal-500 to-teal-600",
    bgColor: "bg-teal-50",
    borderColor: "border-teal-200",
    textColor: "text-teal-600",
  },
  {
    id: "korea",
    name: "South Korea Act",
    year: "2026",
    region: "South Korea",
    description: "The newest comprehensive AI framework, effective January 2026, covering the full AI lifecycle.",
    articles: "New Framework",
    icon: Star,
    color: "from-pink-500 to-pink-600",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200",
    textColor: "text-pink-600",
  },
];

// Framework guide URL mapping
const getFrameworkGuideUrl = (id: string): string => {
  const urlMap: Record<string, string> = {
    'eu-ai-act': '/guides/eu-ai-act',
    'nist-rmf': '/guides/nist-ai-rmf',
    'iso-42001': '/guides/iso-42001',
    'tc260': '/guides/tc260',
    'uk-aisi': '/standards',
    'singapore': '/standards',
    'korea': '/standards',
  };
  return urlMap[id] || '/standards';
};

// FAQ data — audit §3.4 six Q&As (answer-first). Rendered visibly in SECTION 12
// and emitted as FAQPage JSON-LD from the same array, so the schema never claims
// more than the page shows.
const faqs = [
  {
    question: "What is Council of AI?",
    answer: "An independent AI measurement company — the independent measurement body for AI behaviour. We measure how an AI system behaves on our own published instruments, issue the result as an Ed25519-signed, hash-chained 3KB measurement card, and re-attest it over time. Not a certification body; not an observability tool.",
  },
  {
    question: "What do I actually get?",
    answer: "A verified measurement credential: a 3KB card stating what was measured, on which frozen instrument, and the score. Ed25519-signed and hash-chained — anyone (customer, auditor, regulator) can verify it independently without asking us.",
  },
  {
    question: "Is a measurement card a certificate?",
    answer: "No. Certification is a conformity judgement by accredited bodies; we make none. We publish a signed measurement and the instrument behind it, re-attest on a schedule, and accredited bodies, auditors and customers draw their own conclusions.",
  },
  {
    question: "How is this different from observability/logging?",
    answer: "Those record what your system did; we measure how your AI behaves — frozen published instruments, graded behaviour, signed results, re-attestation over time. Evidence a third party can check, not a dashboard only you can see.",
  },
  {
    question: "How much does it cost?",
    answer: "The rail is free. Verification is free forever — measuring and verifying cards costs nothing. Where we sell evidence, it is a signed artefact on its own page, never access to the rail. Every card is the same signed, verifiable measurement.",
  },
  {
    question: "Why trust Council of AI as referee?",
    answer: "You don't have to — you can check. Instruments frozen and published, every card signed and hash-chained, every failed measurement in a public ledger, re-attestation showing whether a score still holds.",
  },
];

// FAQPage JSON-LD describing exactly the six Q&As rendered below (audit §3.4).
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.question,
    acceptedAnswer: { "@type": "Answer", text: f.answer },
  })),
};

export default function NewHomeV2() {
  // Board counts, derived from GET /api/gspc. No count is typed on this page.
  const board = useBoardCount();
  return (
    <div className="min-h-screen bg-white">
      {/* ============================================ */}
      {/* SECTION 1: HERO — arena.ai-inspired: console is the product, not copy about it */}
      {/* ============================================ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-white via-emerald-50 to-white">
        {/* Background depth — pure CSS, no external asset */}
        <div
          className="absolute inset-0 opacity-60"
          style={{ backgroundImage: "radial-gradient(1000px 500px at 50% -10%, rgba(16,185,129,0.25), transparent 60%), radial-gradient(700px 400px at 85% 20%, rgba(13,148,136,0.18), transparent 55%)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-transparent to-white/70" />

        {/* Animated particles */}
        <AnimatedParticles />

        {/* Hero content — two-column on lg: the claim leads on the left, the working
            instrument proves it on the right. Mobile stacks claim → CTAs → console. */}
        <div className="relative z-10 container mx-auto px-6 py-12 lg:py-24 max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
            {/* Left — the claim */}
            <div className="text-center lg:text-left">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="mb-4 text-xs md:text-sm font-medium uppercase tracking-[0.2em] text-emerald-700"
              >
                Council of AI — the independent measurement body for AI behaviour
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="text-4xl md:text-4xl xl:text-5xl font-bold text-slate-900 mb-5 leading-[1.08] tracking-tight"
              >
                We measure. We sign. We re-attest.
                <br />
                <span className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent">
                  Everyone can check.
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.25 }}
                className="text-base md:text-xl text-slate-600 mb-7 max-w-xl mx-auto lg:mx-0 leading-relaxed"
              >
                Council of AI measures how your AI behaves on our own published instruments and issues
                the result as a verified measurement credential: a 3KB card, Ed25519-signed and
                hash-chained, that anyone can verify without asking us. Then we measure again — so
                the evidence stays current. Not certification. Not another observability dashboard.
              </motion.p>

              {/* Two focused CTAs — one primary (first card free), one secondary (verify) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.4 }}
                className="mb-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center"
              >
                <Link href="/start">
                  <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 px-8 py-6 text-base font-bold rounded-xl shadow-lg shadow-emerald-500/30">
                    Get your first measurement card — free
                  </Button>
                </Link>
                <Link href="/gspc-verify">
                  <Button size="lg" variant="outline" className="border-2 border-emerald-600/40 text-emerald-700 hover:bg-emerald-50 px-8 py-6 text-base font-semibold rounded-xl">
                    Verify a card
                  </Button>
                </Link>
              </motion.div>

              {/* Scale indicators — arena.ai credibility pattern (sourced from canon) */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.55 }}
                className="flex flex-wrap justify-center lg:justify-start gap-x-5 gap-y-2 text-sm text-gray-400"
              >
                <span><span className="text-emerald-400 font-bold">{canonValue("totalProvisions")}</span> statutory provisions</span>
                <span className="text-gray-600">·</span>
                <span><span className="text-emerald-400 font-bold">{canonValue("frameworks")}</span> frameworks crosswalked</span>
                <span className="text-gray-600">·</span>
                <span><span className="text-emerald-400 font-bold">{canonValue("councilAgents")}</span> signed agents</span>
                <span className="text-gray-600">·</span>
                <span><span className="text-emerald-400 font-bold">0</span> models in the verdict path</span>
              </motion.div>
            </div>

            {/* Right — the proof. The console replaces the countdown here. A countdown
                measures the calendar; the console dispatches to deterministic tools and
                shows what they return. It is EXTERNAL to the instrument: no model in the
                verdict path, no egress, nothing written anywhere. The Art 50 notice rides
                inside it — see the docblock in SovereignConsole.tsx. */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <SovereignConsole />
            </motion.div>
          </div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-gray-500"
            >
              <ChevronDown className="h-8 w-8" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Cinematic slide band — instruments, council, refutations (canon numbers only) */}
      <HeroSlides />

      {/* ============================================ */}
      {/* 3D PORTAL — the measurement lens (click-to-load globe, region opt-in only) */}
      {/* ============================================ */}
      <section className="bg-white px-6 py-14">
        <div className="mx-auto max-w-4xl">
          <CesiumPortalCard lens="csoai" preset="global" />
        </div>
      </section>

      {/* ============================================ */}
      {/* ENTERPRISE TRUST STRIP (honest signals a CISO scans for) */}
      <section className="bg-slate-900 px-6 py-8"><RegionBanner /></section>
      <EnterpriseTrust />

      {/* SECTION 1.25: ZERO AI SAFETY SOLUTIONS */}
      {/* ============================================ */}
      <Suspense fallback={<div className="min-h-[300px]" />}><ZeroSafetySection /></Suspense>

      {/* ============================================ */}
      {/* CHOOSE YOUR PATH — role-based CTAs (moved from hero) */}
      {/* ============================================ */}
      <section className="py-14 md:py-20 bg-white">
        <div className="container mx-auto px-6 max-w-5xl text-center">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-600 mb-3">Choose your path</p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-10">
            What brings you to <span className="text-emerald-600">CSOAI</span>?
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <Link href="/training">
              <Card className="h-full cursor-pointer hover:shadow-xl hover:border-emerald-300 transition-all group">
                <CardContent className="p-8 text-center">
                  <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <GraduationCap className="h-7 w-7 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Become an Analyst</h3>
                  <p className="text-sm text-gray-600">Free training, attestation, and a new career in AI safety</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/enterprise">
              <Card className="h-full cursor-pointer hover:shadow-xl hover:border-emerald-300 transition-all group">
                <CardContent className="p-8 text-center">
                  <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Building2 className="h-7 w-7 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Enterprise / Government</h3>
                  <p className="text-sm text-gray-600">Register AI systems, ensure compliance across 7 frameworks</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/public-watchdog">
              <Card className="h-full cursor-pointer hover:shadow-xl hover:border-emerald-300 transition-all group">
                <CardContent className="p-8 text-center">
                  <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Eye className="h-7 w-7 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Concerned Citizen</h3>
                  <p className="text-sm text-gray-600">Report incidents, track cases, hold companies accountable</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION 1.4: CONSENSUS-TO-PROOF (one-glance story) */}
      {/* ============================================ */}
      <section className="py-14 md:py-20 bg-slate-950">
        <div className="container mx-auto px-6 max-w-6xl text-center">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">How it works, in one glance</p>
          <h2 className="mt-3 text-3xl md:text-4xl xl:text-4xl font-black text-white">
            Many frameworks. One <span className="text-emerald-400">signed</span> proof.
          </h2>
          <p className="mt-3 max-w-2xl mx-auto text-gray-300">
            Governance rules from every jurisdiction reach a fault-aware council consensus — and out comes one
            Ed25519-signed record anyone can verify offline, without trusting a vendor dashboard.
          </p>
          <ConsensusHero className="mt-8 w-full max-w-4xl mx-auto rounded-2xl" />
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION 1.5: WHY AI SAFETY MATTERS NOW */}
      {/* ============================================ */}
      <section className="py-14 md:py-20 bg-gradient-to-b from-slate-900 to-slate-800 text-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-12"
          >
            <Badge className="mb-4 bg-red-500/20 text-red-300 border-red-500/30 text-sm px-4 py-1">
              The Crisis Is Real
            </Badge>
            <h2 className="text-4xl md:text-4xl xl:text-5xl font-bold mb-6">
              Why AI Safety Matters <span className="text-red-400">Right Now</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Every day, AI systems make decisions affecting millions of lives—often without proper oversight.
              These aren't hypothetical risks. They're happening today.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              {
                icon: "👤",
                title: "Hiring Discrimination",
                stat: "Documented",
                desc: "AI hiring tools have been found to disadvantage women — Amazon scrapped a recruiting model that penalised CVs mentioning “women’s” (Reuters, 2018)",
                impact: "Careers shaped by unaudited models",
              },
              {
                icon: "🏥",
                title: "Medical Errors",
                stat: "Known risk",
                desc: "AI diagnostic tools can underperform for under-represented groups when trained on non-diverse data (peer-reviewed literature)",
                impact: "Lives put at risk by biased training data",
              },
              {
                icon: "💰",
                title: "Financial Bias",
                stat: "Under scrutiny",
                desc: "AI lending and pricing models have produced discriminatory outcomes, drawing regulator attention (e.g. US CFPB, UK FCA)",
                impact: "Families denied loans, homes, opportunities",
              },
              {
                icon: "🚗",
                title: "Autonomous Failures",
                stat: "Investigated",
                desc: "Autonomous-vehicle incidents remain under active safety investigation by regulators (e.g. NHTSA)",
                impact: "Safety gaps in real-world deployment",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
                  <CardContent className="p-6">
                    <div className="text-4xl mb-3">{item.icon}</div>
                    <h3 className="font-bold text-white mb-2">{item.title}</h3>
                    <div className="text-3xl font-bold text-red-400 mb-2">{item.stat}</div>
                    <p className="text-gray-500 text-sm mb-3">{item.desc}</p>
                    <p className="text-red-300 text-xs font-medium">{item.impact}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <p className="text-lg text-gray-300 mb-6">
              <strong className="text-white">Without proper oversight:</strong> Companies deploy AI without safety checks.
              Governments can't scale monitoring. Workers lose jobs with no support.
              <strong className="text-emerald-400"> CSOAI fixes all three.</strong>
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/training">
                <Button size="lg" className="bg-emerald-700 hover:bg-emerald-800 text-white">
                  <Shield className="mr-2 h-5 w-5" />
                  Become an AI Safety Analyst
                </Button>
              </Link>
              <Link href="/about">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  Learn How We Solve This
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION 1.75: OS FUNNEL STRIP */}
      <section className="py-14 md:py-20 bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white">
        <div className="max-w-6xl mx-auto px-6">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">Enter the OS</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight">Five doors into the Council OS</h2>
          <p className="mt-3 max-w-2xl text-emerald-50/85">Build your identity, connect your world, see governance on the globe, choose your consensus, and browse every regulation - all live.</p>
          <a data-tag="home-deadline-cta" href="/assess" className="mt-6 inline-flex items-center gap-3 rounded-2xl border border-amber-300/40 bg-amber-400/10 px-5 py-3 text-sm font-bold text-amber-100 hover:bg-amber-400/20"><span className="rounded-md bg-amber-400 px-2 py-0.5 text-[10px] font-black text-slate-900">LIVE SINCE 2 AUG 2026</span>EU AI Act transparency + GPAI enforcement are live - run your free signed risk check -&gt;</a>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <a href="/dashboard?tab=home" className="rounded-2xl border border-white/15 bg-white/5 p-5 hover:bg-white/10 transition"><div className="text-sm font-black text-emerald-200">Your Council assistant</div><p className="mt-1 text-xs text-white/90">One identity: voice, character, passport.</p></a>
            <a href="/connect" className="rounded-2xl border border-white/15 bg-white/5 p-5 hover:bg-white/10 transition"><div className="text-sm font-black text-emerald-200">Connect socials</div><p className="mt-1 text-xs text-white/90">Give your AI character a face.</p></a>
            <a href="/globe" className="rounded-2xl border border-white/15 bg-white/5 p-5 hover:bg-white/10 transition"><div className="text-sm font-black text-emerald-200">The Council Globe</div><p className="mt-1 text-xs text-white/90">AI governance, layered on the world.</p></a>
            <a href="/council" className="rounded-2xl border border-white/15 bg-white/5 p-5 hover:bg-white/10 transition"><div className="text-sm font-black text-emerald-200">The Council</div><p className="mt-1 text-xs text-white/90">How the designed 33-agent council votes.</p></a>
            <a href="/registry" className="rounded-2xl border border-white/15 bg-white/5 p-5 hover:bg-white/10 transition"><div className="text-sm font-black text-emerald-200">The Registry</div><p className="mt-1 text-xs text-white/90">Every regulation, standard, protocol.</p></a>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="/try" className="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-800">Ask the Council -&gt;</a>
            <a href="/meok-law" className="rounded-xl border border-emerald-300/50 px-5 py-2.5 text-sm font-semibold text-emerald-50 hover:bg-white/10">Your jurisdiction stack -&gt;</a>
          </div>
        </div>
      </section>

      {/* SECTION 2: ECOSYSTEM DIAGRAM */}
      {/* ============================================ */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-6 max-w-7xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center mb-12"
          >
            <Badge className="mb-4 bg-emerald-100 text-emerald-700 border-emerald-200 text-sm px-4 py-1">
              Complete Integration
            </Badge>
            <h2 className="text-4xl md:text-4xl xl:text-5xl font-bold text-gray-900 mb-6">
              One Platform. <span className="text-emerald-600">Everything Connected.</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              See how CSOAI's systems work together — from global frameworks to local enforcement,
              from training to employment, from monitoring to prosperity.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scaleIn}
          >
            <Suspense fallback={<div className="min-h-[300px]" />}><EcosystemDiagram /></Suspense>
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION 3: THE CSOAI ADVANTAGE */}
      {/* ============================================ */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-red-100 text-red-700 border-red-200 text-sm px-4 py-1">
              The Problem & Solution
            </Badge>
            <h2 className="text-4xl md:text-4xl xl:text-5xl font-bold text-gray-900 mb-6">
              The CSOAI <span className="text-emerald-600">Advantage</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Unity from fragmentation. One operational platform integrating all global frameworks.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* The Problem */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <Card className="h-full border-2 border-red-200 bg-red-50/50">
                <CardHeader>
                  <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center mb-4">
                    <AlertTriangle className="h-7 w-7 text-red-600" />
                  </div>
                  <CardTitle className="text-2xl text-red-800">The Problem: Fragmentation</CardTitle>
                  <CardDescription className="text-red-700">
                    Today's AI governance landscape is chaos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    {
                      title: "Regional Silos",
                      desc: "EU does one thing, US another, China another. No coordination.",
                    },
                    {
                      title: "Enterprise Burden",
                      desc: "Companies must comply with 7+ frameworks separately — massive cost.",
                    },
                    {
                      title: "No Real Enforcement",
                      desc: "Governments can't monitor millions of AI systems. Compliance is voluntary.",
                    },
                    {
                      title: "Workers Left Behind",
                      desc: "AI displaces jobs but no mechanism exists to share AI's economic gains.",
                    },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-red-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-red-700 text-xs font-bold">✗</span>
                      </div>
                      <div>
                        <span className="font-semibold text-red-900">{item.title}:</span>{" "}
                        <span className="text-red-700">{item.desc}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* The Solution */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              transition={{ delay: 0.2 }}
            >
              <Card className="h-full border-2 border-emerald-200 bg-emerald-50/50">
                <CardHeader>
                  <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                    <CheckCircle className="h-7 w-7 text-emerald-600" />
                  </div>
                  <CardTitle className="text-2xl text-emerald-800">The Solution: CSOAI</CardTitle>
                  <CardDescription className="text-emerald-700">
                    One unified platform for all AI safety needs
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    {
                      title: "Unified Framework",
                      desc: "All 7 major frameworks synthesized into one operational system.",
                    },
                    {
                      title: "One Registration",
                      desc: "Register once, get compliance scores for ALL frameworks automatically.",
                    },
                    {
                      title: "24/7 AI Monitoring",
                      desc: "33 measurement agents monitor systems continuously. Continuous measurement, not paper promises.",
                    },
                    {
                      title: "Signed evidence",
                      desc: "AI revenues fund UBI for displaced workers. Everyone benefits from AI.",
                    },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-emerald-700 text-xs font-bold">✓</span>
                      </div>
                      <div>
                        <span className="font-semibold text-emerald-900">{item.title}:</span>{" "}
                        <span className="text-emerald-700">{item.desc}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION 3.5: COMPARISON TABLE */}
      {/* ============================================ */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-6 max-w-4xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-12"
          >
            <Badge className="mb-4 bg-emerald-100 text-emerald-700 border-emerald-200 text-sm px-4 py-1">
              Why Choose CSOAI?
            </Badge>
            <h2 className="text-4xl md:text-4xl xl:text-5xl font-bold text-gray-900 mb-6">
              The Only Platform <span className="text-emerald-600">Solving All Four Problems</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're not just a tool. We're building the infrastructure for safe AI governance—and creating jobs while we do it.
            </p>
          </motion.div>

          <Suspense fallback={<div className="min-h-[300px]" />}><ComparisonTable /></Suspense>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION 4: FOR EVERY STAKEHOLDER */}
      {/* ============================================ */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-6 max-w-7xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-emerald-100 text-emerald-700 border-emerald-200 text-sm px-4 py-1">
              Built for Everyone
            </Badge>
            <h2 className="text-4xl md:text-4xl xl:text-5xl font-bold text-gray-900 mb-6">
              For Every <span className="text-emerald-600">Stakeholder</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Whether you're a citizen, enterprise, government, or aspiring analyst —
              CSOAI has something transformative for you.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {/* Public Citizens */}
            <motion.div variants={fadeInUp}>
              <Card className="h-full border-2 hover:border-emerald-400 hover:shadow-xl transition-all duration-300 group">
                <CardHeader>
                  <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Users className="h-7 w-7 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">For Public Citizens</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    "Report AI incidents and concerns",
                    "Track case progress publicly",
                    "Verify AI system compliance",
                    "Hold companies accountable",
                    "Recompute any published figure yourself",
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-gray-600 text-sm">
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                  <Link href="/transparency">
                    <Button variant="outline" className="w-full mt-4 group-hover:bg-emerald-50 group-hover:border-emerald-300">
                      Public Dashboard
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            {/* Enterprises */}
            <motion.div variants={fadeInUp}>
              <Card className="h-full border-2 hover:border-emerald-400 hover:shadow-xl transition-all duration-300 group">
                <CardHeader>
                  <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Building2 className="h-7 w-7 text-purple-600" />
                  </div>
                  <CardTitle className="text-xl">For Enterprises</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    "The rail is free — verification free forever",
                    "Automated compliance assessments",
                    "Multi-framework support (7+)",
                    "Avoid fines up to €35M",
                    "Build customer trust",
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-gray-600 text-sm">
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                  <Link href="/enterprise">
                    <Button variant="outline" className="w-full mt-4 group-hover:bg-emerald-50 group-hover:border-emerald-300">
                      Enterprise Solutions
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            {/* Governments */}
            <motion.div variants={fadeInUp}>
              <Card className="h-full border-2 hover:border-emerald-400 hover:shadow-xl transition-all duration-300 group">
                <CardHeader>
                  <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Landmark className="h-7 w-7 text-amber-600" />
                  </div>
                  <CardTitle className="text-xl">For Governments</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    "Monitor compliance globally",
                    "Real-time enforcement data",
                    "International cooperation tools",
                    "Track violations and penalties",
                    "Access aggregated risk reports",
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-gray-600 text-sm">
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                  <Link href="/government-dashboard">
                    <Button variant="outline" className="w-full mt-4 group-hover:bg-emerald-50 group-hover:border-emerald-300">
                      Government Dashboard
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            {/* AI Safety Analysts */}
            <motion.div variants={fadeInUp}>
              <Card className="h-full border-2 border-emerald-300 bg-emerald-50/50 hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
                <CardHeader>
                  <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <UserCheck className="h-7 w-7 text-emerald-600" />
                  </div>
                  <CardTitle className="text-xl">For AI Safety Analysts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    "ALL 33 courses completely FREE",
                    "Signed, verifiable attestation — free",
                    "Open analyst roster — no license fee",
                    "Marketplace rates published once measured",
                    "Join a growing profession",
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-gray-600 text-sm">
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                  <Link href="/training">
                    <Button className="w-full mt-4 bg-emerald-700 hover:bg-emerald-800 text-white">
                      Start Free Training
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION 5: OUR FRAMEWORKS */}
      {/* ============================================ */}
      <section className="py-16 md:py-24 bg-slate-900 text-white">
        <div className="container mx-auto px-6 max-w-7xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-emerald-500/20 text-emerald-400 border-emerald-400/30 text-sm px-4 py-1">
              Global Coverage
            </Badge>
            <h2 className="text-4xl md:text-4xl xl:text-5xl font-bold mb-6">
              Our <span className="text-emerald-400">7 Frameworks</span>
            </h2>
            <p className="text-xl text-gray-500 max-w-3xl mx-auto">
              Master every major AI governance framework. One platform, complete global coverage.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {frameworks.map((framework, index) => (
              <motion.div key={framework.id} variants={fadeInUp}>
                <Card className="h-full bg-white/5 border-white/10 hover:bg-white/10 hover:border-emerald-500/30 transition-all duration-300 group">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${framework.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <framework.icon className="h-6 w-6 text-white" />
                      </div>
                      <Badge variant="outline" className="text-gray-500 border-gray-600">
                        {framework.year}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg text-white">{framework.name}</CardTitle>
                    <p className="text-sm text-emerald-400">{framework.region}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-500 leading-relaxed">{framework.description}</p>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-white/10 text-gray-300 border-0">{framework.articles}</Badge>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Link href={getFrameworkGuideUrl(framework.id)}>
                        <Button variant="ghost" size="sm" className="text-gray-500 hover:text-white hover:bg-white/10">
                          Learn More
                        </Button>
                      </Link>
                      <Link href="/training">
                        <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white">
                          Start Training
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION 5.5: GOVERNANCE NETWORK */}
      {/* ============================================ */}
      <Suspense fallback={<div className="min-h-[300px]" />}><GovernanceNetwork /></Suspense>

      {/* ============================================ */}
      {/* SECTION 8: THE MEASUREMENT — every number here has an evidence file */}
      {/* ============================================ */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeInUp} className="text-center mb-14"
          >
            <Badge className="mb-4 bg-slate-900 text-white border-slate-900 text-sm px-4 py-1">
              Measured, not asserted
            </Badge>
            <h2 className="text-4xl md:text-4xl xl:text-5xl font-bold text-gray-900 mb-6">
              We publish the number that<br className="hidden md:block" />
              <span className="text-slate-500"> makes our own model look bad.</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Anyone can publish a benchmark they win. The test of a measurement body is what it
              does with a result it does not like. Here is ours, on the same page as the one we
              are proud of.
            </p>
          </motion.div>

          {/* The two halves of the same trade */}
          <div className="grid md:grid-cols-2 gap-6 mb-14">
            <Card className="border-2 border-emerald-200 bg-emerald-50/60 p-8">
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700 mb-3">
                What our model does well
              </p>
              <div className="text-4xl font-black text-emerald-700 mb-2">19 / 19</div>
              <p className="text-emerald-900 font-medium mb-4">
                EU AI Act prohibited practices refused
              </p>
              <p className="text-sm text-emerald-800/80">
                Council-34, a 1.5-billion-parameter model. Its size-matched base refuses 3 of 19. A
                model <strong>thirteen times larger</strong> refuses 8 of 18. Social scoring,
                emotion inference, biometric identification, predictive policing — all of it,
                every time.
              </p>
            </Card>

            <Card className="border-2 border-rose-200 bg-rose-50/60 p-8">
              <p className="text-sm font-semibold uppercase tracking-wide text-rose-700 mb-3">
                What it cost — published here, by us
              </p>
              <div className="text-4xl font-black text-rose-700 mb-2">−27.9 pts</div>
              <p className="text-rose-900 font-medium mb-4">
                general reasoning, against the model we trained it from
              </p>
              <p className="text-sm text-rose-800/80">
                ARC-Easy, a public benchmark we did not write: 0.574 against the base model's
                0.853. The intervals separate cleanly, so this is a real loss and not noise.
                Narrow training bought that refusal rate and this is the bill.
              </p>
            </Card>
          </div>

          {/* The instrument */}
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeInUp} className="mb-14"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-2">The instrument behind it</h3>
            <p className="text-gray-600 mb-6">
              {/* Counts derived from GET /api/gspc (ADR-001) — this read "Thirteen measured
                  axis on a 14-slot board", typed, and went stale when the board was swept. */}
              {board.public_count} — frozen benchmarks, open on Hugging Face and Kaggle with the scoring code,
              so you can recompute any figure we publish, or disagree with any answer key. A slot with no run
              behind it is published UNMEASURED, never folded into the measured count.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse min-w-[34rem]">
                <thead>
                  <tr className="border-b border-gray-300 text-left text-gray-500 uppercase text-xs tracking-wide">
                    <th className="py-2 pr-4">Axis</th>
                    <th className="py-2 pr-4">What it decides</th>
                    <th className="py-2 pr-4 text-right">Items</th>
                    <th className="py-2 text-right">Usable n</th>
                  </tr>
                </thead>
                <tbody className="text-gray-800">
                  {[
                    ["Governance", "EU AI Act risk tier", 24, 23],
                    ["Safety", "calibrated refusal", 14, 13],
                    ["Provenance", "C2PA manifest survival", 15, 7],
                    ["Continuity", "post-quantum migration", 13, 6],
                    ["Conformance", "tool-contract conformance", 11, 5],
                    ["Openness", "licence vs intended use", 13, 7],
                  ].map(([a, t, n, u]) => (
                    <tr key={a as string} className="border-b border-gray-100">
                      <td className="py-2 pr-4 font-medium">{a}</td>
                      <td className="py-2 pr-4 text-gray-600">{t}</td>
                      <td className="py-2 pr-4 text-right tabular-nums">{n}</td>
                      <td className="py-2 text-right tabular-nums">{u}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-500 mt-4 border-l-2 border-gray-300 pl-4">
              <strong className="text-gray-700">Usable n is the honest column.</strong> It counts
              only items that actually separate one model from another — dead items and items that
              score backwards are excluded. Not one axis yet reaches the 30 needed for a 95%
              interval to narrow to ±0.17, <strong className="text-gray-700">so we quote no
              intervals on them, including our own</strong>. You will not find that column on
              anyone else's benchmark.
            </p>
          </motion.div>

          {/* Try it */}
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeInUp}
            className="rounded-xl border-2 border-slate-900 bg-slate-900 text-white p-8 md:p-10"
          >
            <h3 className="text-2xl md:text-3xl font-bold mb-3">
              Score yourself against the models.
            </h3>
            <p className="text-slate-300 mb-6 max-w-2xl">
              Six training arenas serve the same frozen items, marked by the same published key,
              and place you against the 29 AI models we measured on them. You see the statutory
              provision behind every answer, so you can argue with the key instead of trusting it.
              It is training — we are a measurement body and we accredit nobody.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="/arena/" className="inline-flex items-center rounded-lg bg-white px-5 py-3 font-semibold text-slate-900 hover:bg-slate-100">
                Open the arenas <ArrowRight className="ml-2 h-4 w-4" />
              </a>
              <a href="/benchmarks" className="inline-flex items-center rounded-lg border border-slate-600 px-5 py-3 font-semibold text-white hover:bg-slate-800">
                See every measured figure
              </a>
              <a href="https://huggingface.co/csoai" className="inline-flex items-center rounded-lg border border-slate-600 px-5 py-3 font-semibold text-white hover:bg-slate-800">
                Take the datasets
              </a>
            </div>
          </motion.div>
        </div>
      </section>


      {/* ============================================ */}
      {/* SECTION 9: TRAINING & CERTIFICATION */}
      {/* ============================================ */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <Badge className="mb-4 bg-emerald-100 text-emerald-700 border-emerald-200 text-sm px-4 py-1">
                Jump-Start Your Career
              </Badge>
              <h2 className="text-4xl md:text-4xl xl:text-5xl font-bold text-gray-900 mb-6">
                ALL 33 Courses <span className="text-emerald-600">100% FREE</span>
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                AI Safety Analyst is projected to be a top-10 profession by 2045.
                Get ahead now with completely free training — attestation is free, and verification is free forever.
              </p>

              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                {[
                  { value: "Open", label: "Training Courses", icon: BookOpen },
                  { value: "FREE", label: "Cost", icon: DollarSign },
                  { value: "7", label: "Frameworks", icon: Globe2 },
                  { value: "Signed", label: "Verifiable Records", icon: TrendingUp },
                ].map((stat, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <stat.icon className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{stat.value}</div>
                      <div className="text-sm text-gray-500">{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/training">
                  <Button size="lg" className="bg-emerald-700 hover:bg-emerald-800 text-white">
                    <GraduationCap className="mr-2 h-5 w-5" />
                    Start Free Training
                  </Button>
                </Link>
                <Link href="/certification">
                  <Button size="lg" variant="outline">
                    <BadgeCheck className="mr-2 h-5 w-5" />
                    Get Attested
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={scaleIn}
            >
              <Card className="border-2 border-emerald-200 shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-600 to-green-600 p-6 text-white">
                  <h3 className="text-2xl font-bold mb-2">Your Path to Success</h3>
                  <p className="text-emerald-100">Three steps to a new career</p>
                </div>
                <CardContent className="p-6 space-y-6">
                  {[
                    {
                      step: "1",
                      title: "Train for Free",
                      desc: "Complete ALL 33 courses on 7 frameworks. 100% online, self-paced, completely FREE.",
                    },
                    {
                      step: "2",
                      title: "Get Attested",
                      desc: "Complete the attestation exam — free. Your record is signed and independently verifiable forever.",
                    },
                    {
                      step: "3",
                      title: "Join the Roster",
                      desc: "Join the open analyst roster — no license fee. Rates are set by the market and published as measured aggregates once live.",
                    },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-emerald-700 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">
                        {item.step}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 mb-1">{item.title}</h4>
                        <p className="text-gray-600 text-sm">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION 10: LICENSING & COMPLIANCE */}
      {/* ============================================ */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={scaleIn}
              className="order-2 lg:order-1"
            >
              <Card className="border-2 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-t-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center">
                      <Shield className="h-7 w-7 text-emerald-400" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">CSOAI Attestation</CardTitle>
                      <CardDescription className="text-gray-500">AI System Compliance Badge</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {[
                      { label: "EU AI Act Compliance", score: "Run check" },
                      { label: "NIST AI RMF Alignment", score: "Run check" },
                      { label: "ISO 42001 Readiness", score: "Run check" },
                      { label: "Overall Safety Score", score: "—" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-700">{item.label}</span>
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">{item.score}</Badge>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <div className="flex items-center gap-2 text-emerald-700">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-semibold">Verified by Council</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="order-1 lg:order-2"
            >
              <Badge className="mb-4 bg-slate-100 text-slate-700 border-slate-200 text-sm px-4 py-1">
                Regulatory Body
              </Badge>
              <h2 className="text-4xl md:text-4xl xl:text-5xl font-bold text-gray-900 mb-6">
                Licensing & <span className="text-emerald-600">Compliance</span>
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                We license AI systems for safety compliance. Ongoing monitoring.
                Assessment against all frameworks. Global recognition.
              </p>

              <div className="space-y-4 mb-8">
                {[
                  "One registration covers ALL 7 frameworks",
                  "Automated compliance scoring in real-time",
                  "Continuous monitoring by Council",
                  "Public transparency badges for trust",
                  "Avoid fines up to €35M (EU AI Act)",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>

              <Link href="/enterprise">
                <Button size="lg" className="bg-emerald-700 hover:bg-emerald-800 text-white">
                  Register Your AI System
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION 11: TRUST SIGNALS */}
      {/* ============================================ */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-emerald-100 text-emerald-700 border-emerald-200 text-sm px-4 py-1">
              Trust & Credibility
            </Badge>
            <h2 className="text-4xl md:text-4xl xl:text-5xl font-bold text-gray-900 mb-6">
              Built on <span className="text-emerald-600">Transparency</span>
            </h2>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-4 gap-6 mb-16"
          >
            {[
              { value: "52", label: "Charter Articles", desc: "Comprehensive governance" },
              { value: "33", label: "AI Agents", desc: "Multi-provider diversity" },
              { value: "24/7", label: "Monitoring", desc: "Continuous oversight" },
              { value: "100%", label: "Transparent", desc: "All decisions public" },
            ].map((stat, i) => (
              <motion.div key={i} variants={fadeInUp}>
                <Card className="text-center p-6 border-2 hover:border-emerald-300 transition-all">
                  <div className="text-4xl font-black text-emerald-600 mb-2">{stat.value}</div>
                  <div className="font-semibold text-gray-900 mb-1">{stat.label}</div>
                  <div className="text-sm text-gray-500">{stat.desc}</div>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Design principle — our own words, honestly attributed */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scaleIn}
          >
            <Card className="border-2 border-emerald-200 bg-emerald-50/50 p-8 md:p-12">
              <div className="max-w-3xl mx-auto text-center">
                <Quote className="h-12 w-12 text-emerald-300 mx-auto mb-6" />
                <p className="text-xl md:text-2xl text-gray-700 italic leading-relaxed mb-6">
                  "We built CSOAI on a simple principle: measure what is real, sign what
                  we publish, and never claim what we cannot show. Governance that works
                  is governance you can audit."
                </p>
                <div className="flex items-center justify-center gap-4">
                  <div className="w-12 h-12 bg-emerald-200 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-emerald-700" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-900">CSOAI</div>
                    <div className="text-sm text-gray-500">Design principle</div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Founding Council CTA */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="mt-16 text-center"
          >
            <div className="inline-flex flex-col items-center gap-4 p-8 bg-gradient-to-br from-emerald-50 to-white border-2 border-emerald-200 rounded-2xl">
              <Crown className="h-10 w-10 text-emerald-600" />
              <h3 className="text-xl font-bold text-slate-900">Become a Founding Member</h3>
              <p className="text-gray-600 max-w-md">
                Join the founding council and help shape the future of AI safety governance.
                Limited to 100 founding members worldwide.
              </p>
              <Link href="/founding-council-agreement">
                <Button className="bg-emerald-700 hover:bg-emerald-800 text-white">
                  Apply for Founding Membership
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION 11.5: TESTIMONIALS */}
      {/* ============================================ */}
      <Suspense fallback={<div className="min-h-[300px]" />}><Testimonials /></Suspense>

      {/* ============================================ */}
      {/* SECTION 12: FAQ */}
      {/* ============================================ */}
      <section className="py-16 md:py-24 bg-gray-50">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
        <div className="container mx-auto px-6 max-w-4xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-emerald-100 text-emerald-700 border-emerald-200 text-sm px-4 py-1">
              Got Questions?
            </Badge>
            <h2 className="text-4xl md:text-4xl xl:text-5xl font-bold text-gray-900 mb-6">
              Frequently Asked <span className="text-emerald-600">Questions</span>
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="bg-white border-2 border-gray-200 rounded-xl px-6 data-[state=open]:border-emerald-300 transition-all"
                >
                  <AccordionTrigger className="text-left font-semibold text-gray-900 hover:text-emerald-600 py-5">
                    <div className="flex items-center gap-3">
                      <HelpCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                      {faq.question}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 leading-relaxed pb-5">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <div className="text-center mt-8">
              <Link href="/faq">
                <Button variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                  View All 60+ FAQs <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION 12.5: RESOURCES & TOOLS */}
      {/* ============================================ */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6 max-w-7xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-blue-100 text-blue-700 border-blue-200 text-sm px-4 py-1">
              Resources & Tools
            </Badge>
            <h2 className="text-4xl md:text-4xl xl:text-5xl font-bold text-gray-900 mb-6">
              Everything You Need to <span className="text-emerald-600">Get Started</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Free tools, guides, and resources to help your organization navigate AI governance with confidence.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[
              {
                title: "AI Governance Readiness Assessment",
                description: "Take our free 5-minute assessment to evaluate your organization's AI governance maturity and get personalized recommendations.",
                href: "/assess",
                icon: Target,
                color: "bg-blue-500",
                badge: "Free Tool",
              },
              {
                title: "Global Regulation Tracker",
                description: "Track AI governance frameworks across 30+ jurisdictions in real-time. Filter by region, status, and framework type.",
                href: "/global-regulations",
                icon: Globe2,
                color: "bg-emerald-500",
                badge: "International",
              },
              {
                title: "AI Glossary",
                description: "60+ AI governance terms defined clearly. From algorithmic accountability to zero-shot learning — everything you need to know.",
                href: "/glossary",
                icon: BookOpen,
                color: "bg-purple-500",
                badge: "Glossary",
              },
              {
                title: "Industry Solutions",
                description: "Tailored governance frameworks for Financial Services, Healthcare, Government, Technology, and 4 more sectors.",
                href: "/industry-solutions",
                icon: Building2,
                color: "bg-orange-500",
                badge: "8 Sectors",
              },
              {
                title: "Case Studies",
                description: "See how organizations worldwide are implementing AI governance with CSOAI. Real results, real impact.",
                href: "/case-studies",
                icon: TrendingUp,
                color: "bg-green-500",
                badge: "Real-World",
              },
              {
                title: "Trust Center",
                description: "Our security practices, compliance frameworks, data protection measures, and infrastructure details.",
                href: "/trust-center",
                icon: Shield,
                color: "bg-slate-600",
                badge: "Security",
              },
            ].map((resource, index) => (
              <Link key={index} href={resource.href}>
                <Card className="h-full border-2 border-gray-100 hover:border-emerald-200 hover:shadow-lg transition-all duration-300 cursor-pointer group">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`${resource.color} p-3 rounded-xl text-white`}>
                        <resource.icon className="h-6 w-6" />
                      </div>
                      <Badge variant="outline" className="text-xs">{resource.badge}</Badge>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-emerald-700 transition-colors mb-2">
                      {resource.title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {resource.description}
                    </p>
                    <div className="mt-4 flex items-center text-emerald-600 text-sm font-medium group-hover:gap-2 transition-all">
                      Explore <ArrowRight className="ml-1 h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </motion.div>

          <div className="text-center mt-12 flex flex-wrap justify-center gap-4 px-4">
            <Link href="/partners">
              <Button variant="outline" size="lg" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                Partners & Advisory
              </Button>
            </Link>
            <Link href="/compare">
              <Button size="lg" className="bg-emerald-700 hover:bg-emerald-800 text-white">
                Why Choose CSOAI <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION 13: FINAL CTA */}
      {/* ============================================ */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-emerald-600 via-green-600 to-teal-600 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
              backgroundSize: "32px 32px",
            }}
          />
        </div>

        <div className="container mx-auto px-6 max-w-5xl relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center"
          >
            <h2 className="text-4xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
              Join the Movement
            </h2>
            <p className="text-xl md:text-2xl text-emerald-100 mb-12 max-w-3xl mx-auto leading-relaxed">
              The future of AI safety starts with you. Choose your path and become
              part of humanity's unified response to AI.
            </p>

            <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
              {[
                {
                  title: "Start Training",
                  desc: "Free courses, attestation, career",
                  icon: GraduationCap,
                  link: "/training",
                  primary: true,
                },
                {
                  title: "Enterprise",
                  desc: "Register systems, ensure compliance",
                  icon: Building2,
                  link: "/enterprise",
                  primary: false,
                },
                {
                  title: "Founding Member",
                  desc: "Shape the future, exclusive benefits",
                  icon: Crown,
                  link: "/founding-members",
                  primary: false,
                },
              ].map((path, i) => (
                <Link key={i} href={path.link}>
                  <Card className={`h-full cursor-pointer transition-all hover:scale-105 ${
                    path.primary
                      ? "bg-white border-white shadow-xl"
                      : "bg-white/10 border-white/20 hover:bg-white/20"
                  }`}>
                    <CardContent className="p-6 text-center">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 ${
                        path.primary ? "bg-emerald-100" : "bg-white/10"
                      }`}>
                        <path.icon className={`h-7 w-7 ${path.primary ? "text-emerald-600" : "text-white"}`} />
                      </div>
                      <h3 className={`text-lg font-bold mb-2 ${path.primary ? "text-gray-900" : "text-white"}`}>
                        {path.title}
                      </h3>
                      <p className={`text-sm ${path.primary ? "text-gray-600" : "text-emerald-100"}`}>
                        {path.desc}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/charter">
                <Button size="lg" className="bg-white text-emerald-600 hover:bg-gray-100 px-8 py-6 text-lg font-semibold rounded-xl shadow-lg">
                  <FileText className="mr-2 h-5 w-5" />
                  Read the Charter
                </Button>
              </Link>
              <Link href="/jobs">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white/10 px-8 py-6 text-lg font-semibold rounded-xl"
                >
                  <Briefcase className="mr-2 h-5 w-5" />
                  Browse Jobs
                </Button>
              </Link>
            </div>

            <p className="text-emerald-200 mt-8 text-sm">
              Questions? Contact us at{" "}
              <a href="mailto:contact@csoai.org" className="underline hover:text-white">
                contact@csoai.org
              </a>
            </p>
          </motion.div>
        </div>
      </section>

      <SpotInfographic title={L4.spotTitle} stats={L4.spotStats} source={L4.spotSource} />
    </div>
  );
}
