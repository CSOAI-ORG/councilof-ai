"use client";

import { Shield, Eye, AlertCircle } from "lucide-react";

export default function AiTransparencyPage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="bg-[#04120c] text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8 border-b border-border">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-emerald-300 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>Article 50 Disclosure
          </span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-6 font-heading">
            AI Transparency Log
          </h1>
          <p className="text-lg text-emerald-100/80 mb-8 max-w-2xl mx-auto">
            This platform utilizes General-Purpose AI (GPAI) systems for user interaction and measurement routing. In accordance with the EU AI Act (Article 50), all AI systems deployed on this site are disclosed below.
          </p>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          <div className="p-8 rounded-2xl border border-border bg-card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold">Council OS Assistant</h3>
                <p className="text-sm text-muted-foreground mt-1">Deployed in the main workspace cockpit (`/os`)</p>
              </div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">Active</span>
            </div>
            <div className="space-y-4 text-sm text-muted-foreground">
              <p><strong>Provider:</strong> Internal (CSOAI)</p>
              <p><strong>Underlying Model:</strong> Llama 3.1 8B Instruct (Quantized)</p>
              <p><strong>Purpose:</strong> Natural language routing of user queries to the appropriate GSPC measurement axes and live board rendering.</p>
              <p><strong>Human Oversight (Art. 14):</strong> The assistant cannot execute measurements or issue signatures. It operates entirely as a read-only router for the static `/api/gspc` feed.</p>
            </div>
          </div>

          <div className="p-8 rounded-2xl border border-border bg-card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold">Risk Literacy Simulator</h3>
                <p className="text-sm text-muted-foreground mt-1">Deployed in the Simulator lab (`/simulator`)</p>
              </div>
              <span className="px-3 py-1 bg-slate-100 text-slate-800 rounded-full text-xs font-bold">Interactive</span>
            </div>
            <div className="space-y-4 text-sm text-muted-foreground">
              <p><strong>Provider:</strong> OpenAI API</p>
              <p><strong>Underlying Model:</strong> GPT-4o-mini</p>
              <p><strong>Purpose:</strong> Roleplay environments for enterprise compliance officers to test EU AI Act threshold boundaries in a simulated sandbox.</p>
              <p><strong>Human Oversight (Art. 14):</strong> Inputs are anonymized and retained only for the duration of the web session. The system cannot access actual measurement telemetry.</p>
            </div>
          </div>

        </div>
      </section>
    </main>
  );
}
