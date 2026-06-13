/**
 * CEASAI Certification Page - Clear Certification Tiers & Licensing
 * Professional certification pathway with clear progression
 */

import { Link } from "wouter";
import { useState } from "react";
import {
  Award,
  CheckCircle,
  Clock,
  FileText,
  TrendingUp,
  Shield,
  Users,
  ArrowRight,
  Star,
  BookOpen,
  Briefcase,
  GraduationCap,
  Crown,
  ChevronDown,
  ChevronUp,
  BadgeCheck,
  CreditCard,
  HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// FAQ Data
const faqItems = [
  {
    question: "What's the difference between certification and license?",
    answer: "Certification proves your knowledge and skills - it's a one-time exam you pass to demonstrate competency. The Analyst License is an annual subscription (£199/year or £19.99/month) required to do paid work through CEASAI. Think of certification as your qualification, and the license as your permission to practice professionally. You need both to earn money as an analyst."
  },
  {
    question: "Can I get certified without the license?",
    answer: "Yes! You can complete all certifications without purchasing a license. Many people get certified first to build their credentials, then activate their license when ready to start paid work. Your certification remains valid regardless of license status."
  },
  {
    question: "How long does certification take?",
    answer: "Level 1 certification typically takes 2-4 weeks if you study part-time, completing the free Foundation courses and passing the 100-question exam. Higher levels require more time due to review count requirements and additional coursework. Level 2 typically takes 3-6 months, Level 3 takes 6-12 months, and Level 4 can take 1-2+ years depending on your pace."
  },
  {
    question: "What if I fail the exam?",
    answer: "You can retake any certification exam after a 24-hour waiting period. There's no limit to retake attempts, and you only pay the exam fee again if you fail. We recommend reviewing the training materials and focusing on areas where you struggled before retaking."
  },
  {
    question: "Do certifications expire?",
    answer: "Certifications are valid for 1 year from the date of passing. To maintain your certification, you need an active Analyst License which includes automatic recertification. Without an active license, you'll need to retake the exam to recertify."
  },
  {
    question: "Can I skip levels?",
    answer: "No, certification levels must be completed in order. Each level builds on the knowledge and experience from the previous level. You must hold Level 1 before attempting Level 2, and so on."
  }
];

// Certification tier data
const certificationTiers = [
  {
    level: 1,
    title: "AI Safety Analyst",
    examFee: "£49",
    icon: BookOpen,
    color: "green",
    requirements: [
      "Complete Foundation courses (free)",
      "No prior experience required"
    ],
    examDetails: {
      questions: 100,
      passRate: "70%",
      duration: "2 hours"
    },
    benefits: [
      "Official CEASAI Certificate",
      "LinkedIn digital badge",
      "Public registry listing",
      "Access to entry-level reviews"
    ],
    earnings: "£45-75/hour",
    description: "Entry-level certification for aspiring AI Safety Analysts. Perfect starting point for your career."
  },
  {
    level: 2,
    title: "Senior AI Safety Analyst",
    examFee: "£99",
    icon: Briefcase,
    color: "blue",
    requirements: [
      "Hold Level 1 Certification",
      "Complete Regional Specialization course",
      "500+ verified reviews completed"
    ],
    examDetails: {
      questions: 150,
      passRate: "75%",
      duration: "2.5 hours"
    },
    benefits: [
      "Senior analyst status",
      "Mentor junior analysts",
      "Priority job access",
      "Complex case assignments"
    ],
    earnings: "£60-100/hour",
    description: "For experienced analysts ready to take on senior responsibilities and mentor others."
  },
  {
    level: 3,
    title: "AI Safety Specialist",
    examFee: "£149",
    icon: GraduationCap,
    color: "purple",
    requirements: [
      "Hold Level 2 Certification",
      "Complete 5 Industry Specialization courses",
      "2,000+ verified reviews completed"
    ],
    examDetails: {
      questions: 200,
      passRate: "80%",
      duration: "3 hours"
    },
    benefits: [
      "Lead analyst teams",
      "Enterprise consulting eligibility",
      "Custom training development",
      "Speaking opportunities"
    ],
    earnings: "£100-150/hour",
    description: "Expert-level certification for those leading teams and consulting with enterprises."
  },
  {
    level: 4,
    title: "AI Safety Expert",
    examFee: "£199",
    icon: Crown,
    color: "amber",
    requirements: [
      "Hold Level 3 Certification",
      "Complete ALL 33 courses",
      "5,000+ verified reviews completed",
      "Published research or case study"
    ],
    examDetails: {
      questions: "Comprehensive + Practical Assessment",
      passRate: "80%",
      duration: "4+ hours"
    },
    benefits: [
      "Council nomination eligible",
      "Create and teach courses",
      "Revenue sharing on courses",
      "Shape CEASAI standards"
    ],
    earnings: "£150+/hour + royalties",
    description: "The highest certification level. Shape the future of AI safety as an industry leader."
  }
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left hover:bg-gray-50 px-4 -mx-4 transition-colors"
      >
        <span className="text-lg font-semibold text-gray-900 pr-4">{question}</span>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-gray-500 flex-shrink-0" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="pb-6 px-4 -mx-4">
          <p className="text-gray-600 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}

function CertificationTierCard({ tier, index }: { tier: typeof certificationTiers[0]; index: number }) {
  const IconComponent = tier.icon;

  const colorClasses = {
    green: {
      bg: "bg-green-50",
      border: "border-green-200",
      iconBg: "bg-green-100",
      iconText: "text-green-600",
      badge: "bg-green-600",
      accent: "text-green-600"
    },
    blue: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      iconBg: "bg-blue-100",
      iconText: "text-blue-600",
      badge: "bg-blue-600",
      accent: "text-blue-600"
    },
    purple: {
      bg: "bg-purple-50",
      border: "border-purple-200",
      iconBg: "bg-purple-100",
      iconText: "text-purple-600",
      badge: "bg-purple-600",
      accent: "text-purple-600"
    },
    amber: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      iconBg: "bg-amber-100",
      iconText: "text-amber-600",
      badge: "bg-amber-600",
      accent: "text-amber-600"
    }
  };

  const colors = colorClasses[tier.color as keyof typeof colorClasses];

  return (
    <Card className={`p-6 ${colors.bg} ${colors.border} border-2 relative overflow-hidden`}>
      {/* Level Badge */}
      <div className={`absolute top-0 right-0 ${colors.badge} text-white px-4 py-1 text-sm font-bold`}>
        LEVEL {tier.level}
      </div>

      {/* Header */}
      <div className="flex items-start gap-4 mb-6 mt-4">
        <div className={`w-14 h-14 ${colors.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <IconComponent className={`h-7 w-7 ${colors.iconText}`} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">CEASAI {tier.title}</h3>
          <p className="text-gray-600 text-sm mt-1">{tier.description}</p>
        </div>
      </div>

      {/* Exam Fee */}
      <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Exam Fee</span>
          <span className={`text-2xl font-bold ${colors.accent}`}>{tier.examFee}</span>
        </div>
      </div>

      {/* Requirements */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Requirements
        </h4>
        <ul className="space-y-2">
          {tier.requirements.map((req, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
              <CheckCircle className={`h-4 w-4 ${colors.iconText} flex-shrink-0 mt-0.5`} />
              <span>{req}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Exam Details */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Exam Details
        </h4>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="font-bold text-gray-900 text-sm">{tier.examDetails.questions}</div>
            <div className="text-xs text-gray-500">Questions</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="font-bold text-gray-900 text-sm">{tier.examDetails.passRate}</div>
            <div className="text-xs text-gray-500">Pass Rate</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="font-bold text-gray-900 text-sm">{tier.examDetails.duration}</div>
            <div className="text-xs text-gray-500">Duration</div>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Star className="h-4 w-4" />
          Benefits
        </h4>
        <ul className="space-y-2">
          {tier.benefits.map((benefit, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
              <BadgeCheck className={`h-4 w-4 ${colors.iconText} flex-shrink-0 mt-0.5`} />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Earnings */}
      <div className={`p-4 ${colors.iconBg} rounded-lg`}>
        <div className="flex items-center justify-between">
          <span className={`font-semibold ${colors.iconText}`}>Earning Potential</span>
          <span className={`text-xl font-bold ${colors.accent}`}>{tier.earnings}</span>
        </div>
      </div>
    </Card>
  );
}

export default function CertificationV2() {
  return (
    <div className="min-h-screen bg-white">

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-20">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2 mb-6">
              <Award className="h-4 w-4 text-green-400" />
              <span className="text-green-400 text-sm font-medium">Industry-Recognized Certification</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              CEASAI Professional Certification
            </h1>

            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Four clear certification levels from entry to expert. Earn industry-recognized credentials,
              join the global AI safety community, and unlock high-paying remote opportunities.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/training">
                <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg font-semibold">
                  Start Free Training
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a href="#certification-tiers">
                <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 px-8 py-6 text-lg font-semibold">
                  View All Levels
                </Button>
              </a>
            </div>

            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-3xl font-bold mb-1">4</div>
                <div className="text-gray-300 text-sm">Certification Levels</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-3xl font-bold mb-1">33</div>
                <div className="text-gray-300 text-sm">Training Courses</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-3xl font-bold mb-1">£45-150+</div>
                <div className="text-gray-300 text-sm">Per Hour Earnings</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-3xl font-bold mb-1">100%</div>
                <div className="text-gray-300 text-sm">Remote Work</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Certification Pathway Overview */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Clear Certification Pathway
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Progress through four levels from entry analyst to industry expert. Each level builds on the previous,
              unlocking higher earnings and greater responsibilities.
            </p>
          </div>

          {/* Visual Pathway */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-8">
            <div className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full font-medium">
              <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm">1</span>
              Analyst
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400 hidden md:block" />
            <div className="flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full font-medium">
              <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">2</span>
              Senior
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400 hidden md:block" />
            <div className="flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full font-medium">
              <span className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm">3</span>
              Specialist
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400 hidden md:block" />
            <div className="flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-2 rounded-full font-medium">
              <span className="w-6 h-6 bg-amber-600 text-white rounded-full flex items-center justify-center text-sm">4</span>
              Expert
            </div>
          </div>
        </div>
      </section>

      {/* Certification Tiers */}
      <section id="certification-tiers" className="py-20 bg-white">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Certification Levels
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose your starting point and progress through the levels as you gain experience and expertise
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {certificationTiers.map((tier, index) => (
              <CertificationTierCard key={tier.level} tier={tier} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Analyst License Section */}
      <section className="py-20 bg-gradient-to-br from-green-600 to-emerald-700 text-white">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 mb-6">
              <CreditCard className="h-4 w-4" />
              <span className="text-sm font-medium">Required for Paid Work</span>
            </div>
            <h2 className="text-4xl font-bold mb-6">
              Analyst License
            </h2>
            <p className="text-xl text-green-50 max-w-3xl mx-auto">
              Your certification proves your skills. The Analyst License gives you permission to earn.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Annual License */}
            <Card className="p-8 bg-white text-gray-900 border-4 border-green-400 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                BEST VALUE
              </div>
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">Annual License</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-bold text-green-600">£199</span>
                  <span className="text-gray-500">/year</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">Save £40 vs monthly</p>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span>Full access to paid job assignments</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span>Professional liability insurance included</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span>Priority support and escalation</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span>Automatic recertification included</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span>Public registry verified status</span>
                </li>
              </ul>
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg">
                Get Annual License
              </Button>
            </Card>

            {/* Monthly License */}
            <Card className="p-8 bg-white/95 text-gray-900">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">Monthly License</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-bold text-gray-700">£19.99</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">Flexible, cancel anytime</p>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span>Full access to paid job assignments</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span>Professional liability insurance included</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span>Priority support and escalation</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span>Automatic recertification included</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span>Public registry verified status</span>
                </li>
              </ul>
              <Button variant="outline" className="w-full border-2 border-gray-300 py-6 text-lg">
                Get Monthly License
              </Button>
            </Card>
          </div>

          {/* Important Note */}
          <Card className="p-6 bg-white/10 border-white/20 text-white">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">License is Separate from Certification</h3>
                <p className="text-green-50 leading-relaxed">
                  Certification exams are one-time fees that prove your knowledge. The Analyst License is an
                  ongoing subscription required to access paid work through CEASAI. You can get certified without
                  a license, but you need both to earn money as an analyst. This ensures all working analysts
                  maintain current credentials and have proper insurance coverage.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Why Get Certified */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Why Get CEASAI Certified?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join the global network of professionals protecting humanity from AI risks
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-6 border-2 hover:border-green-200 transition-colors">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">High Earning Potential</h3>
              <p className="text-gray-600">
                Start at £45/hour and progress to £150+/hour as you advance through certification levels.
              </p>
            </Card>

            <Card className="p-6 border-2 hover:border-green-200 transition-colors">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Industry Recognition</h3>
              <p className="text-gray-600">
                CEASAI certification is recognized globally by enterprises and governments for AI compliance.
              </p>
            </Card>

            <Card className="p-6 border-2 hover:border-green-200 transition-colors">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Global Community</h3>
              <p className="text-gray-600">
                Join thousands of analysts worldwide working together to ensure AI safety and compliance.
              </p>
            </Card>

            <Card className="p-6 border-2 hover:border-green-200 transition-colors">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Flexible Schedule</h3>
              <p className="text-gray-600">
                Work when you want, where you want. All positions are 100% remote with flexible hours.
              </p>
            </Card>

            <Card className="p-6 border-2 hover:border-green-200 transition-colors">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Award className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Career Growth</h3>
              <p className="text-gray-600">
                Clear progression path from entry analyst to expert. Unlock new opportunities at each level.
              </p>
            </Card>

            <Card className="p-6 border-2 hover:border-green-200 transition-colors">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Prerequisites</h3>
              <p className="text-gray-600">
                No coding or technical degree required. Complete free training and pass the exam to get started.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 rounded-full px-4 py-2 mb-6">
              <HelpCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Common Questions</span>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about CEASAI certification and licensing
            </p>
          </div>

          <Card className="p-8">
            <div className="divide-y divide-gray-200">
              {faqItems.map((item, index) => (
                <FAQItem key={index} question={item.question} answer={item.answer} />
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Start Your Certification Journey?
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Begin with free training, earn your Level 1 certification, and unlock a rewarding career in AI safety.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/training">
              <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg font-semibold">
                Start Free Training
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/certification">
              <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 px-8 py-6 text-lg font-semibold">
                Take Level 1 Exam (£49)
              </Button>
            </Link>
          </div>

          <p className="mt-8 text-gray-400 text-sm">
            Free training courses available. No credit card required to start.
          </p>
        </div>
      </section>

    </div>
  );
}
