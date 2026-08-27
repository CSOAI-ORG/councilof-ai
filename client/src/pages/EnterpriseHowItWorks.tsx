import {useState, useEffect } from "react";
import { ChevronDown, Zap, CheckCircle, Users, Shield, TrendingUp, Code } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
const ENTERPRISE_HOWTO_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to deploy CSOAI in your enterprise",
  description: "The CSOAI enterprise implementation timeline: consultation, assessment, integration planning, implementation, training, and go-live.",
  step: [
    { "@type": "HowToStep", position: 1, name: "Consultation", text: "Meet with our enterprise team to understand your AI systems and compliance needs." },
    { "@type": "HowToStep", position: 2, name: "Assessment", text: "Conduct comprehensive assessment of your current compliance status." },
    { "@type": "HowToStep", position: 3, name: "Integration Planning", text: "Design API integration and compliance framework customization." },
    { "@type": "HowToStep", position: 4, name: "Implementation", text: "Deploy CSOAI's tools, integrate APIs, and configure compliance rules." },
    { "@type": "HowToStep", position: 5, name: "Training", text: "Train your teams on CSOAI platform, compliance framework, and best practices." },
    { "@type": "HowToStep", position: 6, name: "Go Live", text: "Launch monitoring, begin compliance tracking, and start Council reviews." },
  ],
};

const ENTERPRISE_BREADCRUMB_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://csoai.org/" },
    { "@type": "ListItem", position: 2, name: "How It Works", item: "https://csoai.org/how-it-works" },
    { "@type": "ListItem", position: 3, name: "Enterprise", item: "https://csoai.org/how-it-works/enterprise" },
  ],
};

export default function EnterpriseHowItWorks() {
  useEffect(() => { document.title = "CSOAI for Enterprise — AI Compliance Implementation"; }, []);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const enterpriseFeatures = [
    {
      title: "API Integration",
      description: "Integrate CSOAI's compliance assessment API directly into your AI development pipeline",
      icon: Code,
      details: "Real-time compliance scoring, automated incident detection, continuous monitoring"
    },
    {
      title: "Council Review",
      description: "Submit your AI systems for independent review by the designed 33-agent Council of AI",
      icon: Shield,
      details: "Impartial assessment, no vendor bias, detailed compliance report, public transparency"
    },
    {
      title: "Custom Compliance Framework",
      description: "Define custom compliance requirements tailored to your industry and regulations",
      icon: Zap,
      details: "Flexible framework configuration, role-based access, audit trails, compliance dashboards"
    },
    {
      title: "Team Management",
      description: "Manage multiple teams and projects with granular permission controls",
      icon: Users,
      details: "User roles, project isolation, activity logs, compliance reporting"
    },
    {
      title: "Incident Management",
      description: "Centralized incident reporting and tracking with Council analysis",
      icon: CheckCircle,
      details: "Incident triage, severity assessment, root cause analysis, remediation tracking"
    },
    {
      title: "Continuous Monitoring",
      description: "24/7 monitoring of your AI systems with automated alerts and reporting",
      icon: TrendingUp,
      details: "Real-time dashboards, anomaly detection, compliance score tracking, trend analysis"
    }
  ];

  const implementationSteps = [
    {
      step: "1. Consultation",
      description: "Meet with our enterprise team to understand your AI systems and compliance needs",
      timeline: "1-2 weeks"
    },
    {
      step: "2. Assessment",
      description: "Conduct comprehensive assessment of your current compliance status",
      timeline: "2-4 weeks"
    },
    {
      step: "3. Integration Planning",
      description: "Design API integration and compliance framework customization",
      timeline: "1-2 weeks"
    },
    {
      step: "4. Implementation",
      description: "Deploy CSOAI's tools, integrate APIs, and configure compliance rules",
      timeline: "4-8 weeks"
    },
    {
      step: "5. Training",
      description: "Train your teams on CSOAI platform, compliance framework, and best practices",
      timeline: "1-2 weeks"
    },
    {
      step: "6. Go Live",
      description: "Launch monitoring, begin compliance tracking, and start Council reviews",
      timeline: "Ongoing"
    }
  ];

  const pricingTiers = [
    {
      tier: "Startup",
      description: "For early-stage AI companies",
      price: "Free",
      features: [
        "Up to 5 AI systems",
        "API integration",
        "Monthly Council review",
        "Unlimited team members",
        "Community support"
      ]
    },
    {
      tier: "Growth",
      description: "For scaling AI companies",
      price: "Free",
      features: [
        "Up to 20 AI systems",
        "Full API integration",
        "Weekly Council review",
        "Unlimited team members",
        "Priority support",
        "Custom compliance framework"
      ]
    },
    {
      tier: "Enterprise",
      description: "For large organizations",
      price: "Free",
      features: [
        "Unlimited AI systems",
        "Full API integration",
        "Daily Council review",
        "Unlimited team members",
        "24/7 dedicated support",
        "Custom compliance framework",
        "On-premise deployment option"
      ]
    }
  ];

  const faqs = [
    {
      question: "How does the CSOAI API work?",
      answer: "Our REST API allows you to submit AI systems for assessment, retrieve compliance scores, report incidents, and access Council decisions. Full documentation and SDKs available for Python, Node.js, and Go."
    },
    {
      question: "Can we use CSOAI on-premise?",
      answer: "Yes! Enterprise customers can deploy CSOAI on their own infrastructure. This includes the compliance assessment engine, incident management system, and access to the Council via secure API."
    },
    {
      question: "How does the Council review work?",
      answer: "You submit your AI system details, training data samples, and decision logs. The Council's 33 agents independently analyze your system using 12 different AI providers. It is a designed council; its measured performance is published openly on our public Refutation Ledger."
    },
    {
      question: "What compliance frameworks can we customize?",
      answer: "You can customize any framework or create entirely new ones. Define your own risk categories, assessment criteria, remediation requirements, and approval workflows. Our team helps you design the framework."
    },
    {
      question: "How often should we run Council reviews?",
      answer: "Recommended frequency depends on your risk profile: Startup tier = monthly, Growth tier = weekly, Enterprise tier = daily. You can also request ad-hoc reviews for critical systems."
    },
    {
      question: "What if we disagree with a Council decision?",
      answer: "You can submit additional evidence and request a re-review. The Council will reconsider with new information. All dissenting opinions and appeals are documented and published for transparency."
    },
    {
      question: "How is our data protected?",
      answer: "Enterprise deployments include: end-to-end encryption, SOC 2 Type II compliance, regular security audits, data residency options, and strict access controls. Your data never leaves your infrastructure in on-premise deployments."
    },
    {
      question: "Can we integrate with our existing tools?",
      answer: "Yes! CSOAI integrates with popular platforms: Jira for incident tracking, Slack for notifications, GitHub for code compliance, and any system via our REST API and webhooks."
    },
    {
      question: "What support do we get?",
      answer: "All tiers include documentation and community forums. Growth tier adds email support. Enterprise tier includes 24/7 phone/email support, dedicated account manager, and quarterly business reviews."
    },
    {
      question: "How do we measure ROI?",
      answer: "CSOAI provides detailed dashboards showing: compliance score improvements, incident reduction, time saved on audits, regulatory risk mitigation, and customer trust metrics. Most enterprises see ROI within 6 months."
    }
  ];

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      {/* Header */}
      <div className="bg-emerald-600 text-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Enterprise Solutions</h1>
          <p className="text-xl text-emerald-100">
            Integrate CSOAI's compliance framework and Council oversight into your enterprise AI operations
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Enterprise Features */}
        <div className="mb-20">
          <h2 className="text-4xl font-bold mb-12 text-center">Enterprise Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {enterpriseFeatures.map((feature, idx) => {
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

        {/* Implementation Steps */}
        <div className="mb-20">
          <h2 className="text-4xl font-bold mb-12 text-center">Implementation Timeline</h2>
          <div className="space-y-6">
            {implementationSteps.map((item, idx) => (
              <Card key={idx} className="p-8 border-2 border-emerald-200 hover:border-emerald-600 transition-colors">
                <div className="flex items-start gap-6">
                  <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-2xl font-bold text-emerald-900">{item.step}</h3>
                      <span className="text-sm font-semibold text-emerald-600">⏱️ {item.timeline}</span>
                    </div>
                    <p className="text-gray-700">{item.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Deployment Tiers */}
        <div className="mb-20">
          <h2 className="text-4xl font-bold mb-4 text-center">Deployment Tiers</h2>
          <p className="text-lg text-gray-600 mb-12 text-center max-w-2xl mx-auto">
            The rail is free. Verification is free forever — tiers differ by scope and cadence, not by price.
            The product is the evidence, not access.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingTiers.map((tier, idx) => (
              <Card key={idx} className={`p-8 border-2 transition-colors ${
                idx === 1 ? "border-emerald-600 bg-emerald-50" : "border-emerald-200 hover:border-emerald-600"
              }`}>
                <h3 className="text-2xl font-bold text-emerald-900 mb-2">{tier.tier}</h3>
                <p className="text-gray-700 mb-4">{tier.description}</p>
                <div className="text-3xl font-bold text-emerald-600 mb-6">{tier.price}</div>
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  size="lg"
                  className={`w-full font-bold ${
                    idx === 1
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "bg-white text-emerald-600 border-2 border-emerald-600 hover:bg-emerald-50"
                  }`}
                  onClick={() => window.location.href = "/contact?plan=" + tier.tier.toLowerCase()}
                >
                  Get Started
                </Button>
              </Card>
            ))}
          </div>
        </div>

        {/* Why Choose CSOAI */}
        <div className="mb-20 bg-emerald-50 p-12 rounded-lg border-2 border-emerald-200">
          <h2 className="text-3xl font-bold mb-8 text-center">Why Choose CSOAI for Enterprise?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-xl font-bold text-emerald-900 mb-3">🏛️ Council</h4>
              <p className="text-gray-700">Independent review by 33 AI + human experts using 12 different AI providers. No vendor bias, no conflicts of interest. Decisions published publicly for full transparency.</p>
            </div>
            <div>
              <h4 className="text-xl font-bold text-emerald-900 mb-3">🌍 Global Standards</h4>
              <p className="text-gray-700">Support for EU AI Act, NIST AI RMF, TC260, UK AI Bill, Canada AI Act, Australia AI Governance, and ISO 42001. One platform for all your compliance needs.</p>
            </div>
            <div>
              <h4 className="text-xl font-bold text-emerald-900 mb-3">📊 Continuous Improvement</h4>
              <p className="text-gray-700">SOAI-PDCA methodology ensures your compliance keeps improving. Quarterly cycles, automated monitoring, and actionable insights drive continuous enhancement.</p>
            </div>
            <div>
              <h4 className="text-xl font-bold text-emerald-900 mb-3">🔒 Security & Privacy</h4>
              <p className="text-gray-700">SOC 2 Type II compliant, end-to-end encryption, data residency options, and on-premise deployment available. Your data stays secure and under your control.</p>
            </div>
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
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your AI Compliance?</h2>
          <p className="text-lg mb-8 text-emerald-100">
            Schedule a consultation with our enterprise team to discuss your needs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-emerald-600 hover:bg-emerald-50 font-bold"
              onClick={() => window.location.href = "/contact?type=enterprise"}
            >
              Schedule Consultation
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
