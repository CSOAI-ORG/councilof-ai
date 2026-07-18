import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { 
  Shield, 
  Users, 
  FileCheck, 
  Eye, 
  Globe, 
  Zap,
  CheckCircle,
  ArrowRight,
  Building2,
  GraduationCap,
  BarChart3,
  Lock,
  Scale,
  Sparkles,
  ChevronRight
} from "lucide-react";

export default function PublicHome() {
  const { data: loiCount } = trpc.applications.getCount.useQuery();
  const { data: stats } = trpc.dashboard.getStats.useQuery();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">COAI</span>
              </div>
              <span className="font-semibold text-lg">Council of AIs</span>
            </div>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</Link>
            <Link href="#frameworks" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Frameworks</Link>
            <Link href="#watchdog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Watchdog Program</Link>
            <Link href="/landing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/home">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/watchdog-signup">
              <Button size="sm">Become a Watchdog</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              The Western AI Safety Governance Platform
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Council of AIs
              <span className="block text-primary">Transparent. Accountable. Human-Verified.</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              The first open-source AI safety governance platform for the West. 
              Multi-framework compliance, 33-agent Byzantine fault-tolerant voting, 
              and public accountability through The Watchdog program.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link href="/home">
                <Button size="lg" className="gap-2">
                  Start Compliance Check
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/watchdog-signup">
                <Button size="lg" variant="outline" className="gap-2">
                  <Eye className="w-4 h-4" />
                  Become a Watchdog Analyst
                </Button>
              </Link>
            </div>

            {/* Social Proof */}
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <span><strong className="text-foreground">{loiCount?.total || 0}</strong> Watchdog Applications</span>
              </div>
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-primary" />
                <span><strong className="text-foreground">3</strong> Frameworks Supported</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <span><strong className="text-foreground">33</strong> Agent Council</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Framework Badges */}
      <section className="py-12 bg-muted/30 border-y">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-muted-foreground mb-6">Compliance frameworks supported</p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            <div className="flex items-center gap-3 px-4 py-2 bg-background rounded-lg border">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">EU</span>
              </div>
              <div>
                <p className="font-semibold text-sm">EU AI Act</p>
                <p className="text-xs text-muted-foreground">Regulation 2024/1689</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 bg-background rounded-lg border">
              <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">NIST</span>
              </div>
              <div>
                <p className="font-semibold text-sm">NIST AI RMF</p>
                <p className="text-xs text-muted-foreground">AI 100-1</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 bg-background rounded-lg border">
              <div className="w-10 h-10 bg-yellow-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">TC</span>
              </div>
              <div>
                <p className="font-semibold text-sm">TC260</p>
                <p className="text-xs text-muted-foreground">China Reference</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - SOAI-PDCA */}
      <section className="py-20 px-4" id="how-it-works">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">The SOAI-PDCA Loop</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Continuous AI safety improvement through our integrated Plan-Do-Check-Act methodology
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <Card className="relative overflow-hidden border-2 border-blue-200 bg-blue-50/50">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-white font-bold">P</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">Plan</h3>
                <p className="text-sm text-muted-foreground">
                  Register AI systems, identify risks, map compliance requirements across frameworks
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-2 border-green-200 bg-green-50/50">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-white font-bold">D</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">Do</h3>
                <p className="text-sm text-muted-foreground">
                  Implement compliance measures, document controls, deploy safeguards
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-2 border-yellow-200 bg-yellow-50/50">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-yellow-600 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-white font-bold">C</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">Check</h3>
                <p className="text-sm text-muted-foreground">
                  Watchdog monitoring, 33-agent council voting, public incident reports
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-2 border-purple-200 bg-purple-50/50">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-white font-bold">A</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">Act</h3>
                <p className="text-sm text-muted-foreground">
                  Continuous improvement, update policies, retrain models, iterate
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-muted/30" id="features">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Enterprise-Grade AI Governance</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to achieve and maintain AI compliance across multiple frameworks
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-background">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">33-Agent Council</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Byzantine fault-tolerant voting with 11 Guardian, 11 Arbiter, and 11 Scribe agents. 
                  Requires 22/33 consensus for decisions.
                </p>
                <Link href="/agent-council" className="text-sm text-primary flex items-center gap-1 hover:underline">
                  Learn more <ChevronRight className="w-4 h-4" />
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-background">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <Eye className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">The Watchdog</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Public incident reporting with human-in-the-loop verification. 
                  Transparent accountability for AI systems.
                </p>
                <Link href="/watchdog" className="text-sm text-primary flex items-center gap-1 hover:underline">
                  View reports <ChevronRight className="w-4 h-4" />
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-background">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <Globe className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Multi-Framework</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Unified compliance across EU AI Act, NIST AI RMF, and TC260. 
                  One assessment, multiple frameworks.
                </p>
                <Link href="/compliance" className="text-sm text-primary flex items-center gap-1 hover:underline">
                  Explore frameworks <ChevronRight className="w-4 h-4" />
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-background">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <GraduationCap className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Training & Certification</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  5 training modules, 51 test questions. Become a certified Watchdog Analyst 
                  and earn while protecting AI safety.
                </p>
                <Link href="/training" className="text-sm text-primary flex items-center gap-1 hover:underline">
                  Start training <ChevronRight className="w-4 h-4" />
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-background">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Real-Time Dashboard</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Monitor compliance scores, track assessments, view council decisions, 
                  and manage your AI portfolio.
                </p>
                <Link href="/dashboard" className="text-sm text-primary flex items-center gap-1 hover:underline">
                  View dashboard <ChevronRight className="w-4 h-4" />
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-background">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <Lock className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Open Source</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Fully transparent, MIT licensed. Audit our code, contribute improvements, 
                  build trust through openness.
                </p>
                <a href="https://github.com/optimobile/coai-dashboard" target="_blank" rel="noopener noreferrer" className="text-sm text-primary flex items-center gap-1 hover:underline">
                  View on GitHub <ChevronRight className="w-4 h-4" />
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Watchdog CTA Section */}
      <section className="py-20 px-4" id="watchdog">
        <div className="container mx-auto max-w-4xl">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-8 md:p-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Eye className="w-8 h-8 text-primary-foreground" />
                </div>
                
                <h2 className="text-3xl font-bold mb-4">
                  Are You Worried About AI Safety?
                </h2>
                
                <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Become a Watchdog Analyst. Work from home, audit AI systems, 
                  and earn money while protecting humanity from AI risks.
                </p>

                <div className="grid sm:grid-cols-3 gap-4 mb-8 max-w-xl mx-auto">
                  <div className="flex items-center gap-2 justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm">Work from home</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm">Flexible hours</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm">Free training</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link href="/watchdog-signup">
                    <Button size="lg" className="gap-2">
                      Apply Now - It's Free
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <div className="text-sm text-muted-foreground">
                    <strong className="text-foreground">{loiCount?.total || 0}</strong> people have applied
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Our Mission - Transparency Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-background to-muted/30" id="mission">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium mb-6">
              <Globe className="w-4 h-4" />
              Open Source & Transparent
            </div>
            <h2 className="text-3xl font-bold mb-4">Our Mission: AI Safety for Humanity</h2>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              We're building the Western equivalent of China's TC260 - a comprehensive AI safety governance 
              framework that protects both businesses and citizens. This is bigger than any one company.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card className="bg-background border-2">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-6 h-6 text-primary" />
                  Join the Movement
                </h3>
                <p className="text-muted-foreground mb-4">
                  Every Letter of Intent (LOI) from Watchdog applicants helps us prove market demand 
                  to investors. Your interest directly contributes to building this critical infrastructure 
                  for AI safety in the West.
                </p>
                <div className="bg-muted/50 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Community Progress</span>
                    <span className="text-sm text-primary font-bold">{loiCount?.total || 0} LOIs</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary rounded-full h-2 transition-all duration-500" 
                      style={{ width: `${Math.min((loiCount?.total || 0) / 1000 * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Goal: 1,000 LOIs for Series A</p>
                </div>
                <Link href="/watchdog-signup">
                  <Button className="w-full gap-2">
                    Add Your Voice <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-background border-2">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Lock className="w-6 h-6 text-primary" />
                  How We're Building This
                </h3>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong className="text-foreground">100% Open Source</strong> - All code on GitHub, MIT licensed</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong className="text-foreground">Community-Driven</strong> - Watchdog Analysts are real people, not bots</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong className="text-foreground">Transparent Governance</strong> - All council votes are public</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong className="text-foreground">Job Creation</strong> - We're creating real jobs in AI safety</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong className="text-foreground">For Humanity</strong> - Not just for profit, but for protection</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Together, we're building the safety infrastructure that AI companies need and humanity deserves.
            </p>
            <a 
              href="https://github.com/optimobile/coai-dashboard" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              View our code on GitHub <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* For Different Users */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Built for Everyone</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Whether you're an AI company, regulator, or concerned citizen, COAI has tools for you
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">AI Companies (B2B)</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Achieve compliance before the August 2026 EU AI Act deadline. 
                Avoid €35M fines with proactive governance.
              </p>
              <Link href="/home">
                <Button variant="outline" size="sm">Start Assessment</Button>
              </Link>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Scale className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Regulators (B2G)</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Monitor AI systems in your jurisdiction. Access public Watchdog reports 
                and council decisions for oversight.
              </p>
              <Link href="/watchdog">
                <Button variant="outline" size="sm">View Reports</Button>
              </Link>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Citizens (B2C)</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Report AI issues, become a Watchdog Analyst, or simply stay informed 
                about AI safety in your community.
              </p>
              <Link href="/watchdog-signup">
                <Button variant="outline" size="sm">Get Involved</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold text-primary mb-2">33</p>
              <p className="text-sm text-muted-foreground">AI Agents</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary mb-2">3</p>
              <p className="text-sm text-muted-foreground">Frameworks</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary mb-2">{loiCount?.total || 0}</p>
              <p className="text-sm text-muted-foreground">Watchdog Applications</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary mb-2">100%</p>
              <p className="text-sm text-muted-foreground">Open Source</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-muted/50 border-t">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs">COAI</span>
                </div>
                <span className="font-semibold">Council of AIs</span>
              </div>
              <p className="text-sm text-muted-foreground">
                The Western AI Safety Governance Platform. Open source, transparent, human-verified.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/dashboard" className="hover:text-foreground">Dashboard</Link></li>
                <li><Link href="/ai-systems" className="hover:text-foreground">AI Systems</Link></li>
                <li><Link href="/compliance" className="hover:text-foreground">Compliance</Link></li>
                <li><Link href="/agent-council" className="hover:text-foreground">33-Agent Council</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Watchdog</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/watchdog" className="hover:text-foreground">Public Reports</Link></li>
                <li><Link href="/watchdog-signup" className="hover:text-foreground">Become an Analyst</Link></li>
                <li><Link href="/training" className="hover:text-foreground">Training</Link></li>
                <li><Link href="/certification" className="hover:text-foreground">Certification</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="https://github.com/optimobile/coai-dashboard" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">GitHub</a></li>
                <li><Link href="/landing" className="hover:text-foreground">About</Link></li>
                <li><a href="mailto:contact@coai.org" className="hover:text-foreground">Contact</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 Council of AIs. Open source under MIT License.
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Built for humanity's AI safety</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
