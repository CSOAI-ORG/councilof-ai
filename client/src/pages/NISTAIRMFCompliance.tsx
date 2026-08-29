import {useState, useEffect } from "react";
import { ChevronDown, CheckCircle, Shield, Zap, Users, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function NISTAIRMFCompliance() {
  useEffect(() => { document.title = "NISTAIRMFCompliance | CSOAI"; }, []);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = [
    { question: "What is NIST AI RMF?", answer: "NIST AI Risk Management Framework is a voluntary framework from the US National Institute of Standards and Technology for managing AI risks. It provides guidance on identifying, measuring, and managing AI risks across organizations." },
    { question: "Is NIST AI RMF mandatory?", answer: "NIST AI RMF is voluntary but widely adopted. Federal agencies must use it. Private companies adopt it to demonstrate responsible AI practices and meet customer/investor expectations." },
    { question: "How does CSOAI help with NIST compliance?", answer: "CSOAI provides assessment tools, Council review, and measurement credential training covering NIST AI RMF. We help you map your systems to NIST categories and implement required controls." },
    { question: "Can we obtain a NIST compliance certificate from Council of AI?", answer: "No — and neither can anyone else, because the NIST AI RMF is a voluntary framework with no certification scheme attached. There is no NIST AI RMF certificate to issue. What we provide is an assessment: signed, provision-anchored evidence of how your system behaves, mapped to RMF functions, which you can present to a customer or an auditor yourself. We do not certify." },
    { question: "How often should we assess NIST compliance?", answer: "We recommend quarterly assessments using SOAI-PDCA cycles. After major AI system changes, conduct immediate assessment." }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <div className="bg-emerald-600 text-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">NIST AI RMF Compliance</h1>
          <p className="text-xl text-emerald-100">
            Understand NIST AI Risk Management Framework requirements and how CSOAI ensures compliance using SOAI-PDCA methodology
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="mb-20 bg-emerald-50 p-12 rounded-lg border-2 border-emerald-200">
          <h2 className="text-3xl font-bold mb-6">What is NIST AI RMF?</h2>
          <p className="text-gray-700 mb-4">
            The NIST AI Risk Management Framework provides a structured approach to managing AI risks. It focuses on four core functions: Map (understand your AI systems), Measure (assess risks), Manage (implement controls), and Govern (establish oversight).
          </p>
        </div>

        <div className="mb-20">
          <h2 className="text-4xl font-bold mb-12 text-center">Key Components</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { title: "Map", desc: "Understand your AI systems and their risks", icon: Shield },
              { title: "Measure", desc: "Assess and quantify AI risks", icon: Zap },
              { title: "Manage", desc: "Implement controls to mitigate risks", icon: Users },
              { title: "Govern", desc: "Establish oversight and accountability", icon: TrendingUp }
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <Card key={idx} className="p-8 border-2 border-emerald-200">
                  <Icon className="w-12 h-12 text-emerald-600 mb-4" />
                  <h3 className="text-2xl font-bold text-emerald-900 mb-2">{item.title}</h3>
                  <p className="text-gray-700">{item.desc}</p>
                </Card>
              );
            })}
          </div>
        </div>

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
                  <ChevronDown className={`w-5 h-5 text-emerald-600 transition-transform flex-shrink-0 ${expandedFaq === idx ? "rotate-180" : ""}`} />
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

        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-12 rounded-lg text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Achieve NIST AI RMF Compliance?</h2>
          <p className="text-lg mb-8 text-emerald-100">Start your compliance journey with CSOAI's Council oversight</p>
          <Button size="lg" className="bg-white text-emerald-600 hover:bg-emerald-50 font-bold" onClick={() => window.location.href = "/compliance"}>
            Start Assessment
          </Button>
        </div>
      </div>
    </div>
  );
}
