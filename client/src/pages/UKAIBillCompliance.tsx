import {useState } from "react";
import { ChevronDown, CheckCircle, Shield } from "lucide-react";

// Correction, 6 Oct 2026: this page described a "UK AI Bill" as an enacted regulation that is
// mandatory for high-risk systems. No AI-specific statute is in force in the UK, so there is no
// such obligation and no AI-specific penalty. The copy now says what applies; /frameworks/uk-ai-bill
// carries the same correction.
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function UKAIBillCompliance() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = [
    { question: "Is there a UK AI Bill in force?", answer: "No. No AI-specific Act of Parliament is in force. Bills about AI have been introduced as proposals, including private members' bills in the House of Lords; a bill is not law until it receives Royal Assent." },
    { question: "Is there an AI-specific fine in the UK?", answer: "No. The UK has no AI-specific penalty regime. Penalties that reach an AI system come from the existing law it falls under, such as data protection, equality, consumer, financial-services or online-safety law, each with its own regulator." },
    { question: "What does government policy ask for?", answer: "The 2023 white paper 'A pro-innovation approach to AI regulation' asks existing regulators to apply five principles within their current powers: safety, security and robustness; appropriate transparency and explainability; fairness; accountability and governance; contestability and redress. The principles are not statutory." },
    { question: "What does Council of AI do?", answer: "We measure AI systems against published rules and sign the result; verification is free. We do not certify, and nothing here is legal advice or a compliance determination." }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <div className="bg-emerald-600 text-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">UK AI regulation: what applies today</h1>
          <p className="text-xl text-emerald-100">
            No AI-specific statute is in force in the UK. Existing law and existing regulators apply.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="mb-20 bg-emerald-50 p-12 rounded-lg border-2 border-emerald-200">
          <h2 className="text-3xl font-bold mb-6">Overview</h2>
          <p className="text-gray-700">There is no enacted &ldquo;UK AI Bill&rdquo;, so there is no AI-specific obligation or fine to comply with. Government policy asks existing regulators (ICO, FCA, CMA, Ofcom, MHRA and others) to apply five non-statutory principles within their current powers. See <a href="/frameworks/uk-ai-bill" className="underline">UK AI regulation</a> for the law that does apply.</p>
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
          <h2 className="text-3xl font-bold mb-4">See what we have measured</h2>
          <Button size="lg" className="bg-white text-emerald-600 hover:bg-emerald-50 font-bold" onClick={() => window.location.href = "/dashboard?tab=board"}>
            Open the measured board
          </Button>
        </div>
      </div>
    </div>
  );
}
