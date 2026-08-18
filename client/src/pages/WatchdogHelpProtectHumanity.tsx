import {useState, useEffect } from "react";
import { ChevronDown, Shield, Users, TrendingUp, BookOpen, AlertCircle, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function WatchdogHelpProtectHumanity() {
  useEffect(() => { document.title = "WatchdogHelpProtectHumanity | CSOAI"; }, []);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const whyMattersSections = [
    {
      title: "AI is Everywhere",
      description: "AI systems make decisions affecting healthcare, finance, hiring, criminal justice, and more. Without human oversight, these systems can cause real harm.",
      icon: AlertCircle
    },
    {
      title: "Humans Must Decide",
      description: "AI can't judge ethics, fairness, or safety. Only humans can. Watchdog Analysts provide the critical human judgment that keeps AI safe.",
      icon: Users
    },
    {
      title: "Global Impact",
      description: "Your work as a Watchdog Analyst protects people worldwide. Every incident you identify, every assessment you make, prevents potential harm.",
      icon: Shield
    }
  ];

  const getInvolvedSteps = [
    {
      step: "1. Take Free Training",
      description: "Complete our 4-hour Watchdog training module covering incident identification, severity assessment, and reporting",
      time: "4 hours",
      cost: "Free"
    },
    {
      step: "2. Learn the Framework",
      description: "Understand how CSOAI's Council works and how your assessments contribute to global AI safety",
      time: "2 hours",
      cost: "Free"
    },
    {
      step: "3. Get Your Credential",
      description: "Pass the measurement credential assessment to become an official Watchdog Analyst",
      time: "6-8 weeks",
      cost: "Free"
    },
    {
      step: "4. Start Reporting",
      description: "Use the incident reporting system to flag AI safety concerns and contribute to public oversight",
      time: "Ongoing",
      cost: "Free"
    },
    {
      step: "5. Take On Cases",
      description: "Take on AI safety monitoring and compliance assessment work as a certified analyst",
      time: "Flexible",
      cost: "Remote"
    }
  ];

  const trainingCourses = [
    {
      title: "Free Watchdog Training",
      description: "Foundation in AI safety and incident identification",
      modules: [
        "Introduction to AI Safety",
        "Identifying AI Incidents",
        "Severity Assessment Framework",
        "Evidence Collection & Reporting"
      ],
      duration: "4 hours",
      price: "Free"
    },
    {
      title: "Measurement Credential Fundamentals",
      description: "Professional certification covering core compliance frameworks",
      modules: [
        "EU AI Act Fundamentals",
        "NIST AI RMF Basics",
        "TC260 Overview",
        "Compliance Principles",
        "Case Studies & Practice Exams"
      ],
      duration: "6-8 weeks",
      price: "Free"
    },
    {
      title: "Measurement Credential Professional",
      description: "Advanced certification for experienced analysts",
      modules: [
        "Deep Dive: All Frameworks",
        "Complex Case Studies",
        "Advanced Assessment Techniques",
        "Enterprise Compliance",
        "Capstone Project"
      ],
      duration: "10-12 weeks",
      price: "Free"
    }
  ];

  const reportingProcess = [
    {
      step: "Identify",
      description: "Notice an AI system behaving unsafely or unfairly"
    },
    {
      step: "Document",
      description: "Gather evidence: screenshots, logs, context, impact"
    },
    {
      step: "Report",
      description: "Submit incident through CSOAI's secure reporting system"
    },
    {
      step: "Review",
      description: "Council reviews your report and makes recommendations"
    },
    {
      step: "Public",
      description: "Decision and analysis published for full transparency"
    }
  ];

  const faqs = [
    {
      question: "What exactly is a Watchdog Analyst?",
      answer: "A Watchdog Analyst is a trained professional who evaluates AI systems for safety, fairness, and compliance with regulatory frameworks. You review AI decisions, assess risks, and contribute to public oversight of AI development."
    },
    {
      question: "Do I need technical skills to be a Watchdog Analyst?",
      answer: "No! You need critical thinking and attention to detail, not coding skills. Our training teaches you everything. We've trained accountants, teachers, lawyers, and people from all backgrounds."
    },
    {
      question: "How do I report an AI incident?",
      answer: "Log into your CSOAI dashboard, go to 'Report Incident', and fill out the form with details about the AI system, what happened, and the impact. You can remain anonymous if you prefer."
    },
    {
      question: "What happens after I report?",
      answer: "Your report goes to the Council for review. They analyze it using their 33-Agent Council methodology. The decision and full analysis are published publicly within 5 business days."
    },
    {
      question: "Can I report incidents anonymously?",
      answer: "Yes! You can submit anonymous reports. We protect whistleblowers and have strict confidentiality policies. Your identity is never disclosed without your permission."
    },
    {
      question: "What types of AI incidents should I report?",
      answer: "Report any AI system that: discriminates unfairly, makes incorrect decisions, violates privacy, lacks transparency, operates outside its intended use, or violates regulatory frameworks like EU AI Act or NIST RMF."
    },
    {
      question: "What does a Watchdog Analyst do?",
      answer: "Watchdog Analysts review AI systems and report incidents for compliance with frameworks like the EU AI Act and NIST RMF. Most work is remote and flexible — you choose your hours."
    },
    {
      question: "Is this a full-time job or part-time?",
      answer: "Completely flexible! You choose your hours. Some analysts work 10 hours/week, others 40+. Many combine it with other work. You control your schedule."
    },
    {
      question: "How do I know my work matters?",
      answer: "Every incident you report is published publicly. You can see the Council's analysis and recommendations. You're directly contributing to global AI safety and transparency."
    },
    {
      question: "What if I disagree with the Council's decision?",
      answer: "You can submit feedback and additional evidence. The Council reviews all feedback. We also publish minority opinions and dissents, so your perspective is heard even if the Council disagrees."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      {/* Header */}
      <div className="bg-emerald-600 text-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-5xl font-bold mb-4">Help Protect Humanity from AI</h1>
          <p className="text-xl text-emerald-100">
            Become a Watchdog Analyst and help ensure AI systems are safe, fair, and compliant
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Why This Matters */}
        <div className="mb-20">
          <h2 className="text-4xl font-bold mb-12 text-center">Why This Matters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {whyMattersSections.map((section, idx) => {
              const Icon = section.icon;
              return (
                <Card key={idx} className="p-8 border-2 border-emerald-200">
                  <Icon className="w-12 h-12 text-emerald-600 mb-4" />
                  <h3 className="text-xl font-bold text-emerald-900 mb-3">{section.title}</h3>
                  <p className="text-gray-700">{section.description}</p>
                </Card>
              );
            })}
          </div>
        </div>

        {/* How to Get Involved */}
        <div className="mb-20">
          <h2 className="text-4xl font-bold mb-12 text-center">How to Get Involved</h2>
          <div className="space-y-6">
            {getInvolvedSteps.map((item, idx) => (
              <Card key={idx} className="p-8 border-2 border-emerald-200 hover:border-emerald-600 transition-colors">
                <div className="flex items-start gap-6">
                  <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-emerald-900 mb-2">{item.step}</h3>
                    <p className="text-gray-700 mb-4">{item.description}</p>
                    <div className="flex flex-wrap gap-6 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <span className="font-semibold">⏱️ {item.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-emerald-600 font-semibold">
                        💰 {item.cost}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Training Courses */}
        <div className="mb-20">
          <h2 className="text-4xl font-bold mb-12 text-center">Free Training Courses</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {trainingCourses.map((course, idx) => (
              <Card key={idx} className="p-8 border-2 border-emerald-200 hover:border-emerald-600 transition-colors">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-emerald-900 mb-2">{course.title}</h3>
                  <p className="text-gray-700 mb-4">{course.description}</p>
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-emerald-200">
                    <span className="text-sm text-gray-600">⏱️ {course.duration}</span>
                    <span className="text-lg font-bold text-emerald-600">{course.price}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  {course.modules.map((module, i) => (
                    <div key={i} className="flex items-start gap-2 text-gray-700">
                      <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{module}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Reporting Process */}
        <div className="mb-20 bg-emerald-50 p-12 rounded-lg border-2 border-emerald-200">
          <h2 className="text-3xl font-bold mb-8 text-center">How Incident Reporting Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {reportingProcess.map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold mx-auto mb-4">
                  {idx + 1}
                </div>
                <h4 className="font-bold text-emerald-900 mb-2">{item.step}</h4>
                <p className="text-sm text-gray-700">{item.description}</p>
                {idx < reportingProcess.length - 1 && (
                  <div className="hidden md:block absolute right-0 top-1/2 transform -translate-y-1/2">→</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* What You'll Be Doing */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold mb-8 text-center">What You'll Be Doing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="p-8 border-2 border-emerald-200">
              <Shield className="w-12 h-12 text-emerald-600 mb-4" />
              <h3 className="text-xl font-bold text-emerald-900 mb-3">Compliance Reviews</h3>
              <p className="text-gray-700 mb-4">Evaluate AI systems for compliance with EU AI Act, NIST RMF, TC260, and other frameworks. Identify gaps and recommend improvements.</p>
            </Card>
            <Card className="p-8 border-2 border-emerald-200">
              <AlertCircle className="w-12 h-12 text-emerald-600 mb-4" />
              <h3 className="text-xl font-bold text-emerald-900 mb-3">Incident Investigation</h3>
              <p className="text-gray-700 mb-4">Investigate reported AI incidents, gather evidence, assess severity, and document findings for the Council.</p>
            </Card>
            <Card className="p-8 border-2 border-emerald-200">
              <BookOpen className="w-12 h-12 text-emerald-600 mb-4" />
              <h3 className="text-xl font-bold text-emerald-900 mb-3">Documentation</h3>
              <p className="text-gray-700 mb-4">Write clear, detailed reports and assessments that will be published publicly for full transparency.</p>
            </Card>
            <Card className="p-8 border-2 border-emerald-200">
              <Users className="w-12 h-12 text-emerald-600 mb-4" />
              <h3 className="text-xl font-bold text-emerald-900 mb-3">Community Engagement</h3>
              <p className="text-gray-700 mb-4">Participate in forums, help train new analysts, and contribute to the global AI safety community.</p>
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
          <h2 className="text-3xl font-bold mb-4">Ready to Protect Humanity from AI?</h2>
          <p className="text-lg mb-8 text-emerald-100">
            Start with free training today. No experience necessary. Help keep AI safe.
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
  );
}
