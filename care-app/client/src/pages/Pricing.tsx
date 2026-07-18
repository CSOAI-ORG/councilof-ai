import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { trpc } from '@/lib/trpc';
import {
  Check,
  X,
  Zap,
  Building2,
  Rocket,
  Shield,
  Users,
  FileText,
  Brain,
  Globe,
  Mail,
  Phone,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Award,
  Briefcase,
  Heart,
  Star,
  TrendingUp,
  Lock,
  BookOpen,
  BadgeCheck,
  Landmark,
  Scale,
  Sparkles
} from 'lucide-react';

// All 33 courses - completely FREE
const FREE_COURSES = {
  foundation: [
    'AI Safety Fundamentals',
    'Ethics & Bias in AI',
    'Regulatory Overview'
  ],
  regional: [
    'EU AI Act Compliance',
    'NIST AI Risk Management Framework',
    'UK AI Regulation',
    'Canada AIDA Framework',
    'Australia AI Ethics Framework'
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
    'Research & Development AI'
  ]
};

const ENTERPRISE_TIERS = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'For small teams starting AI compliance',
    price: 1500,
    period: 'year',
    icon: Zap,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500/30',
    features: [
      'Up to 5 AI systems',
      'Basic compliance dashboard',
      'Email support',
      'Standard reporting',
      '1 admin user',
      'EU AI Act framework'
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'For growing organizations with multiple AI systems',
    price: 5000,
    period: 'year',
    icon: Rocket,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500/50',
    features: [
      'Up to 25 AI systems',
      'Advanced compliance dashboard',
      'Priority email & chat support',
      'Custom reporting',
      '5 admin users',
      'All regulatory frameworks',
      'API access',
      'Byzantine Council priority reviews'
    ],
    cta: 'Start Professional',
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations requiring unlimited scale',
    price: null,
    period: 'custom',
    icon: Building2,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500/50',
    features: [
      'Unlimited AI systems',
      'White-label dashboard',
      'Dedicated account manager',
      'Custom integrations',
      'Unlimited admin users',
      'All frameworks + custom',
      'Full API access',
      'Priority Byzantine Council',
      'On-site training',
      'SLA guarantee'
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

const FAQ = [
  {
    question: 'Why is all the training completely free?',
    answer: 'Our mission is to democratize AI safety education. We believe everyone should have access to world-class AI governance training regardless of their financial situation. The future of AI depends on having well-trained professionals who understand safety and ethics. By making courses free, we\'re building a global community of AI safety experts.'
  },
  {
    question: 'What does the certification exam fee cover?',
    answer: 'The one-time certification exam fee covers the cost of exam administration, verification, and your official credentials. You\'ll receive a digital certificate with a unique verification ID, a LinkedIn badge you can display on your profile, and your name will be added to our public registry of certified analysts that employers can verify.'
  },
  {
    question: 'Do I need the Analyst License to take courses or get certified?',
    answer: 'No! You can take all 33 courses and even pass the certification exam without ever paying for the Analyst License. The license is only required if you want to work as a paid CSOAI analyst, access our job marketplace, and earn money doing AI safety audits.'
  },
  {
    question: 'What is the Enterprise pricing for?',
    answer: 'Enterprise pricing is specifically for companies that want to register and manage their AI systems on our platform. This is NOT for training - that\'s free for everyone. Enterprise customers use our platform to demonstrate compliance with regulations like the EU AI Act, track their AI inventory, and get Byzantine Council safety reviews.'
  },
  {
    question: 'How much can I earn as a certified analyst?',
    answer: 'Certified analysts with an active license typically earn between 45-150 per hour depending on their expertise, location, and the complexity of the audit. Top analysts working on high-risk AI systems can earn even more. The license pays for itself after just a few hours of work.'
  },
  {
    question: 'What is the Byzantine Council?',
    answer: 'The Byzantine Council is our unique 33-agent AI safety review system. When organizations submit their AI systems for review, the Council evaluates them from multiple stakeholder perspectives - from regulators and ethicists to end-users and vulnerable populations. This provides the most comprehensive AI safety assessment available anywhere.'
  },
  {
    question: 'What is the Prosperity Fund?',
    answer: 'The Prosperity Fund is our commitment to giving back. A portion of all revenue goes into the fund, which provides grants to underrepresented communities, funds AI safety research, and supports analysts in developing nations who can\'t afford the license fee. We believe in building prosperity for everyone.'
  },
  {
    question: 'Can I switch from monthly to yearly licensing?',
    answer: 'Yes! You can switch from monthly to yearly at any time and immediately start saving. If you switch mid-cycle, we\'ll prorate your remaining monthly payment toward the annual fee. Annual licensing saves you over 40 compared to paying monthly.'
  },
  {
    question: 'What happens if my Analyst License expires?',
    answer: 'If your license expires, you\'ll no longer be able to accept new paid work through our marketplace, but your certification remains valid permanently. You can reactivate your license at any time by paying the annual or monthly fee. Any in-progress audits can be completed.'
  },
  {
    question: 'Is there financial assistance available?',
    answer: 'Yes! Through the Prosperity Fund, we offer reduced-cost or free licenses to analysts in developing nations, students, and those facing financial hardship. Contact us with your situation and we\'ll work to find a solution. AI safety is too important to be gated by ability to pay.'
  }
];

const COMPETITOR_COMPARISON = [
  {
    feature: 'Course Access',
    csoai: 'All 33 courses FREE forever',
    competitors: 'Pay per course or subscription'
  },
  {
    feature: 'Training Model',
    csoai: 'Learn first, pay only when working',
    competitors: 'Pay upfront to learn'
  },
  {
    feature: 'Certification',
    csoai: 'One-time fee, permanent credential',
    competitors: 'Often requires ongoing fees'
  },
  {
    feature: 'Job Marketplace',
    csoai: 'Direct access to AI audit opportunities',
    competitors: 'No job placement support'
  },
  {
    feature: 'AI Safety Review',
    csoai: 'Byzantine Council - 33 agent analysis',
    competitors: 'Basic checklists only'
  },
  {
    feature: 'Community Fund',
    csoai: 'Prosperity Fund supports underserved',
    competitors: 'No community investment'
  },
  {
    feature: 'Insurance Coverage',
    csoai: 'Liability insurance included',
    competitors: 'You\'re on your own'
  },
  {
    feature: 'Global Recognition',
    csoai: 'Public analyst registry',
    competitors: 'Certificates only'
  }
];

export default function Pricing() {
  const [, setLocation] = useLocation();
  const [isYearlyLicense, setIsYearlyLicense] = useState(true);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [showAllCourses, setShowAllCourses] = useState(false);

  const { data: user } = trpc.auth.me.useQuery();
  const checkoutMutation = trpc.stripe.createCheckoutSession.useMutation();

  const handleSubscribe = async (tier: string, type: 'exam' | 'license' | 'enterprise') => {
    if (type === 'enterprise' && tier === 'enterprise') {
      window.location.href = 'mailto:enterprise@csoai.org?subject=Enterprise%20Inquiry';
      return;
    }

    try {
      const result = await checkoutMutation.mutateAsync({
        tier: tier as 'pro' | 'enterprise',
        billingPeriod: isYearlyLicense ? 'yearly' : 'monthly',
      });
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      console.error('Checkout failed:', error);
    }
  };

  const totalCourses = FREE_COURSES.foundation.length + FREE_COURSES.regional.length + FREE_COURSES.industry.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <div className="container mx-auto py-16 px-4">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
            Revolutionary Pricing Model
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            All Training is <span className="text-emerald-400">100% Free</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8">
            We believe AI safety education should be accessible to everyone. That's why all 33 courses
            in our curriculum are completely free. You only pay when you're ready to work.
          </p>

          {/* Key Value Props */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6">
              <GraduationCap className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Free Training</h3>
              <p className="text-slate-400 text-sm">All 33 courses, no hidden fees, forever free</p>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6">
              <Award className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Get Certified</h3>
              <p className="text-slate-400 text-sm">One-time exam fee, permanent credential</p>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6">
              <Briefcase className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Start Earning</h3>
              <p className="text-slate-400 text-sm">License to work, earn 45-150/hour</p>
            </div>
          </div>
        </div>

        {/* Free Courses Section */}
        <div className="max-w-6xl mx-auto mb-20">
          <div className="text-center mb-10">
            <Badge className="mb-4 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
              <Heart className="h-3 w-3 mr-1 inline" />
              Completely Free
            </Badge>
            <h2 className="text-3xl font-bold text-white mb-4">
              All {totalCourses} Courses - Free Forever
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              We're democratizing AI safety education. Every course below is free - no credit card required,
              no trial period, no upsells. Just high-quality education for everyone.
            </p>
          </div>

          <Card className="bg-slate-800/50 border-emerald-500/30 border-2">
            <CardContent className="p-8">
              {/* Foundation Courses */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="h-5 w-5 text-emerald-400" />
                  <h3 className="text-lg font-semibold text-white">Foundation Courses</h3>
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

              {/* Regional Courses */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="h-5 w-5 text-emerald-400" />
                  <h3 className="text-lg font-semibold text-white">Regional Compliance</h3>
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

              {/* Industry Courses */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Briefcase className="h-5 w-5 text-emerald-400" />
                  <h3 className="text-lg font-semibold text-white">Industry Specializations</h3>
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
                      <>Show Less <ChevronUp className="h-4 w-4 ml-1" /></>
                    ) : (
                      <>Show All {FREE_COURSES.industry.length} Industry Courses <ChevronDown className="h-4 w-4 ml-1" /></>
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
                  Start Learning Free
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Individual Pricing - Certification & License */}
        <div className="max-w-5xl mx-auto mb-20">
          <div className="text-center mb-10">
            <Badge className="mb-4 bg-white/10 text-white border-white/30">
              For Individuals
            </Badge>
            <h2 className="text-3xl font-bold text-white mb-4">
              Certification & Analyst License
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              After completing your free training, get certified and start earning.
              The certification is a one-time fee; the license is only needed if you want to work as a paid analyst.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Certification Exam */}
            <Card className="bg-slate-800/50 border-2 border-white/20 hover:border-white/40 transition-colors">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto p-4 rounded-xl bg-white/10 w-fit mb-4">
                  <Award className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-2xl text-white">Certification Exam</CardTitle>
                <CardDescription className="text-slate-400">
                  Prove your expertise with an official credential
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="mb-6">
                  <span className="text-5xl font-bold text-white">49</span>
                  <span className="text-slate-400 text-lg ml-1">one-time</span>
                </div>

                <div className="text-left space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-slate-300">
                    <Check className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                    <span>Digital certificate with unique ID</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-300">
                    <Check className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                    <span>LinkedIn badge for your profile</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-300">
                    <Check className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                    <span>Listed in public analyst registry</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-300">
                    <Check className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                    <span>Employer verification system</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-300">
                    <Check className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                    <span>Credential never expires</span>
                  </div>
                </div>

                <Button
                  className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/30"
                  onClick={() => handleSubscribe('exam', 'exam')}
                >
                  <BadgeCheck className="h-4 w-4 mr-2" />
                  Get Certified
                </Button>

                <p className="text-xs text-slate-500 mt-4">
                  Requires completion of all foundation courses
                </p>
              </CardContent>
            </Card>

            {/* Analyst License */}
            <Card className="bg-slate-800/50 border-2 border-emerald-500/50 shadow-xl shadow-emerald-500/10">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-emerald-500 text-white border-0">Start Earning</Badge>
              </div>
              <CardHeader className="text-center pb-4 pt-8">
                <div className="mx-auto p-4 rounded-xl bg-emerald-500/20 w-fit mb-4">
                  <Briefcase className="h-10 w-10 text-emerald-400" />
                </div>
                <CardTitle className="text-2xl text-white">Analyst License</CardTitle>
                <CardDescription className="text-slate-400">
                  Work as a paid CSOAI analyst
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                {/* Billing Toggle */}
                <div className="flex items-center justify-center gap-3 mb-4">
                  <span className={`text-sm ${!isYearlyLicense ? 'text-white' : 'text-slate-400'}`}>Monthly</span>
                  <Switch
                    checked={isYearlyLicense}
                    onCheckedChange={setIsYearlyLicense}
                  />
                  <span className={`text-sm ${isYearlyLicense ? 'text-white' : 'text-slate-400'}`}>
                    Yearly <Badge className="ml-1 bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">Save 40%+</Badge>
                  </span>
                </div>

                <div className="mb-6">
                  <span className="text-5xl font-bold text-white">
                    {isYearlyLicense ? '199' : '19.99'}
                  </span>
                  <span className="text-slate-400 text-lg ml-1">/{isYearlyLicense ? 'year' : 'month'}</span>
                  {isYearlyLicense && (
                    <p className="text-sm text-emerald-400 mt-1">
                      vs 239.88/year if paid monthly
                    </p>
                  )}
                </div>

                <div className="text-left space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-slate-300">
                    <Check className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                    <span>Access to job marketplace</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-300">
                    <Check className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                    <span>Earn 45-150/hour on audits</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-300">
                    <Check className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                    <span>Ongoing professional support</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-300">
                    <Check className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                    <span>Annual recertification included</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-300">
                    <Check className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                    <span>Liability insurance coverage</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-300">
                    <Check className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                    <span>Professional network access</span>
                  </div>
                </div>

                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => handleSubscribe('license', 'license')}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Get Licensed & Start Earning
                </Button>

                <p className="text-xs text-slate-500 mt-4">
                  Requires valid certification. Cancel anytime.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Clarification Note */}
          <div className="mt-8 bg-slate-800/30 border border-slate-700 rounded-xl p-6 text-center">
            <p className="text-slate-300">
              <strong className="text-white">Important:</strong> You do NOT need the Analyst License to take courses or get certified.
              The license is only required if you want to work as a <strong className="text-emerald-400">paid</strong> CSOAI analyst
              and access our job marketplace.
            </p>
          </div>
        </div>

        {/* Enterprise Pricing */}
        <div className="max-w-6xl mx-auto mb-20">
          <div className="text-center mb-10">
            <Badge className="mb-4 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
              <Building2 className="h-3 w-3 mr-1 inline" />
              For Organizations
            </Badge>
            <h2 className="text-3xl font-bold text-white mb-4">
              Enterprise AI System Registration
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Register and manage your organization's AI systems. Demonstrate compliance with EU AI Act,
              NIST, and other frameworks. Get Byzantine Council safety reviews.
            </p>
            <p className="text-sm text-emerald-400 mt-2 font-medium">
              This is for AI system compliance management - training is free for everyone!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {ENTERPRISE_TIERS.map((tier) => {
              const Icon = tier.icon;

              return (
                <Card
                  key={tier.id}
                  className={`relative bg-slate-800/50 border-2 ${tier.borderColor} ${
                    tier.popular ? 'scale-105 shadow-xl shadow-emerald-500/20' : ''
                  }`}
                >
                  {tier.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-emerald-500 text-white border-0">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-2">
                    <div className={`mx-auto p-3 rounded-xl ${tier.bgColor} w-fit mb-4`}>
                      <Icon className={`h-8 w-8 ${tier.color}`} />
                    </div>
                    <CardTitle className="text-2xl text-white">{tier.name}</CardTitle>
                    <CardDescription>{tier.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="mb-6">
                      {tier.price ? (
                        <>
                          <span className="text-5xl font-bold text-white">{tier.price.toLocaleString()}</span>
                          <span className="text-slate-400">/{tier.period}</span>
                        </>
                      ) : (
                        <span className="text-3xl font-bold text-white">Custom Pricing</span>
                      )}
                    </div>

                    <Button
                      onClick={() => handleSubscribe(tier.id, 'enterprise')}
                      className={`w-full mb-6 ${
                        tier.popular
                          ? 'bg-emerald-600 hover:bg-emerald-700'
                          : 'bg-slate-700 hover:bg-slate-600'
                      }`}
                    >
                      {tier.cta}
                    </Button>

                    <div className="text-left space-y-2">
                      {tier.features.map((feature, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                          <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Why We're Different */}
        <div className="max-w-6xl mx-auto mb-20">
          <div className="text-center mb-10">
            <Badge className="mb-4 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
              <Sparkles className="h-3 w-3 mr-1 inline" />
              The CSOAI Difference
            </Badge>
            <h2 className="text-3xl font-bold text-white mb-4">
              Why We're Different From Competitors
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Other platforms charge you to learn. We built an entire ecosystem where education is free
              and you only invest when you're ready to build your career.
            </p>
          </div>

          <Card className="bg-slate-800/50 border-emerald-500/30 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left p-4 text-slate-400 font-medium">Feature</th>
                    <th className="text-center p-4 text-emerald-400 font-bold bg-emerald-500/10">
                      <div className="flex items-center justify-center gap-2">
                        <Shield className="h-5 w-5" />
                        CSOAI
                      </div>
                    </th>
                    <th className="text-center p-4 text-slate-500 font-medium">Other Platforms</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPETITOR_COMPARISON.map((row, i) => (
                    <tr key={i} className="border-b border-slate-700/50">
                      <td className="p-4 text-white font-medium">{row.feature}</td>
                      <td className="p-4 text-center bg-emerald-500/5">
                        <div className="flex items-center justify-center gap-2 text-emerald-400">
                          <Check className="h-5 w-5" />
                          <span className="text-sm">{row.csoai}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2 text-slate-500">
                          <X className="h-5 w-5" />
                          <span className="text-sm">{row.competitors}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Ecosystem Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6 text-center">
                <Landmark className="h-10 w-10 text-emerald-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Byzantine Council</h3>
                <p className="text-slate-400 text-sm">
                  Our unique 33-agent AI safety review system provides the most comprehensive
                  multi-stakeholder analysis available anywhere.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6 text-center">
                <Heart className="h-10 w-10 text-emerald-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Prosperity Fund</h3>
                <p className="text-slate-400 text-sm">
                  A portion of all revenue supports analysts in developing nations,
                  funds AI safety research, and provides financial assistance.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6 text-center">
                <Scale className="h-10 w-10 text-emerald-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Complete Ecosystem</h3>
                <p className="text-slate-400 text-sm">
                  Training, certification, job marketplace, compliance tools, and community -
                  everything you need in one integrated platform.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mb-16">
          <div className="text-center mb-10">
            <Badge className="mb-4 bg-white/10 text-white border-white/30">
              Questions?
            </Badge>
            <h2 className="text-3xl font-bold text-white mb-4">Frequently Asked Questions</h2>
            <p className="text-slate-400">
              Everything you need to know about our pricing model
            </p>
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

        {/* Final CTA */}
        <div className="text-center">
          <Card className="max-w-3xl mx-auto bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 border-emerald-500/30">
            <CardContent className="p-10">
              <GraduationCap className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white mb-4">
                Start Your AI Safety Journey Today
              </h2>
              <p className="text-slate-300 mb-8 text-lg">
                Join thousands of professionals learning AI governance for free.
                No credit card required. No hidden fees. Just start learning.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => setLocation('/curriculum')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 text-lg"
                >
                  <BookOpen className="h-5 w-5 mr-2" />
                  Start Free Training
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setLocation('/register')}
                  className="border-white/30 text-white hover:bg-white/10 px-8 py-3 text-lg"
                >
                  <Users className="h-5 w-5 mr-2" />
                  Create Free Account
                </Button>
              </div>
              <p className="text-emerald-400 mt-6 text-sm font-medium">
                All 33 courses included free - forever.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
