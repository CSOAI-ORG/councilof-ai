import {useState, useEffect } from "react";
import { ChevronDown, CheckCircle, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CanadaAIActCompliance() {
  useEffect(() => { document.title = "CanadaAIActCompliance | CSOAI"; }, []);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = [
    { question: "What is the Canada AI Act?", answer: "Canada's Artificial Intelligence and Data Act requires mandatory compliance for high-impact AI systems. It focuses on impact assessment, testing, and ongoing monitoring." },
    { question: "Is it mandatory?", answer: "Yes, for high-impact AI systems. Organizations must conduct impact assessments and implement ongoing monitoring." },
    { question: "How does CSOAI help?", answer: "CSOAI provides impact assessment tools, Council review, and training. We help you implement testing and monitoring requirements." },
    { question: "What are key requirements?", answer: "Impact assessment, testing, monitoring, documentation, and transparency. CSOAI helps implement each requirement." }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <div className="bg-emerald-600 text-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Canada AI Act Compliance</h1>
          <p className="text-xl text-emerald-100">
            Achieve compliance with Canada's mandatory AI regulation for high-impact systems
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="mb-20 bg-emerald-50 p-12 rounded-lg border-2 border-emerald-200">
          <h2 className="text-3xl font-bold mb-6">Canada AI Act Overview</h2>
          <p className="text-gray-700">Canada's Artificial Intelligence and Data Act requires organizations to conduct impact assessments, implement testing, and maintain ongoing monitoring for high-impact AI systems.</p>
        </div>

        <div className="mb-20">
          <h2 className="text-3xl font-bold mb-12 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <Card key={idx} className="border-2 border-emerald-200 overflow-hidden">
                <button onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)} className="w-full p-6 flex items-center justify-between hover:bg-emerald-50 transition-colors">
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
          <h2 className="text-3xl font-bold mb-4">Ready for Canada AI Act Compliance?</h2>
          <Button size="lg" className="bg-white text-emerald-600 hover:bg-emerald-50 font-bold" onClick={() => window.location.href = "/compliance"}>
            Start Assessment
          </Button>
        </div>
      </div>
    </div>
  );
}
