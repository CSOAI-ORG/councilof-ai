/**
 * PDCA Framework Feature Page
 * Explains the Plan-Do-Check-Act continuous improvement cycle for AI safety
 */

import { motion } from "framer-motion";
import { RefreshCw, Target, Play, CheckCircle, TrendingUp, ArrowRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

export default function PDCAFrameworkFeature() {
  const pdcaPhases = [
    {
      icon: Target,
      phase: "PLAN",
      color: "blue",
      title: "Identify & Plan",
      description: "Identify AI safety risks, set objectives, and develop comprehensive action plans based on frameworks like EU AI Act, NIST AI RMF, and ISO 42001.",
      actions: [
        "Risk assessment and categorization",
        "Objective setting with measurable KPIs",
        "Resource allocation and timeline planning",
        "Stakeholder identification and engagement"
      ]
    },
    {
      icon: Play,
      phase: "DO",
      color: "green",
      title: "Implement & Execute",
      description: "Execute the planned safety measures, deploy monitoring systems, and implement controls across the AI lifecycle.",
      actions: [
        "Deploy safety controls and guardrails",
        "Implement monitoring and logging",
        "Train teams on safety protocols",
        "Document all implementation steps"
      ]
    },
    {
      icon: CheckCircle,
      phase: "CHECK",
      color: "purple",
      title: "Monitor & Measure",
      description: "Continuously monitor AI systems, measure performance against objectives, and validate effectiveness of safety controls.",
      actions: [
        "Real-time system monitoring",
        "Performance metric tracking",
        "Compliance audits and reviews",
        "Incident detection and logging"
      ]
    },
    {
      icon: TrendingUp,
      phase: "ACT",
      color: "orange",
      title: "Improve & Iterate",
      description: "Analyze findings, implement corrective actions, standardize successful practices, and continuously improve safety measures.",
      actions: [
        "Root cause analysis of issues",
        "Corrective and preventive actions",
        "Process optimization and refinement",
        "Knowledge sharing and documentation"
      ]
    }
  ];

  const benefits = [
    {
      title: "Continuous Improvement",
      description: "Never settle for \"good enough\" - constantly evolve safety measures as AI systems and risks change."
    },
    {
      title: "Data-Driven Decisions",
      description: "Make informed decisions based on real metrics and evidence, not assumptions or guesswork."
    },
    {
      title: "Proactive Risk Management",
      description: "Identify and address potential issues before they become actual problems or incidents."
    },
    {
      title: "Regulatory Alignment",
      description: "Demonstrate systematic approach to compliance with EU AI Act, NIST AI RMF, and ISO 42001."
    },
    {
      title: "Organizational Learning",
      description: "Build institutional knowledge and improve team capabilities through structured reflection."
    },
    {
      title: "Stakeholder Confidence",
      description: "Show customers, regulators, and partners your commitment to responsible AI through transparent processes."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-orange-500/10" />
        <div className="container max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6"
          >
            <Badge variant="outline" className="text-lg px-4 py-2">
              <RefreshCw className="h-4 w-4 mr-2" />
              Continuous Improvement
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold">
              The SOAI-PDCA
              <span className="bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent"> Framework</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              A systematic approach to AI safety management combining the proven Plan-Do-Check-Act cycle
              with specialized Safety Oversight for AI (SOAI) principles.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/courses">
                <Button size="lg">
                  Start Learning
                  <BookOpen className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/watchdog">
                <Button size="lg" variant="outline">
                  See It in Action
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* PDCA Cycle Visualization */}
      <section className="py-16 px-6">
        <div className="container max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">The Four Phases</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A continuous cycle that never ends - each iteration builds on the last,
              creating ever-improving AI safety practices.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {pdcaPhases.map((phase, idx) => {
              const colorClasses = {
                blue: "from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20 border-blue-200 dark:border-blue-800",
                green: "from-green-100 to-green-50 dark:from-green-900/30 dark:to-green-800/20 border-green-200 dark:border-green-800",
                purple: "from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-800/20 border-purple-200 dark:border-purple-800",
                orange: "from-orange-100 to-orange-50 dark:from-orange-900/30 dark:to-orange-800/20 border-orange-200 dark:border-orange-800"
              }[phase.color];

              return (
                <motion.div
                  key={phase.phase}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className={`h-full bg-gradient-to-br ${colorClasses}`}>
                    <CardHeader>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center flex-shrink-0 shadow-md">
                          <phase.icon className={`h-7 w-7 text-${phase.color}-600 dark:text-${phase.color}-400`} />
                        </div>
                        <div>
                          <Badge variant="secondary" className="mb-2">{phase.phase}</Badge>
                          <CardTitle className="text-xl">{phase.title}</CardTitle>
                        </div>
                      </div>
                      <p className="text-muted-foreground">{phase.description}</p>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {phase.actions.map((action, actionIdx) => (
                          <li key={actionIdx} className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 mt-1 flex-shrink-0 text-green-600 dark:text-green-400" />
                            <span className="text-sm">{action}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Cycle Arrow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="flex justify-center mt-8"
          >
            <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-blue-500/20 to-orange-500/20 border border-blue-500/30">
              <RefreshCw className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin" style={{ animationDuration: "3s" }} />
              <span className="font-semibold">Continuous Cycle</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="container max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Why SOAI-PDCA?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A proven methodology adapted for the unique challenges of AI safety management.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, idx) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{benefit.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Implementation Example */}
      <section className="py-16 px-6">
        <div className="container max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">PDCA in Action</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              See how the SOAI-PDCA framework applies to real AI safety scenarios.
            </p>
          </motion.div>

          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle>Example: Bias Detection in Hiring AI</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  <h4 className="font-semibold">PLAN</h4>
                </div>
                <p className="text-sm text-muted-foreground ml-7">
                  Identify potential gender bias in resume screening AI. Set objective: Achieve parity
                  in interview callback rates across genders within 90 days.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Play className="h-5 w-5 text-green-600" />
                  <h4 className="font-semibold">DO</h4>
                </div>
                <p className="text-sm text-muted-foreground ml-7">
                  Implement bias detection algorithms, add fairness constraints to model training,
                  and deploy monitoring dashboard tracking callback rates by demographic.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-purple-600" />
                  <h4 className="font-semibold">CHECK</h4>
                </div>
                <p className="text-sm text-muted-foreground ml-7">
                  Monitor for 30 days. Discover callback rate gap reduced from 15% to 5%, but new
                  bias emerged in technical role recommendations.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                  <h4 className="font-semibold">ACT</h4>
                </div>
                <p className="text-sm text-muted-foreground ml-7">
                  Standardize successful bias mitigation techniques. Address new technical role bias
                  in next PDCA cycle. Document lessons learned for future AI systems.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h2 className="text-4xl font-bold">
              Master the SOAI-PDCA Framework
            </h2>
            <p className="text-xl text-muted-foreground">
              Learn how to implement systematic AI safety management in your organization
              through our comprehensive training programs.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/courses">
                <Button size="lg">
                  Browse Courses
                  <BookOpen className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/features/training-certification">
                <Button size="lg" variant="outline">
                  View Certifications
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
