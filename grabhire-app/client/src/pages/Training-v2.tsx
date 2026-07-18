/**
 * CSOAI Training Page - Enhanced Professional Design
 * Comprehensive training overview with course catalog, certification paths, FAQ
 * Updated pricing model: Free training, paid certification and licensing
 */

import { useState } from "react";
import { Link } from "wouter";
import {
  BookOpen, Clock, CheckCircle, Award, TrendingUp, Shield, Users, ArrowRight,
  GraduationCap, FileCheck, Play, Star, ChevronDown, ChevronUp, Globe, Sparkles,
  Target, Briefcase, BadgeCheck, Timer, HelpCircle, RefreshCw, MessageCircle,
  PoundSterling, Calendar, Zap, X, Check, CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface FAQItem {
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    question: "Why is training free?",
    answer: "We believe AI safety education should be accessible to everyone. The world needs more AI safety professionals, and cost shouldn't be a barrier. We sustain our operations through certification fees and enterprise licensing, not by charging for education. This ensures anyone with the motivation can learn these critical skills."
  },
  {
    question: "What does the £49 exam fee cover?",
    answer: "The £49 certification exam fee covers exam administration and proctoring, official CSOAI certificate generation, LinkedIn badge and digital credentials, lifetime verification through our public registry, and ongoing certificate validation. This is a one-time fee per certification level."
  },
  {
    question: "Is the £199 license required?",
    answer: "The Analyst License (£199/year or £19.99/month) is only required if you want to work as a paid analyst through the CSOAI platform and earn £45-150/hour. If you're learning for personal development or to enhance your current job skills, you don't need it. The license gives you access to paid case reviews, the analyst job board, and client matching."
  },
  {
    question: "Can I pay monthly for the license?",
    answer: "Yes! We offer flexible payment options. You can pay £199/year (best value - save £40) or £19.99/month with no long-term commitment. Monthly subscribers can cancel anytime. Both options include full platform access and earning capabilities."
  },
  {
    question: "How long does it take to complete training?",
    answer: "Most learners complete the foundation courses in 15-25 hours spread over 2-4 weeks. With 33 courses available, you can specialise in specific areas or complete the entire curriculum. The training is entirely self-paced, so you can go faster or slower depending on your schedule."
  },
  {
    question: "What certification do I get?",
    answer: "Upon passing the certification exam (£49), you receive the CSOAI Certified AI Safety Analyst credential. This includes a verifiable digital certificate, a unique certification ID, LinkedIn badge, and listing in our public registry. You can also earn specialised certifications for each framework."
  },
  {
    question: "Are certificates recognised by employers?",
    answer: "Yes. Our certifications are recognised by enterprises worldwide seeking AI safety compliance expertise. CSOAI works directly with organisations implementing AI governance, and certified analysts are preferred for contract work. Our curriculum aligns with actual regulatory requirements from EU, US, and international standards bodies."
  },
  {
    question: "What if I fail an exam?",
    answer: "You can retake any exam after a 7-day waiting period. We provide detailed feedback on areas needing improvement, and you can review the relevant modules before retaking. Retakes are £25 each. Most learners pass on their first or second attempt."
  }
];

const courseCatalog = {
  foundation: [
    {
      id: "ai-safety-fundamentals",
      name: "AI Safety Fundamentals",
      modules: 8,
      status: "available",
      description: "Core concepts of AI safety including alignment, robustness, and interpretability.",
      topics: ["AI Alignment", "Safety Principles", "Risk Assessment", "Human Oversight"],
      hours: "6-8",
      color: "green"
    },
    {
      id: "ethics-bias",
      name: "Ethics & Bias in AI",
      modules: 6,
      status: "available",
      description: "Understanding and mitigating bias in AI systems, ethical considerations and fairness.",
      topics: ["Bias Detection", "Fairness Metrics", "Ethical Frameworks", "Inclusive AI"],
      hours: "5-6",
      color: "green"
    },
    {
      id: "regulatory-overview",
      name: "Regulatory Overview",
      modules: 5,
      status: "available",
      description: "Global landscape of AI regulation and compliance requirements across jurisdictions.",
      topics: ["Global Regulations", "Compliance Basics", "Enforcement", "Future Trends"],
      hours: "4-5",
      color: "green"
    }
  ],
  regional: [
    {
      id: "eu-ai-act",
      name: "EU AI Act",
      modules: 8,
      status: "available",
      description: "Master Europe's comprehensive AI regulation including risk categories, compliance requirements, and penalties.",
      topics: ["Risk Classification", "High-Risk Requirements", "Conformity Assessment", "Documentation", "Transparency", "Prohibited Practices", "Governance", "Penalties"],
      hours: "6-8",
      color: "blue"
    },
    {
      id: "nist-ai-rmf",
      name: "NIST AI RMF",
      modules: 8,
      status: "available",
      description: "Learn the US National Institute of Standards and Technology's AI Risk Management Framework.",
      topics: ["Govern", "Map", "Measure", "Manage", "AI Lifecycle", "Risk Assessment", "Trustworthy AI", "Implementation"],
      hours: "6-8",
      color: "blue"
    },
    {
      id: "iso-42001",
      name: "ISO 42001",
      modules: 8,
      status: "available",
      description: "Understand the international standard for AI Management Systems used by global organisations.",
      topics: ["Context & Scope", "Leadership", "Planning", "Support", "Operation", "Performance Evaluation", "Improvement", "Certification"],
      hours: "6-8",
      color: "blue"
    },
    {
      id: "tc260",
      name: "TC260 Framework",
      modules: 6,
      status: "available",
      description: "China's national AI governance framework from the TC260 standardisation committee.",
      topics: ["Chinese AI Standards", "Data Governance", "Algorithm Auditing", "Cross-border Compliance", "Industry Applications", "Future Developments"],
      hours: "4-6",
      color: "blue"
    },
    {
      id: "uk-ai-framework",
      name: "UK AI Framework",
      modules: 6,
      status: "available",
      description: "UK's pro-innovation approach to AI regulation and sector-specific guidelines.",
      topics: ["UK AI Strategy", "Sector Regulators", "Pro-Innovation Approach", "Safety", "Fairness", "Accountability"],
      hours: "4-6",
      color: "blue"
    },
    {
      id: "canada-aida",
      name: "Canada AIDA",
      modules: 5,
      status: "available",
      description: "Canada's Artificial Intelligence and Data Act and compliance requirements.",
      topics: ["AIDA Overview", "High-Impact Systems", "Compliance Duties", "Enforcement", "Privacy Integration"],
      hours: "4-5",
      color: "blue"
    },
    {
      id: "australia-ethics",
      name: "Australia AI Ethics",
      modules: 5,
      status: "available",
      description: "Australia's AI Ethics Framework and voluntary principles for responsible AI.",
      topics: ["Ethics Principles", "Human Rights", "Privacy", "Accountability", "Implementation Guide"],
      hours: "4-5",
      color: "blue"
    }
  ],
  industry: [
    {
      id: "healthcare-ai",
      name: "Healthcare AI Safety",
      modules: 7,
      status: "available",
      description: "AI safety considerations specific to healthcare, clinical decision support, and medical devices.",
      topics: ["Clinical AI Systems", "FDA Guidance", "Patient Safety", "Medical Device AI", "Diagnostic AI", "Privacy (HIPAA)", "Validation"],
      hours: "6-7",
      color: "purple"
    },
    {
      id: "financial-trading-ai",
      name: "Financial Trading AI",
      modules: 6,
      status: "available",
      description: "AI safety in algorithmic trading, risk management, and financial services compliance.",
      topics: ["Algorithmic Trading", "Risk Management", "Market Manipulation", "FCA/SEC Rules", "Model Validation", "Audit Trails"],
      hours: "5-6",
      color: "purple"
    },
    {
      id: "autonomous-vehicles",
      name: "Autonomous Vehicles",
      modules: 7,
      status: "available",
      description: "Safety frameworks for autonomous vehicles, including testing, validation, and regulatory compliance.",
      topics: ["AV Safety Levels", "Testing & Validation", "Sensor Fusion", "Edge Cases", "Regulatory Landscape", "Liability", "Ethics"],
      hours: "6-7",
      color: "purple"
    }
  ],
  csoai: [
    {
      id: "maternal-covenant",
      name: "Maternal Covenant",
      modules: 4,
      status: "available",
      description: "CSOAI's ethical framework for AI systems that protect and nurture human wellbeing.",
      topics: ["Covenant Principles", "Human-Centred AI", "Safety-First Design", "Implementation Guide"],
      hours: "3-4",
      color: "pink"
    },
    {
      id: "soai-pdca",
      name: "SOAI-PDCA Framework",
      modules: 6,
      status: "available",
      description: "Plan-Do-Check-Act methodology specifically adapted for AI safety and compliance.",
      topics: ["PDCA Fundamentals", "Planning AI Safety", "Implementation", "Monitoring & Checking", "Acting on Findings", "Continuous Improvement"],
      hours: "5-6",
      color: "pink"
    }
  ]
};

const certificationSteps = [
  {
    step: 1,
    title: "Complete FREE Training",
    description: "Work through any of our 33 free courses. Master AI safety frameworks at your own pace.",
    icon: BookOpen,
    price: "FREE",
    priceNote: "All courses included"
  },
  {
    step: 2,
    title: "Pass Certification Exam",
    description: "Demonstrate your expertise with our comprehensive certification exam. Get your official credential.",
    icon: GraduationCap,
    price: "£49",
    priceNote: "One-time fee"
  },
  {
    step: 3,
    title: "Get Analyst License",
    description: "Activate your license to access paid work opportunities through the CSOAI platform.",
    icon: BadgeCheck,
    price: "£199/year",
    priceNote: "or £19.99/month"
  },
  {
    step: 4,
    title: "Start Earning",
    description: "Review AI systems for enterprises worldwide. Set your own schedule, work remotely.",
    icon: PoundSterling,
    price: "£45-150/hour",
    priceNote: "Your earning potential"
  }
];

const competitorComparison = [
  {
    feature: "Comprehensive AI Safety Training",
    csoai: true,
    csoaiNote: "33 courses FREE",
    competitors: true,
    competitorsNote: "£500-2,000"
  },
  {
    feature: "Official Certification",
    csoai: true,
    csoaiNote: "£49 exam fee",
    competitors: true,
    competitorsNote: "£200-500"
  },
  {
    feature: "EU AI Act Coverage",
    csoai: true,
    csoaiNote: "Included FREE",
    competitors: true,
    competitorsNote: "£300-800 extra"
  },
  {
    feature: "Multiple Framework Training",
    csoai: true,
    csoaiNote: "7 frameworks FREE",
    competitors: false,
    competitorsNote: "Single framework only"
  },
  {
    feature: "Industry-Specific Courses",
    csoai: true,
    csoaiNote: "Healthcare, Finance, AV",
    competitors: false,
    competitorsNote: "Generic only"
  },
  {
    feature: "Paid Work Opportunities",
    csoai: true,
    csoaiNote: "£45-150/hour",
    competitors: false,
    competitorsNote: "Not available"
  },
  {
    feature: "LinkedIn Badge",
    csoai: true,
    csoaiNote: "Included",
    competitors: true,
    competitorsNote: "Extra £50"
  },
  {
    feature: "Lifetime Course Access",
    csoai: true,
    csoaiNote: "Always FREE",
    competitors: false,
    competitorsNote: "1 year only"
  }
];

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Former Software Engineer",
    location: "London, UK",
    quote: "I transitioned from software development to AI safety in just 3 weeks. The free training was comprehensive and the certification opened doors immediately. Now earning £95/hour part-time.",
    earnings: "£95/hour",
    image: null
  },
  {
    name: "Michael Okonkwo",
    role: "Compliance Professional",
    location: "Manchester, UK",
    quote: "The EU AI Act training prepared me perfectly for my role. My employer valued the certification and I received a promotion within 2 months of completing the program.",
    earnings: "Promoted",
    image: null
  },
  {
    name: "Ana Rodriguez",
    role: "Recent Graduate",
    location: "Edinburgh, UK",
    quote: "As a recent graduate, the free training gave me skills employers actually want. I started my first AI safety role 6 weeks after certification. Best career decision ever.",
    earnings: "£68/hour",
    image: null
  }
];

function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-4">
      {faqItems.map((item, index) => (
        <div
          key={index}
          className="border border-gray-200 rounded-lg overflow-hidden bg-white"
        >
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
          >
            <span className="text-lg font-semibold text-gray-900 pr-4">{item.question}</span>
            {openIndex === index ? (
              <ChevronUp className="h-5 w-5 text-green-600 flex-shrink-0" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
            )}
          </button>
          {openIndex === index && (
            <div className="px-6 pb-6 pt-0">
              <p className="text-gray-600 leading-relaxed">{item.answer}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function CourseCard({ course }: { course: typeof courseCatalog.foundation[0] }) {
  return (
    <Card
      className={`p-6 border-2 hover:shadow-lg transition-all relative ${
        course.status === 'planned' ? 'opacity-75' : ''
      }`}
    >
      <div className="absolute -top-3 -right-3 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
        FREE
      </div>

      <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
        course.color === 'blue' ? 'bg-blue-100' :
        course.color === 'green' ? 'bg-green-100' :
        course.color === 'purple' ? 'bg-purple-100' :
        course.color === 'pink' ? 'bg-pink-100' :
        'bg-amber-100'
      }`}>
        <BookOpen className={`h-6 w-6 ${
          course.color === 'blue' ? 'text-blue-600' :
          course.color === 'green' ? 'text-green-600' :
          course.color === 'purple' ? 'text-purple-600' :
          course.color === 'pink' ? 'text-pink-600' :
          'text-amber-600'
        }`} />
      </div>

      <h3 className="text-xl font-bold text-gray-900 mb-2">{course.name}</h3>
      <p className="text-gray-600 text-sm mb-4">{course.description}</p>

      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
        <div className="flex items-center gap-1">
          <BookOpen className="h-4 w-4" />
          <span>{course.modules} modules</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          <span>{course.hours} hours</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {course.topics.slice(0, 4).map((topic, i) => (
          <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
            {topic}
          </span>
        ))}
        {course.topics.length > 4 && (
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
            +{course.topics.length - 4} more
          </span>
        )}
      </div>

      <Link href="/register">
        <Button className={`w-full ${
          course.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' :
          course.color === 'green' ? 'bg-green-600 hover:bg-green-700' :
          course.color === 'purple' ? 'bg-purple-600 hover:bg-purple-700' :
          course.color === 'pink' ? 'bg-pink-600 hover:bg-pink-700' :
          'bg-amber-600 hover:bg-amber-700'
        } text-white`}>
          Start Free Course
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </Link>
    </Card>
  );
}

export default function TrainingV2() {
  return (
    <div className="min-h-screen bg-white">

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-700 via-green-600 to-emerald-600 text-white py-24">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-5 py-2.5 mb-8">
              <Sparkles className="h-5 w-5 text-yellow-300" />
              <span className="text-white text-sm font-semibold">No Credit Card Required</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              ALL 33 Courses<br />
              <span className="text-yellow-300">100% FREE</span>
            </h1>

            <p className="text-xl md:text-2xl text-green-50 mb-6 max-w-4xl mx-auto leading-relaxed">
              Master AI safety frameworks - EU AI Act, NIST AI RMF, ISO 42001, and more.
              Get certified and start earning <span className="text-yellow-300 font-semibold">£45-150/hour</span>.
            </p>

            <p className="text-lg text-green-100 mb-10 max-w-2xl mx-auto">
              <strong className="text-white">Only pay when you start earning.</strong> Training is free.
              Certification is £49. License to earn is £199/year.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link href="/register">
                <Button size="lg" className="bg-white text-green-700 hover:bg-green-50 px-10 py-7 text-lg font-bold shadow-xl hover:shadow-2xl transition-all">
                  Start Free Training
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/certification">
                <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 px-10 py-7 text-lg font-semibold">
                  View Certifications
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5">
                <div className="text-3xl font-bold mb-1">33</div>
                <div className="text-green-100 text-sm">Free Courses</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5">
                <div className="text-3xl font-bold mb-1">100+</div>
                <div className="text-green-100 text-sm">Training Modules</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5">
                <div className="text-3xl font-bold mb-1">£0</div>
                <div className="text-green-100 text-sm">Training Cost</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5">
                <div className="text-3xl font-bold mb-1">£150/hr</div>
                <div className="text-green-100 text-sm">Earning Potential</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clear Pricing Path */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Your Path to Earning £45-150/hour
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Simple, transparent pricing. Free training, pay only when you're ready to earn.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {certificationSteps.map((item) => (
              <Card key={item.step} className="p-6 text-center hover:shadow-lg transition-shadow border-2 border-transparent hover:border-green-500">
                <div className="w-14 h-14 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
                  {item.step}
                </div>
                <item.icon className="h-10 w-10 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{item.description}</p>
                <div className={`text-2xl font-bold mb-1 ${item.price === 'FREE' ? 'text-green-600' : 'text-gray-900'}`}>
                  {item.price}
                </div>
                <div className="text-sm text-gray-500">{item.priceNote}</div>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-3 bg-green-100 border border-green-200 rounded-full px-6 py-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-green-800 font-medium">Monthly license option: £19.99/month - cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Course Catalog - Foundation */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Complete Course Catalog
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              All 33 courses are <span className="text-green-600 font-bold">100% FREE</span>. No credit card required. Start anywhere.
            </p>
          </div>

          {/* Foundation Courses */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Target className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Foundation Courses</h3>
              <span className="bg-green-100 text-green-700 text-sm font-semibold px-3 py-1 rounded-full">
                Start Here
              </span>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courseCatalog.foundation.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </div>

          {/* Regional Frameworks */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Globe className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Regional Frameworks</h3>
              <span className="bg-blue-100 text-blue-700 text-sm font-semibold px-3 py-1 rounded-full">
                7 Frameworks
              </span>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courseCatalog.regional.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </div>

          {/* Industry-Specific */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Industry-Specific Courses</h3>
              <span className="bg-purple-100 text-purple-700 text-sm font-semibold px-3 py-1 rounded-full">
                Specialise
              </span>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courseCatalog.industry.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </div>

          {/* CSOAI Specific */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-pink-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">CSOAI Frameworks</h3>
              <span className="bg-pink-100 text-pink-700 text-sm font-semibold px-3 py-1 rounded-full">
                Exclusive
              </span>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courseCatalog.csoai.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why We're Different - Competitor Comparison */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Why We're Different
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Other providers charge £500-2,000+ for courses we offer free. Here's how we compare.
            </p>
          </div>

          <Card className="overflow-hidden border-2">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left p-4 font-semibold text-gray-900">Feature</th>
                    <th className="text-center p-4 font-semibold text-green-700 bg-green-50">
                      <div className="flex items-center justify-center gap-2">
                        <Shield className="h-5 w-5" />
                        CSOAI
                      </div>
                    </th>
                    <th className="text-center p-4 font-semibold text-gray-500">
                      Other Providers
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {competitorComparison.map((row, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="p-4 font-medium text-gray-900">{row.feature}</td>
                      <td className="p-4 text-center bg-green-50/50">
                        <div className="flex flex-col items-center">
                          {row.csoai ? (
                            <Check className="h-6 w-6 text-green-600 mb-1" />
                          ) : (
                            <X className="h-6 w-6 text-red-500 mb-1" />
                          )}
                          <span className="text-sm text-green-700 font-medium">{row.csoaiNote}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex flex-col items-center">
                          {row.competitors ? (
                            <Check className="h-6 w-6 text-gray-400 mb-1" />
                          ) : (
                            <X className="h-6 w-6 text-red-500 mb-1" />
                          )}
                          <span className="text-sm text-gray-500">{row.competitorsNote}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-6">
              We believe AI safety education should be accessible to everyone, not just those who can afford premium courses.
            </p>
            <Link href="/register">
              <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg font-bold">
                Start Your Free Training
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Success Stories
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Real people who transformed their careers with CSOAI certification
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-8 bg-white border-0 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>

                <p className="text-gray-600 leading-relaxed mb-6 italic">
                  "{testimonial.quote}"
                </p>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                    <div className="text-sm text-gray-400">{testimonial.location}</div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="text-sm text-gray-500">Now earning</div>
                  <div className="text-lg font-bold text-green-600">{testimonial.earnings}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to know about our free training and pricing
            </p>
          </div>

          <FAQAccordion />
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-gradient-to-br from-green-700 via-green-600 to-emerald-600 text-white">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-5 py-2.5 mb-8">
            <Zap className="h-5 w-5 text-yellow-300" />
            <span className="text-white text-sm font-semibold">All 33 Courses - 100% FREE</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Become an AI Safety Analyst?
          </h2>
          <p className="text-xl text-green-50 mb-6 max-w-2xl mx-auto">
            Join thousands of certified analysts protecting humanity from AI risks.
            Start learning today - no credit card required.
          </p>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-10 max-w-lg mx-auto">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-yellow-300">FREE</div>
                <div className="text-sm text-green-100">Training</div>
              </div>
              <div>
                <div className="text-2xl font-bold">£49</div>
                <div className="text-sm text-green-100">Certification</div>
              </div>
              <div>
                <div className="text-2xl font-bold">£199/yr</div>
                <div className="text-sm text-green-100">License to Earn</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/register">
              <Button size="lg" className="bg-white text-green-700 hover:bg-green-50 px-12 py-7 text-lg font-bold shadow-xl hover:shadow-2xl transition-all">
                Start Free Training Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-green-100 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <span>33 courses included</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <span>Only pay when earning</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <span>Monthly license option</span>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
