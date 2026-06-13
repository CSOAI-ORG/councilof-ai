/**
 * Training Certification Feature Page
 * Explains the comprehensive AI safety training and certification system
 */

import { motion } from "framer-motion";
import { GraduationCap, Award, BookOpen, CheckCircle, ArrowRight, Download, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

export default function TrainingCertificationFeature() {
  const frameworks = [
    {
      name: "EU AI Act",
      icon: "🇪🇺",
      modules: 8,
      duration: "12-16 hours",
      level: "Beginner to Advanced",
      description: "Master the European Union's landmark AI regulation covering risk classification, compliance requirements, and implementation strategies.",
      topics: [
        "AI Act structure and scope",
        "Risk-based classification system",
        "High-risk AI requirements",
        "Prohibited AI practices",
        "Transparency obligations",
        "Governance and compliance",
        "Penalties and enforcement",
        "Implementation roadmap"
      ]
    },
    {
      name: "NIST AI RMF",
      icon: "🇺🇸",
      modules: 8,
      duration: "10-14 hours",
      level: "Beginner to Intermediate",
      description: "Learn the US National Institute of Standards and Technology's AI Risk Management Framework for trustworthy AI development.",
      topics: [
        "Framework introduction",
        "Trustworthy AI characteristics",
        "GOVERN function",
        "MAP function",
        "MEASURE function",
        "MANAGE function",
        "AI lifecycle and actors",
        "Implementation roadmap"
      ]
    },
    {
      name: "ISO 42001",
      icon: "🌍",
      modules: 8,
      duration: "14-18 hours",
      level: "Intermediate to Advanced",
      description: "Understand the international standard for AI Management Systems (AIMS) and achieve organizational certification readiness.",
      topics: [
        "ISO 42001 introduction",
        "AIMS requirements",
        "Context and leadership",
        "Planning and risk management",
        "Support and operations",
        "Performance evaluation",
        "Improvement and certification",
        "Implementation best practices"
      ]
    }
  ];

  const certificationProcess = [
    {
      step: 1,
      title: "Choose Your Path",
      description: "Select one or more frameworks based on your role, industry, and career goals.",
      icon: BookOpen
    },
    {
      step: 2,
      title: "Complete Training",
      description: "Work through comprehensive modules with real-world examples, case studies, and practical guidance.",
      icon: GraduationCap
    },
    {
      step: 3,
      title: "Pass Assessments",
      description: "Demonstrate mastery with 70%+ scores on module quizzes covering key concepts and applications.",
      icon: CheckCircle
    },
    {
      step: 4,
      title: "Earn Certificate",
      description: "Download your professional certificate with unique ID, QR code verification, and LinkedIn sharing.",
      icon: Award
    }
  ];

  const benefits = [
    {
      icon: Shield,
      title: "Industry Recognition",
      description: "Certificates recognized by employers globally as proof of AI safety expertise."
    },
    {
      icon: Award,
      title: "Career Advancement",
      description: "Stand out in the job market with specialized credentials in emerging AI safety roles."
    },
    {
      icon: BookOpen,
      title: "Practical Knowledge",
      description: "Learn actionable frameworks you can immediately apply in your organization."
    },
    {
      icon: CheckCircle,
      title: "Verified Credentials",
      description: "Every certificate includes QR code verification to prevent fraud and ensure authenticity."
    }
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
              <GraduationCap className="h-4 w-4 mr-2" />
              Professional Certification
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold">
              Become an AI Safety
              <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent"> Expert</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Earn professional certifications in EU AI Act, NIST AI RMF, and ISO 42001.
              Master the frameworks shaping the future of responsible AI.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/courses">
                <Button size="lg">
                  Start Learning (Free)
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/certificates">
                <Button size="lg" variant="outline">
                  View Sample Certificate
                  <Download className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Frameworks Overview */}
      <section className="py-16 px-6">
        <div className="container max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Three Global Frameworks</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Comprehensive training covering the world's leading AI safety and governance frameworks.
              240 assessment questions across 24 modules.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {frameworks.map((framework, idx) => (
              <motion.div
                key={framework.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="h-full hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <div className="text-5xl mb-4">{framework.icon}</div>
                    <CardTitle className="text-2xl mb-2">{framework.name}</CardTitle>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant="secondary">{framework.modules} Modules</Badge>
                      <Badge variant="secondary">{framework.duration}</Badge>
                      <Badge variant="outline">{framework.level}</Badge>
                    </div>
                    <p className="text-muted-foreground text-sm">{framework.description}</p>
                  </CardHeader>
                  <CardContent>
                    <h4 className="font-semibold mb-3">What You'll Learn:</h4>
                    <ul className="space-y-2">
                      {framework.topics.map((topic, topicIdx) => (
                        <li key={topicIdx} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-600 dark:text-green-400" />
                          <span className="text-sm">{topic}</span>
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

      {/* Certification Process */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="container max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A straightforward path from beginner to certified AI safety professional.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {certificationProcess.map((process, idx) => (
              <motion.div
                key={process.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="relative"
              >
                <Card className="h-full text-center">
                  <CardHeader>
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-green-100 dark:from-blue-900/30 dark:to-green-900/30 flex items-center justify-center mx-auto mb-4">
                      <process.icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                      {process.step}
                    </div>
                    <CardTitle className="text-lg">{process.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{process.description}</p>
                  </CardContent>
                </Card>
                {idx < certificationProcess.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                    <ArrowRight className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-6">
        <div className="container max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Why Get Certified?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Stand out in the rapidly growing AI safety field with recognized credentials.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {benefits.map((benefit, idx) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-green-100 dark:from-blue-900/30 dark:to-green-900/30 flex items-center justify-center flex-shrink-0">
                        <benefit.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <CardTitle className="mb-2">{benefit.title}</CardTitle>
                        <p className="text-muted-foreground">{benefit.description}</p>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Certificate Preview */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="container max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <h2 className="text-3xl font-bold mb-4">Your Professional Certificate</h2>
            <p className="text-muted-foreground">
              Each certificate includes your name, course details, completion date, unique certificate ID,
              and QR code for instant verification.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <Card className="p-8 bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-950/30 dark:to-green-950/30 border-2">
              <div className="text-center space-y-4">
                <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">🏆</div>
                <h3 className="text-2xl font-bold">Certificate of Completion</h3>
                <p className="text-lg">This certifies that</p>
                <p className="text-3xl font-bold">Your Name</p>
                <p className="text-lg">has successfully completed</p>
                <p className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
                  EU AI Act Fundamentals
                </p>
                <div className="flex justify-center gap-8 pt-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Issue Date</p>
                    <p className="font-semibold">January 1, 2026</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Certificate ID</p>
                    <p className="font-semibold">COAI-EU-2026-001234</p>
                  </div>
                </div>
                <div className="pt-4">
                  <div className="w-24 h-24 bg-white dark:bg-gray-900 mx-auto rounded border-2 flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">QR Code</span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
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
              Start Your AI Safety Journey Today
            </h2>
            <p className="text-xl text-muted-foreground">
              Join thousands of professionals earning recognized AI safety certifications.
              Free to start, learn at your own pace.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/courses">
                <Button size="lg">
                  Browse Courses
                  <BookOpen className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/features/watchdog-jobs">
                <Button size="lg" variant="outline">
                  Explore Career Paths
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
