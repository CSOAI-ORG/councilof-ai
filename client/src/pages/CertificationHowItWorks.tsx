import {useState, useEffect } from "react";
import { ChevronDown, Trophy, CheckCircle, Users, Zap, TrendingUp, Award } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
const CERT_HOWTO_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to complete a Council Academy course as an AI Safety Analyst",
  description: "The Council Academy process from enrollment to completion: enroll, study, schedule, take the assessment, and get your completion record.",
  step: [
    { "@type": "HowToStep", position: 1, name: "Enroll", text: "Choose your course level and start free with Watchdog training." },
    { "@type": "HowToStep", position: 2, name: "Study", text: "Work through modules at your own pace, complete quizzes and case studies." },
    { "@type": "HowToStep", position: 3, name: "Schedule", text: "Choose your assessment date and time (24/7 availability)." },
    { "@type": "HowToStep", position: 4, name: "Take Assessment", text: "Complete 50 questions in 90 minutes with proctored supervision." },
    { "@type": "HowToStep", position: 5, name: "Get Results", text: "Receive instant pass/fail notification with detailed feedback." },
    { "@type": "HowToStep", position: 6, name: "Get Your Record", text: "Earn a signed completion record and access the analyst job board." },
  ],
};

const CERT_BREADCRUMB_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://csoai.org/" },
    { "@type": "ListItem", position: 2, name: "How It Works", item: "https://csoai.org/how-it-works" },
    { "@type": "ListItem", position: 3, name: "Council Academy", item: "https://csoai.org/how-it-works/certification" },
  ],
};

export default function CertificationHowItWorks() {
  useEffect(() => { document.title = "Council Academy Guide — Course & Assessment Process"; }, []);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const certificationPathway = [
    {
      level: "Watchdog Analyst",
      requirement: "Complete free Watchdog training",
      benefits: "Access to job board, entry-level positions",
      duration: "4 hours"
    },
    {
      level: "Council Academy — Fundamentals",
      requirement: "Pass 50-question assessment (70% pass rate)",
      benefits: "Job board positions, foundational review work",
      duration: "6-8 weeks study + 90 min assessment"
    },
    {
      level: "Council Academy — Professional",
      requirement: "Pass advanced assessment covering all frameworks",
      benefits: "Job board positions, complex review projects",
      duration: "10-12 weeks study + 90 min assessment"
    },
    {
      level: "Council Academy — Expert",
      requirement: "Pass master-level assessment + capstone project",
      benefits: "Enterprise contracts, consulting",
      duration: "14-16 weeks study + 90 min assessment + capstone"
    }
  ];

  const examProcess = [
    {
      step: "1. Enroll",
      description: "Choose your course level and start free with Watchdog training",
      action: "Get instant access to all training materials"
    },
    {
      step: "2. Study",
      description: "Work through modules at your own pace, complete quizzes and case studies",
      action: "Take unlimited practice assessments to prepare"
    },
    {
      step: "3. Schedule",
      description: "Choose your assessment date and time (24/7 availability)",
      action: "We'll send you proctoring instructions via email"
    },
    {
      step: "4. Take Assessment",
      description: "Complete 50 questions in 90 minutes with proctored supervision",
      action: "Answer questions covering all frameworks and real-world scenarios"
    },
    {
      step: "5. Get Results",
      description: "Receive instant pass/fail notification with detailed feedback",
      action: "If you pass, your completion record is issued immediately"
    },
    {
      step: "6. Get Your Record",
      description: "Earn your signed completion record and access the analyst job board",
      action: "Apply for projects and start working within 24 hours"
    }
  ];

  const renewalProcess = [
    {
      option: "Refresh Assessment",
      description: "Take a 30-minute refresh assessment covering updates and new frameworks",
      cost: "Free",
      time: "30 minutes"
    },
    {
      option: "Continuing Education",
      description: "Complete 10 hours of approved continuing education courses",
      cost: "Free",
      time: "10 hours"
    },
    {
      option: "Hybrid Approach",
      description: "Combine 5 hours of continuing education + 15-minute mini assessment",
      cost: "Free",
      time: "5 hours + 15 min"
    }
  ];

  const faqs = [
    {
      question: "How long is a completion record valid?",
      answer: "Completion records are valid for 2 years from the date you pass the assessment. You'll receive refresh reminders 90 days before expiration. You can refresh anytime after 18 months."
    },
    {
      question: "What's the difference between the course levels?",
      answer: "Fundamentals covers basics of all frameworks. Professional goes deeper into each framework and adds UK AI Bill and Canada AI Act. Expert covers everything plus Australia AI Governance, ISO 42001, and SOAI-PDCA methodology."
    },
    {
      question: "Can I take the assessment multiple times?",
      answer: "Yes! You can retake the assessment as many times as needed. There's a 7-day waiting period between attempts. Retakes are free. Most students pass on their first or second attempt."
    },
    {
      question: "Is the assessment proctored?",
      answer: "Yes, all assessments are proctored via video to ensure integrity. You'll use your webcam and screen sharing. Make sure you have a quiet space and stable internet connection."
    },
    {
      question: "What if I don't pass the assessment?",
      answer: "No problem! You get detailed feedback showing which topics to review. You can retake after 7 days. We offer free review sessions and study groups to help you prepare for your next attempt."
    },
    {
      question: "Can I move up a course level?",
      answer: "Yes! You can progress at any time. Every course level is free, and your study time carries over. Complete each level in order to unlock the next."
    },
    {
      question: "Do I need to refresh my completion record?",
      answer: "Completion records expire after 2 years. Refreshing is simple and free: take a 30-minute refresh assessment, complete continuing education, or use a hybrid approach. Most people refresh in 30 minutes."
    },
    {
      question: "What does a completion record mean internationally?",
      answer: "A completion record attests that you completed Council Academy training measured against frameworks covering the EU, US, China, UK, Canada, and Australia. It is a record of your training — not a conformity mark and not proof any AI system complies with a regulation. Council of AI measures; it does not certify or issue conformity marks."
    },
    {
      question: "What happens if I don't refresh?",
      answer: "Your completion record becomes inactive. You can't access the premium job board or take on analyst work that requires a current record. You can reactivate by refreshing anytime. If it's been more than 2 years, you may need to retake the full assessment."
    },
    {
      question: "Is there a guarantee I'll pass?",
      answer: "We're confident in our training! If you don't pass on your first attempt, we offer free tutoring and a second assessment attempt at no cost. Most students pass on their second try."
    }
  ];

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      {/* Header */}
      <div className="bg-emerald-600 text-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Council Academy Guide</h1>
          <p className="text-xl text-emerald-100">
            Understand the course pathway, assessment process, and how to advance your career as an AI Safety Analyst
          </p>
          <p className="mt-4 text-sm text-emerald-100/80 max-w-3xl">
            Course completion attests training completion, not conformity. Council of AI
            measures; it does not certify or issue conformity marks.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Certification Pathway */}
        <div className="mb-20">
          <h2 className="text-4xl font-bold mb-12 text-center">Council Academy Pathway</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {certificationPathway.map((cert, idx) => (
              <Card key={idx} className="p-8 border-2 border-emerald-200 hover:border-emerald-600 transition-colors">
                <div className="flex items-start gap-4 mb-4">
                  <Trophy className="w-8 h-8 text-emerald-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-emerald-900 mb-2">{cert.level}</h3>
                    <p className="text-sm text-gray-600 bg-emerald-50 p-2 rounded mb-3">⏱️ {cert.duration}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Requirement:</p>
                    <p className="text-gray-700">{cert.requirement}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Benefits:</p>
                    <p className="text-gray-700">{cert.benefits}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Exam Process */}
        <div className="mb-20">
          <h2 className="text-4xl font-bold mb-12 text-center">The Assessment Process</h2>
          <div className="space-y-6">
            {examProcess.map((item, idx) => (
              <Card key={idx} className="p-6 border-2 border-emerald-200">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-emerald-900 mb-2">{item.step}</h4>
                    <p className="text-gray-700 mb-2">{item.description}</p>
                    <p className="text-sm text-emerald-700 bg-emerald-50 p-2 rounded">💡 {item.action}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Exam Details */}
        <div className="mb-20 bg-emerald-50 p-12 rounded-lg border-2 border-emerald-200">
          <h2 className="text-3xl font-bold mb-8 text-center">Assessment Specifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold text-emerald-900 mb-4">Format</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>50 questions</strong> - Multiple choice format</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>90 minutes</strong> - Total assessment duration</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>70% pass rate</strong> - Need 35/50 correct</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Proctored</strong> - Video supervision required</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold text-emerald-900 mb-4">Content Coverage</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>EU AI Act</strong> - 20% of questions</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>NIST AI RMF</strong> - 20% of questions</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Other Frameworks</strong> - 30% of questions</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Case Studies</strong> - 30% of questions</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Renewal Options */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold mb-12 text-center">Completion Record Refresh Options</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {renewalProcess.map((option, idx) => (
              <Card key={idx} className="p-8 border-2 border-emerald-200 hover:border-emerald-600 transition-colors">
                <Award className="w-12 h-12 text-emerald-600 mb-4" />
                <h3 className="text-xl font-bold text-emerald-900 mb-4">{option.option}</h3>
                <p className="text-gray-700 mb-6">{option.description}</p>
                <div className="space-y-2 border-t border-emerald-200 pt-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cost:</span>
                    <span className="font-bold text-emerald-600">{option.cost}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time:</span>
                    <span className="font-bold text-emerald-600">{option.time}</span>
                  </div>
                </div>
              </Card>
            ))}
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
          <h2 className="text-3xl font-bold mb-4">Ready to Start the Course?</h2>
          <p className="text-lg mb-8 text-emerald-100">
            Start with free training and work toward your completion record
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-emerald-600 hover:bg-emerald-50 font-bold"
              onClick={() => window.location.href = "/certification"}
            >
              View Council Academy
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-emerald-700 font-bold"
              onClick={() => window.location.href = "/training"}
            >
              Start Training
            </Button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
