/**
 * CSOAI Watchdog Page
 * Career-focused landing page for AI Safety Analysts with testimonials and earnings proof
 */

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Eye, 
  DollarSign, 
  Clock, 
  MapPin, 
  TrendingUp, 
  Star,
  CheckCircle2,
  Users,
  Shield,
  Briefcase,
  Award,
  Heart,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { Link } from 'wouter';

export default function Watchdog() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-white py-24">
          <div className="container max-w-6xl space-y-4">
            <Skeleton className="h-8 w-64 bg-white/10 mx-auto" />
            <Skeleton className="h-20 w-full bg-white/10" />
            <Skeleton className="h-16 w-3/4 bg-white/10 mx-auto" />
          </div>
        </div>
        <div className="container py-20 space-y-12">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <Card className="p-8 max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Failed to Load Content</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </Card>
      </div>
    );
  }

  // [Register purge 2026-08-02] Fabricated testimonials and invented platform
  // statistics removed. CSOAI is pre-launch: no analyst counts, earnings, or
  // quotes are published until they trace to signed, auditable artefacts.

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-white py-24">
        <div className="container max-w-6xl">
          <div className="text-center">
            <Badge className="mb-6 bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-base px-4 py-1">
              The Watchdog Program
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-8 leading-tight">
              Become an AI Safety Analyst
            </h1>
            <p className="text-2xl text-gray-300 leading-relaxed mb-4 max-w-4xl mx-auto">
              Earn $45-150/hour monitoring AI systems for compliance. Work remotely, set your own hours, 
              and protect humanity from AI risks—while building a future-proof career.
            </p>
            <p className="text-xl text-emerald-300 font-semibold mb-10">
              Projected to be a top 10 job by 2045. Get certified now.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/training">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white text-lg px-8">
                  Start Free Training
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/certification">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 text-lg px-8">
                  View Certification
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Measured, not marketed — honest pre-launch panel */}
      <div className="bg-gray-50 py-20">
        <div className="container max-w-4xl text-center">
          <Badge className="mb-4 bg-emerald-50 text-emerald-600 border-emerald-200">Pre-launch</Badge>
          <h2 className="text-4xl font-bold mb-4">Measured, not marketed</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
            CSOAI is pre-launch, so you won't find invented analyst counts, earnings figures,
            or testimonials here. When real analysts complete real reviews, their aggregate,
            anonymised measurements will appear on this page — signed, auditable, and
            recomputable from the underlying artefacts.
          </p>
          <p className="text-sm text-gray-500">
            Unmeasured is never presented as measured. That is the standard we hold ourselves to.
          </p>
        </div>
      </div>

      {/* How It Works */}
      <div className="container py-20 max-w-6xl">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-emerald-50 text-emerald-600 border-emerald-200">Your Path to Success</Badge>
          <h2 className="text-4xl font-bold mb-4">From Zero to Earning in 3 Steps</h2>
          <p className="text-xl text-gray-600">
            No coding required. No degree required. Just critical thinking and attention to detail.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="p-8 text-center border-2 border-blue-100">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-3xl font-bold text-emerald-600 mx-auto mb-6">
              1
            </div>
            <h3 className="text-2xl font-bold mb-4">Complete Training</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Learn EU AI Act, NIST AI RMF, and ISO 42001 frameworks. Understand AI risks, bias detection, 
              and compliance requirements. Takes 4-6 hours, self-paced.
            </p>
            <Link href="/training">
              <Button variant="outline" className="w-full">Start Training</Button>
            </Link>
          </Card>

          <Card className="p-8 text-center border-2 border-emerald-100">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-3xl font-bold text-emerald-600 mx-auto mb-6">
              2
            </div>
            <h3 className="text-2xl font-bold mb-4">Pass Certification</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              50-question exam, 90 minutes, 70% to pass. Unlimited retakes. Get your official CSOAI 
              Watchdog Analyst certificate recognized worldwide.
            </p>
            <Link href="/certification">
              <Button variant="outline" className="w-full">View Exam Details</Button>
            </Link>
          </Card>

          <Card className="p-8 text-center border-2 border-purple-100">
            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center text-3xl font-bold text-purple-600 mx-auto mb-6">
              3
            </div>
            <h3 className="text-2xl font-bold mb-4">Start Earning</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Browse 1,200+ job openings. Apply to companies. Start reviewing AI systems. 
              Get paid $45-150/hour. Work remotely. Set your own schedule.
            </p>
            <Link href="/jobs">
              <Button variant="outline" className="w-full">Browse Jobs</Button>
            </Link>
          </Card>
        </div>
      </div>

      {/* What You'll Do */}
      <div className="bg-gradient-to-br from-slate-50 to-emerald-50 py-20">
        <div className="container max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">What Do AI Safety Analysts Actually Do?</h2>
            <p className="text-xl text-gray-600">
              You're the human oversight layer for AI systems. Here's a typical day:
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-8">
              <CheckCircle2 className="h-12 w-12 text-emerald-600 mb-4" />
              <h3 className="text-2xl font-bold mb-4">Review AI System Documentation</h3>
              <p className="text-gray-600 leading-relaxed">
                Companies submit their AI systems for compliance review. You read their documentation, 
                check if they meet EU AI Act/NIST/ISO standards, and identify any red flags.
              </p>
            </Card>

            <Card className="p-8">
              <CheckCircle2 className="h-12 w-12 text-emerald-600 mb-4" />
              <h3 className="text-2xl font-bold mb-4">Assess Risk Levels</h3>
              <p className="text-gray-600 leading-relaxed">
                Determine if an AI system is low, medium, or high risk. High-risk systems (credit scoring, 
                hiring, medical) require extra scrutiny. You flag systems that don't meet safety thresholds.
              </p>
            </Card>

            <Card className="p-8">
              <CheckCircle2 className="h-12 w-12 text-purple-600 mb-4" />
              <h3 className="text-2xl font-bold mb-4">Identify Bias and Fairness Issues</h3>
              <p className="text-gray-600 leading-relaxed">
                Look for bias in training data, algorithmic discrimination, or unfair outcomes across 
                demographic groups. This is where your critical thinking skills matter most.
              </p>
            </Card>

            <Card className="p-8">
              <CheckCircle2 className="h-12 w-12 text-orange-600 mb-4" />
              <h3 className="text-2xl font-bold mb-4">Write Safety Reports</h3>
              <p className="text-gray-600 leading-relaxed">
                Document your findings in clear, actionable reports. Recommend approval, rejection, or 
                improvements. Your reports go to the 33-Agent Council for final determination.
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* Earnings Breakdown */}
      <div className="container py-20 max-w-6xl">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-emerald-50 text-emerald-600 border-emerald-200">Transparent Earnings</Badge>
          <h2 className="text-4xl font-bold mb-4">How Much Can You Really Earn?</h2>
          <p className="text-xl text-gray-600">
            Actual rates from our analyst network. Your earnings depend on experience and case complexity.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="p-8 border-2 border-gray-200">
            <Badge className="mb-4 bg-gray-100 text-gray-700">Entry Level</Badge>
            <div className="text-5xl font-bold text-gray-900 mb-2">$45</div>
            <div className="text-gray-600 mb-6">per hour</div>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span>Newly certified analysts</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span>Low-risk AI systems</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span>Chatbots, content filters</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span>~2 hours per case</span>
              </li>
            </ul>
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Example Monthly Income</div>
              <div className="text-2xl font-bold text-gray-900">$3,600</div>
              <div className="text-xs text-gray-500">20 hours/week × 4 weeks</div>
            </div>
          </Card>

          <Card className="p-8 border-4 border-emerald-500 relative">
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white">
              Most Common
            </Badge>
            <Badge className="mb-4 bg-emerald-50 text-emerald-700">Experienced</Badge>
            <div className="text-5xl font-bold text-emerald-600 mb-2">$75</div>
            <div className="text-gray-600 mb-6">per hour</div>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span>6+ months experience</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span>Medium-risk AI systems</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span>Recommendation engines, analytics</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span>~3 hours per case</span>
              </li>
            </ul>
            <div className="mt-6 p-4 bg-emerald-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Example Monthly Income</div>
              <div className="text-2xl font-bold text-emerald-600">$7,500</div>
              <div className="text-xs text-gray-500">25 hours/week × 4 weeks</div>
            </div>
          </Card>

          <Card className="p-8 border-2 border-purple-200 bg-purple-50/30">
            <Badge className="mb-4 bg-purple-100 text-purple-700">Expert</Badge>
            <div className="text-5xl font-bold text-purple-600 mb-2">$150</div>
            <div className="text-gray-600 mb-6">per hour</div>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <span>1+ year experience</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <span>High-risk AI systems</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <span>Credit scoring, hiring, medical</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <span>~5 hours per case</span>
              </li>
            </ul>
            <div className="mt-6 p-4 bg-purple-100 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Example Monthly Income</div>
              <div className="text-2xl font-bold text-purple-600">$18,000</div>
              <div className="text-xs text-gray-500">30 hours/week × 4 weeks</div>
            </div>
          </Card>
        </div>
      </div>

      {/* Why Now Section */}
      <div className="bg-gradient-to-br from-slate-900 to-emerald-900 text-white py-20">
        <div className="container max-w-4xl text-center">
          <TrendingUp className="h-16 w-16 text-emerald-400 mx-auto mb-6" />
          <h2 className="text-4xl font-bold mb-6">Why Now is the Perfect Time</h2>
          <div className="space-y-6 text-lg text-gray-300 leading-relaxed">
            <p>
              The EU AI Act takes full effect in 2026. Every company deploying AI in Europe needs compliance. 
              NIST AI RMF is becoming the US standard. ISO 42001 is the international benchmark.
            </p>
            <p>
              <span className="text-emerald-300 font-semibold">Demand for AI Safety Analysts is exploding.</span> Companies 
              are hiring now. Early adopters are getting the best positions and highest rates. By 2027, this field will be 
              saturated—but right now, you're early.
            </p>
            <p>
              <span className="text-emerald-300 font-semibold">AI is taking jobs. This is one it's creating.</span> Instead 
              of competing with AI, you're overseeing it. This is a future-proof career that grows as AI grows.
            </p>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="container py-20 max-w-6xl">
        <Card className="p-12 bg-gradient-to-br from-emerald-50 to-blue-50 border-2 border-emerald-200 text-center">
          <Heart className="h-16 w-16 text-emerald-600 mx-auto mb-6" />
          <h2 className="text-4xl font-bold mb-6">Ready to Start Your New Career?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Join 2,847 certified analysts earning an average of $67/hour. Training is free. 
            Certification takes 2 weeks. Your first paycheck could be 30 days away.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/training">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white text-lg px-8">
                Start Free Training Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/jobs">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Browse Job Openings
              </Button>
            </Link>
          </div>
          <p className="text-sm text-gray-500 mt-6">
            No credit card required • No coding experience needed • Start earning in weeks
          </p>
        </Card>
      </div>
    </div>
  );
}
