import {useState, useEffect } from "react";
import { ChevronDown, Zap, CheckCircle, Users, Shield, TrendingUp, Code } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
const ENTERPRISE_HOWTO_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to evaluate CSOAI for an enterprise",
  description: "A proposed enterprise evaluation sequence. It is not a live deployment or support commitment.",
  step: [
    { "@type": "HowToStep", position: 1, name: "Consultation", text: "Meet with our enterprise team to understand your AI systems and compliance needs." },
    { "@type": "HowToStep", position: 2, name: "Scoping", text: "Identify a subject, jurisdiction, method, evidence owner, and accountable reviewer." },
    { "@type": "HowToStep", position: 3, name: "Interface review", text: "Compare published APIs and schemas with the enterprise stack." },
    { "@type": "HowToStep", position: 4, name: "Pilot", text: "Run a bounded pilot before any production integration." },
    { "@type": "HowToStep", position: 5, name: "Training review", text: "Evaluate the available practice material; no accredited programme is implied." },
    { "@type": "HowToStep", position: 6, name: "Review", text: "Review published measurement evidence and record future monitoring requirements." },
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
  useEffect(() => { document.title = "CSOAI for Enterprise — evaluation preview"; }, []);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const enterpriseFeatures = [
    {
      title: "API Integration",
      description: "Inspect the published measurement and incident interfaces before designing a pilot",
      icon: Code,
      details: "Published measurement APIs and incident intake; continuous monitoring is a target, not a live service"
    },
    {
      title: "Council Review",
      description: "Explore the designed 33-seat Council workflow for future scoped review",
      icon: Shield,
      details: "Design target only: multi-provider review with retained evidence and human accountability"
    },
    {
      title: "Custom Compliance Framework",
      description: "Model candidate requirements for a scoped pilot",
      icon: Zap,
      details: "Design target; custom framework enforcement and enterprise RBAC are not verified live"
    },
    {
      title: "Team Management",
      description: "Proposed multi-team and project workspace",
      icon: Users,
      details: "Design target; project isolation and granular enterprise permissions are not verified here"
    },
    {
      title: "Incident Management",
      description: "Public incident intake plus a proposed triage workflow",
      icon: CheckCircle,
      details: "Council analysis, case management and remediation tracking are not live services"
    },
    {
      title: "Monitoring Design",
      description: "Target architecture for scheduled re-measurement, alerts and reporting; not a live 24/7 service",
      icon: TrendingUp,
      details: "Available today: published GSPC evidence and service status. Automated alerts and anomaly detection remain targets"
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
      description: "Scope a specific system and candidate obligations; this does not produce a legal compliance verdict",
      timeline: "2-4 weeks"
    },
    {
      step: "3. Integration Planning",
      description: "Compare the published interfaces with your architecture and record missing adapters",
      timeline: "1-2 weeks"
    },
    {
      step: "4. Implementation",
      description: "Run a bounded non-production pilot; production deployment remains subject to separate engineering and review",
      timeline: "4-8 weeks"
    },
    {
      step: "5. Training",
      description: "Review available practice modules; no accredited training service is promised",
      timeline: "1-2 weeks"
    },
    {
      step: "6. Review",
      description: "Review published measurement evidence and record future monitoring requirements",
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
        "Public API documentation",
        "Published GSPC evidence",
        "Unlimited team members",
        "No support SLA"
      ]
    },
    {
      tier: "Growth",
      description: "For scaling AI companies",
      price: "Free",
      features: [
        "Up to 20 AI systems",
        "Integration design review",
        "Council review design documentation",
        "Unlimited team members",
        "No support SLA",
        "Custom framework prototype"
      ]
    },
    {
      tier: "Enterprise",
      description: "For large organizations",
      price: "Free",
      features: [
        "Unlimited AI systems",
        "Enterprise pilot design",
        "Council review design documentation",
        "Unlimited team members",
        "No 24/7 support commitment",
        "Custom framework prototype",
        "On-premise architecture review"
      ]
    }
  ];

  const faqs = [
    {
      question: "How does the CSOAI API work?",
      answer: "Public endpoints expose specific measurement, verification and incident-intake functions. They do not currently promise compliance scores, live Council decisions, or supported SDKs in Python, Node.js and Go. Inspect the API documentation and endpoint status before integrating."
    },
    {
      question: "Can we use CSOAI on-premise?",
      answer: "A production on-premise enterprise package is not currently verified or generally available. The repository contains components and interface designs that would require a scoped deployment review."
    },
    {
      question: "How does the Council review work?",
      answer: "The Council is a proposed 33-seat, multi-provider review architecture, not a live service. The latest three-leg experiment was fully correlated, so independent analysis, vendor neutrality and resilience under independent failures are not claimed. Current users can inspect the published evidence and methods while the operating workflow remains a target."
    },
    {
      question: "What compliance frameworks can we customize?",
      answer: "The catalogue can inform a scoped mapping exercise. Custom runtime rules, approval workflows and enforcement require a separately tested implementation and accountable review."
    },
    {
      question: "How often should we run Council reviews?",
      answer: "There is no live scheduled Council review service today. Re-measurement cadence should be set by system risk, applicable obligations and accountable human owners; current published records state their own scope and date."
    },
    {
      question: "What if we disagree with a Council decision?",
      answer: "There is no live Council appeal service. A production service would need an explicit evidence-submission, human review, correction, revocation and appeal contract."
    },
    {
      question: "How is our data protected?",
      answer: "Do not assume SOC 2 Type II status, an on-premise data boundary, residency controls, or an audit programme from this preview. Those claims require deployment-specific evidence and contracts."
    },
    {
      question: "Can we integrate with our existing tools?",
      answer: "No supported Jira, Slack, GitHub-compliance, universal REST, or webhook integration is claimed here. The published interfaces can be evaluated as building blocks for a scoped adapter."
    },
    {
      question: "What support do we get?",
      answer: "No tier-specific support SLA, 24/7 line, dedicated account manager, or quarterly review programme is currently committed by this page."
    },
    {
      question: "How do we measure ROI?",
      answer: "No six-month ROI claim is supported. A pilot should define its own baseline, cost, evidence coverage, error rate and time-to-review, then publish what was actually observed."
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
            Evaluate published measurement interfaces and a proposed Council workflow without assuming a live enterprise service
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
              <p className="text-gray-700">The 33-seat, multi-provider Council is a design target, not a live review service. Current experiments do not establish independent providers, absence of vendor bias or resilience under independent failures.</p>
            </div>
            <div>
              <h4 className="text-xl font-bold text-emerald-900 mb-3">🌍 Global Standards</h4>
              <p className="text-gray-700">The catalogue references multiple laws, standards and guidance sources. A mapping is not a conformity verdict and coverage must be checked per subject and version.</p>
            </div>
            <div>
              <h4 className="text-xl font-bold text-emerald-900 mb-3">📊 Continuous Improvement</h4>
              <p className="text-gray-700">SOAI-PDCA is a proposed re-measurement loop. Automated monitoring is not live; accountable teams must decide cadence, review findings and approve any action.</p>
            </div>
            <div>
              <h4 className="text-xl font-bold text-emerald-900 mb-3">🔒 Security & Privacy</h4>
              <p className="text-gray-700">Security, privacy, residency and deployment boundaries require system-specific evidence. This preview does not assert SOC 2 Type II status or general on-premise availability.</p>
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
          <h2 className="text-3xl font-bold mb-4">Ready to scope an evidence pilot?</h2>
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
