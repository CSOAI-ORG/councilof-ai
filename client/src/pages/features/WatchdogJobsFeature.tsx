/**
 * Watchdog Jobs Feature Page
 * Explains AI Safety Analyst career opportunities and the Watchdog program
 */

import { motion } from "framer-motion";
import { Briefcase, TrendingUp, DollarSign, Globe, Clock, Home, CheckCircle, ArrowRight, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

export default function WatchdogJobsFeature() {
  const roleHighlights = [
    {
      icon: Globe,
      title: "Work From Anywhere",
      description: "100% remote positions available worldwide. Work from home, coffee shops, or while traveling."
    },
    {
      icon: Clock,
      title: "Flexible Hours",
      description: "Choose your schedule. Part-time, full-time, or freelance opportunities available."
    },
    {
      icon: TrendingUp,
      title: "High Growth Field",
      description: "AI Safety Analyst projected to be a top 10 job by 2045 as AI systems proliferate globally."
    },
    {
      icon: DollarSign,
      title: "Competitive Pay",
      description: "Entry-level: $45k-65k/year. Mid-level: $65k-95k/year. Senior: $95k-150k+/year."
    }
  ];

  const responsibilities = [
    {
      category: "Risk Assessment",
      tasks: [
        "Review AI system documentation and architecture",
        "Identify potential safety risks and ethical concerns",
        "Evaluate compliance with EU AI Act, NIST AI RMF, ISO 42001",
        "Document findings in standardized assessment reports"
      ]
    },
    {
      category: "Council Oversight",
      tasks: [
        "Review recommendations from 33-Agent Council",
        "Validate AI-generated risk assessments",
        "Approve or modify proposed safety measures",
        "Provide human judgment on edge cases"
      ]
    },
    {
      category: "Monitoring & Response",
      tasks: [
        "Monitor AI systems for anomalies and violations",
        "Respond to automated safety alerts",
        "Investigate incidents and near-misses",
        "Coordinate with development teams on fixes"
      ]
    },
    {
      category: "Documentation & Reporting",
      tasks: [
        "Maintain audit trails and compliance records",
        "Generate reports for stakeholders and regulators",
        "Update safety policies and procedures",
        "Contribute to knowledge base and best practices"
      ]
    }
  ];

  const careerPath = [
    {
      level: "Junior Analyst",
      experience: "0-2 years",
      salary: "$45k-65k",
      description: "Entry-level position reviewing straightforward AI systems under supervision.",
      requirements: ["EU AI Act certification", "Basic understanding of AI concepts", "Strong attention to detail"]
    },
    {
      level: "Analyst",
      experience: "2-4 years",
      salary: "$65k-85k",
      description: "Independent review of moderate-complexity AI systems and mentoring juniors.",
      requirements: ["2+ certifications", "Proven track record", "Domain expertise developing"]
    },
    {
      level: "Senior Analyst",
      experience: "4-7 years",
      salary: "$85k-110k",
      description: "Lead complex assessments, make final approval decisions, guide team strategy.",
      requirements: ["All 3 certifications", "Deep technical knowledge", "Leadership skills"]
    },
    {
      level: "Principal Analyst",
      experience: "7+ years",
      salary: "$110k-150k+",
      description: "Set organizational policy, handle highest-risk systems, represent company to regulators.",
      requirements: ["Extensive experience", "Industry recognition", "Strategic thinking"]
    }
  ];

  const benefits = [
    "Health, dental, and vision insurance",
    "401(k) matching and retirement planning",
    "Unlimited PTO and flexible scheduling",
    "Professional development budget",
    "Home office stipend",
    "Latest AI safety tools and software",
    "Conference and training attendance",
    "Career mentorship program"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-green-500/10 to-purple-500/10" />
        <div className="container max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6"
          >
            <Badge variant="outline" className="text-lg px-4 py-2">
              <Briefcase className="h-4 w-4 mr-2" />
              Career Opportunity
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold">
              AI is Taking Jobs.
              <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent"> We're Creating Them.</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Become an AI Safety Analyst - one of the fastest-growing careers of the next 20 years.
              Protect humanity from AI risks while earning a competitive salary from anywhere in the world.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/watchdog-signup">
                <Button size="lg">
                  Apply Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/courses">
                <Button size="lg" variant="outline">
                  Start Training
                  <GraduationCap className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Role Highlights */}
      <section className="py-16 px-6">
        <div className="container max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Why Become a Watchdog Analyst?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A career that combines purpose, flexibility, and growth potential.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {roleHighlights.map((highlight, idx) => (
              <motion.div
                key={highlight.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-green-100 dark:from-blue-900/30 dark:to-green-900/30 flex items-center justify-center flex-shrink-0">
                        <highlight.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <CardTitle className="mb-2">{highlight.title}</CardTitle>
                        <p className="text-muted-foreground">{highlight.description}</p>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Responsibilities */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="container max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">What You'll Do</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A day in the life of an AI Safety Analyst - meaningful work protecting humanity.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {responsibilities.map((resp, idx) => (
              <motion.div
                key={resp.category}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-lg">{resp.category}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {resp.tasks.map((task, taskIdx) => (
                        <li key={taskIdx} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-600 dark:text-green-400" />
                          <span className="text-sm">{task}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Career Path */}
      <section className="py-16 px-6">
        <div className="container max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Career Progression</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Clear advancement path from entry-level to senior leadership positions.
            </p>
          </motion.div>

          <div className="space-y-6">
            {careerPath.map((level, idx) => (
              <motion.div
                key={level.level}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-xl mb-2">{level.level}</CardTitle>
                        <p className="text-muted-foreground">{level.description}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className="text-lg px-3 py-1 mb-2">
                          {level.salary}
                        </Badge>
                        <p className="text-sm text-muted-foreground">{level.experience}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <h4 className="font-semibold mb-2 text-sm">Requirements:</h4>
                    <div className="flex flex-wrap gap-2">
                      {level.requirements.map((req, reqIdx) => (
                        <Badge key={reqIdx} variant="outline">{req}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
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
            <h2 className="text-3xl font-bold mb-4">Comprehensive Benefits</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We take care of our Watchdog Analysts so they can focus on protecting humanity.
            </p>
          </motion.div>

          <Card className="max-w-3xl mx-auto">
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-2 gap-4">
                {benefits.map((benefit, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-start gap-2"
                  >
                    <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0 text-green-600 dark:text-green-400" />
                    <span>{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How to Apply */}
      <section className="py-16 px-6">
        <div className="container max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">How to Apply</h2>
            <p className="text-muted-foreground">
              Three simple steps to start your AI safety career.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">1</span>
                </div>
                <CardTitle className="text-lg">Get Certified</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Complete at least one framework certification (EU AI Act, NIST, or ISO 42001).
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">2</span>
                </div>
                <CardTitle className="text-lg">Pass Exam</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Take the Watchdog Analyst certification exam to demonstrate practical skills.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">3</span>
                </div>
                <CardTitle className="text-lg">Start Working</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Join the Watchdog network and start reviewing AI systems from day one.
                </p>
              </CardContent>
            </Card>
          </div>
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
              Ready to Protect Humanity?
            </h2>
            <p className="text-xl text-muted-foreground">
              Join certified AI Safety Analysts worldwide making a difference.
              No coding required - just critical thinking and our comprehensive training.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/watchdog-signup">
                <Button size="lg">
                  Apply for Watchdog Program
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/courses">
                <Button size="lg" variant="outline">
                  Start Free Training
                  <GraduationCap className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
