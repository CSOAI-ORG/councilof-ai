import { useEffect } from "react";
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Shield, 
  Users, 
  CheckCircle, 
  AlertTriangle, 
  Zap, 
  Lock, 
  Scale, 
  Globe, 
  Brain,
  Building2,
  Cpu,
  Database,
  Eye,
  BookOpen,
  FileCheck,
  ArrowRight
} from 'lucide-react';
import { Footer } from '@/components/Footer';

// The 33 council members organized by category
const COUNCIL_CATEGORIES = [
  {
    title: 'AI Safety & Ethics Specialists',
    color: '#8B5CF6',
    members: [
      { id: 1, name: 'Ethics Guardian', role: 'AI Ethics Specialist', provider: 'Anthropic Claude' },
      { id: 2, name: 'Bias Detector', role: 'Fairness Analyst', provider: 'OpenAI GPT-4' },
      { id: 3, name: 'Safety Sentinel', role: 'Safety Engineer', provider: 'Google Gemini' },
      { id: 4, name: 'Rights Advocate', role: 'Human Rights Expert', provider: 'Mistral' },
      { id: 5, name: 'Transparency Agent', role: 'Explainability Expert', provider: 'Cohere' },
      { id: 6, name: 'Accountability Auditor', role: 'Compliance Auditor', provider: 'Meta Llama' },
      { id: 7, name: 'Privacy Protector', role: 'Privacy Specialist', provider: 'Anthropic Claude' },
      { id: 8, name: 'Consent Validator', role: 'Consent Expert', provider: 'OpenAI GPT-4' },
    ]
  },
  {
    title: 'Regulatory & Compliance Experts',
    color: '#3B82F6',
    members: [
      { id: 9, name: 'EU AI Act Analyst', role: 'EU Regulation Expert', provider: 'Google Gemini' },
      { id: 10, name: 'NIST RMF Specialist', role: 'US Standards Expert', provider: 'Mistral' },
      { id: 11, name: 'TC260 Interpreter', role: 'China Standards Expert', provider: 'Cohere' },
      { id: 12, name: 'ISO 42001 Auditor', role: 'ISO Compliance Expert', provider: 'Meta Llama' },
      { id: 13, name: 'GDPR Guardian', role: 'Data Protection Expert', provider: 'Anthropic Claude' },
      { id: 14, name: 'Sector Regulator', role: 'Industry Specialist', provider: 'OpenAI GPT-4' },
      { id: 15, name: 'Cross-Border Analyst', role: 'International Law Expert', provider: 'Google Gemini' },
      { id: 16, name: 'Standards Harmonizer', role: 'Standards Expert', provider: 'Mistral' },
    ]
  },
  {
    title: 'Technical Security Experts',
    color: '#10B981',
    members: [
      { id: 17, name: 'Adversarial Defender', role: 'Security Researcher', provider: 'Cohere' },
      { id: 18, name: 'Model Validator', role: 'ML Engineer', provider: 'Meta Llama' },
      { id: 19, name: 'Robustness Tester', role: 'QA Specialist', provider: 'Anthropic Claude' },
      { id: 20, name: 'Drift Monitor', role: 'MLOps Engineer', provider: 'OpenAI GPT-4' },
      { id: 21, name: 'Supply Chain Auditor', role: 'Supply Chain Expert', provider: 'Google Gemini' },
      { id: 22, name: 'Vulnerability Hunter', role: 'Penetration Tester', provider: 'Mistral' },
      { id: 23, name: 'Cryptography Expert', role: 'Security Architect', provider: 'Cohere' },
      { id: 24, name: 'Infrastructure Guardian', role: 'DevSecOps Engineer', provider: 'Meta Llama' },
    ]
  },
  {
    title: 'Domain & Impact Specialists',
    color: '#F59E0B',
    members: [
      { id: 25, name: 'Healthcare Analyst', role: 'Medical AI Expert', provider: 'Anthropic Claude' },
      { id: 26, name: 'Finance Watchdog', role: 'FinTech Specialist', provider: 'OpenAI GPT-4' },
      { id: 27, name: 'Education Evaluator', role: 'EdTech Expert', provider: 'Google Gemini' },
      { id: 28, name: 'Legal Advisor', role: 'AI Law Specialist', provider: 'Mistral' },
      { id: 29, name: 'Environmental Assessor', role: 'Sustainability Expert', provider: 'Cohere' },
      { id: 30, name: 'Labor Impact Analyst', role: 'Workforce Expert', provider: 'Meta Llama' },
      { id: 31, name: 'Accessibility Champion', role: 'Inclusion Specialist', provider: 'Anthropic Claude' },
      { id: 32, name: 'Public Interest Guardian', role: 'Civil Society Rep', provider: 'OpenAI GPT-4' },
      { id: 33, name: 'Future Risk Analyst', role: 'Long-term Safety Expert', provider: 'Google Gemini' },
    ]
  }
];

const PIPELINES = [
  {
    icon: Building2,
    title: 'Governments',
    color: '#3B82F6',
    description: 'EU, US, UK, China, Australia, and Canada regulatory bodies providing compliance requirements and enforcement data.',
    items: ['European Union (EU AI Act)', 'United States (NIST RMF)', 'United Kingdom (AI Safety Institute)', 'China (TC260 Standards)', 'Australia (AI Ethics Framework)', 'Canada (AIDA)']
  },
  {
    icon: Cpu,
    title: 'AI Companies',
    color: '#8B5CF6',
    description: 'Major AI providers whose models are evaluated for safety and compliance by the Council.',
    items: ['OpenAI', 'Anthropic', 'Google DeepMind', 'Meta AI', 'Microsoft', 'Mistral AI']
  },
  {
    icon: Database,
    title: 'Data Sources',
    color: '#10B981',
    description: 'Real-time data feeds that inform council decisions and compliance assessments.',
    items: ['Incident Reports', 'Compliance Data', 'Research Papers', 'News & Media', 'Audit Reports', 'User Feedback']
  },
  {
    icon: Eye,
    title: 'Public Watchdog',
    color: '#EF4444',
    description: 'Transparent public reporting system for AI safety concerns and incidents.',
    items: ['Report Submission', 'Pattern Analysis', 'Alert System', 'Transparency Dashboard']
  },
  {
    icon: BookOpen,
    title: 'Measurement Credential Training',
    color: '#F59E0B',
    description: 'Professional certification program for AI safety analysts.',
    items: ['Training Courses', 'Certification Exams', 'Certified Analysts', 'Job Marketplace']
  },
  {
    icon: FileCheck,
    title: 'SOAI-PDCA',
    color: '#EC4899',
    description: 'Continuous improvement methodology for AI governance.',
    items: ['Plan Phase', 'Do Phase', 'Check Phase', 'Act Phase']
  }
];

export default function ByzantineConsensus() {
  useEffect(() => { document.title = "Designed multi-agent council | CSOAI"; }, []);
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container py-4 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
          <Badge variant="outline" className="text-primary border-primary">
            TC 260 Multi-Agent Council
          </Badge>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-purple-50 to-background dark:from-purple-950/20">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <Badge className="mb-4 bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
              Distributed AI Safety Governance
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              The 33-Seat{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                Council Design
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-4">
              A fault-aware, vendor-independent AI safety governance architecture inspired by
              distributed-consensus principles. The design seats members across 12 different AI providers
              so no single vendor can steer an outcome.
            </p>
            <p className="text-sm text-muted-foreground/80 mb-8 max-w-2xl mx-auto border border-amber-300/40 bg-amber-50/60 dark:bg-amber-900/10 rounded-lg px-4 py-3">
              Honest status: this page describes the target architecture. Today's measured
              cross-checking is n_eff 1.21 of 3 nominal votes — published, signed, and
              explained on the{' '}
              <Link href="/refutation-ledger" className="underline font-semibold">Refutation Ledger</Link>.
              We measure the gap instead of hiding it.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/agent-council">
                <Button size="lg" className="gap-2">
                  View Live Council
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/watchdog">
                <Button size="lg" variant="outline" className="gap-2">
                  Submit a Report
                  <Eye className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* What is Multi-Agent Council */}
      <section className="py-16 bg-white dark:bg-gray-950">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-center">What is Multi-Agent Council?</h2>
            <div className="prose prose-lg dark:prose-invert mx-auto">
              <p>
                Our design is a multi-agent vote: 33 specialized agents each weigh in, and a decision passes only on a
                23/33 (67%) supermajority. The intent is that no single agent, provider, or bias decides an
                outcome. We do not claim guaranteed fault tolerance — effective independence is measured,
                not assumed.
              </p>
              <p>
                In the context of AI safety, we apply multi-agent council principles to ensure that 
                no single AI provider, bias, or perspective can dominate safety decisions. Our 33-agent 
                council uses models from 12 different AI providers, each with different training data, 
                architectures, and perspectives.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <h2 className="text-3xl font-bold mb-12 text-center">How the Council Works</h2>
          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              {
                step: 1,
                icon: Eye,
                title: 'Report Submitted',
                description: 'An AI safety concern is submitted through the Public Watchdog system.'
              },
              {
                step: 2,
                icon: Users,
                title: 'Council Convenes',
                description: 'All 33 agents receive the case and independently analyze the situation.'
              },
              {
                step: 3,
                icon: Scale,
                title: 'Voting Process',
                description: 'Each agent votes (Approve, Reject, or Escalate) with confidence scores and reasoning.'
              },
              {
                step: 4,
                icon: CheckCircle,
                title: 'Consensus Reached',
                description: 'When 22+ agents (⅔ majority) agree, consensus is reached and action is taken.'
              }
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full text-center">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <item.icon className="w-6 h-6 text-primary" />
                    </div>
                    <Badge variant="outline" className="w-fit mx-auto mb-2">Step {item.step}</Badge>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* The 33 Council Members */}
      <section className="py-16 bg-white dark:bg-gray-950">
        <div className="container">
          <h2 className="text-3xl font-bold mb-4 text-center">The 33 Council Members</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Each member specializes in a specific aspect of AI safety, compliance, or domain expertise.
            Together, they provide comprehensive coverage of all AI governance concerns.
          </p>
          
          <div className="space-y-12">
            {COUNCIL_CATEGORIES.map((category, catIndex) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: catIndex * 0.1 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <h3 className="text-xl font-semibold">{category.title}</h3>
                  <Badge variant="secondary">{category.members.length} members</Badge>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {category.members.map((member) => (
                    <Card key={member.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                            style={{ backgroundColor: category.color }}
                          >
                            {member.id}
                          </div>
                          <div>
                            <CardTitle className="text-sm">{member.name}</CardTitle>
                            <CardDescription className="text-xs">{member.role}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <Badge variant="outline" className="text-xs">
                          {member.provider}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Data Pipelines */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <h2 className="text-3xl font-bold mb-4 text-center">Data Pipelines</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            The Council receives data from multiple sources to make informed decisions.
            Each pipeline provides crucial information for comprehensive AI safety governance.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PIPELINES.map((pipeline, i) => (
              <motion.div
                key={pipeline.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${pipeline.color}20` }}
                      >
                        <pipeline.icon className="w-5 h-5" style={{ color: pipeline.color }} />
                      </div>
                      <CardTitle>{pipeline.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{pipeline.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {pipeline.items.map((item) => (
                        <Badge key={item} variant="secondary" className="text-xs">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Multi-Agent Council */}
      <section className="py-16 bg-white dark:bg-gray-950">
        <div className="container">
          <h2 className="text-3xl font-bold mb-12 text-center">Why Multi-Agent Council for AI Safety?</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: Lock,
                title: 'Supermajority vote',
                description: 'A decision requires a supermajority (23 of 33) of the designed council to agree; no single agent decides.'
              },
              {
                icon: Scale,
                title: 'Vendor Independence',
                description: 'Using 12 different AI providers ensures no single company can influence safety decisions.'
              },
              {
                icon: Globe,
                title: 'Diverse Perspectives',
                description: 'Each agent brings unique expertise, from ethics to security to domain-specific knowledge.'
              },
              {
                icon: Shield,
                title: 'Transparency',
                description: 'All votes, reasoning, and decisions are recorded and can be audited by the public.'
              },
              {
                icon: Brain,
                title: 'Continuous Learning',
                description: 'The council learns from each decision, improving its accuracy and consistency over time.'
              },
              {
                icon: Zap,
                title: 'Real-time Response',
                description: 'Automated voting allows rapid response to emerging AI safety concerns.'
              }
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">Join the AI Safety Movement</h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Whether you want to report AI safety concerns, become a certified analyst, 
            or integrate our council into your enterprise, we have a path for you.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/watchdog">
              <Button size="lg" variant="secondary" className="gap-2">
                <Eye className="w-4 h-4" />
                Report an Incident
              </Button>
            </Link>
            <Link href="/training">
              <Button size="lg" variant="outline" className="gap-2 bg-transparent border-white text-white hover:bg-white/10">
                <BookOpen className="w-4 h-4" />
                Get Certified
              </Button>
            </Link>
            <Link href="/enterprise">
              <Button size="lg" variant="outline" className="gap-2 bg-transparent border-white text-white hover:bg-white/10">
                <Building2 className="w-4 h-4" />
                Enterprise Solutions
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
