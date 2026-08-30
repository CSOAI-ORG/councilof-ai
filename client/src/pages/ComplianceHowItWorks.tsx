import {useState, useEffect } from "react";
import { ChevronDown, CheckCircle, Zap, Shield, TrendingUp, Users, Globe } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
const COMPLIANCE_HOWTO_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to achieve AI compliance with CSOAI",
  description: "The CSOAI compliance process: assess your AI systems, analyze gaps, implement controls, monitor continuously, and improve with SOAI-PDCA.",
  step: [
    { "@type": "HowToStep", position: 1, name: "Assessment", text: "Evaluate your AI systems against relevant frameworks." },
    { "@type": "HowToStep", position: 2, name: "Gap Analysis", text: "Identify areas where you're not yet compliant." },
    { "@type": "HowToStep", position: 3, name: "Implementation", text: "Deploy controls and safeguards to close gaps." },
    { "@type": "HowToStep", position: 4, name: "Monitoring", text: "Continuously monitor compliance and incident reports." },
    { "@type": "HowToStep", position: 5, name: "Improvement", text: "Use SOAI-PDCA to continuously improve compliance." },
  ],
};

const COMPLIANCE_BREADCRUMB_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://csoai.org/" },
    { "@type": "ListItem", position: 2, name: "How It Works", item: "https://csoai.org/how-it-works" },
    { "@type": "ListItem", position: 3, name: "Compliance", item: "https://csoai.org/how-it-works/compliance" },
  ],
};

export default function ComplianceHowItWorks() {
  useEffect(() => { document.title = "CSOAI Compliance Guide — EU AI Act & NIST in 5 Steps"; }, []);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const frameworks = [
    {
      name: "EU AI Act",
      region: "European Union",
      description: "Risk-based approach to AI regulation with strict requirements for high-risk systems",
      keyRequirements: ["Risk assessment", "Transparency", "Human oversight", "Data governance"]
    },
    {
      name: "NIST AI RMF",
      region: "United States",
      description: "Voluntary framework for managing AI risks across organizations",
      keyRequirements: ["Risk mapping", "Measurement", "Management", "Governance"]
    },
    {
      name: "TC260",
      region: "China",
      description: "Technical standards for AI security and algorithm governance",
      keyRequirements: ["Algorithm audit", "Data security", "User rights", "Transparency"]
    },
    {
      name: "UK AI Bill",
      region: "United Kingdom",
      description: "Flexible, principles-based AI regulation with sector-specific guidance",
      keyRequirements: ["Transparency", "Accountability", "Risk management", "Human oversight"]
    },
    {
      name: "Canada AI Act",
      region: "Canada",
      description: "Mandatory compliance for high-impact AI systems with ongoing monitoring",
      keyRequirements: ["Impact assessment", "Testing", "Monitoring", "Documentation"]
    },
    {
      name: "Australia AI Governance",
      region: "Australia",
      description: "Principles-based approach to responsible AI development and deployment",
      keyRequirements: ["Transparency", "Fairness", "Accountability", "Human oversight"]
    }
  ];

  const soaiPdcaSteps = [
    {
      phase: "PLAN",
      description: "Define compliance objectives and identify gaps",
      activities: [
        "Assess current AI systems",
        "Map against regulatory frameworks",
        "Identify compliance gaps",
        "Set improvement targets"
      ]
    },
    {
      phase: "DO",
      description: "Implement compliance improvements",
      activities: [
        "Deploy safeguards",
        "Update documentation",
        "Train teams",
        "Establish monitoring"
      ]
    },
    {
      phase: "CHECK",
      description: "Monitor and measure compliance",
      activities: [
        "Run compliance audits",
        "Collect incident reports",
        "Measure performance",
        "Gather feedback"
      ]
    },
    {
      phase: "ACT",
      description: "Continuously improve based on findings",
      activities: [
        "Analyze results",
        "Update procedures",
        "Scale improvements",
        "Plan next cycle"
      ]
    }
  ];

  const complianceProcess = [
    {
      step: "1. Assessment",
      description: "Evaluate your AI systems against relevant frameworks",
      icon: Shield
    },
    {
      step: "2. Gap Analysis",
      description: "Identify areas where you're not yet compliant",
      icon: Zap
    },
    {
      step: "3. Implementation",
      description: "Deploy controls and safeguards to close gaps",
      icon: CheckCircle
    },
    {
      step: "4. Monitoring",
      description: "Continuously monitor compliance and incident reports",
      icon: TrendingUp
    },
    {
      step: "5. Improvement",
      description: "Use SOAI-PDCA to continuously improve compliance",
      icon: Users
    }
  ];

  const faqs = [
    {
      question: "Do I need to comply with all frameworks?",
      answer: "It depends on your region and where your AI systems operate. If you serve EU customers, you must comply with EU AI Act. If you operate in China, you need TC260 compliance. CSOAI helps you identify which frameworks apply to you."
    },
    {
      question: "What is SOAI-PDCA?",
      answer: "SOAI-PDCA combines Safety Oversight AI (the 33-agent Council of AI) with the Deming Cycle (Plan-Do-Check-Act). It's a continuous improvement methodology that ensures your compliance keeps improving over time."
    },
    {
      question: "How often should we run SOAI-PDCA cycles?",
      answer: "We recommend quarterly cycles for most organizations. High-risk systems should run monthly cycles. You can adjust based on your risk profile and regulatory requirements."
    },
    {
      question: "Can I use CSOAI's compliance tools for my enterprise?",
      answer: "Yes! CSOAI provides compliance assessment tools, documentation templates, and integration with our Council for independent review. Contact our enterprise team for custom solutions."
    },
    {
      question: "What if we fail a compliance audit?",
      answer: "Don't worry! Compliance is a journey. We provide detailed feedback on what needs improvement and help you create an action plan. Most organizations improve significantly after their first audit."
    },
    {
      question: "How do we stay updated on regulatory changes?",
      answer: "CSOAI monitors global AI regulations and publishes updates monthly. You'll receive notifications when frameworks change, and we update our assessment tools accordingly."
    },
    {
      question: "Can we obtain a conformity certificate from Council of AI?",
      answer: "Not in the regulatory sense, and we will not pretend otherwise. A conformity certificate requires an accreditation chain — a national accreditation organisation (such as UKAS), then a certification body under ISO/IEC 42006 — and CSOAI holds no such accreditation. What you receive is an attestation record: signed, deterministic, provision-anchored evidence of measured behaviour. It demonstrates what your system actually did. It does not, and cannot, declare conformity."
    },
    {
      question: "What's the cost of compliance?",
      answer: "Get measured is free and needs no account. A grade is never sold. Paid arms — Run/re-attest, Ledger, and Data — are quoted privately. There are no public prices."
    },
    {
      question: "How long does compliance implementation take?",
      answer: "Timeline depends on your starting point and system complexity. Simple systems: 1-3 months. Complex systems: 6-12 months. We provide a detailed roadmap during assessment."
    },
    {
      question: "Do we need to hire compliance experts?",
      answer: "Not necessarily! CSOAI's tools and training help your team build compliance expertise. Many organizations upskill their existing teams using our measurement credential program."
    }
  ];

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      {/* Header */}
      <div className="bg-emerald-600 text-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Compliance Guide</h1>
          <p className="text-xl text-emerald-100">
            Master multi-framework AI compliance using CSOAI's methodology and the SOAI-PDCA continuous improvement cycle
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Global Frameworks */}
        <div className="mb-20">
          <h2 className="text-4xl font-bold mb-12 text-center">Global Regulatory Frameworks</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {frameworks.map((framework, idx) => (
              <Card key={idx} className="p-8 border-2 border-emerald-200 hover:border-emerald-600 transition-colors">
                <div className="mb-4">
                  <h3 className="text-2xl font-bold text-emerald-900 mb-1">{framework.name}</h3>
                  <p className="text-sm text-emerald-600 font-semibold">📍 {framework.region}</p>
                </div>
                <p className="text-gray-700 mb-4">{framework.description}</p>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-600">Key Requirements:</p>
                  {framework.keyRequirements.map((req, i) => (
                    <div key={i} className="flex items-center gap-2 text-gray-700">
                      <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span className="text-sm">{req}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* SOAI-PDCA Methodology */}
        <div className="mb-20">
          <h2 className="text-4xl font-bold mb-12 text-center">SOAI-PDCA Continuous Improvement</h2>
          <p className="text-center text-gray-700 mb-12 max-w-3xl mx-auto">
            SOAI-PDCA combines Safety Oversight AI (the 33-agent Council of AI) with the Deming Cycle to ensure your compliance keeps improving over time.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {soaiPdcaSteps.map((step, idx) => (
              <Card key={idx} className="p-8 border-2 border-emerald-200 hover:border-emerald-600 transition-colors">
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-lg mb-4">
                  {idx + 1}
                </div>
                <h3 className="text-xl font-bold text-emerald-900 mb-2">{step.phase}</h3>
                <p className="text-gray-700 mb-4 text-sm">{step.description}</p>
                <ul className="space-y-2">
                  {step.activities.map((activity, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-700 text-sm">
                      <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      {activity}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>

        {/* Compliance Process */}
        <div className="mb-20 bg-emerald-50 p-12 rounded-lg border-2 border-emerald-200">
          <h2 className="text-3xl font-bold mb-8 text-center">Our Compliance Process</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {complianceProcess.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="text-center">
                  <Icon className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
                  <h4 className="font-bold text-emerald-900 mb-2">{item.step}</h4>
                  <p className="text-sm text-gray-700">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Council Role */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold mb-8 text-center">How the Council Helps</h2>
          <Card className="p-12 border-2 border-emerald-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <Shield className="w-12 h-12 text-emerald-600 mb-4" />
                <h3 className="text-xl font-bold text-emerald-900 mb-3">Independent Review</h3>
                <p className="text-gray-700">The 33-agent Council of AI independently reviews your AI systems and compliance practices. No vendor bias, no conflicts of interest.</p>
              </div>
              <div>
                <Globe className="w-12 h-12 text-emerald-600 mb-4" />
                <h3 className="text-xl font-bold text-emerald-900 mb-3">Global Expertise</h3>
                <p className="text-gray-700">Council members include AI researchers, ethicists, regulators, and domain experts from around the world. Diverse perspectives ensure thorough assessment.</p>
              </div>
              <div>
                <Zap className="w-12 h-12 text-emerald-600 mb-4" />
                <h3 className="text-xl font-bold text-emerald-900 mb-3">Continuous Monitoring</h3>
                <p className="text-gray-700">The Council continuously monitors your systems and compliance. Incidents are reviewed within 5 business days and decisions published publicly.</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Implementation Timeline */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold mb-8 text-center">Typical Implementation Timeline</h2>
          <div className="space-y-6">
            <Card className="p-6 border-2 border-emerald-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold flex-shrink-0">Week 1</div>
                <div>
                  <h4 className="font-bold text-emerald-900 mb-1">Initial Assessment</h4>
                  <p className="text-gray-700">Review your current AI systems and compliance status</p>
                </div>
              </div>
            </Card>
            <Card className="p-6 border-2 border-emerald-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold flex-shrink-0">Week 2-4</div>
                <div>
                  <h4 className="font-bold text-emerald-900 mb-1">Gap Analysis</h4>
                  <p className="text-gray-700">Identify compliance gaps and create action plan</p>
                </div>
              </div>
            </Card>
            <Card className="p-6 border-2 border-emerald-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold flex-shrink-0">Month 2-3</div>
                <div>
                  <h4 className="font-bold text-emerald-900 mb-1">Implementation</h4>
                  <p className="text-gray-700">Deploy controls, update documentation, train teams</p>
                </div>
              </div>
            </Card>
            <Card className="p-6 border-2 border-emerald-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold flex-shrink-0">Month 4</div>
                <div>
                  <h4 className="font-bold text-emerald-900 mb-1">Council Review</h4>
                  <p className="text-gray-700">Council independently reviews your compliance</p>
                </div>
              </div>
            </Card>
            <Card className="p-6 border-2 border-emerald-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold flex-shrink-0">Ongoing</div>
                <div>
                  <h4 className="font-bold text-emerald-900 mb-1">SOAI-PDCA Cycles</h4>
                  <p className="text-gray-700">Run quarterly improvement cycles to maintain and enhance compliance</p>
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
          <h2 className="text-3xl font-bold mb-4">Ready to Achieve Compliance?</h2>
          <p className="text-lg mb-8 text-emerald-100">
            Start your compliance journey with CSOAI's comprehensive framework and Council oversight
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-emerald-600 hover:bg-emerald-50 font-bold"
              onClick={() => window.location.href = "/compliance"}
            >
              Start Compliance Assessment
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
