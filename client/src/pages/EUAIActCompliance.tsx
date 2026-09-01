import {useState, useEffect } from "react";
import { ChevronDown, CheckCircle, AlertCircle, Shield, Zap, Users, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function EUAIActCompliance() {
  useEffect(() => { document.title = "EUAIActCompliance | CSOAI"; }, []);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const keyRequirements = [
    {
      title: "Risk Classification",
      description: "Classify AI systems into risk categories: Prohibited, High-Risk, Limited Risk, or Minimal Risk",
      icon: AlertCircle,
      details: "Determine appropriate compliance level based on system impact and use case"
    },
    {
      title: "Transparency Requirements",
      description: "Disclose when AI is used, how it works, and its limitations to users",
      icon: Shield,
      details: "Clear documentation, user notifications, and explainability requirements"
    },
    {
      title: "Human Oversight",
      description: "Maintain human control over high-risk AI decisions with meaningful human review",
      icon: Users,
      details: "Humans must understand and be able to override AI decisions"
    },
    {
      title: "Data Governance",
      description: "Ensure high-quality training data with proper documentation and governance",
      icon: Zap,
      details: "Data quality standards, bias mitigation, and documentation requirements"
    },
    {
      title: "Conformity Assessment",
      description: "Demonstrate compliance through third-party assessment or self-assessment",
      icon: CheckCircle,
      details: "Documentation, testing, and audit trail requirements"
    },
    {
      title: "Post-Market Monitoring",
      description: "Monitor AI systems after deployment for safety and compliance issues",
      icon: TrendingUp,
      details: "Incident reporting, performance tracking, and continuous improvement"
    }
  ];

  const csoaiCompliance = [
    {
      requirement: "Risk Classification",
      euaiActRequirement: "Classify AI systems by risk level",
      csoaiApproach: "Council assesses risk level using 33 independent agents. Results published publicly for transparency.",
      soaiPdcaRole: "PLAN: Define risk categories. DO: Implement controls. CHECK: Monitor incidents. ACT: Adjust controls."
    },
    {
      requirement: "Transparency",
      euaiActRequirement: "Disclose AI usage and limitations",
      csoaiApproach: "All CSOAI assessments and decisions are published publicly. Users can see exactly how AI systems are evaluated.",
      soaiPdcaRole: "PLAN: Define transparency standards. DO: Publish decisions. CHECK: Gather feedback. ACT: Improve clarity."
    },
    {
      requirement: "Human Oversight",
      euaiActRequirement: "Maintain meaningful human control",
      csoaiApproach: "Council is 50% human experts + 50% AI agents. Humans have final say on all critical decisions.",
      soaiPdcaRole: "PLAN: Define oversight procedures. DO: Train analysts. CHECK: Audit decisions. ACT: Improve processes."
    },
    {
      requirement: "Data Governance",
      euaiActRequirement: "Ensure data quality and bias mitigation",
      csoaiApproach: "Measurement credential training covers data governance. Analysts assess data quality as part of compliance reviews.",
      soaiPdcaRole: "PLAN: Define data standards. DO: Audit data. CHECK: Test for bias. ACT: Remediate issues."
    },
    {
      requirement: "Conformity Assessment",
      euaiActRequirement: "Document compliance through assessment",
      csoaiApproach: "Council provides independent conformity assessment. Reports detail compliance with each requirement.",
      soaiPdcaRole: "PLAN: Define assessment criteria. DO: Conduct assessment. CHECK: Verify compliance. ACT: Document findings."
    },
    {
      requirement: "Post-Market Monitoring",
      euaiActRequirement: "Monitor systems after deployment",
      csoaiApproach: "CSOAI provides continuous monitoring. Incidents are reported to Council within 24 hours.",
      soaiPdcaRole: "PLAN: Define monitoring strategy. DO: Monitor systems. CHECK: Analyze incidents. ACT: Implement fixes."
    }
  ];

  const faqs = [
    {
      question: "When does the EU AI Act take effect?",
      answer: "The EU AI Act has a phased implementation. Prohibited AI practices are banned immediately. High-risk systems have until 2026 to comply. Other requirements phase in through 2027-2028."
    },
    {
      question: "Does the EU AI Act apply to my company?",
      answer: "Yes, if you: (1) operate in the EU, (2) sell to EU customers, or (3) use AI systems that affect EU residents. The Act applies regardless of where your company is located."
    },
    {
      question: "What are 'prohibited' AI systems?",
      answer: "Prohibited uses include: mass surveillance, social credit systems, real-time facial recognition in public, manipulation of human behavior, and discrimination-based systems. These are banned entirely."
    },
    {
      question: "What counts as 'high-risk' AI?",
      answer: "High-risk systems include: hiring/firing decisions, loan approvals, criminal justice, immigration, education grading, and autonomous vehicles. These require extensive documentation and oversight."
    },
    {
      question: "How does CSOAI help with compliance?",
      answer: "CSOAI provides: compliance assessment tools, Council review, measurement credential training for your team, incident reporting system, and continuous monitoring. We handle the technical complexity."
    },
    {
      question: "Can we obtain an EU AI Act conformity certificate from Council of AI?",
      answer: "Not by us, and — as of now — not by anyone. EU AI Act conformity certificates are issued by notified bodies, and as of April 2026 zero had been designated; no JTC 21 harmonised standard yet grants presumption of conformity either. Anyone offering you an EU AI Act certificate today cannot deliver what it implies. What we provide is attestation-support: signed, provision-anchored evidence of how your system actually behaves, which is what you will need when a conformity route opens — and what a market-surveillance authority can act on now."
    },
    {
      question: "What happens if we don't comply?",
      answer: "Non-compliance penalties: €30 million or 6% of global revenue (whichever is higher) for prohibited systems. €20 million or 4% of revenue for high-risk system violations. €10 million or 2% for other violations."
    },
    {
      question: "How often should we assess compliance?",
      answer: "We recommend quarterly assessments using SOAI-PDCA cycles. High-risk systems should be assessed monthly. After major changes to your AI system, conduct an immediate assessment."
    },
    {
      question: "What documentation do we need?",
      answer: "Required documentation: system description, risk assessment, training data documentation, testing results, human oversight procedures, incident reports, and post-market monitoring plan. CSOAI helps you organize this."
    },
    {
      question: "Can we appeal a Council decision?",
      answer: "Yes! You can submit additional evidence and request a re-review. The Council will reconsider with new information. All appeals and dissenting opinions are documented and published."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      {/* Header */}
      <div className="bg-emerald-600 text-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">EU AI Act Compliance</h1>
          <p className="text-xl text-emerald-100">
            Understand EU AI Act requirements and how CSOAI helps you achieve and maintain compliance using SOAI-PDCA methodology
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* What is EU AI Act */}
        <div className="mb-20 bg-emerald-50 p-12 rounded-lg border-2 border-emerald-200">
          <h2 className="text-3xl font-bold mb-6">What is the EU AI Act?</h2>
          <p className="text-gray-700 mb-4">
            The European Union's Artificial Intelligence Act is the first comprehensive AI regulation. It takes a risk-based approach, imposing stricter requirements on higher-risk AI systems. The Act applies to any AI system that affects people in the EU, regardless of where the system is developed or deployed.
          </p>
          <p className="text-gray-700">
            The Act categorizes AI systems into four risk levels: Prohibited (banned entirely), High-Risk (extensive requirements), Limited Risk (transparency requirements), and Minimal Risk (no specific requirements). Most commercial AI systems fall into High-Risk or Limited Risk categories.
          </p>
        </div>

        {/* Key Requirements */}
        <div className="mb-20">
          <h2 className="text-4xl font-bold mb-12 text-center">Key Requirements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {keyRequirements.map((req, idx) => {
              const Icon = req.icon;
              return (
                <Card key={idx} className="p-8 border-2 border-emerald-200 hover:border-emerald-600 transition-colors">
                  <Icon className="w-12 h-12 text-emerald-600 mb-4" />
                  <h3 className="text-2xl font-bold text-emerald-900 mb-2">{req.title}</h3>
                  <p className="text-gray-700 mb-3">{req.description}</p>
                  <p className="text-sm text-gray-600 bg-white p-3 rounded border-l-4 border-emerald-600">{req.details}</p>
                </Card>
              );
            })}
          </div>
        </div>

        {/* CSOAI Compliance */}
        <div className="mb-20">
          <h2 className="text-4xl font-bold mb-12 text-center">How CSOAI Ensures Compliance</h2>
          <div className="space-y-6">
            {csoaiCompliance.map((item, idx) => (
              <Card key={idx} className="p-8 border-2 border-emerald-200">
                <h3 className="text-2xl font-bold text-emerald-900 mb-4">{item.requirement}</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">EU AI Act Requirement:</p>
                    <p className="text-gray-700">{item.euaiActRequirement}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">CSOAI Approach:</p>
                    <p className="text-gray-700">{item.csoaiApproach}</p>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded border-l-4 border-emerald-600">
                    <p className="text-sm font-semibold text-emerald-900 mb-1">SOAI-PDCA Continuous Improvement:</p>
                    <p className="text-gray-700 text-sm">{item.soaiPdcaRole}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Compliance Roadmap */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold mb-8 text-center">Your Compliance Roadmap</h2>
          <div className="space-y-6">
            <Card className="p-6 border-2 border-emerald-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold flex-shrink-0">1</div>
                <div>
                  <h4 className="font-bold text-emerald-900 mb-1">Assessment (Week 1-2)</h4>
                  <p className="text-gray-700">We assess your AI systems against EU AI Act requirements. Identify risk levels, gaps, and compliance priorities.</p>
                </div>
              </div>
            </Card>
            <Card className="p-6 border-2 border-emerald-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold flex-shrink-0">2</div>
                <div>
                  <h4 className="font-bold text-emerald-900 mb-1">Planning (Week 3-4)</h4>
                  <p className="text-gray-700">Create compliance action plan with timelines and resource requirements. Define SOAI-PDCA cycle schedule.</p>
                </div>
              </div>
            </Card>
            <Card className="p-6 border-2 border-emerald-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold flex-shrink-0">3</div>
                <div>
                  <h4 className="font-bold text-emerald-900 mb-1">Implementation (Month 2-3)</h4>
                  <p className="text-gray-700">Deploy controls, update documentation, train teams, and establish monitoring systems.</p>
                </div>
              </div>
            </Card>
            <Card className="p-6 border-2 border-emerald-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold flex-shrink-0">4</div>
                <div>
                  <h4 className="font-bold text-emerald-900 mb-1">Council Review (Month 4)</h4>
                  <p className="text-gray-700">Submit to independent Council review. Receive compliance assessment and recommendations.</p>
                </div>
              </div>
            </Card>
            <Card className="p-6 border-2 border-emerald-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold flex-shrink-0">5</div>
                <div>
                  <h4 className="font-bold text-emerald-900 mb-1">Continuous Improvement (Ongoing)</h4>
                  <p className="text-gray-700">Run quarterly SOAI-PDCA cycles. Monitor incidents, gather feedback, and continuously improve compliance.</p>
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
          <h2 className="text-3xl font-bold mb-4">Ready to Achieve EU AI Act Compliance?</h2>
          <p className="text-lg mb-8 text-emerald-100">
            Start your compliance journey with CSOAI's Council oversight and SOAI-PDCA methodology
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-emerald-600 hover:bg-emerald-50 font-bold"
              onClick={() => window.location.href = "/compliance"}
            >
              Start Assessment
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
