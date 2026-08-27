import {useState, useEffect } from "react";
import { ChevronDown, BarChart3, Users, FileText, Settings, Zap, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
const DASHBOARD_HOWTO_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to use the CSOAI dashboard",
  description: "Navigate the CSOAI dashboard step by step: log in, check your overview, start training, prepare for your exam, browse jobs, then apply and earn.",
  step: [
    { "@type": "HowToStep", position: 1, name: "Log In", text: "Access your dashboard using your email or OAuth credentials." },
    { "@type": "HowToStep", position: 2, name: "Check Overview", text: "See your training status, earnings, and recent activity at a glance." },
    { "@type": "HowToStep", position: 3, name: "Start Training", text: "If new, go to Training Hub and start with Fundamentals module." },
    { "@type": "HowToStep", position: 4, name: "Prepare for Exam", text: "Review study materials and practice exams before taking the real exam." },
    { "@type": "HowToStep", position: 5, name: "Browse Jobs", text: "Once trained, explore available AI safety monitoring projects." },
    { "@type": "HowToStep", position: 6, name: "Apply & Earn", text: "Apply for projects, complete work, and get paid directly to your account." },
  ],
};

const DASHBOARD_BREADCRUMB_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://csoai.org/" },
    { "@type": "ListItem", position: 2, name: "How It Works", item: "https://csoai.org/how-it-works" },
    { "@type": "ListItem", position: 3, name: "Dashboard", item: "https://csoai.org/how-it-works/dashboard" },
  ],
};

export default function DashboardHowItWorks() {
  useEffect(() => { document.title = "CSOAI Dashboard Guide — Track Progress & Find Jobs"; }, []);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const dashboardFeatures = [
    {
      title: "Overview",
      description: "Your personal dashboard showing training status, earnings, and recent activity",
      icon: BarChart3,
      details: "Track your progress, view earnings summary, see upcoming deadlines, and monitor your analyst rating"
    },
    {
      title: "Training Hub",
      description: "Access all measurement credential training modules and track your learning progress",
      icon: Users,
      details: "Self-paced modules, interactive quizzes, real-world case studies, and downloadable resources"
    },
    {
      title: "Training records",
      description: "Manage your training records and view your exam history",
      icon: Trophy,
      details: "View completed training, retake exams, track refresher dates, and download completion certificates"
    },
    {
      title: "Jobs Board",
      description: "Browse available AI safety monitoring opportunities and apply for projects",
      icon: FileText,
      details: "Filter by pay rate, difficulty, frameworks, and deadline. Apply in one click and start earning"
    },
    {
      title: "Compliance Tools",
      description: "Access regulatory framework guides and compliance checklists",
      icon: Zap,
      details: "EU AI Act, NIST RMF, TC260, UK AI Bill, Canada AI Act, Australia AI Governance, ISO 42001"
    },
    {
      title: "Settings",
      description: "Manage your profile, payment methods, and notification preferences",
      icon: Settings,
      details: "Update profile, set payment preferences, manage notifications, and export your data"
    }
  ];

  const navigationGuide = [
    {
      step: "1. Log In",
      description: "Access your dashboard using your email or OAuth credentials",
      action: "You'll see your personalized overview immediately"
    },
    {
      step: "2. Check Overview",
      description: "See your training status, earnings, and recent activity at a glance",
      action: "Click cards to dive deeper into specific areas"
    },
    {
      step: "3. Start Training",
      description: "If new, go to Training Hub and start with Fundamentals module",
      action: "Complete modules at your own pace, take quizzes to reinforce learning"
    },
    {
      step: "4. Prepare for Exam",
      description: "Review study materials and practice exams before taking the real exam",
      action: "Schedule your exam when ready, take it anytime, get results instantly"
    },
    {
      step: "5. Browse Jobs",
      description: "Once trained, explore available AI safety monitoring projects",
      action: "Filter by pay, difficulty, and frameworks that match your expertise"
    },
    {
      step: "6. Apply & Earn",
      description: "Apply for projects, complete work, and get paid directly to your account",
      action: "Track hours, submit work, and receive payment within 5 business days"
    }
  ];

  const faqs = [
    {
      question: "How do I access the dashboard?",
      answer: "Simply log in with your email or OAuth credentials. If you don't have an account, sign up for free first. You'll be taken to your personalized dashboard immediately."
    },
    {
      question: "Can I access the dashboard on mobile?",
      answer: "Yes! The dashboard is fully responsive and works on all devices. You can check your earnings, apply for jobs, and track progress from anywhere."
    },
    {
      question: "What if I forget my password?",
      answer: "Click 'Forgot Password' on the login page. We'll send you a reset link via email. If you signed up with OAuth, use that provider to log in instead."
    },
    {
      question: "How do I update my profile?",
      answer: "Go to Settings → Profile. You can update your name, email, bio, skills, and payment information. Changes take effect immediately."
    },
    {
      question: "Can I change my payment method?",
      answer: "Yes, go to Settings → Payment Methods. You can add, update, or remove payment methods. We support bank transfers and major payment processors."
    },
    {
      question: "How do I see my earnings history?",
      answer: "Go to Overview → Earnings. You'll see a detailed breakdown of all your projects, hours worked, and payments received. Download reports for your records."
    },
    {
      question: "What does my analyst rating mean?",
      answer: "Your rating (1-5 stars) is based on the quality of your work, timeliness, and client feedback. Higher ratings lead to better job opportunities and higher pay."
    },
    {
      question: "How do I contact support?",
      answer: "Go to Settings → Help & Support. You can submit a ticket, chat with our support team, or browse our knowledge base for common questions."
    }
  ];

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      {/* Header */}
      <div className="bg-emerald-600 text-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Dashboard Guide</h1>
          <p className="text-xl text-emerald-100">
            Master your personal dashboard to track progress, manage certifications, and find high-paying AI safety jobs
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Features Overview */}
        <div className="mb-20">
          <h2 className="text-4xl font-bold mb-12 text-center">Dashboard Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {dashboardFeatures.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card key={idx} className="p-8 border-2 border-emerald-200 hover:border-emerald-600 transition-colors">
                  <Icon className="w-12 h-12 text-emerald-600 mb-4" />
                  <h3 className="text-2xl font-bold text-emerald-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-700 mb-3">{feature.description}</p>
                  <p className="text-sm text-gray-600 bg-emerald-50 p-3 rounded">{feature.details}</p>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Navigation Guide */}
        <div className="mb-20 bg-emerald-50 p-12 rounded-lg border-2 border-emerald-200">
          <h2 className="text-3xl font-bold mb-8 text-center">Step-by-Step Navigation</h2>
          <div className="space-y-6">
            {navigationGuide.map((item, idx) => (
              <div key={idx} className="flex items-start gap-6 pb-6 border-b border-emerald-200 last:border-b-0">
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-emerald-900 mb-2">{item.step}</h4>
                  <p className="text-gray-700 mb-2">{item.description}</p>
                  <p className="text-sm text-emerald-700 bg-white p-2 rounded border-l-4 border-emerald-600">
                    💡 {item.action}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Tips */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold mb-8 text-center">Pro Tips for Dashboard Success</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 border-2 border-emerald-200 bg-emerald-50">
              <h3 className="font-bold text-emerald-900 mb-2">📊 Track Your Progress</h3>
              <p className="text-gray-700">Check your Overview daily to see your earnings growth, training status, and upcoming deadlines.</p>
            </Card>
            <Card className="p-6 border-2 border-emerald-200 bg-emerald-50">
              <h3 className="font-bold text-emerald-900 mb-2">🎯 Complete Your Profile</h3>
              <p className="text-gray-700">A complete profile with skills and bio increases your chances of getting selected for high-paying jobs.</p>
            </Card>
            <Card className="p-6 border-2 border-emerald-200 bg-emerald-50">
              <h3 className="font-bold text-emerald-900 mb-2">🔔 Enable Notifications</h3>
              <p className="text-gray-700">Turn on notifications to get alerts for new job opportunities, certification renewals, and payment updates.</p>
            </Card>
            <Card className="p-6 border-2 border-emerald-200 bg-emerald-50">
              <h3 className="font-bold text-emerald-900 mb-2">⭐ Maintain Your Rating</h3>
              <p className="text-gray-700">Submit quality work on time to maintain a high analyst rating and unlock better opportunities.</p>
            </Card>
            <Card className="p-6 border-2 border-emerald-200 bg-emerald-50">
              <h3 className="font-bold text-emerald-900 mb-2">📚 Keep Learning</h3>
              <p className="text-gray-700">Refresh your training and take advanced courses to qualify for higher-paying expert-level projects.</p>
            </Card>
            <Card className="p-6 border-2 border-emerald-200 bg-emerald-50">
              <h3 className="font-bold text-emerald-900 mb-2">💰 Optimize Earnings</h3>
              <p className="text-gray-700">Filter jobs by pay rate and difficulty. Focus on projects that match your expertise for maximum hourly earnings.</p>
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
          <h2 className="text-3xl font-bold mb-4">Ready to Access Your Dashboard?</h2>
          <p className="text-lg mb-8 text-emerald-100">
            Sign up for free and start your journey by completing the AI Safety Analyst training
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-emerald-600 hover:bg-emerald-50 font-bold"
              onClick={() => window.location.href = "/dashboard"}
            >
              Go to Dashboard
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-emerald-700 font-bold"
              onClick={() => window.location.href = "/signup"}
            >
              Sign Up Free
            </Button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
