/**
 * Council Academy Page - Course Levels & Training Progression
 * Course completion attests training completion, not conformity.
 * Council of AI measures; it does not certify or issue conformity marks.
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
  HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// FAQ Data
const faqItems = [
  {
    question: "What does a completion record attest?",
    answer: "A completion record is a signed record that you completed a Council Academy course and its assessment. It attests training completion — nothing about any AI system's compliance or conformity. Council of AI measures; it does not certify or issue conformity marks."
  },
  {
    question: "Is the training free?",
    answer: "Yes. You can complete every Council Academy course and assessment without any payment. Many people work through the free Foundation courses first, then progress to higher course levels as they build their measured track record. Your signed completion record remains verifiable at any time."
  },
  {
    question: "How long does a course take?",
    answer: "Level 1 typically takes 2-4 weeks if you study part-time, completing the free Foundation courses and passing the 100-question assessment. Higher levels require more time due to review count requirements and additional coursework. Level 2 typically takes 3-6 months, Level 3 takes 6-12 months, and Level 4 can take 1-2+ years depending on your pace."
  },
  {
    question: "What if I don't pass the assessment?",
    answer: "You can retake any assessment after a 24-hour waiting period. There's no limit to retake attempts. We recommend reviewing the training materials and focusing on areas where you struggled before retaking."
  },
  {
    question: "Do completion records expire?",
    answer: "Completion records are valid for 1 year from the date of the measured assessment. To keep your record current, you retake the assessment to refresh it."
  },
  {
    question: "Can I skip levels?",
    answer: "No, course levels must be completed in order. Each level builds on the knowledge and experience from the previous level. You must complete Level 1 before attempting Level 2, and so on."
  }
];

// Certification tier data
const certificationTiers = [
  {
    level: 1,
    title: "AI Safety Analyst",
    examFee: "—",
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
      "Signed measurement record",
      "LinkedIn digital badge",
      "Public registry listing",
      "Access to entry-level reviews"
    ],
    earnings: "—",
    description: "Entry-level course for aspiring AI Safety Analysts. Perfect starting point for your training."
  },
  {
    level: 2,
    title: "Senior AI Safety Analyst",
    examFee: "—",
    icon: Briefcase,
    color: "blue",
    requirements: [
      "Complete Level 1 course",
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
    earnings: "—",
    description: "A course for experienced analysts ready to take on senior responsibilities and mentor others."
  },
  {
    level: 3,
    title: "AI Safety Specialist",
    examFee: "—",
    icon: GraduationCap,
    color: "purple",
    requirements: [
      "Complete Level 2 course",
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
    earnings: "—",
    description: "Expert-level course for those leading teams and consulting with enterprises."
  },
  {
    level: 4,
    title: "AI Safety Expert",
    examFee: "—",
    icon: Crown,
    color: "amber",
    requirements: [
      "Complete Level 3 course",
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
      "Shape measurement credential standards"
    ],
    earnings: "—",
    description: "The highest course level. Shape the future of AI safety as an industry leader."
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
          <h3 className="text-xl font-bold text-gray-900">Council Academy — {tier.title}</h3>
          <p className="text-gray-600 text-sm mt-1">{tier.description}</p>
        </div>
      </div>

      {/* Course Access */}
      <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Course Access</span>
          <span className={`text-2xl font-bold ${colors.accent}`}>Free</span>
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
              <span className="text-green-400 text-sm font-medium">Signed, Verifiable Measurement Records</span>
            </div>

            <h1 className="text-4xl md:text-4xl lg:text-5xl font-bold mb-6">
              Council Academy
            </h1>

            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Four course levels from entry to expert. Earn signed, verifiable completion records
              of measured performance and join the global AI safety measurement community.
            </p>
            <p className="text-sm text-gray-400 mb-8 max-w-3xl mx-auto">
              Course completion attests training completion, not conformity. Council of AI
              measures; it does not certify or issue conformity marks.
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
                <div className="text-gray-300 text-sm">Course Levels</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-3xl font-bold mb-1">33</div>
                <div className="text-gray-300 text-sm">Training Courses</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-3xl font-bold mb-1">Signed</div>
                <div className="text-gray-300 text-sm">Verifiable Records</div>
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
              Clear Council Academy Pathway
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Progress through four course levels from entry analyst to expert. Each level builds on the previous,
              extending your measured track record and assessment scope.
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
              Course Levels
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

      {/* Keeping Your Completion Record Current */}
      <section className="py-20 bg-gradient-to-br from-green-600 to-emerald-700 text-white">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 mb-6">
              <BadgeCheck className="h-4 w-4" />
              <span className="text-sm font-medium">Free · Signed · Publicly Verifiable</span>
            </div>
            <h2 className="text-4xl font-bold mb-6">
              Your Completion Record
            </h2>
            <p className="text-xl text-green-50 max-w-3xl mx-auto">
              Every Council Academy course and assessment is free. Passing produces a signed
              completion record of your measured performance.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card className="p-8 bg-white text-gray-900">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Free to Learn</h3>
              <p className="text-gray-600">
                Work through every course and assessment at no cost. No payment, no plan, no tiers.
              </p>
            </Card>
            <Card className="p-8 bg-white text-gray-900">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Signed Record</h3>
              <p className="text-gray-600">
                Passing an assessment produces a signed completion record anyone can verify.
              </p>
            </Card>
            <Card className="p-8 bg-white text-gray-900">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Keep It Current</h3>
              <p className="text-gray-600">
                Records are valid for one year. Retake the assessment any time to refresh yours.
              </p>
            </Card>
          </div>

          {/* Important Note */}
          <Card className="p-6 bg-white/10 border-white/20 text-white">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">A Completion Record Is Not a Conformity Mark</h3>
                <p className="text-green-50 leading-relaxed">
                  Assessments produce a signed record that a person completed Council Academy training.
                  It attests training completion — nothing about any AI system's compliance or conformity.
                  Council of AI measures; it does not certify or issue conformity marks.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Why a Measurement Credential */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Why a Completion Record?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A verified completion record shows what was measured, by whom, and when — evidence anyone can check
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-6 border-2 hover:border-green-200 transition-colors">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Measured Career Signal</h3>
              <p className="text-gray-600">
                Signed records show exactly what was measured, at what level, and when — evidence anyone can verify.
              </p>
            </Card>

            <Card className="p-6 border-2 hover:border-green-200 transition-colors">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Verifiable by Design</h3>
              <p className="text-gray-600">
                Every record is signed and publicly verifiable — no trust required, check it yourself.
              </p>
            </Card>

            <Card className="p-6 border-2 hover:border-green-200 transition-colors">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Global Community</h3>
              <p className="text-gray-600">
                Join a growing global network of analysts working on AI safety measurement.
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
              Everything you need to know about Council Academy courses and completion records
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
            Ready to Start Your Council Academy Journey?
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Begin with free training, complete your Level 1 measured assessment, and build a verifiable track record in AI safety.
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
                Take Level 1 Assessment
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
