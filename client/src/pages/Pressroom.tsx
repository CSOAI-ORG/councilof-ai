import { useEffect } from "react";

// Pressroom - press one-pager + boilerplate for distribution. Quotable facts, the story,
// and a single CTA. Built for journalists, partners, and demo sharing.
const FACTS = [
  { k: "What it is", v: "An agentic AI-governance operating system - the Council of AI decides, the OS proves it." },
  { k: "The Council", v: "Five independent AI agents reach designed multi-agent review on every major decision." },
  { k: "Coverage", v: "13+ frameworks (EU AI Act, NIST AI RMF, ISO 42001, and more) across 47 industries." },
  { k: "The lineage", v: "Governance rediscovered from 4,000 years of human history - Athens to Bitcoin to AI." },
  { k: "The proof", v: "Every verdict is Ed25519-signed, replayable, and permanently logged." },
];
const QUOTES = [
  "We did not invent AI governance. We rediscovered it - and built it in digital form.",
  "No single agent can decide. That is the point.",
  "Ask it any governance question and watch five minds reach consensus in thirty seconds.",
];

export default function Pressroom() {
  useEffect(() => { document.title = "Pressroom - CSOAI, the AI governance OS"; }, []);
  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white py-16">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(700px 380px at 80% -10%, rgba(45,212,191,.22), transparent 60%)" }} />
        <div className="relative max-w-5xl mx-auto px-6">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">CSOAI - pressroom</p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight">Press & media kit</h1>
          <p className="mt-4 max-w-2xl text-lg text-emerald-50/90">Everything you need to write about CSOAI - the facts, the story, and the quotes. Reach the live OS at csoai-v2-app.vercel.app.</p>
        </div>
      </section>
      <section className="max-w-5xl mx-auto px-6 py-12">
        <h2 className="text-xl font-bold text-gray-900">Fast facts</h2>
        <div className="mt-4 divide-y divide-gray-100 rounded-2xl border border-gray-200">
          {FACTS.map((f) => (
            <div key={f.k} className="grid gap-1 px-5 py-4 sm:grid-cols-[160px_1fr]">
              <div className="text-xs font-bold uppercase tracking-wide text-emerald-700">{f.k}</div>
              <div className="text-sm text-gray-700">{f.v}</div>
            </div>
          ))}
        </div>
        <h2 className="mt-12 text-xl font-bold text-gray-900">Quotable</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {QUOTES.map((q) => (
            <blockquote key={q} className="rounded-2xl border-l-4 border-emerald-400 bg-emerald-50 p-4 text-sm italic text-emerald-900">"{q}"</blockquote>
          ))}
        </div>
        <h2 className="mt-12 text-xl font-bold text-gray-900">Boilerplate</h2>
        <p className="mt-2 max-w-3xl text-sm text-gray-700 leading-relaxed">CSOAI (Council for the Safety of AI) builds the operating system for AI governance. Its designed multi-agent review Council of five independent agents reaches consensus across 13+ regulatory frameworks and 47 industries, proving every decision with cryptographic signatures. Rediscovered from 4,000 years of governance and built for the agentic era, CSOAI turns compliance from a checklist into a living system.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="/try" className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500">See the Council live -&gt;</a>
          <a href="/lineage" className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">The story -&gt;</a>
          <a href="/sectors" className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">Sector coverage -&gt;</a>
        </div>
      </section>
    </div>
  );
}
