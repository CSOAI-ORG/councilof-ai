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
            <span className="font-bold text-xl">CSOAI</span>
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
        {/* Background Gradient */}
        <div
          className="absolute inset-0 z-0 opacity-30 bg-gradient-to-br from-[#1a1a2e] to-[#16213e]"
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
              Multi-Agent Council for AI Safety
            </Badge>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent leading-tight">
              AI Governance
              <br />
              Made Simple
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              The first platform to implement <strong>EU AI Act</strong>,{" "}
              <strong>NIST AI RMF</strong>, and ISO/IEC 42001 measurement with a designed 33-agent council.
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
                <span>Crosswalked to TC260 controls</span>
              </div>
            </div>
          </motion.div>

          {/* Designed 33-agent council — structure, not a fault-tolerance guarantee */}
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
                  <strong className="text-foreground">Multi-Agent Council in Action</strong> — Watch 33 AI agents reach agreement in real-time
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* PLACEHOLDER_REST */}
    </div>
  );
}
