import {useState, useEffect } from "react";
import { ChevronDown, CheckCircle, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function TC260Compliance() {
  useEffect(() => { document.title = "TC260Compliance | CSOAI"; }, []);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = [
    { question: "What is TC260?", answer: "TC260 is China's Technical Committee for Standardization of Information Security. It develops technical standards for AI security, algorithm governance, and data protection in China." },
    { question: "Do I need TC260 compliance?", answer: "Yes, if you operate in China or serve Chinese customers. TC260 standards are mandatory for AI systems deployed in China." },
    { question: "How does CSOAI help with TC260?", answer: "CSOAI provides TC260 compliance assessment, Council review, and measurement credential training. We help you implement required algorithm audits and data security controls." },
    { question: "What are the key TC260 requirements?", answer: "Algorithm audit, data security, user rights protection, transparency, and algorithm governance. CSOAI helps you implement each requirement." }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <div className="bg-emerald-600 text-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">TC260 Compliance</h1>
          <p className="text-xl text-emerald-100">
            Achieve compliance with China's technical standards for AI security and algorithm governance
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="mb-20 bg-emerald-50 p-12 rounded-lg border-2 border-emerald-200">
          <h2 className="text-3xl font-bold mb-6">TC260 Standards Overview</h2>
          <p className="text-gray-700">TC260 develops technical standards for information security in China, including AI security, algorithm governance, and data protection. Compliance is mandatory for AI systems in China.</p>
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
          <h2 className="text-3xl font-bold mb-4">Ready for TC260 Compliance?</h2>
          <Button size="lg" className="bg-white text-emerald-600 hover:bg-emerald-50 font-bold" onClick={() => window.location.href = "/compliance"}>
            Start Assessment
          </Button>
        </div>
      </div>
    </div>
  );
}
