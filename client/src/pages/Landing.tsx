/*
 * COAI Public Landing Page
 * Marketing page with Watchdog job signup CTA
 * "Are you worried about AI safety? Earn money as an AI Watchdog!"
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation, Link } from "wouter";
import {
  Shield,
  Users,
  Eye,
  CheckCircle2,
  ArrowRight,
  Globe,
  Zap,
  TrendingUp,
  FileCheck,
  Scale,
  Clock,
  DollarSign,
  Home as HomeIcon,
  Laptop,
  Award,
  ChevronRight,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

const features = [
  {
    icon: Shield,
    title: "Multi-Framework Compliance",
    description: "EU AI Act, NIST AI RMF, TC260 - all in one platform",
  },
  {
    icon: Users,
    title: "33-Agent Council",
    description: "Byzantine fault-tolerant AI voting system for unbiased decisions",
  },
  {
    icon: Eye,
    title: "The Watchdog",
    description: "Public incident reporting for transparent AI accountability",
  },
  {
    icon: TrendingUp,
    title: "SOAI-PDCA Loop",
    description: "Continuous improvement cycle for AI safety governance",
  },
];

const frameworks = [
  { name: "EU AI Act", articles: 113, status: "Mandatory Aug 2026" },
  { name: "NIST AI RMF", articles: 72, status: "Voluntary" },
  { name: "TC260", articles: 56, status: "China Standard" },
];

const benefits = [
  { icon: HomeIcon, title: "Work From Home", description: "Flexible remote work" },
  { icon: Clock, title: "Flexible Hours", description: "Set your own schedule" },
  { icon: DollarSign, title: "Earn Money", description: "Get paid per case reviewed" },
  { icon: Award, title: "Get Certified", description: "Free training & certification" },
];

export default function Landing() {
  const [, setLocation] = useLocation();
  
  // Get LOI count
  const { data: loiData } = trpc.applications.getCount.useQuery();
  const { data: watchdogReports } = trpc.watchdog.list.useQuery();
  
  const loiCount = loiData?.total || 0;
  const reportCount = watchdogReports?.length || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">CO</span>
            </div>
            <span className="font-bold text-lg">COAI</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">Council of AIs</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/watchdog">
              <Button variant="ghost" size="sm">Watchdog</Button>
            </Link>
            <Link href="/">
              <Button size="sm">
                Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Globe className="h-4 w-4" />
                Western TC260 Equivalent
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                AI Safety Governance
                <span className="text-primary"> for Humanity</span>
              </h1>
              
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                The first comprehensive AI safety compliance platform for the West. 
                Multi-framework support, 33-agent Byzantine consensus, and public accountability 
                through The Watchdog.
              </p>
              
              <div className="flex flex-wrap gap-4 mb-8">
                <Link href="/">
                  <Button size="lg" className="gap-2">
                    Get Started Free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/watchdog-signup">
                  <Button size="lg" variant="outline" className="gap-2">
                    <Eye className="h-4 w-4" />
                    Become a Watchdog
                  </Button>
                </Link>
              </div>
              
              {/* Stats */}
              <div className="flex gap-8">
                <div>
                  <p className="text-3xl font-bold text-primary">{loiCount}+</p>
                  <p className="text-sm text-muted-foreground">Watchdog Signups</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-primary">{reportCount}</p>
                  <p className="text-sm text-muted-foreground">Public Reports</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-primary">3</p>
                  <p className="text-sm text-muted-foreground">Frameworks</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative"
            >
              {/* Dashboard Preview Card */}
              <Card className="bg-card border-border shadow-2xl overflow-hidden">
                <div className="bg-secondary/50 px-4 py-2 border-b border-border flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="ml-2 text-xs text-muted-foreground">COAI Dashboard</span>
                </div>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                        <span className="text-primary-foreground font-bold text-xs">COAI</span>
                      </div>
                      <div>
                        <p className="font-semibold">Hello, Admin</p>
                        <p className="text-sm text-muted-foreground">How can I help you today?</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      {["Compliance Check", "Risk Assessment", "Agent Council", "Watchdog"].map((item) => (
                        <div key={item} className="p-3 rounded-lg bg-secondary/50 text-sm">
                          {item}
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary">
                      <span className="text-muted-foreground text-sm">Ask about AI compliance...</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Floating badges */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="absolute -bottom-4 -left-4 bg-emerald-500 text-white px-4 py-2 rounded-lg shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="font-medium">EU AI Act Ready</span>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="absolute -top-4 -right-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">33 AI Agents</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Watchdog CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary/5 to-purple-500/5">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 text-sm font-medium mb-4">
              <Zap className="h-4 w-4" />
              Now Hiring
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Are You Worried About AI Safety?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Become a Watchdog Analyst. Work from home, earn money, and help protect humanity from AI risks.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            {benefits.map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="bg-card border-border h-full">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-semibold mb-2">{benefit.title}</h3>
                      <p className="text-sm text-muted-foreground">{benefit.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
          
          <div className="text-center">
            <Link href="/watchdog-signup">
              <Button size="lg" className="gap-2">
                Sign Up to Become a Watchdog
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground mt-4">
              <span className="font-semibold text-primary">{loiCount}+</span> people have already signed up
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              The Western TC260
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive AI safety governance built for Western democracies
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="bg-card border-border h-full hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-semibold mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Frameworks Section */}
      <section className="py-20 px-4 bg-secondary/30">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Multi-Framework Compliance
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              One platform, all major AI safety frameworks
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {frameworks.map((framework, idx) => (
              <motion.div
                key={framework.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="bg-card border-border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-lg">{framework.name}</h3>
                      <FileCheck className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Requirements</span>
                        <span className="font-medium">{framework.articles}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Status</span>
                        <span className="font-medium text-primary">{framework.status}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Ensure AI Safety?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join the movement. Whether you're a business ensuring compliance or an individual 
              wanting to protect humanity, COAI is for you.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/">
                <Button size="lg" className="gap-2">
                  Start Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/watchdog-signup">
                <Button size="lg" variant="outline" className="gap-2">
                  Become a Watchdog
                  <Eye className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs">CO</span>
              </div>
              <span className="font-bold">COAI</span>
              <span className="text-sm text-muted-foreground">Council of AIs</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/watchdog">
                <span className="hover:text-foreground transition cursor-pointer">Watchdog</span>
              </Link>
              <Link href="/watchdog-signup">
                <span className="hover:text-foreground transition cursor-pointer">Careers</span>
              </Link>
              <a href="https://github.com/optimobile/coai-dashboard" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition">
                GitHub
              </a>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 COAI. Open source under MIT License.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
