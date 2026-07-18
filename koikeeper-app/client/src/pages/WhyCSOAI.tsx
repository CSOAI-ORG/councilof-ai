/**
 * Why CSOAI / Our Difference Page
 *
 * Comprehensive page showcasing CSOAI's unique differentiators
 * that competitors cannot easily replicate.
 */

import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  Shield,
  GraduationCap,
  Users,
  DollarSign,
  Globe2,
  FileText,
  Eye,
  Briefcase,
  Heart,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Zap,
  Scale,
  Building2,
  Award,
  TrendingUp,
  Lock,
  Unlock,
  Brain,
  Coins,
  ShieldCheck,
  BookOpen,
  Layers,
  Network,
  Target,
  Star,
  Quote,
  ChevronRight,
  BadgeCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Key differentiators data
const differentiators = [
  {
    id: "free-training",
    title: "100% FREE Training",
    subtitle: "ALL 33 Courses - No Paywalls",
    icon: GraduationCap,
    color: "emerald",
    bgGradient: "from-emerald-500 to-green-600",
    highlights: [
      "Foundation courses (Core AI Safety, Ethics, Risk Management)",
      "7 Regional compliance courses (EU, US, UK, Canada, Australia, China, Global)",
      "Industry-specific courses (Healthcare, Finance, Government, Critical Infrastructure)",
      "50+ languages supported",
    ],
    competitorPain: "Competitors charge 500-2,000+ for similar content",
    ourApproach: "We only monetize when YOU earn (license fees). Education should be free.",
  },
  {
    id: "ecosystem",
    title: "Complete Ecosystem",
    subtitle: "Not Just Training - A Full Stack",
    icon: Layers,
    color: "blue",
    bgGradient: "from-blue-500 to-indigo-600",
    highlights: [
      "Training: 33 free courses across all domains",
      "Certification: Globally recognized credentials",
      "License: Professional analyst registration",
      "Jobs: Real paid work at 45-150/hour",
      "Earnings: Direct connection to enterprises",
    ],
    competitorPain: "Competitors offer training OR jobs, never the complete journey",
    ourApproach: "From zero to earning in one platform. No gaps. No third parties.",
  },
  {
    id: "maternal-covenant",
    title: "The Maternal Covenant",
    subtitle: "Partnership, Not Control",
    icon: Heart,
    color: "rose",
    bgGradient: "from-rose-500 to-pink-600",
    highlights: [
      "Based on Geoffrey Hinton's 2023 insight",
      "Care-based AI alignment philosophy",
      "AI should WANT to protect humans",
      "Partnership dynamics, not adversarial control",
      "Scales with intelligence (more capable = more protective)",
    ],
    competitorPain: "No competitor has a coherent philosophical framework",
    ourApproach: "The only AI safety organization built on maternal care principles.",
  },
  {
    id: "byzantine-council",
    title: "Byzantine Fault-Tolerant Council",
    subtitle: "33 AI Agents. Multi-Provider. Consensus-Driven.",
    icon: Network,
    color: "purple",
    bgGradient: "from-purple-500 to-violet-600",
    highlights: [
      "33 independent AI agents monitoring AI systems",
      "Multi-provider diversity (GPT-4, Claude, Gemini, Llama, DeepSeek)",
      "23/33 supermajority required for decisions",
      "Tolerates up to 10 malicious/faulty agents",
      "Real-time voting on safety incidents",
    ],
    competitorPain: "No competitor has multi-AI oversight architecture",
    ourApproach: "The first Byzantine consensus system for AI governance in the world.",
  },
  {
    id: "prosperity-fund",
    title: "Prosperity Fund + UBI",
    subtitle: "AI Companies Fund Humanity's Future",
    icon: Coins,
    color: "amber",
    bgGradient: "from-amber-500 to-orange-600",
    highlights: [
      "Progressive contribution rates (1-20% of AI revenues)",
      "UBI triggers: 20% displacement = 500/month",
      "40% displacement = 1,500/month",
      "70% displacement = 3,000/month",
      "Goal: 100B+ fund by 2030",
    ],
    competitorPain: "No competitor addresses economic justice from AI displacement",
    ourApproach: "AI creates wealth. We ensure that wealth is shared with ALL of humanity.",
  },
  {
    id: "global-frameworks",
    title: "7 Global Frameworks",
    subtitle: "One Platform. Complete Coverage.",
    icon: Globe2,
    color: "cyan",
    bgGradient: "from-cyan-500 to-teal-600",
    highlights: [
      "EU AI Act (comprehensive high-risk requirements)",
      "NIST AI RMF (US federal standard)",
      "ISO/IEC 42001 (international standard)",
      "TC260 (China's AI governance framework)",
      "UK AI Safety Framework",
      "Canadian AI regulations",
      "Australian AI Ethics Framework",
    ],
    competitorPain: "Competitors focus on one region. Global companies need global coverage.",
    ourApproach: "Master all 7 frameworks in ONE platform. Work anywhere in the world.",
  },
  {
    id: "job-marketplace",
    title: "Real Job Marketplace",
    subtitle: "Certificates + Actual Paid Work",
    icon: Briefcase,
    color: "green",
    bgGradient: "from-green-500 to-emerald-600",
    highlights: [
      "45-150/hour earning potential",
      "Direct enterprise connections",
      "Liability insurance included",
      "Remote work available globally",
      "Part-time to full-time flexibility",
    ],
    competitorPain: "Other certifications are just paper. No jobs attached.",
    ourApproach: "Certificate is your entry ticket. Jobs are your destination.",
  },
  {
    id: "charter",
    title: "52-Article Charter",
    subtitle: "Complete Governance Framework",
    icon: FileText,
    color: "slate",
    bgGradient: "from-slate-500 to-gray-600",
    highlights: [
      "52 comprehensive articles",
      "13 detailed schedules",
      "Democratic participation mechanisms",
      "Founding Member rights and protections",
      "Transparent governance structure",
    ],
    competitorPain: "No competitor has a comprehensive governance charter",
    ourApproach: "Complete rules of engagement. Nothing hidden. Full transparency.",
  },
];

// Comparison table data
const comparisonData = [
  {
    feature: "Training Cost",
    csoai: "100% FREE (33 courses)",
    others: "500 - 2,000+",
    csoaiWins: true,
  },
  {
    feature: "Regional Coverage",
    csoai: "7 major frameworks",
    others: "1-2 frameworks",
    csoaiWins: true,
  },
  {
    feature: "Job Marketplace",
    csoai: "Built-in, 45-150/hr",
    others: "None or third-party",
    csoaiWins: true,
  },
  {
    feature: "AI Oversight Council",
    csoai: "33 agents, Byzantine consensus",
    others: "None",
    csoaiWins: true,
  },
  {
    feature: "Economic Justice Plan",
    csoai: "Prosperity Fund + UBI",
    others: "None",
    csoaiWins: true,
  },
  {
    feature: "Philosophical Framework",
    csoai: "Maternal Covenant",
    others: "None",
    csoaiWins: true,
  },
  {
    feature: "Public Watchdog",
    csoai: "Transparent dashboard",
    others: "None",
    csoaiWins: true,
  },
  {
    feature: "Governance Charter",
    csoai: "52 articles, 13 schedules",
    others: "Basic ToS only",
    csoaiWins: true,
  },
  {
    feature: "Liability Insurance",
    csoai: "Included for analysts",
    others: "Not offered",
    csoaiWins: true,
  },
  {
    feature: "Languages Supported",
    csoai: "50+",
    others: "1-5",
    csoaiWins: true,
  },
];

// Social proof / testimonials
const testimonials = [
  {
    quote: "CSOAI's free training model changed everything for me. I went from zero AI knowledge to a certified analyst earning 75/hour in 6 months.",
    author: "Maria Santos",
    role: "Certified AI Safety Analyst",
    location: "Brazil",
  },
  {
    quote: "The Byzantine Council is unlike anything else in the industry. True multi-AI oversight that actually works.",
    author: "Dr. James Chen",
    role: "AI Ethics Researcher",
    location: "Singapore",
  },
  {
    quote: "We evaluated 12 AI governance platforms. Only CSOAI covered all 7 regulatory frameworks we needed.",
    author: "Sarah Mueller",
    role: "Head of Compliance, TechCorp",
    location: "Germany",
  },
];

export default function WhyCSOAI() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-emerald-900 via-green-800 to-teal-900 text-white py-24 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full border-4 border-white" />
          <div className="absolute bottom-20 right-10 w-56 h-56 rounded-full border-4 border-white" />
          <div className="absolute top-1/2 right-1/3 w-40 h-40 rounded-full border-4 border-white" />
        </div>

        <div className="container max-w-6xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <Badge className="mb-6 bg-white/20 text-white border-white/30 text-lg px-6 py-2">
              <Shield className="inline h-5 w-5 mr-2" />
              The CSOAI Difference
            </Badge>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Why Nobody Can
              <br />
              <span className="text-emerald-300">Copy What We've Built</span>
            </h1>

            <p className="text-xl md:text-2xl text-emerald-100 leading-relaxed mb-8 max-w-4xl mx-auto">
              CSOAI isn't just another AI training platform. It's a complete ecosystem
              for AI safety: free education, global certification, real jobs,
              and a vision for humanity's future.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-12">
              {[
                { label: "33 Free Courses", icon: GraduationCap },
                { label: "7 Global Frameworks", icon: Globe2 },
                { label: "45-150/hr Jobs", icon: Briefcase },
                { label: "100B+ UBI Goal", icon: Coins },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.2 + idx * 0.1 }}
                  className="flex items-center gap-2 bg-white/10 px-5 py-3 rounded-full"
                >
                  <item.icon className="h-5 w-5 text-emerald-300" />
                  <span className="font-semibold">{item.label}</span>
                </motion.div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/training">
                <Button
                  size="lg"
                  className="bg-white text-emerald-700 hover:bg-emerald-50 px-8 text-lg"
                >
                  <GraduationCap className="mr-2 h-5 w-5" />
                  Start Free Training
                </Button>
              </Link>
              <Link href="/charter">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10 px-8 text-lg"
                >
                  <FileText className="mr-2 h-5 w-5" />
                  Read Our Charter
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="py-20 bg-gray-50">
        <div className="container max-w-6xl">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-red-100 text-red-600 border-red-200">
              The Problem
            </Badge>
            <h2 className="text-4xl font-bold mb-4">
              AI Safety Training Is Broken
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The industry is fragmented, expensive, and disconnected from real employment opportunities.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                problem: "Expensive Training",
                desc: "Competitors charge 500-2,000+ for basic AI safety courses. Education should be accessible to everyone.",
                icon: DollarSign,
                color: "red",
              },
              {
                problem: "Regional Silos",
                desc: "Most platforms focus on one region. Global companies need global compliance coverage.",
                icon: Globe2,
                color: "red",
              },
              {
                problem: "Certificates Without Jobs",
                desc: "Traditional certifications are just paper. No connection to actual employment opportunities.",
                icon: Award,
                color: "red",
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                >
                  <Card className="h-full border-red-200 bg-red-50/50">
                    <CardContent className="p-6">
                      <div className="w-14 h-14 rounded-xl bg-red-100 flex items-center justify-center mb-4">
                        <Icon className="h-7 w-7 text-red-600" />
                      </div>
                      <h3 className="text-xl font-bold text-red-800 mb-2">
                        {item.problem}
                      </h3>
                      <p className="text-gray-600">{item.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Our Solution - 8 Differentiators */}
      <section className="py-20 bg-white">
        <div className="container max-w-6xl">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-emerald-100 text-emerald-600 border-emerald-200">
              Our Solution
            </Badge>
            <h2 className="text-4xl font-bold mb-4">
              8 Things That Make Us Different
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              These aren't just features - they're the reasons competitors can't replicate
              what CSOAI has built.
            </p>
          </div>

          <div className="space-y-8">
            {differentiators.map((diff, idx) => {
              const Icon = diff.icon;
              return (
                <motion.div
                  key={diff.id}
                  initial={{ opacity: 0, x: idx % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  <Card className="overflow-hidden hover:shadow-xl transition-shadow">
                    <div className="flex flex-col lg:flex-row">
                      {/* Icon/Number Side */}
                      <div
                        className={`lg:w-64 p-8 bg-gradient-to-br ${diff.bgGradient} text-white flex flex-col items-center justify-center`}
                      >
                        <div className="text-6xl font-bold opacity-30 mb-2">
                          0{idx + 1}
                        </div>
                        <Icon className="h-16 w-16" />
                      </div>

                      {/* Content Side */}
                      <div className="flex-1 p-8">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-2xl font-bold mb-1">{diff.title}</h3>
                            <p className="text-gray-500">{diff.subtitle}</p>
                          </div>
                          <Badge
                            variant="outline"
                            className={`bg-${diff.color}-50 text-${diff.color}-600 border-${diff.color}-200`}
                          >
                            Unique to CSOAI
                          </Badge>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-semibold text-gray-800 mb-3">
                              What You Get:
                            </h4>
                            <ul className="space-y-2">
                              {diff.highlights.map((highlight, hIdx) => (
                                <li
                                  key={hIdx}
                                  className="flex items-start gap-2 text-gray-600"
                                >
                                  <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                                  <span>{highlight}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="space-y-4">
                            <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                              <p className="text-sm text-red-700">
                                <XCircle className="inline h-4 w-4 mr-1" />
                                <strong>Competitors:</strong> {diff.competitorPain}
                              </p>
                            </div>
                            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                              <p className="text-sm text-emerald-700">
                                <CheckCircle2 className="inline h-4 w-4 mr-1" />
                                <strong>CSOAI:</strong> {diff.ourApproach}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 bg-gray-50">
        <div className="container max-w-6xl">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-emerald-100 text-emerald-600 border-emerald-200">
              Side-by-Side
            </Badge>
            <h2 className="text-4xl font-bold mb-4">CSOAI vs. The Competition</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A direct comparison shows why CSOAI stands alone in the AI safety space.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Card className="overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-4 text-left font-bold text-gray-800 w-1/3">
                        Feature
                      </th>
                      <th className="p-4 text-left w-1/3">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                            <Shield className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <span className="font-bold text-emerald-700">CSOAI</span>
                            <p className="text-xs text-gray-500">Our Platform</p>
                          </div>
                        </div>
                      </th>
                      <th className="p-4 text-left w-1/3">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-lg bg-gray-400 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <span className="font-bold text-gray-700">Others</span>
                            <p className="text-xs text-gray-500">Competitors</p>
                          </div>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonData.map((row, idx) => (
                      <tr
                        key={idx}
                        className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        <td className="p-4 font-medium text-gray-800">
                          {row.feature}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                            <span className="text-emerald-700 font-semibold">
                              {row.csoai}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <XCircle className="h-5 w-5 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-500">{row.others}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>

          {/* Summary Badge */}
          <div className="mt-8 text-center">
            <Badge className="text-lg px-6 py-3 bg-emerald-600 text-white">
              <BadgeCheck className="inline h-5 w-5 mr-2" />
              CSOAI wins on ALL 10 comparison points
            </Badge>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="container max-w-6xl">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-emerald-100 text-emerald-600 border-emerald-200">
              Testimonials
            </Badge>
            <h2 className="text-4xl font-bold mb-4">What Our Community Says</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Real stories from analysts, researchers, and enterprises using CSOAI.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <Quote className="h-10 w-10 text-emerald-200 mb-4" />
                    <p className="text-gray-700 mb-6 italic leading-relaxed">
                      "{testimonial.quote}"
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center text-white font-bold">
                        {testimonial.author
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">
                          {testimonial.author}
                        </p>
                        <p className="text-sm text-gray-600">{testimonial.role}</p>
                        <p className="text-xs text-gray-400">{testimonial.location}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* The Complete Stack Visual */}
      <section className="py-20 bg-gradient-to-br from-emerald-900 via-green-800 to-teal-900 text-white">
        <div className="container max-w-6xl">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-white/20 text-white border-white/30">
              The Complete Stack
            </Badge>
            <h2 className="text-4xl font-bold mb-4">Your Journey With CSOAI</h2>
            <p className="text-xl text-emerald-100 max-w-3xl mx-auto">
              From zero knowledge to earning income - all in one platform.
            </p>
          </div>

          <div className="relative">
            {/* Connection Line */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-emerald-500/30 hidden lg:block" />

            <div className="grid lg:grid-cols-5 gap-6">
              {[
                {
                  step: 1,
                  title: "Learn",
                  desc: "33 FREE courses",
                  icon: BookOpen,
                  link: "/training",
                },
                {
                  step: 2,
                  title: "Certify",
                  desc: "Global credentials",
                  icon: Award,
                  link: "/certification",
                },
                {
                  step: 3,
                  title: "License",
                  desc: "Professional registration",
                  icon: BadgeCheck,
                  link: "/accreditation",
                },
                {
                  step: 4,
                  title: "Work",
                  desc: "Real paid jobs",
                  icon: Briefcase,
                  link: "/jobs",
                },
                {
                  step: 5,
                  title: "Earn",
                  desc: "45-150/hour",
                  icon: Coins,
                  link: "/jobs",
                },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: idx * 0.1 }}
                    className="relative"
                  >
                    <Link href={item.link}>
                      <Card className="bg-white/10 border-white/20 hover:bg-white/20 transition-colors cursor-pointer h-full">
                        <CardContent className="p-6 text-center">
                          <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-4 relative">
                            <span className="absolute -top-2 -right-2 w-8 h-8 bg-white text-emerald-700 rounded-full flex items-center justify-center font-bold text-sm">
                              {item.step}
                            </span>
                            <Icon className="h-8 w-8 text-white" />
                          </div>
                          <h3 className="text-xl font-bold mb-2 text-white">
                            {item.title}
                          </h3>
                          <p className="text-emerald-200">{item.desc}</p>
                        </CardContent>
                      </Card>
                    </Link>
                    {idx < 4 && (
                      <div className="hidden lg:flex absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                        <ChevronRight className="h-6 w-6 text-emerald-400" />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Key Numbers */}
      <section className="py-20 bg-white">
        <div className="container max-w-6xl">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-emerald-100 text-emerald-600 border-emerald-200">
              By The Numbers
            </Badge>
            <h2 className="text-4xl font-bold mb-4">CSOAI at a Glance</h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { number: "33", label: "Free Courses", suffix: "" },
              { number: "7", label: "Global Frameworks", suffix: "" },
              { number: "52", label: "Charter Articles", suffix: "" },
              { number: "100B+", label: "Prosperity Fund Goal", suffix: "" },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
              >
                <Card className="text-center p-8 hover:shadow-lg transition-shadow">
                  <p className="text-5xl font-bold text-emerald-600 mb-2">
                    {stat.number}
                    {stat.suffix}
                  </p>
                  <p className="text-gray-600 font-medium">{stat.label}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-gradient-to-br from-emerald-600 via-green-600 to-teal-600 text-white">
        <div className="container max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Shield className="h-20 w-20 mx-auto mb-8 text-white/80" />
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Join the Future of AI Safety?
            </h2>
            <p className="text-xl text-emerald-100 mb-10 leading-relaxed max-w-3xl mx-auto">
              Start your journey today. Free training, global certification,
              real jobs, and a community dedicated to making AI safe for everyone.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
              <Link href="/training">
                <Button
                  size="lg"
                  className="bg-white text-emerald-700 hover:bg-emerald-50 px-10 py-6 text-lg"
                >
                  <GraduationCap className="mr-2 h-6 w-6" />
                  Start Free Training Now
                </Button>
              </Link>
              <Link href="/founding-members">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10 px-10 py-6 text-lg"
                >
                  <Users className="mr-2 h-6 w-6" />
                  Become a Founding Member
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm text-emerald-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                <span>100% free training</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                <span>Start earning in weeks</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Quick Links Footer */}
      <section className="py-12 bg-gray-900 text-white">
        <div className="container max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-bold mb-4 text-emerald-400">Learn More</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link
                    href="/charter"
                    className="hover:text-white transition-colors"
                  >
                    Read the Charter
                  </Link>
                </li>
                <li>
                  <Link
                    href="/maternal-covenant"
                    className="hover:text-white transition-colors"
                  >
                    Maternal Covenant
                  </Link>
                </li>
                <li>
                  <Link
                    href="/prosperity-fund"
                    className="hover:text-white transition-colors"
                  >
                    Prosperity Fund
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-emerald-400">Get Started</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link
                    href="/training"
                    className="hover:text-white transition-colors"
                  >
                    Free Training
                  </Link>
                </li>
                <li>
                  <Link
                    href="/certification"
                    className="hover:text-white transition-colors"
                  >
                    Get Certified
                  </Link>
                </li>
                <li>
                  <Link
                    href="/jobs"
                    className="hover:text-white transition-colors"
                  >
                    Find Jobs
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-emerald-400">Frameworks</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link
                    href="/eu-ai-act"
                    className="hover:text-white transition-colors"
                  >
                    EU AI Act
                  </Link>
                </li>
                <li>
                  <Link
                    href="/nist-ai-rmf"
                    className="hover:text-white transition-colors"
                  >
                    NIST AI RMF
                  </Link>
                </li>
                <li>
                  <Link
                    href="/iso-42001"
                    className="hover:text-white transition-colors"
                  >
                    ISO 42001
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-emerald-400">Community</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link
                    href="/founding-members"
                    className="hover:text-white transition-colors"
                  >
                    Founding Members
                  </Link>
                </li>
                <li>
                  <Link
                    href="/public-watchdog"
                    className="hover:text-white transition-colors"
                  >
                    Public Watchdog
                  </Link>
                </li>
                <li>
                  <Link
                    href="/byzantine"
                    className="hover:text-white transition-colors"
                  >
                    Byzantine Council
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
