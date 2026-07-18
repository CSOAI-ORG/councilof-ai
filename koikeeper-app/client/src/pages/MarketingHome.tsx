/**
 * Marketing Landing Page (proof.ai style)
 * High-quality landing page for LOI signups and viral growth
 */

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Shield,
  Users,
  BarChart3,
  RefreshCw,
  Eye,
  CheckCircle2,
  Star,
  Play,
  ChevronRight,
  Zap,
  Globe,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { toast } from "sonner";
import CouncilVisualization from "@/components/CouncilVisualization";

export default function MarketingHome() {
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLOISignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast.success("Thank you! We'll be in touch soon.");
    setEmail("");
    setCompany("");
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              CO
            </div>
            <span className="font-bold text-xl">COAI</span>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">
              Pricing
            </a>
            <a href="#faq" className="text-sm font-medium hover:text-primary transition-colors">
              FAQ
            </a>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Button size="sm">
              Start Free Trial
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 z-0 opacity-30"
          style={{
            backgroundImage: "url(/hero-bg.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-background via-background/95 to-background" />

        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            {/* Badge */}
            <Badge variant="outline" className="mb-6 px-4 py-1.5">
              <Zap className="h-3 w-3 mr-1.5" />
              Byzantine Consensus for AI Safety
            </Badge>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent leading-tight">
              AI Governance
              <br />
              Made Simple
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              The first platform to implement <strong>TC260</strong>, <strong>EU AI Act</strong>, and{" "}
              <strong>NIST AI RMF</strong> compliance with 33-agent Byzantine consensus.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" className="text-lg px-8 py-6">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </div>

            {/* Social Proof */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>1,000+ LOI Signups</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>170 Tests Passing</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>100% TC260 Compliant</span>
              </div>
            </div>
          </motion.div>

          {/* Live 33-Agent Council Visualization */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-20 max-w-6xl mx-auto"
          >
            <div className="relative rounded-2xl border-2 shadow-2xl overflow-hidden bg-card/50 backdrop-blur-sm">
              <div className="absolute top-4 left-4 z-10">
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                  <span className="relative flex h-2 w-2 mr-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  Live Voting
                </Badge>
              </div>
              <div className="aspect-video bg-gradient-to-br from-primary/5 via-background/50 to-accent/5">
                <CouncilVisualization autoAnimate={true} showLabels={true} />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent p-6">
                <p className="text-center text-sm text-muted-foreground">
                  <strong className="text-foreground">Byzantine Consensus in Action</strong> — Watch 33 AI agents reach agreement in real-time
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              Features
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything you need for AI governance
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From Byzantine consensus to PDCA cycles, COAI provides a complete governance platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1: 33-Agent Council */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="mb-4">
                    <img
                      src="/feature-council.png"
                      alt="33-Agent Council"
                      className="h-16 w-16 object-contain"
                    />
                  </div>
                  <h3 className="text-xl font-bold mb-2">33-Agent Council</h3>
                  <p className="text-muted-foreground mb-4">
                    Byzantine fault-tolerant consensus with 5 LLM providers (OpenAI, Anthropic, Google, Kimi,
                    DeepSeek). Tolerates up to 10 malicious agents.
                  </p>
                  <Button variant="link" className="p-0">
                    Learn more
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Feature 2: Public Watchdog */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="mb-4">
                    <img
                      src="/feature-watchdog.png"
                      alt="Watchdog System"
                      className="h-16 w-16 object-contain"
                    />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Public Watchdog</h3>
                  <p className="text-muted-foreground mb-4">
                    Certified analysts submit incident reports. Public transparency dashboard with real-time
                    council voting. Leaderboard for top contributors.
                  </p>
                  <Button variant="link" className="p-0">
                    Learn more
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Feature 3: PDCA Cycles */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="mb-4">
                    <img src="/feature-pdca.png" alt="PDCA Cycles" className="h-16 w-16 object-contain" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">PDCA Cycles</h3>
                  <p className="text-muted-foreground mb-4">
                    Continuous improvement methodology (Plan-Do-Check-Act). Track phases, generate PDF reports,
                    integrate with Watchdog and Council.
                  </p>
                  <Button variant="link" className="p-0">
                    Learn more
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Feature 4: Multi-Framework Compliance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <Shield className="h-16 w-16 text-primary mb-4" />
                  <h3 className="text-xl font-bold mb-2">Multi-Framework Compliance</h3>
                  <p className="text-muted-foreground mb-4">
                    Support for TC260, EU AI Act, NIST AI RMF. Automated assessments, gap analysis, and
                    compliance scorecards with PDF export.
                  </p>
                  <Button variant="link" className="p-0">
                    Learn more
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Feature 5: RLMAI Knowledge Base */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <BarChart3 className="h-16 w-16 text-primary mb-4" />
                  <h3 className="text-xl font-bold mb-2">RLMAI Recommendations</h3>
                  <p className="text-muted-foreground mb-4">
                    AI-powered recommendations based on council voting patterns and incident analysis. Track
                    implementation and learn from user feedback.
                  </p>
                  <Button variant="link" className="p-0">
                    Learn more
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Feature 6: Enterprise API */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <Globe className="h-16 w-16 text-primary mb-4" />
                  <h3 className="text-xl font-bold mb-2">Enterprise API & SDK</h3>
                  <p className="text-muted-foreground mb-4">
                    RESTful API with webhooks, TypeScript SDK, comprehensive documentation. Automate compliance
                    reporting and integrate with your stack.
                  </p>
                  <Button variant="link" className="p-0">
                    Learn more
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* LOI Signup Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Join 1,000+ Early Adopters</h2>
            <p className="text-xl mb-8 opacity-90">
              Sign up for early access and get <strong>50% off</strong> as a Founding Member.
            </p>

            <form onSubmit={handleLOISignup} className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
              <Input
                type="email"
                placeholder="Your work email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background text-foreground flex-1"
              />
              <Input
                type="text"
                placeholder="Company name"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
                className="bg-background text-foreground flex-1"
              />
              <Button
                type="submit"
                size="lg"
                variant="secondary"
                disabled={isSubmitting}
                className="whitespace-nowrap"
              >
                {isSubmitting ? "Submitting..." : "Get Early Access"}
              </Button>
            </form>

            <p className="text-sm mt-4 opacity-75">
              No credit card required. 14-day free trial. Cancel anytime.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="container">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              Pricing
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Simple, transparent pricing</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your needs. All plans include core features.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Tier */}
            <Card>
              <CardContent className="pt-6">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2">Free</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">$0</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm">1 AI system</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm">Basic compliance assessments</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm">Public Watchdog access</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm">Community support</span>
                  </li>
                </ul>

                <Button variant="outline" className="w-full">
                  Get Started
                </Button>
              </CardContent>
            </Card>

            {/* Pro Tier */}
            <Card className="border-primary shadow-lg relative">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Most Popular</Badge>
              <CardContent className="pt-6">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2">Pro</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">$99</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    <s>$198</s> 50% off for Founding Members
                  </p>
                </div>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm">Unlimited AI systems</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm">Multi-framework compliance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm">PDCA cycle management</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm">PDF report generation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm">Priority support</span>
                  </li>
                </ul>

                <Button className="w-full">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Enterprise Tier */}
            <Card>
              <CardContent className="pt-6">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">$499</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm">Everything in Pro</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm">API access & webhooks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm">Custom integrations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm">Dedicated support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm">SLA guarantee</span>
                  </li>
                </ul>

                <Button variant="outline" className="w-full">
                  Contact Sales
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-muted/30">
        <div className="container max-w-3xl">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              FAQ
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Frequently asked questions</h2>
          </div>

          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-bold mb-2">What is Byzantine consensus?</h3>
                <p className="text-muted-foreground">
                  Byzantine consensus is a fault-tolerant decision-making algorithm that can reach agreement
                  even when some participants (agents) are malicious or faulty. Our 33-agent system can
                  tolerate up to 10 malicious agents while still reaching valid decisions.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-bold mb-2">Is COAI compliant with TC260?</h3>
                <p className="text-muted-foreground">
                  Yes, COAI implements all requirements of China's TC260 AI Safety Governance Framework,
                  including continuous monitoring (PDCA), ethical review (Council), incident reporting
                  (Watchdog), and transparency (public dashboard).
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-bold mb-2">How does the Watchdog system work?</h3>
                <p className="text-muted-foreground">
                  Certified Watchdog Analysts submit incident reports about AI systems. These reports are
                  reviewed by our 33-Agent Council using Byzantine consensus. Approved reports are published on
                  our public transparency dashboard.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-bold mb-2">Can I integrate COAI with my existing systems?</h3>
                <p className="text-muted-foreground">
                  Yes, Enterprise plans include full API access with webhooks, TypeScript SDK, and
                  comprehensive documentation. You can automate compliance reporting and integrate COAI with
                  your CI/CD pipeline.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to get started?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join 1,000+ companies building safer AI with COAI.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 py-6">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                Book a Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/30">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                  CO
                </div>
                <span className="font-bold text-xl">COAI</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI governance made simple with Byzantine consensus.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#features" className="hover:text-foreground transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-foreground transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <Link href="/api-docs" className="hover:text-foreground transition-colors">
                    API Docs
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="hover:text-foreground transition-colors">
                    Blog
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Security
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>&copy; 2025 COAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
