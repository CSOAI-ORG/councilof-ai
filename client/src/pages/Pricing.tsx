import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { openLobby } from '@/lib/lobbyLink';
import {
  Check,
  Globe,
  BookOpen,
  GraduationCap,
  Briefcase,
  Heart,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Users,
  MessageSquare,
} from 'lucide-react';

// All courses — completely free. Council Academy attests training completion, not conformity.
const FREE_COURSES = {
  foundation: [
    'AI Safety Fundamentals',
    'Ethics & Bias in AI',
    'Regulatory Overview',
  ],
  regional: [
    'EU AI Act Compliance',
    'NIST AI Risk Management Framework',
    'UK AI Regulation',
    'Canada AIDA Framework',
    'Australia AI Ethics Framework',
  ],
  industry: [
    'Healthcare AI Compliance',
    'Autonomous Vehicles Safety',
    'Finance & Banking AI',
    'Insurance AI Systems',
    'Legal AI Applications',
    'Education AI Tools',
    'HR & Recruitment AI',
    'Manufacturing AI',
    'Retail & E-commerce AI',
    'Energy Sector AI',
    'Transportation & Logistics',
    'Agriculture AI',
    'Real Estate AI',
    'Media & Entertainment AI',
    'Telecommunications AI',
    'Government & Public Sector',
    'Defense & Security AI',
    'Environmental AI',
    'Social Media AI',
    'Gaming AI',
    'Cybersecurity AI',
    'Supply Chain AI',
    'Customer Service AI',
    'Marketing AI',
    'Research & Development AI',
  ],
};

const FAQ = [
  {
    question: 'Why is everything free?',
    answer: 'Because the rail is free and verification is free forever — that is the posture, not a promotion. Council of AI is a measurement body: anyone can run a measurement, read a signed board, and verify a card at no cost, with no account. The product is the evidence, not access to it.',
  },
  {
    question: 'Do you certify AI systems or people?',
    answer: 'No. Council of AI measures; it does not certify, accredit, or issue conformity marks. Council Academy course completion attests that a person completed training — it is not a statement about any AI system’s compliance with any regulation.',
  },
  {
    question: 'How does Council of AI fund itself, then?',
    answer: 'By selling evidence, never access. Signed datasets, attested evaluation reports, and quarterly re-attestation of evidence freshness are the products — priced as artefacts, published win-or-lose, and never a fee for a ranking or a placement. Nothing you can verify is ever behind a paywall.',
  },
  {
    question: 'Is there any pricing on this site?',
    answer: 'No SaaS tiers, no per-seat plans, no course fees. Measurement and verification are free. Where a signed evidence artefact is sold, it is priced on its own product page as an artefact, and its verification remains free for everyone.',
  },
];

const COMPARISON = [
  { feature: 'Verification', csoai: 'Free forever, no account', competitors: 'Often gated or paid' },
  { feature: 'Course access', csoai: 'All courses free', competitors: 'Pay per course or subscription' },
  { feature: 'What is sold', csoai: 'Signed evidence artefacts', competitors: 'Access / seats / rankings' },
  { feature: 'Method', csoai: 'Deterministic predicates, no LLM-as-judge', competitors: 'Opaque scoring' },
  { feature: 'Honesty', csoai: 'Ties and UNMEASURED published', competitors: 'Losses hidden' },
];

export default function Pricing() {
  const [, setLocation] = useLocation();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [showAllCourses, setShowAllCourses] = useState(false);

  const totalCourses =
    FREE_COURSES.foundation.length + FREE_COURSES.regional.length + FREE_COURSES.industry.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto py-16 px-4">
        {/* Hero — the free-rail posture */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
            The free-rail posture
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            The rail is <span className="text-emerald-400">free</span>.
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-4">
            Verification is free forever. The product is the evidence.
          </p>
          <p className="text-base text-slate-400 max-w-2xl mx-auto">
            Council of AI is an independent measurement body. Run a measurement, read a signed
            board, verify a card — free, no account. We sell signed evidence artefacts, never
            access, never a ranking, never a placement. No grade SKUs — HO.2. Measurement, not certification.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-10">
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6">
              <ShieldCheck className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Free verification</h3>
              <p className="text-slate-400 text-sm">Every signed card and board verifies free, forever</p>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6">
              <GraduationCap className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Council Academy</h3>
              <p className="text-slate-400 text-sm">All courses free; completion attests training, not conformity</p>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6">
              <Briefcase className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Evidence, not access</h3>
              <p className="text-slate-400 text-sm">Signed datasets and attested reports, published win-or-lose</p>
            </div>
          </div>
        </div>

        {/* Free courses */}
        <div className="max-w-6xl mx-auto mb-20">
          <div className="text-center mb-10">
            <Badge className="mb-4 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
              <Heart className="h-3 w-3 mr-1 inline" />
              Council Academy — free
            </Badge>
            <h2 className="text-3xl font-bold text-white mb-4">All {totalCourses} courses — free forever</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              No credit card, no trial, no upsell. Course completion attests that you completed the
              training — Council of AI measures, it does not certify.
            </p>
          </div>

          <Card className="bg-slate-800/50 border-emerald-500/30 border-2">
            <CardContent className="p-8">
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="h-5 w-5 text-emerald-400" />
                  <h3 className="text-lg font-semibold text-white">Foundation courses</h3>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">FREE</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {FREE_COURSES.foundation.map((course, i) => (
                    <div key={i} className="flex items-center gap-2 text-slate-300">
                      <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                      <span className="text-sm">{course}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="h-5 w-5 text-emerald-400" />
                  <h3 className="text-lg font-semibold text-white">Regional compliance</h3>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">FREE</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {FREE_COURSES.regional.map((course, i) => (
                    <div key={i} className="flex items-center gap-2 text-slate-300">
                      <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                      <span className="text-sm">{course}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Briefcase className="h-5 w-5 text-emerald-400" />
                  <h3 className="text-lg font-semibold text-white">Industry specialisations</h3>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">FREE</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(showAllCourses ? FREE_COURSES.industry : FREE_COURSES.industry.slice(0, 9)).map((course, i) => (
                    <div key={i} className="flex items-center gap-2 text-slate-300">
                      <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                      <span className="text-sm">{course}</span>
                    </div>
                  ))}
                </div>
                {FREE_COURSES.industry.length > 9 && (
                  <Button
                    variant="ghost"
                    className="mt-4 text-emerald-400 hover:text-emerald-300"
                    onClick={() => setShowAllCourses(!showAllCourses)}
                  >
                    {showAllCourses ? (
                      <>Show less <ChevronUp className="h-4 w-4 ml-1" /></>
                    ) : (
                      <>Show all {FREE_COURSES.industry.length} industry courses <ChevronDown className="h-4 w-4 ml-1" /></>
                    )}
                  </Button>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-slate-700 text-center">
                <Button
                  onClick={() => setLocation('/curriculum')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-8"
                >
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Start learning free
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* How we're funded — honest, price-free */}
        <div className="max-w-3xl mx-auto mb-20">
          <Card className="bg-slate-800/30 border border-slate-700 rounded-xl">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-3">How measurement stays free</h2>
              <p className="text-slate-300">
                We make money by selling <strong className="text-white">evidence</strong>, never access.
                Signed datasets, attested evaluation reports, and quarterly re-attestation of evidence
                freshness are the products — priced as artefacts on their own pages, published win-or-lose,
                and never a fee for a ranking or a placement. Anything you can verify stays free for everyone.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Comparison */}
        <div className="max-w-6xl mx-auto mb-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white mb-4">How this differs</h2>
          </div>
          <Card className="bg-slate-800/50 border-emerald-500/30 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left p-4 text-slate-400 font-medium">Feature</th>
                    <th className="text-center p-4 text-emerald-400 font-bold bg-emerald-500/10">Council of AI</th>
                    <th className="text-center p-4 text-slate-500 font-medium">Other platforms</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row, i) => (
                    <tr key={i} className="border-b border-slate-700/50">
                      <td className="p-4 text-white font-medium">{row.feature}</td>
                      <td className="p-4 text-center bg-emerald-500/5 text-emerald-400 text-sm">{row.csoai}</td>
                      <td className="p-4 text-center text-slate-500 text-sm">{row.competitors}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto mb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white mb-4">Questions</h2>
          </div>
          <div className="space-y-4">
            {FAQ.map((item, index) => (
              <Card
                key={index}
                className="bg-slate-800/50 border-slate-700 cursor-pointer hover:border-slate-600 transition-colors"
                onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-white pr-4">{item.question}</h3>
                    {expandedFaq === index ? (
                      <ChevronUp className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-slate-400 flex-shrink-0" />
                    )}
                  </div>
                  {expandedFaq === index && (
                    <p className="mt-4 text-slate-400 text-sm leading-relaxed">{item.answer}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Catalog links */}
        <div className="max-w-3xl mx-auto mb-12 text-center text-sm text-slate-400">
          <p>
            Evidence artefacts and HO.2 posture:{' '}
            <a href="/products" className="text-emerald-400 underline hover:text-emerald-300">
              Products catalog
            </a>
            {' · '}
            <a href="/indices" className="text-emerald-400 underline hover:text-emerald-300">
              Labour &amp; AI-economy indices
            </a>
            {' '}(UNMEASURED — scores never sold)
          </p>
        </div>

        {/* Final CTA */}
        <div className="text-center">
          <Card className="max-w-3xl mx-auto bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 border-emerald-500/30">
            <CardContent className="p-10">
              <GraduationCap className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white mb-4">Start measuring today</h2>
              <p className="text-slate-300 mb-8 text-lg">
                No credit card. No tiers. Verification is free forever.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => setLocation('/curriculum')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 text-lg"
                >
                  <BookOpen className="h-5 w-5 mr-2" />
                  Start free training
                </Button>
                <Button
                  variant="outline"
                  onClick={() => openLobby({ task: 'pricing-overview' })}
                  className="border-emerald-500/50 text-emerald-100 hover:bg-emerald-500/10 px-8 py-3 text-lg"
                >
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Ask in Council OS
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setLocation('/register')}
                  className="border-white/30 text-white hover:bg-white/10 px-8 py-3 text-lg"
                >
                  <Users className="h-5 w-5 mr-2" />
                  Create free account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
