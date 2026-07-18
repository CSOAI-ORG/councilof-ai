/**
 * CSOAI Homepage - Complete Professional Redesign
 * The most impressive AI safety platform homepage ever created
 * Brand: White and emerald green (csoai.org)
 */

import { Link } from "wouter";
import { motion } from "framer-motion";
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
  Play,
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
  ExternalLink,
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
import AnimatedParticles from "@/components/AnimatedParticles";
import EcosystemDiagram from "@/components/EcosystemDiagram";
import CouncilVisualization from "@/components/CouncilVisualization";
import EUAIActCountdown from "@/components/EUAIActCountdown";
import ComparisonTable from "@/components/ComparisonTable";
import GovernanceNetwork from "@/components/GovernanceNetwork";
import ZeroSafetySection from "@/components/ZeroSafetySection";
import Testimonials from "@/components/Testimonials";

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
    description: "The world's first comprehensive AI law. Risk-based approach covering all AI systems in the EU market.",
    articles: "113 Articles",
    icon: Flag,
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-[#9CA6C9]/5",
    borderColor: "border-[#9CA6C9]/20",
    textColor: "text-[#9CA6C9]",
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
    bgColor: "bg-destructive/5",
    borderColor: "border-destructive/20",
    textColor: "text-destructive",
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
    bgColor: "bg-[#9CA6C9]/5",
    borderColor: "border-[#9CA6C9]/20",
    textColor: "text-[#9CA6C9]",
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
    textColor: "text-[#C8A873]",
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
    bgColor: "bg-[#9CA6C9]/5",
    borderColor: "border-[#9CA6C9]/20",
    textColor: "text-[#9CA6C9]",
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
    bgColor: "bg-primary/5",
    borderColor: "border-primary/20",
    textColor: "text-primary",
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
    bgColor: "bg-[#D98C7E]/5",
    borderColor: "border-[#D98C7E]/20",
    textColor: "text-[#D98C7E]",
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

// FAQ data
const faqs = [
  {
    question: "What is CSOAI?",
    answer: "CSOAI (Civil Society Oversight of AI) is the world's first relationship-based AI safety infrastructure organization. We provide operational infrastructure for AI governance, combining licensing, training, monitoring, and economic redistribution into one unified platform. Unlike think tanks, we offer market-driven enforcement and real operational systems.",
  },
  {
    question: "How do I get certified as an AI Safety Analyst?",
    answer: "Getting certified is a 3-step process: First, complete our free comprehensive training covering EU AI Act, NIST AI RMF, ISO 42001, and other frameworks. Second, pass the certification examination to prove your competency. Third, apply for positions in our job marketplace. The entire process can be completed online at your own pace.",
  },
  {
    question: "Is training really free?",
    answer: "Yes, ALL 33 courses are 100% free - including Foundation courses, Regional Compliance courses (EU AI Act, NIST, UK, Canada, Australia), and all Industry Specialization courses. The only costs are the certification exam (£49 one-time) and the Analyst License (£199/year or £19.99/month) which is only required if you want to work as a paid analyst.",
  },
  {
    question: "How does the Byzantine Council work?",
    answer: "The Byzantine Council consists of 33 AI agents from multiple providers (including GPT-4, Claude, Gemini, and others). Any safety decision requires 23 of 33 agents (70%) to reach consensus - this is Byzantine fault tolerance. No single AI provider can manipulate outcomes. Human analysts provide final oversight on all critical decisions.",
  },
  {
    question: "What frameworks does CSOAI cover?",
    answer: "We cover 7 major global frameworks: EU AI Act (Europe), NIST AI RMF (USA), ISO 42001 (International), TC260 (China), UK AI Safety Institute guidelines (UK), Singapore Model AI Governance (APAC), and the new South Korea AI Framework Act (2026). Our platform synthesizes all of these into one operational system.",
  },
  {
    question: "How does the Prosperity Fund work?",
    answer: "The Prosperity Fund is funded by AI company contributions (1-20% of revenues, scaled by risk level) - NOT by analyst fees. This funds Universal Basic Income for workers displaced by AI. When AI-caused unemployment reaches 20%, the first UBI tier activates. At 40%, the second tier activates, and at 70%, full UBI is provided. The goal is £100B+ to protect humanity's economic future.",
  },
  {
    question: "Can I earn money as an AI Safety Analyst?",
    answer: "Absolutely! Certified analysts earn £45-150/hour depending on experience and specialization. You can work remotely, set your own hours, and choose which AI systems to monitor. Top analysts working full-time can earn £100,000-300,000+ annually. Our job marketplace connects you directly with enterprises needing compliance monitoring.",
  },
  {
    question: "How do enterprises register AI systems?",
    answer: "Enterprises can register AI systems through our Enterprise portal. The process involves: describing your AI system, self-assessing risk level (minimal, limited, high, or unacceptable), uploading documentation, and receiving automated compliance assessments against all 7 frameworks. Ongoing monitoring is provided through the Byzantine Council.",
  },
];

export default function NewHomeV2() {
  return (
    <div className="min-h-screen bg-card">
      {/* ============================================ */}
      {/* SECTION 1: HERO */}
      {/* ============================================ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden meok-gradient">
        {/* Background image overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: "url(/hero-epic.png)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/90 via-emerald-900/70 to-slate-900/95" />

        {/* Animated particles */}
        <AnimatedParticles />

        {/* Hero content */}
        <div className="relative z-10 container mx-auto px-6 py-24 text-center max-w-6xl">
          {/* Launch badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 rounded-full px-5 py-2.5 mb-4"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-primary text-sm font-medium">
              Launching January 15, 2026 | Join 10,000+ Early Members
            </span>
          </motion.div>

          {/* Why We're Different badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 bg-[#C8A873]/20 border border-[#C8A873]/30 rounded-full px-5 py-2.5 mb-6"
          >
            <BadgeCheck className="h-4 w-4 text-[#C8A873]" />
            <span className="text-[#C8A873] text-sm font-medium">
              100% Free Training | Only Pay When You Earn
            </span>
          </motion.div>

          {/* EU AI Act Countdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mb-10"
          >
            <EUAIActCountdown />
          </motion.div>

          {/* Main headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight tracking-tight"
          >
            Unifying the World's
            <br />
            <span className="bg-gradient-to-r from-[#C8A873] via-[#D98C7E] to-[#7D8C7E] bg-clip-text text-transparent">
              Response to AI
            </span>
          </motion.h1>

          {/* Sub-headline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="text-xl md:text-2xl text-muted-foreground mb-6 max-w-4xl mx-auto leading-relaxed"
          >
            From fragmentation to unity. Training, licensing, monitoring, and prosperity
            <span className="text-primary font-semibold"> — one platform</span> for
            humanity's AI safety future.
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto"
          >
            The world's first relationship-based AI safety infrastructure.
            Partnership, not control. Prosperity, not fear.
          </motion.p>

          {/* Choose Your Path - Role-based CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="mb-16"
          >
            <p className="text-muted-foreground text-sm mb-4">Choose your path:</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/training">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary text-white px-6 py-6 text-base font-semibold rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all group"
                >
                  <GraduationCap className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                  I Want to Become an Analyst
                </Button>
              </Link>
              <Link href="/pricing">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-blue-400/50 text-[#9CA6C9] hover:bg-[#9CA6C9]/10 hover:border-blue-400 px-6 py-6 text-base font-semibold rounded-xl transition-all"
                >
                  <Building className="mr-2 h-5 w-5" />
                  I'm an Enterprise / Government
                </Button>
              </Link>
              <Link href="/watchdog">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-purple-400/50 text-[#9CA6C9] hover:bg-[#9CA6C9]/10 hover:border-purple-400 px-6 py-6 text-base font-semibold rounded-xl transition-all"
                >
                  <Eye className="mr-2 h-5 w-5" />
                  I'm a Concerned Citizen
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
          >
            {[
              { value: "52", label: "Charter Articles", icon: FileText },
              { value: "33", label: "AI Agents", icon: Shield },
              { value: "7", label: "Frameworks", icon: Globe2 },
              { value: "£100B+", label: "Prosperity Fund Goal", icon: DollarSign },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.9 + index * 0.1 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-2xl blur-xl group-hover:from-emerald-500/30 transition-all" />
                <div className="relative bg-card/40 backdrop-blur-sm border border-border rounded-2xl p-6 hover:border-primary/30 transition-all">
                  <stat.icon className="h-6 w-6 text-primary mx-auto mb-2" />
                  <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-muted-foreground"
            >
              <ChevronDown className="h-8 w-8" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION 1.25: ZERO AI SAFETY SOLUTIONS */}
      {/* ============================================ */}
      <ZeroSafetySection />

      {/* ============================================ */}
      {/* SECTION 1.5: WHY AI SAFETY MATTERS NOW */}
      {/* ============================================ */}
      <section className="py-20 meok-gradient text-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-12"
          >
            <Badge className="mb-4 bg-destructive/20 text-destructive border-destructive/30 text-sm px-4 py-1">
              The Crisis Is Real
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Why AI Safety Matters <span className="text-destructive">Right Now</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Every day, AI systems make decisions affecting millions of lives—often without proper oversight.
              These aren't hypothetical risks. They're happening today.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              {
                icon: "👤",
                title: "Hiring Discrimination",
                stat: "2x",
                desc: "AI hiring tools have rejected qualified women at twice the rate of men",
                impact: "Millions of career opportunities lost",
              },
              {
                icon: "🏥",
                title: "Medical Errors",
                stat: "30%",
                desc: "AI diagnostic tools show significant error rates in diverse populations",
                impact: "Lives put at risk by biased training data",
              },
              {
                icon: "💰",
                title: "Financial Bias",
                stat: "£4.5B",
                desc: "Annual cost of AI-driven lending discrimination globally",
                impact: "Families denied loans, homes, opportunities",
              },
              {
                icon: "🚗",
                title: "Autonomous Failures",
                stat: "400+",
                desc: "Reported autonomous vehicle incidents requiring investigation",
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
                <Card className="h-full bg-card/40 border-border hover:bg-card/60 transition-colors">
                  <CardContent className="p-6">
                    <div className="text-4xl mb-3">{item.icon}</div>
                    <h3 className="font-bold text-white mb-2">{item.title}</h3>
                    <div className="text-3xl font-bold text-destructive mb-2">{item.stat}</div>
                    <p className="text-muted-foreground text-sm mb-3">{item.desc}</p>
                    <p className="text-destructive text-xs font-medium">{item.impact}</p>
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
            <p className="text-lg text-muted-foreground mb-6">
              <strong className="text-white">Without proper oversight:</strong> Companies deploy AI without safety checks.
              Governments can't scale monitoring. Workers lose jobs with no support.
              <strong className="text-primary"> CSOAI fixes all three.</strong>
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/training">
                <Button size="lg" className="bg-primary hover:bg-primary text-white">
                  <Shield className="mr-2 h-5 w-5" />
                  Become an AI Safety Analyst
                </Button>
              </Link>
              <Link href="/about">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-card/60">
                  Learn How We Solve This
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION 2: ECOSYSTEM DIAGRAM */}
      {/* ============================================ */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6 max-w-7xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center mb-12"
          >
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 text-sm px-4 py-1">
              Complete Integration
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              One Platform. <span className="text-primary">Everything Connected.</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
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
            <EcosystemDiagram />
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION 3: THE CSOAI ADVANTAGE */}
      {/* ============================================ */}
      <section className="py-24 bg-card">
        <div className="container mx-auto px-6 max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-destructive/10 text-destructive border-destructive/20 text-sm px-4 py-1">
              The Problem & Solution
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              The CSOAI <span className="text-primary">Advantage</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
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
              <Card className="h-full border-2 border-destructive/20 bg-destructive/5">
                <CardHeader>
                  <div className="w-14 h-14 bg-destructive/10 rounded-xl flex items-center justify-center mb-4">
                    <AlertTriangle className="h-7 w-7 text-destructive" />
                  </div>
                  <CardTitle className="text-2xl text-destructive">The Problem: Fragmentation</CardTitle>
                  <CardDescription className="text-destructive">
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
                        <span className="text-destructive text-xs font-bold">✗</span>
                      </div>
                      <div>
                        <span className="font-semibold text-destructive">{item.title}:</span>{" "}
                        <span className="text-destructive">{item.desc}</span>
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
              <Card className="h-full border-2 border-primary/20 bg-primary/5">
                <CardHeader>
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <CheckCircle className="h-7 w-7 text-primary" />
                  </div>
                  <CardTitle className="text-2xl text-primary">The Solution: CSOAI</CardTitle>
                  <CardDescription className="text-primary">
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
                      desc: "33 AI agents monitor systems continuously. Real enforcement, not paper.",
                    },
                    {
                      title: "Prosperity Fund",
                      desc: "AI revenues fund UBI for displaced workers. Everyone benefits from AI.",
                    },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-primary text-xs font-bold">✓</span>
                      </div>
                      <div>
                        <span className="font-semibold text-emerald-900">{item.title}:</span>{" "}
                        <span className="text-primary">{item.desc}</span>
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
      <section className="py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-6 max-w-4xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-12"
          >
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 text-sm px-4 py-1">
              Why Choose CSOAI?
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              The Only Platform <span className="text-primary">Solving All Four Problems</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              We're not just a tool. We're building the infrastructure for safe AI governance—and creating jobs while we do it.
            </p>
          </motion.div>

          <ComparisonTable />
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION 4: FOR EVERY STAKEHOLDER */}
      {/* ============================================ */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6 max-w-7xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 text-sm px-4 py-1">
              Built for Everyone
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              For Every <span className="text-primary">Stakeholder</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
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
                    <Users className="h-7 w-7 text-[#9CA6C9]" />
                  </div>
                  <CardTitle className="text-xl">For Public Citizens</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    "Report AI incidents and concerns",
                    "Track case progress publicly",
                    "Verify AI system compliance",
                    "Hold companies accountable",
                    "Access Prosperity Fund benefits",
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-muted-foreground text-sm">
                      <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                  <Link href="/transparency">
                    <Button variant="outline" className="w-full mt-4 group-hover:bg-primary/5 group-hover:border-emerald-300">
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
                    <Building2 className="h-7 w-7 text-[#9CA6C9]" />
                  </div>
                  <CardTitle className="text-xl">For Enterprises</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    "Registration from £1,500/year",
                    "Automated compliance assessments",
                    "Multi-framework support (7+)",
                    "Avoid fines up to €35M",
                    "Build customer trust",
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-muted-foreground text-sm">
                      <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                  <Link href="/enterprise">
                    <Button variant="outline" className="w-full mt-4 group-hover:bg-primary/5 group-hover:border-emerald-300">
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
                  <div className="w-14 h-14 bg-[#C8A873]/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Landmark className="h-7 w-7 text-[#C8A873]" />
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
                    <div key={i} className="flex items-center gap-2 text-muted-foreground text-sm">
                      <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                  <Link href="/government-dashboard">
                    <Button variant="outline" className="w-full mt-4 group-hover:bg-primary/5 group-hover:border-emerald-300">
                      Government Dashboard
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            {/* AI Safety Analysts */}
            <motion.div variants={fadeInUp}>
              <Card className="h-full border-2 border-emerald-300 bg-primary/5 hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
                <div className="absolute top-4 right-4">
                  <Badge className="bg-primary text-white">Most Popular</Badge>
                </div>
                <CardHeader>
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <UserCheck className="h-7 w-7 text-primary" />
                  </div>
                  <CardTitle className="text-xl">For AI Safety Analysts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    "ALL 33 courses completely FREE",
                    "Industry-recognized certification (£49 exam)",
                    "Analyst License: £199/year",
                    "Earn £45-150/hour remotely",
                    "Join a growing profession",
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-muted-foreground text-sm">
                      <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                  <Link href="/training">
                    <Button className="w-full mt-4 bg-primary hover:bg-primary text-white">
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
      <section className="py-24 bg-slate-900 text-white">
        <div className="container mx-auto px-6 max-w-7xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-primary/20 text-primary border-primary/30 text-sm px-4 py-1">
              Global Coverage
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Our <span className="text-primary">7 Frameworks</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
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
                <Card className="h-full bg-card/40 border-border hover:bg-card/60 hover:border-primary/30 transition-all duration-300 group">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${framework.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <framework.icon className="h-6 w-6 text-white" />
                      </div>
                      <Badge variant="outline" className="text-muted-foreground border-gray-600">
                        {framework.year}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg text-white">{framework.name}</CardTitle>
                    <p className="text-sm text-primary">{framework.region}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">{framework.description}</p>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-card/60 text-muted-foreground border-0">{framework.articles}</Badge>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Link href={getFrameworkGuideUrl(framework.id)}>
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white hover:bg-card/60">
                          Learn More
                        </Button>
                      </Link>
                      <Link href="/training">
                        <Button size="sm" className="bg-primary hover:bg-primary text-white">
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
      <GovernanceNetwork />

      {/* ============================================ */}
      {/* SECTION 6: THE MATERNAL COVENANT */}
      {/* ============================================ */}
      <section className="py-24 bg-gradient-to-b from-emerald-50 to-white">
        <div className="container mx-auto px-6 max-w-5xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-12"
          >
            <Badge className="mb-4 bg-rose-100 text-rose-700 border-rose-200 text-sm px-4 py-1">
              Article 1: Core Innovation
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              The <span className="text-rose-600">Maternal Covenant</span>
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scaleIn}
          >
            <Card className="border-2 border-rose-200 bg-card shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-rose-500 to-pink-500 p-1" />
              <CardContent className="p-8 md:p-12">
                {/* Quote */}
                <div className="flex items-start gap-4 mb-10">
                  <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                    <Heart className="h-8 w-8 text-rose-600" />
                  </div>
                  <div>
                    <Quote className="h-8 w-8 text-rose-300 mb-2" />
                    <p className="text-xl md:text-2xl text-foreground italic leading-relaxed">
                      AI should want to protect humans the way a mother wants to protect a child.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">— Geoffrey Hinton, 2023</p>
                  </div>
                </div>

                {/* Comparison */}
                <div className="grid md:grid-cols-2 gap-8 mb-10">
                  <div className="p-6 bg-destructive/5 rounded-xl border border-destructive/20">
                    <h4 className="font-bold text-destructive mb-4 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Control Paradigm (Fails)
                    </h4>
                    <ul className="space-y-3 text-destructive">
                      <li className="flex items-start gap-2">
                        <span className="text-destructive mt-1">•</span>
                        <span>Adversarial: AI vs Humans</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-destructive mt-1">•</span>
                        <span>Arms race: ever-stronger constraints</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-destructive mt-1">•</span>
                        <span>Inevitable failure with superintelligence</span>
                      </li>
                    </ul>
                  </div>
                  <div className="p-6 bg-primary/5 rounded-xl border border-primary/20">
                    <h4 className="font-bold text-primary mb-4 flex items-center gap-2">
                      <Heart className="h-5 w-5" />
                      Covenant Paradigm (Works)
                    </h4>
                    <ul className="space-y-3 text-primary">
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>Partnership: AI + Humans together</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>Cooperative: mutual benefit design</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>Sustainable: scales with AI growth</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Core insight */}
                <div className="p-6 bg-gradient-to-r from-rose-100 to-pink-100 rounded-xl text-center mb-8">
                  <p className="text-rose-800 font-semibold text-lg flex items-center justify-center gap-3 flex-wrap">
                    <Sparkles className="h-5 w-5" />
                    Mother gives child allowance → AI gives humanity prosperity
                    <Sparkles className="h-5 w-5" />
                  </p>
                </div>

                <div className="text-center">
                  <Link href="/maternal-covenant">
                    <Button size="lg" className="bg-rose-600 hover:bg-rose-700 text-white">
                      Read the Full Maternal Covenant
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION 7: BYZANTINE COUNCIL */}
      {/* ============================================ */}
      <section className="py-24 bg-slate-900 text-white overflow-hidden">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <Badge className="mb-4 bg-primary/20 text-primary border-primary/30 text-sm px-4 py-1">
                Real-Time Monitoring
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                The <span className="text-primary">Byzantine Council</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                33 AI agents from multiple providers working together with Byzantine fault tolerance.
                No single company can manipulate safety decisions.
              </p>

              <div className="space-y-6 mb-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">23/33 Consensus Required</h4>
                    <p className="text-muted-foreground">70% agreement for any safety decision. Byzantine fault tolerance ensures reliability even if agents fail or are compromised.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Network className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">Multi-Provider Diversity</h4>
                    <p className="text-muted-foreground">Agents span GPT-4, Claude, Gemini, Llama, and more. No single AI company has majority control.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Eye className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">Human Oversight</h4>
                    <p className="text-muted-foreground">Certified AI Safety Analysts review critical decisions. AI monitors AI, humans oversee all.</p>
                  </div>
                </div>
              </div>

              <Link href="/agent-council">
                <Button size="lg" className="bg-primary hover:bg-primary text-white">
                  Explore the Council
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>

            {/* Visualization */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={scaleIn}
              className="relative"
            >
              <div className="aspect-square max-w-lg mx-auto bg-slate-800/50 rounded-3xl border border-slate-700 overflow-hidden">
                <CouncilVisualization autoAnimate={true} showLabels={true} useLiveData={false} />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION 8: PROSPERITY FUND */}
      {/* ============================================ */}
      <section className="py-24 bg-gradient-to-b from-amber-50 to-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-[#C8A873]/10 text-amber-700 border-amber-200 text-sm px-4 py-1">
              Economic Justice
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              The <span className="text-[#C8A873]">Prosperity Fund</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              AI creates unprecedented wealth. The Prosperity Fund ensures everyone benefits.
            </p>
          </motion.div>

          {/* Fund goal */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scaleIn}
            className="mb-12"
          >
            <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-100 to-amber-50 text-center p-8">
              <div className="flex items-center justify-center gap-4 mb-4">
                <CircleDollarSign className="h-12 w-12 text-[#C8A873]" />
                <span className="text-6xl md:text-7xl font-black text-amber-700">£100B+</span>
              </div>
              <p className="text-xl text-amber-800 font-medium">Prosperity Fund Goal</p>
              <p className="text-[#C8A873] mt-2">Funded by AI company contributions (1-20% of revenues) - NOT by analyst fees</p>
            </Card>
          </motion.div>

          {/* UBI Triggers */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-6 mb-12"
          >
            {[
              {
                threshold: "20%",
                label: "Tier 1 UBI",
                desc: "When AI-caused unemployment reaches 20%, first tier of Universal Basic Income activates.",
                color: "from-green-500 to-emerald-500",
              },
              {
                threshold: "40%",
                label: "Tier 2 UBI",
                desc: "When displacement reaches 40%, enhanced benefits activate to support affected workers.",
                color: "from-amber-500 to-orange-500",
              },
              {
                threshold: "70%",
                label: "Full UBI",
                desc: "At 70% displacement, full Universal Basic Income ensures everyone's economic security.",
                color: "from-rose-500 to-red-500",
              },
            ].map((tier, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="h-full border hover:shadow-lg transition-all">
                  <CardHeader>
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${tier.color} flex items-center justify-center mx-auto mb-4`}>
                      <span className="text-2xl font-black text-white">{tier.threshold}</span>
                    </div>
                    <CardTitle className="text-center">{tier.label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-center text-sm">{tier.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <div className="text-center">
            <Link href="/prosperity-fund">
              <Button size="lg" className="bg-amber-600 hover:bg-amber-700 text-white">
                Learn About the Prosperity Fund
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION 9: TRAINING & CERTIFICATION */}
      {/* ============================================ */}
      <section className="py-24 bg-card">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 text-sm px-4 py-1">
                Jump-Start Your Career
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                ALL 33 Courses <span className="text-primary">100% FREE</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                AI Safety Analyst is projected to be a top-10 profession by 2045.
                Get ahead now with completely free training - certification exam £49, Analyst License £199/year.
              </p>

              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                {[
                  { value: "33+", label: "Training Courses", icon: BookOpen },
                  { value: "FREE", label: "Cost", icon: DollarSign },
                  { value: "7", label: "Frameworks", icon: Globe2 },
                  { value: "£45-150", label: "Per Hour Earnings", icon: TrendingUp },
                ].map((stat, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 bg-muted rounded-xl">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <stat.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-bold text-foreground">{stat.value}</div>
                      <div className="text-sm text-muted-foreground">{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/training">
                  <Button size="lg" className="bg-primary hover:bg-primary text-white">
                    <GraduationCap className="mr-2 h-5 w-5" />
                    Start Free Training
                  </Button>
                </Link>
                <Link href="/certification">
                  <Button size="lg" variant="outline">
                    <BadgeCheck className="mr-2 h-5 w-5" />
                    Get Certified
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
              <Card className="border-2 border-primary/20 shadow-xl overflow-hidden">
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
                      title: "Get Certified",
                      desc: "Pass the certification exam (£49 one-time). Your credential is recognized globally.",
                    },
                    {
                      step: "3",
                      title: "Start Earning",
                      desc: "Get your Analyst License (£199/year) and work remotely. Earn £45-150/hour.",
                    },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">
                        {item.step}
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground mb-1">{item.title}</h4>
                        <p className="text-muted-foreground text-sm">{item.desc}</p>
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
      <section className="py-24 bg-muted">
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
                    <div className="w-14 h-14 bg-card/60 rounded-xl flex items-center justify-center">
                      <Shield className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">CSOAI Certification</CardTitle>
                      <CardDescription className="text-muted-foreground">AI System Compliance Badge</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {[
                      { label: "EU AI Act Compliance", score: "94%" },
                      { label: "NIST AI RMF Alignment", score: "89%" },
                      { label: "ISO 42001 Readiness", score: "91%" },
                      { label: "Overall Safety Score", score: "A+" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="font-medium text-foreground">{item.label}</span>
                        <Badge className="bg-primary/10 text-primary border-primary/20">{item.score}</Badge>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="flex items-center gap-2 text-primary">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-semibold">Verified by Byzantine Council</span>
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
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Licensing & <span className="text-primary">Compliance</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                We license AI systems for safety compliance. Ongoing monitoring.
                Assessment against all frameworks. Global recognition.
              </p>

              <div className="space-y-4 mb-8">
                {[
                  "One registration covers ALL 7 frameworks",
                  "Automated compliance scoring in real-time",
                  "Continuous monitoring by Byzantine Council",
                  "Public transparency badges for trust",
                  "Avoid fines up to €35M (EU AI Act)",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">{item}</span>
                  </div>
                ))}
              </div>

              <Link href="/enterprise">
                <Button size="lg" className="bg-primary hover:bg-primary text-white">
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
      <section className="py-24 bg-card">
        <div className="container mx-auto px-6 max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 text-sm px-4 py-1">
              Trust & Credibility
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Built on <span className="text-primary">Transparency</span>
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
                  <div className="text-4xl font-black text-primary mb-2">{stat.value}</div>
                  <div className="font-semibold text-foreground mb-1">{stat.label}</div>
                  <div className="text-sm text-muted-foreground">{stat.desc}</div>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Testimonial */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scaleIn}
          >
            <Card className="border-2 border-primary/20 bg-primary/5 p-8 md:p-12">
              <div className="max-w-3xl mx-auto text-center">
                <Quote className="h-12 w-12 text-primary mx-auto mb-6" />
                <p className="text-xl md:text-2xl text-foreground italic leading-relaxed mb-6">
                  "CSOAI represents a fundamental shift in how we think about AI governance.
                  Instead of adversarial control, they've designed a system based on partnership
                  and mutual benefit. This is the approach that will actually work."
                </p>
                <div className="flex items-center justify-center gap-4">
                  <div className="w-12 h-12 bg-emerald-200 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-foreground">AI Safety Community</div>
                    <div className="text-sm text-muted-foreground">Early Supporters</div>
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
            <div className="inline-flex flex-col items-center gap-4 p-8 bg-gradient-to-br from-emerald-50 to-white border-2 border-primary/20 rounded-2xl">
              <Crown className="h-10 w-10 text-primary" />
              <h3 className="text-xl font-bold text-slate-900">Become a Founding Member</h3>
              <p className="text-muted-foreground max-w-md">
                Join the founding council and help shape the future of AI safety governance.
                Limited to 100 founding members worldwide.
              </p>
              <Link href="/founding-council-agreement">
                <Button className="bg-primary hover:bg-primary text-white">
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
      <Testimonials />

      {/* ============================================ */}
      {/* SECTION 12: FAQ */}
      {/* ============================================ */}
      <section className="py-24 bg-muted">
        <div className="container mx-auto px-6 max-w-4xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 text-sm px-4 py-1">
              Got Questions?
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Frequently Asked <span className="text-primary">Questions</span>
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
                  className="bg-card border-2 border-border rounded-xl px-6 data-[state=open]:border-emerald-300 transition-all"
                >
                  <AccordionTrigger className="text-left font-semibold text-foreground hover:text-primary py-5">
                    <div className="flex items-center gap-3">
                      <HelpCircle className="h-5 w-5 text-primary flex-shrink-0" />
                      {faq.question}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION 13: FINAL CTA */}
      {/* ============================================ */}
      <section className="py-24 bg-gradient-to-br from-emerald-600 via-green-600 to-teal-600 relative overflow-hidden">
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
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
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
                  desc: "Free courses, certification, career",
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
                      ? "bg-card border-white shadow-xl"
                      : "bg-card/60 border-border hover:bg-card/70"
                  }`}>
                    <CardContent className="p-6 text-center">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 ${
                        path.primary ? "bg-primary/10" : "bg-card/60"
                      }`}>
                        <path.icon className={`h-7 w-7 ${path.primary ? "text-primary" : "text-white"}`} />
                      </div>
                      <h3 className={`text-lg font-bold mb-2 ${path.primary ? "text-foreground" : "text-white"}`}>
                        {path.title}
                      </h3>
                      <p className={`text-sm ${path.primary ? "text-muted-foreground" : "text-emerald-100"}`}>
                        {path.desc}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/charter">
                <Button size="lg" className="bg-card text-primary hover:bg-muted px-8 py-6 text-lg font-semibold rounded-xl shadow-lg">
                  <FileText className="mr-2 h-5 w-5" />
                  Read the Charter
                </Button>
              </Link>
              <Link href="/jobs">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-card/60 px-8 py-6 text-lg font-semibold rounded-xl"
                >
                  <Briefcase className="mr-2 h-5 w-5" />
                  Browse Jobs
                </Button>
              </Link>
            </div>

            <p className="text-emerald-200 mt-8 text-sm">
              Questions? Contact us at{" "}
              <a href="mailto:hello@csoai.org" className="underline hover:text-white">
                hello@csoai.org
              </a>
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
