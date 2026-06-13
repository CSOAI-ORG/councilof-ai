/**
 * Zero AI Safety Solutions Until Now Section
 * Highlights the gap in AI safety market that CSOAI fills
 */

import { motion } from "framer-motion";
import {
  AlertOctagon,
  Building2,
  GraduationCap,
  Users,
  Landmark,
  ArrowRight,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const gaps = [
  {
    title: "No Jobs for AI Analysts",
    problem: "There was no structured profession or marketplace for AI safety monitoring",
    solution: "CSOAI creates thousands of remote, high-paying AI Safety Analyst positions",
    icon: GraduationCap,
  },
  {
    title: "No Human Oversight at Scale",
    problem: "Governments can't monitor millions of AI systems with limited staff",
    solution: "Certified analysts + 33-agent Byzantine Council provides 24/7 oversight",
    icon: Users,
  },
  {
    title: "No Unified Compliance",
    problem: "7+ frameworks, each requiring separate compliance efforts",
    solution: "One registration = compliance scores for ALL frameworks automatically",
    icon: Building2,
  },
  {
    title: "No Economic Safety Net",
    problem: "AI displaces workers but no mechanism shares AI's economic gains",
    solution: "Prosperity Fund provides UBI when AI-caused unemployment rises",
    icon: Landmark,
  },
];

const roleCards = [
  {
    role: "Individuals",
    description: "Start a career in AI safety with free training and certification",
    cta: "Start Free Training",
    href: "/training",
    color: "from-emerald-500 to-green-600",
    icon: GraduationCap,
  },
  {
    role: "Enterprise",
    description: "Register AI systems and ensure compliance across all frameworks",
    cta: "Enterprise Solutions",
    href: "/enterprise",
    color: "from-blue-500 to-indigo-600",
    icon: Building2,
  },
  {
    role: "Government",
    description: "Monitor AI compliance and access real-time enforcement data",
    cta: "Government Portal",
    href: "/government-dashboard",
    color: "from-amber-500 to-orange-600",
    icon: Landmark,
  },
  {
    role: "Citizens",
    description: "Report AI incidents and track public accountability",
    cta: "Public Watchdog",
    href: "/watchdog",
    color: "from-purple-500 to-pink-600",
    icon: Users,
  },
];

export default function ZeroSafetySection() {
  return (
    <section className="py-20 bg-gradient-to-b from-slate-950 to-slate-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge className="mb-4 bg-red-500/20 text-red-400 border-red-500/30">
            <AlertOctagon className="h-3.5 w-3.5 mr-1" />
            The Problem
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Zero AI Safety Solutions
            <span className="block text-emerald-400">Until Now.</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            For years, the AI safety landscape was fragmented and ineffective.
            No unified system existed to train analysts, monitor systems, or protect workers.
          </p>
        </motion.div>

        {/* Gap Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {gaps.map((gap, index) => (
            <motion.div
              key={gap.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full bg-white/5 border-white/10 hover:border-emerald-500/30 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-emerald-500/20">
                      <gap.icon className="h-6 w-6 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-3">{gap.title}</h3>
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <XCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                          <p className="text-gray-400 text-sm">{gap.problem}</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                          <p className="text-emerald-300 text-sm font-medium">{gap.solution}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Role-based CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Choose Your Path
          </h3>
          <p className="text-gray-400">
            CSOAI has something for everyone. Find your place in the AI safety ecosystem.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {roleCards.map((card, index) => (
            <motion.div
              key={card.role}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={card.href}>
                <Card className="h-full bg-gradient-to-br from-white/5 to-white/[0.02] border-white/10 hover:border-white/20 cursor-pointer transition-all group overflow-hidden">
                  <CardContent className="p-6 relative">
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.color} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity`} />
                    <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${card.color} mb-4`}>
                      <card.icon className="h-5 w-5 text-white" />
                    </div>
                    <h4 className="text-lg font-bold text-white mb-2">{card.role}</h4>
                    <p className="text-gray-400 text-sm mb-4">{card.description}</p>
                    <div className="flex items-center gap-1 text-emerald-400 text-sm font-medium group-hover:gap-2 transition-all">
                      {card.cta}
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
