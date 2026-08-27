import {useState, useEffect } from "react";
import { ChevronDown, BookOpen, CheckCircle, Users, Zap, Award, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
const TRAINING_HOWTO_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to train and certify as a CSOAI AI Safety Analyst",
  description: "A typical 8-week study timeline to become a certified AI Safety Analyst, from free Watchdog training through to the certification exam.",
  step: [
    { "@type": "HowToStep", position: 1, name: "Week 1 — Watchdog Training", text: "Complete free Watchdog modules (4 hours). Understand AI safety basics and incident identification." },
    { "@type": "HowToStep", position: 2, name: "Week 2-3 — Fundamentals Module 1", text: "Study EU AI Act and NIST AI RMF basics. Complete quizzes and case studies." },
    { "@type": "HowToStep", position: 3, name: "Week 4-5 — Fundamentals Module 2", text: "Learn TC260, compliance principles, and review case studies." },
    { "@type": "HowToStep", position: 4, name: "Week 6-7 — Practice & Review", text: "Take unlimited practice exams, review weak areas, and prepare for the real exam." },
    { "@type": "HowToStep", position: 5, name: "Week 8 — Take Certification Exam", text: "Schedule and take your 90-minute proctored exam. Get results instantly." },
  ],
};

const TRAINING_BREADCRUMB_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://csoai.org/" },
    { "@type": "ListItem", position: 2, name: "How It Works", item: "https://csoai.org/how-it-works" },
    { "@type": "ListItem", position: 3, name: "Training", item: "https://csoai.org/how-it-works/training" },
  ],
};

export default function TrainingHowItWorks() {
  useEffect(() => { document.title = "CSOAI Training Guide — Certify in 8 Weeks"; }, []);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const trainingLevels = [
    {
      level: "Watchdog Training (Free)",
      duration: "4 hours",
      description: "Foundation in AI safety and incident identification",
      modules: [
        "Introduction to AI Safety",
        "Identifying AI Incidents",
        "Severity Assessment Framework",
        "Evidence Collection & Reporting"
      ],
      price: "Free"
    },
    {
      level: "Measurement Credential Fundamentals",
      duration: "6-8 weeks",
      description: "Entry-level programme covering core frameworks",
      modules: [
        "EU AI Act Fundamentals",
        "NIST AI RMF Basics",
        "TC260 Overview",
        "Compliance Principles",
        "Case Studies & Practice Exams"
      ],
      price: "Free"
    },
    {
      level: "Measurement Credential Professional",
      duration: "10-12 weeks",
      description: "Advanced programme for experienced analysts",
      modules: [
        "Deep Dive: EU AI Act",
        "NIST AI RMF Implementation",
        "TC260 Advanced Topics",
        "UK AI Bill & Canada AI Act",
        "Complex Case Studies",
        "Advanced Assessment Techniques"
      ],
      price: "Free"
    },
    {
      level: "Measurement Credential Expert",
      duration: "14-16 weeks",
      description: "Master-level programme for senior analysts",
      modules: [
        "All Previous Modules",
        "Australia AI Governance",
        "ISO 42001 Mastery",
        "SOAI-PDCA Methodology",
        "Council Decision Making",
        "Enterprise Compliance Strategy",
        "Capstone Project"
      ],
      price: "Free"
    }
  ];

  const learningMethodology = [
    {
      title: "Self-Paced Learning",
      description: "Study at your own speed, access materials 24/7, take breaks whenever needed",
      icon: Clock
    },
    {
      title: "Interactive Content",
      description: "Videos, quizzes, case studies, and hands-on exercises to reinforce learning",
      icon: Zap
    },
    {
      title: "Real-World Case Studies",
      description: "Learn from actual AI incidents and how they were assessed and resolved",
      icon: Users
    },
    {
      title: "Expert Instructors",
      description: "Taught by AI safety researchers, compliance experts, and industry veterans",
      icon: Award
    },
    {
      title: "Practice Exams",
      description: "Take unlimited practice exams to prepare for the real certification exam",
      icon: CheckCircle
    },
    {
      title: "Community Support",
      description: "Join study groups, ask questions in forums, and learn from peers",
      icon: Users
    }
  ];

  const examStructure = [
    {
      aspect: "Format",
      details: "50 multiple-choice questions"
    },
    {
      aspect: "Duration",
      details: "90 minutes"
    },
    {
      aspect: "Passing Score",
      details: "70% (35 out of 50 questions)"
    },
    {
      aspect: "Retakes",
      details: "Unlimited retakes, wait 7 days between attempts"
    },
    {
      aspect: "Results",
      details: "Instant results, detailed feedback on weak areas"
    },
    {
      aspect: "Validity",
      details: "Certificate valid for 2 years, renewal available"
    }
  ];

  const faqs = [
    {
      question: "Do I need any prerequisites to start training?",
      answer: "No prerequisites required! Our Watchdog training starts from the basics. We only assume you have critical thinking skills and interest in AI safety. No technical background needed."
    },
    {
      question: "Can I study part-time while working?",
      answer: "Absolutely! Our training is completely self-paced. Most students study 1-2 hours per day and complete modules over several weeks. You control the schedule."
    },
    {
      question: "What if I fail the assessment?",
      answer: "You can retake it as many times as you need, at no cost. We provide detailed feedback showing which topics to review."
    },
    {
      question: "How long is the credential valid?",
      answer: "Measurement credentials are valid for 2 years. You can renew by taking a 30-minute renewal assessment or by completing continuing education credits. A credential records completed training — it is not a certification and it attests nothing about a system's conformity."
    },
    {
      question: "Can I move from Fundamentals to Professional?",
      answer: "Yes, at any time. Every programme is free, so there is nothing to pay when you move up."
    },
    {
      question: "What does it cost?",
      answer: "Nothing. The programmes, the assessments and the retakes are free, and stay free."
    },
    {
      question: "Can I download the training materials?",
      answer: "Yes! You can download PDFs, videos, and study guides for offline access. This helps you study anywhere, even without internet."
    },
    {
      question: "What frameworks does the training cover?",
      answer: "We cover EU AI Act, NIST AI RMF, TC260, UK AI Bill, Canada AI Act, Australia AI Governance, and ISO 42001. Each framework gets deeper coverage at higher certification levels."
    }
  ];

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      {/* Header */}
      <div className="bg-emerald-600 text-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Training Guide</h1>
          <p className="text-xl text-emerald-100">
            Master AI safety through our comprehensive, self-paced training program designed for everyone
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Training Levels */}
        <div className="mb-20">
          <h2 className="text-4xl font-bold mb-12 text-center">Training Levels</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {trainingLevels.map((level, idx) => (
              <Card key={idx} className="p-8 border-2 border-emerald-200 hover:border-emerald-600 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-emerald-900 mb-2">{level.level}</h3>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{level.duration}</span>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-emerald-600">{level.price}</div>
                </div>
                <p className="text-gray-700 mb-4">{level.description}</p>
                <div className="space-y-2">
                  <p className="font-semibold text-emerald-900">Modules:</p>
                  {level.modules.map((module, i) => (
                    <div key={i} className="flex items-center gap-2 text-gray-700">
                      <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      {module}
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Learning Methodology */}
        <div className="mb-20">
          <h2 className="text-4xl font-bold mb-12 text-center">How We Teach</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {learningMethodology.map((method, idx) => {
              const Icon = method.icon;
              return (
                <Card key={idx} className="p-8 border-2 border-emerald-200">
                  <Icon className="w-12 h-12 text-emerald-600 mb-4" />
                  <h3 className="text-xl font-bold text-emerald-900 mb-3">{method.title}</h3>
                  <p className="text-gray-700">{method.description}</p>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Exam Structure */}
        <div className="mb-20 bg-emerald-50 p-12 rounded-lg border-2 border-emerald-200">
          <h2 className="text-3xl font-bold mb-8 text-center">Certification Exam Structure</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {examStructure.map((item, idx) => (
              <div key={idx} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                  ✓
                </div>
                <div>
                  <h4 className="font-bold text-emerald-900 mb-1">{item.aspect}</h4>
                  <p className="text-gray-700">{item.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Study Timeline */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold mb-8 text-center">Typical Study Timeline</h2>
          <div className="space-y-6">
            <Card className="p-6 border-2 border-emerald-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold flex-shrink-0">Week 1</div>
                <div>
                  <h4 className="font-bold text-emerald-900 mb-1">Watchdog Training</h4>
                  <p className="text-gray-700">Complete free Watchdog modules (4 hours). Understand AI safety basics and incident identification.</p>
                </div>
              </div>
            </Card>
            <Card className="p-6 border-2 border-emerald-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold flex-shrink-0">Week 2-3</div>
                <div>
                  <h4 className="font-bold text-emerald-900 mb-1">Fundamentals Module 1</h4>
                  <p className="text-gray-700">Study EU AI Act and NIST AI RMF basics. Complete quizzes and case studies.</p>
                </div>
              </div>
            </Card>
            <Card className="p-6 border-2 border-emerald-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold flex-shrink-0">Week 4-5</div>
                <div>
                  <h4 className="font-bold text-emerald-900 mb-1">Fundamentals Module 2</h4>
                  <p className="text-gray-700">Learn TC260, compliance principles, and review case studies.</p>
                </div>
              </div>
            </Card>
            <Card className="p-6 border-2 border-emerald-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold flex-shrink-0">Week 6-7</div>
                <div>
                  <h4 className="font-bold text-emerald-900 mb-1">Practice & Review</h4>
                  <p className="text-gray-700">Take unlimited practice exams, review weak areas, and prepare for the real exam.</p>
                </div>
              </div>
            </Card>
            <Card className="p-6 border-2 border-emerald-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold flex-shrink-0">Week 8</div>
                <div>
                  <h4 className="font-bold text-emerald-900 mb-1">Take Certification Exam</h4>
                  <p className="text-gray-700">Schedule and take your 90-minute proctored exam. Get results instantly.</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold mb-12 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <Card key={idx} className="border-2 border-emerald-200 overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className="w-full p-6 flex items-center justify-between hover:bg-emerald-50 transition-colors"
                >
                  <h3 className="text-lg font-bold text-emerald-900 text-left">{faq.question}</h3>
                  <ChevronDown
                    className={`w-5 h-5 text-emerald-600 transition-transform flex-shrink-0 ${
                      expandedFaq === idx ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {expandedFaq === idx && (
                  <div className="px-6 pb-6 border-t border-emerald-200 bg-emerald-50">
                    <p className="text-gray-700">{faq.answer}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-12 rounded-lg text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Training?</h2>
          <p className="text-lg mb-8 text-emerald-100">
            Begin with free Watchdog training today. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-emerald-600 hover:bg-emerald-50 font-bold"
              onClick={() => window.location.href = "/training"}
            >
              Start Free Training
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-emerald-700 font-bold"
              onClick={() => window.location.href = "/dashboard"}
            >
              View Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
