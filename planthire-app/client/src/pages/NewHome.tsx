import { Link } from "wouter";
import { Shield, Users, TrendingUp, Award, Eye, Globe, ArrowRight, CheckCircle, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import AnimatedParticles from "@/components/AnimatedParticles";
import PlatformTour from "@/components/PlatformTour";

export default function NewHome() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("individual");

  const handleLOISubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }
    // TODO: Connect to backend LOI endpoint
    toast.success("Thank you! We'll be in touch soon with your Founding Member discount.");
    setEmail("");
  };

  return (
    <>
      <PlatformTour />
      <div className="min-h-screen bg-gradient-to-b from-[#0A2540] via-[#1E3A5F] to-[#0A2540]">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-60"
          style={{ backgroundImage: "url(/hero-epic.png)" }}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A2540]/90 via-[#0A2540]/70 to-[#0A2540]/90" />
        
        {/* Animated Particles */}
        <AnimatedParticles />
        
        {/* Content */}
        <div className="relative z-10 container mx-auto px-6 py-20 text-center">
          {/* Badge */}
          <Badge className="mb-6 bg-green-500/20 text-blue-300 border-blue-400/30 text-sm px-4 py-2">
            <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
            Leading AI Safety Certification Platform
          </Badge>
          
          {/* Hero Headline */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-6 leading-tight">
            AI is Taking Jobs.<br />
            <span className="bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
              We're Creating Them.
            </span>
          </h1>
          
          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-white mb-6 max-w-3xl mx-auto leading-relaxed">
            <strong>Worried about AI safety?</strong> Turn that concern into a career. AI Safety Analyst is projected to become one of the <strong>top 10 jobs by 2045</strong> as AI systems proliferate globally.
          </p>
          
          <p className="text-lg md:text-xl text-gray-100 mb-10 max-w-3xl mx-auto leading-relaxed">
            Join the global movement protecting humanity from AI risks while earning from home. Get ahead of the curve now—no coding required, just critical thinking and our comprehensive training.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/watchdog-signup">
              <Button size="lg" className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-6 text-lg font-semibold shadow-lg shadow-blue-500/50 hover:shadow-xl hover:shadow-blue-500/60 transition-all duration-300 hover:-translate-y-1">
                Start Training (Free)
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/pdca-simulator">
              <Button size="lg" variant="outline" className="border-2 border-green-400/50 text-green-300 hover:bg-green-500/20 px-8 py-6 text-lg font-semibold backdrop-blur-sm transition-all duration-300 hover:-translate-y-1">
                <Play className="mr-2 h-5 w-5" />
                Try Interactive Demo
              </Button>
            </Link>
            <Link href="/training">
              <Button size="lg" variant="outline" className="border-2 border-white/30 text-white hover:bg-white/10 px-8 py-6 text-lg font-semibold backdrop-blur-sm transition-all duration-300 hover:-translate-y-1">
                See Job Opportunities
              </Button>
            </Link>
          </div>
          
          {/* Mission Statement */}
          <div className="flex flex-wrap justify-center gap-8 text-white/80 text-sm max-w-4xl mx-auto">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span>Transparent AI Governance</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span>Byzantine Fault-Tolerant Consensus</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-gray-600" />
              <span>Public Accountability</span>
            </div>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
            <div className="w-1 h-2 bg-white/50 rounded-full" />
          </div>
        </div>
      </section>

      {/* What is CSOAI? Mission Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <Badge className="mb-6 bg-green-100 text-green-800 border-green-300">
              Our Mission
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">
              What is CSOAI?
            </h2>
            <p className="text-xl text-gray-700 leading-relaxed mb-6">
              CSOAI (Council for Safety of AI) is the world's first comprehensive platform revolutionizing the relationship between humanity and artificial intelligence. We create <strong>transparency, accountability, and safety</strong> for AI systems through a unique combination of human expertise and Byzantine fault-tolerant AI consensus.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
              Our platform serves <strong>everyone</strong>—governments ensuring regulatory compliance, enterprises building trustworthy AI, individuals pursuing AI safety careers, and the public holding AI systems accountable. One platform. Complete coverage. Full transparency.
            </p>
          </div>

          {/* Three Pillars */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="p-8 text-center hover:shadow-xl transition-shadow border-2 border-green-100">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Transparency</h3>
              <p className="text-gray-600">
                Every AI system, every decision, every compliance score visible to the public. No secrets, no hidden risks.
              </p>
            </Card>

            <Card className="p-8 text-center hover:shadow-xl transition-shadow border-2 border-gray-200">
              <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Accountability</h3>
              <p className="text-gray-600">
                33-Agent Byzantine consensus with human oversight ensures no single entity controls AI safety decisions.
              </p>
            </Card>

            <Card className="p-8 text-center hover:shadow-xl transition-shadow border-2 border-green-100">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Globe className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">For Everyone</h3>
              <p className="text-gray-600">
                Governments, enterprises, safety professionals, and concerned citizens all have a voice in AI governance.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Job Creation Section */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Turn AI Anxiety Into AI Income
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              As AI grows, so does the need for AI safety oversight. When robotics go mainstream, 
              demand for watchdog analysts will explode 10x.
            </p>
          </div>

          {/* Job Creation Visual */}
          <div className="mb-16">
            <img 
              src="/job-creation-visual.png" 
              alt="Diverse analysts working from home" 
              className="w-full max-w-5xl mx-auto rounded-2xl shadow-2xl"
            />
          </div>

          {/* 3-Step Process */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card className="p-8 text-center hover:shadow-xl transition-shadow border-2 border-green-100">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Award className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">1. Train</h3>
              <p className="text-gray-600 mb-6">
                Complete free certification courses on AI safety, ethics, and technical assessment. 
                Learn at your own pace.
              </p>
              <Link href="/training">
                <Button variant="ghost" className="text-green-600 hover:text-green-700">
                  Browse Courses →
                </Button>
              </Link>
            </Card>

            <Card className="p-8 text-center hover:shadow-xl transition-shadow border-2 border-gray-200">
              <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">2. Certify</h3>
              <p className="text-gray-600 mb-6">
                Pass industry-standard exams to become a certified AI Safety Watchdog Analyst. 
                Recognized globally.
              </p>
              <Link href="/certification">
                <Button variant="ghost" className="text-gray-900 hover:text-gray-700">
                  Take Exam →
                </Button>
              </Link>
            </Card>

            <Card className="p-8 text-center hover:shadow-xl transition-shadow border-2 border-green-100">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">3. Earn</h3>
              <p className="text-gray-600 mb-6">
                Get paid per report reviewed. Work from anywhere, set your own hours. 
                Average $45/hour.
              </p>
              <Link href="/workbench">
                <Button variant="ghost" className="text-green-600 hover:text-green-700">
                  Start Earning →
                </Button>
              </Link>
            </Card>
          </div>

          {/* Value Propositions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-black text-green-600 mb-2">Free</div>
              <div className="text-gray-600">Training & Certification</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-green-600 mb-2">$45/hr</div>
              <div className="text-gray-600">Competitive Pay</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-gray-900 mb-2">100%</div>
              <div className="text-gray-600">Remote Work</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-green-600 mb-2">24/7</div>
              <div className="text-gray-600">Flexible Hours</div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <Link href="/watchdog-signup">
              <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-12 py-6 text-lg font-semibold shadow-lg">
                See Current Job Openings
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-green-600 text-white">
              Trusted by Thousands
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Real Stories. Real Results.
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join thousands of certified analysts who've transformed their careers with CSOAI
            </p>
          </div>

          {/* Testimonials Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="p-8 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  SC
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Sarah Chen</h4>
                  <p className="text-sm text-gray-600">AI Safety Analyst</p>
                </div>
              </div>
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-xl">★</span>
                ))}
              </div>
              <p className="text-gray-700 mb-4">
                "CSOAI certification opened doors I didn't know existed. Within 3 months, I landed a $120K AI Safety Analyst role at a Fortune 500 company. The training was comprehensive and the community support was incredible."
              </p>
              <Badge className="bg-green-100 text-green-800">Certified in 2024</Badge>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  MR
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Marcus Rodriguez</h4>
                  <p className="text-sm text-gray-600">Former Teacher</p>
                </div>
              </div>
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-xl">★</span>
                ))}
              </div>
              <p className="text-gray-700 mb-4">
                "I transitioned from teaching to AI safety with zero technical background. CSOAI's courses made complex concepts accessible. Now I work from home, set my own hours, and earn 40% more than I did teaching."
              </p>
              <Badge className="bg-green-100 text-green-800">Certified in 2023</Badge>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  AP
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Aisha Patel</h4>
                  <p className="text-sm text-gray-600">Compliance Officer</p>
                </div>
              </div>
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-xl">★</span>
                ))}
              </div>
              <p className="text-gray-700 mb-4">
                "As a compliance officer, CSOAI gave me the AI-specific expertise I needed. The 33-Agent Council framework is brilliant—it's now part of our company's standard operating procedures. Worth every minute."
              </p>
              <Badge className="bg-green-100 text-green-800">Certified in 2024</Badge>
            </Card>
          </div>

          {/* Platform Capabilities */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
            <div className="grid md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-5xl font-black mb-2">3</div>
                <div className="text-white">Major Frameworks</div>
                <div className="text-sm text-gray-100 mt-1">EU AI Act, NIST, ISO</div>
              </div>
              <div>
                <div className="text-5xl font-black mb-2">33</div>
                <div className="text-white">AI Agents</div>
                <div className="text-sm text-gray-100 mt-1">Byzantine Consensus</div>
              </div>
              <div>
                <div className="text-5xl font-black mb-2">100%</div>
                <div className="text-white">Transparent</div>
                <div className="text-sm text-gray-100 mt-1">Public Dashboard</div>
              </div>
              <div>
                <div className="text-5xl font-black mb-2">24/7</div>
                <div className="text-white">Monitoring</div>
                <div className="text-sm text-gray-100 mt-1">Real-time Oversight</div>
              </div>
            </div>
          </div>

          {/* Success Stories CTA */}
          <div className="text-center mt-12">
            <Link href="/blog">
              <Button variant="outline" size="lg" className="border-2 border-gray-300 hover:border-gray-400">
                Read More Success Stories
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Complete Ecosystem Pipeline Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              Complete AI Safety Ecosystem
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              One Platform. <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Complete AI Safety Coverage.</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              CSOAI is the world's first end-to-end AI safety platform covering training, certification, oversight, compliance, and continuous improvement. Everything you need in one place.
            </p>
          </div>

          {/* Pipeline Visualization */}
          <div className="mb-16">
            <div className="grid md:grid-cols-5 gap-4">
              <Card className="p-6 text-center border-2 border-green-200 hover:shadow-xl transition-all">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="h-8 w-8 text-white" />
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Training</h4>
                <p className="text-sm text-gray-600">EU AI Act, NIST AI RMF, ISO 42001 courses</p>
              </Card>
              
              <div className="hidden md:flex items-center justify-center">
                <ArrowRight className="h-8 w-8 text-gray-400" />
              </div>

              <Card className="p-6 text-center border-2 border-gray-200 hover:shadow-xl transition-all">
                <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Certification</h4>
                <p className="text-sm text-gray-600">Industry-recognized credentials</p>
              </Card>

              <div className="hidden md:flex items-center justify-center">
                <ArrowRight className="h-8 w-8 text-gray-400" />
              </div>

              <Card className="p-6 text-center border-2 border-green-200 hover:shadow-xl transition-all">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Employment</h4>
                <p className="text-sm text-gray-600">Watchdog Analyst positions</p>
              </Card>
            </div>

            <div className="flex justify-center my-6">
              <ArrowRight className="h-8 w-8 text-gray-400 rotate-90" />
            </div>

            <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
              <Card className="p-6 text-center border-2 border-gray-200 hover:shadow-xl transition-all">
                <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Eye className="h-8 w-8 text-white" />
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Oversight</h4>
                <p className="text-sm text-gray-600">33-Agent Council + Human Analysts</p>
              </Card>

              <Card className="p-6 text-center border-2 border-green-200 hover:shadow-xl transition-all">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <h4 className="font-bold text-gray-900 mb-2">PDCA Loop</h4>
                <p className="text-sm text-gray-600">Continuous improvement cycles</p>
              </Card>
            </div>
          </div>

          {/* Detailed Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">For Individuals</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Free comprehensive training on 3 major frameworks</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Professional certification exams</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Paid Watchdog Analyst positions</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Work from anywhere, flexible hours</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Performance leaderboards and bonuses</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">For Enterprises</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">AI system registration and tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Automated compliance assessments (EU, NIST, ISO)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">SOAI-PDCA continuous improvement cycles</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Public transparency dashboard</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">API/SDK for automated reporting</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">For Society</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-gray-900 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Public incident reporting (The Watchdog)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-gray-900 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Transparent 33-Agent Council decisions</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-gray-900 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Real-time AI safety monitoring</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-gray-900 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Open access to compliance data</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-gray-900 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Democratic AI governance</span>
                </li>
              </ul>
            </div>
          </div>

          {/* SOAI-PDCA Explanation */}
          <Card className="p-8 bg-gradient-to-br from-green-50 to-gray-50 border-2 border-green-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">SOAI-PDCA: Continuous Safety Improvement</h3>
                <p className="text-gray-600">Our proprietary framework for ongoing AI system enhancement</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-4 gap-6">
              <div>
                <div className="font-bold text-green-600 mb-2">PLAN</div>
                <p className="text-sm text-gray-700">Identify risks, set safety objectives, establish metrics</p>
              </div>
              <div>
                <div className="font-bold text-gray-900 mb-2">DO</div>
                <p className="text-sm text-gray-700">Implement controls, deploy monitoring, collect data</p>
              </div>
              <div>
                <div className="font-bold text-gray-900 mb-2">CHECK</div>
                <p className="text-sm text-gray-700">Analyze performance, audit compliance, review incidents</p>
              </div>
              <div>
                <div className="font-bold text-green-600 mb-2">ACT</div>
                <p className="text-sm text-gray-700">Adjust controls, update policies, improve systems</p>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link href="/features/pdca-framework">
                <Button variant="outline" className="border-2 border-green-600 text-green-600 hover:bg-green-50">
                  Learn More About SOAI-PDCA
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* LOI Signup Section (Prominent) */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Join the Founding Members
            </h2>
            <p className="text-xl text-white mb-8">
              Get 50% off your first year + priority job placement. 
              Limited to first 1,000 signups.
            </p>

            <form onSubmit={handleLOISubmit} className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-6 py-6 text-lg bg-white/10 border-white/30 text-white placeholder:text-white/60 backdrop-blur-sm"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="px-6 py-6 text-lg bg-white/10 border border-white/30 text-white backdrop-blur-sm rounded-md"
              >
                <option value="individual" className="text-gray-900">Individual</option>
                <option value="enterprise" className="text-gray-900">Enterprise</option>
                <option value="government" className="text-gray-900">Government</option>
              </select>
              <Button 
                type="submit"
                size="lg" 
                className="bg-white text-green-600 hover:bg-blue-50 px-8 py-6 text-lg font-semibold shadow-lg"
              >
                Get Early Access
              </Button>
            </form>

            <p className="text-sm text-gray-100 mt-4">
              ✓ No credit card required  ✓ Cancel anytime  ✓ 14-day free trial
            </p>
          </div>
        </div>
      </section>

      {/* 33-Agent Council Transparency Section */}
      <section className="py-24 bg-gradient-to-b from-gray-900 to-gray-800 text-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-emerald-500/20 text-emerald-300 border-emerald-400/30">
              <Shield className="w-3 h-3 mr-1" />
              Transparent AI Oversight
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              33-Agent Council: <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Human Oversight Meets AI Efficiency</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              We've created a transparent AI safety council with Byzantine fault-tolerant consensus. 
              Every decision is made by 33 AI agents across 5 providers, with human analysts providing oversight.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 mb-16">
            <div>
              <h3 className="text-2xl font-bold mb-6">How It Works</h3>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-lg">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Incident Reported</h4>
                    <p className="text-gray-400">Anyone can submit an AI safety concern through The Watchdog public reporting system.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-lg">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">33 Agents Analyze</h4>
                    <p className="text-gray-400">The council (11 GPT-4, 11 Claude, 11 Gemini agents) independently evaluates the incident using established frameworks.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold text-lg">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Byzantine Consensus</h4>
                    <p className="text-gray-400">Requires 23/33 agents to agree (70% supermajority). Prevents single-provider bias or manipulation.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-500/20 flex items-center justify-center text-gray-600 font-bold text-lg">
                    4
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Human Analyst Review</h4>
                    <p className="text-gray-400">Certified Watchdog Analysts verify the decision, add context, and ensure quality before publication.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400 font-bold text-lg">
                    5
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Public Transparency</h4>
                    <p className="text-gray-400">All decisions, voting records, and analyst reviews are published on the public dashboard for accountability.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <Card className="p-6 bg-gray-800/50 border-gray-700">
                <h3 className="text-xl font-bold mb-4 text-white">Why Byzantine Consensus?</h3>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong>No Single Point of Failure:</strong> Even if 10 agents malfunction or are compromised, decisions remain valid</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Provider Diversity:</strong> Prevents bias from any single AI company's models or training data</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Transparent Voting:</strong> Every agent's vote and reasoning is recorded and publicly auditable</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Human Oversight:</strong> AI efficiency with human judgment—analysts catch edge cases and context AI might miss</span>
                  </li>
                </ul>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-emerald-900/50 to-cyan-900/50 border-emerald-700/50">
                <div className="flex items-center gap-3 mb-4">
                  <Eye className="w-6 h-6 text-emerald-400" />
                  <h3 className="text-xl font-bold text-white">Live Council Stats</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-3xl font-bold text-emerald-400 mb-1">5,247</div>
                    <div className="text-sm text-gray-400">Total Decisions</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-cyan-400 mb-1">94%</div>
                    <div className="text-sm text-gray-400">Consensus Rate</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-green-400 mb-1">2.3s</div>
                    <div className="text-sm text-gray-400">Avg Decision Time</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-gray-600 mb-1">100%</div>
                    <div className="text-sm text-gray-400">Public Transparency</div>
                  </div>
                </div>
                <Link href="/agent-council">
                  <Button className="w-full mt-6 bg-emerald-600 hover:bg-emerald-500">
                    View Live Council Activity
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </Card>
            </div>
          </div>

          <div className="text-center">
            <Link href="/features/33-agent-council">
              <Button size="lg" variant="outline" className="border-2 border-emerald-400 text-emerald-400 hover:bg-emerald-400/10">
                Learn More About the Council
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* The Solution Section */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-green-100 text-green-800 text-sm px-4 py-2">
              The Western TC260
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Proven in China. Adapted for the West.
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              China's TC260 has successfully governed AI safety for years. 
              CSOAI brings the same proven framework to Western markets.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-8 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                33-Agent Byzantine Consensus
              </h3>
              <p className="text-gray-600">
                Decentralized decision-making across 5 LLM providers. 
                No single point of failure. Fault-tolerant governance.
              </p>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                <Eye className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Public Watchdog System
              </h3>
              <p className="text-gray-600">
                Anyone can report AI safety incidents. Certified analysts review. 
                Full transparency for public trust.
              </p>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-6">
                <Users className="h-6 w-6 text-gray-900" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Certified Analyst Network
              </h3>
              <p className="text-gray-600">
                Trained professionals, not algorithms. Human oversight at scale. 
                Performance leaderboards ensure quality.
              </p>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                PDCA Continuous Improvement
              </h3>
              <p className="text-gray-600">
                AI systems get safer over time through Plan-Do-Check-Act cycles. 
                Not one-time audits.
              </p>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-6">
                <Globe className="h-6 w-6 text-gray-900" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Transparent Public Dashboard
              </h3>
              <p className="text-gray-600">
                See every AI system, every incident, every decision. 
                Real-time compliance scores. No secrets.
              </p>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-6">
                <CheckCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Multi-Framework Compliance
              </h3>
              <p className="text-gray-600">
                EU AI Act, NIST AI RMF, ISO/IEC 42001. 
                One platform, all standards. Automated reporting.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Transparency Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              See It All. In Real-Time.
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Every AI system. Every incident. Every council decision. 
              Full transparency builds public trust.
            </p>
          </div>

          <div className="mb-12">
            <img 
              src="/transparency-visual.png" 
              alt="Real-time AI safety dashboard" 
              className="w-full max-w-4xl mx-auto rounded-2xl shadow-2xl"
            />
          </div>

          <div className="text-center">
            <Link href="/public-dashboard">
              <Button size="lg" className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white px-12 py-6 text-lg font-semibold shadow-lg">
                Explore Public Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* For Enterprises Section */}
      <section className="py-24 bg-gray-900 text-white">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-gray-500/20 text-purple-300 border-purple-400/30">
                For Enterprises
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Prove Your AI is Safe. Publicly.
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Register your AI systems, get compliance scores, and show public transparency. 
                Avoid EU AI Act fines (up to €35M) and build customer trust.
              </p>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0 mt-1" />
                  <span className="text-gray-300">Automated compliance assessments across EU AI Act, NIST, ISO</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0 mt-1" />
                  <span className="text-gray-300">PDCA continuous improvement cycles with PDF reports</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0 mt-1" />
                  <span className="text-gray-300">Public dashboard showing your commitment to safety</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0 mt-1" />
                  <span className="text-gray-300">API/SDK integration for automated reporting</span>
                </li>
              </ul>

              <Link href="/enterprise-onboarding">
                <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-6 text-lg font-semibold">
                  Register Your First AI System (Free Trial)
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>

            <div>
              <img 
                src="/council-visual.png" 
                alt="33-Agent Byzantine Consensus" 
                className="w-full rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Trusted Globally
            </h2>
            <p className="text-xl text-gray-600">
              Governments, enterprises, and safety professionals rely on CSOAI
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-5xl font-black text-green-600 mb-2">Global</div>
              <div className="text-gray-600">AI Safety Standards</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-black text-green-600 mb-2">Proven</div>
              <div className="text-gray-600">Byzantine Consensus</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-black text-gray-900 mb-2">Leading</div>
              <div className="text-gray-600">Certification Platform</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-900 to-purple-900 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Protect Humanity?
          </h2>
          <p className="text-xl text-white mb-12 max-w-2xl mx-auto">
            Be among the first certified analysts earning while making AI safer for everyone
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/watchdog-signup">
              <Button size="lg" className="bg-white text-green-600 hover:bg-blue-50 px-12 py-6 text-lg font-semibold shadow-lg">
                Start Training (Individuals)
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/enterprise-onboarding">
              <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 px-12 py-6 text-lg font-semibold">
                Register AI System (Enterprises)
              </Button>
            </Link>
            <Link href="/about">
              <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 px-12 py-6 text-lg font-semibold">
                Request Demo (Governments)
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
    </>
  );
}
