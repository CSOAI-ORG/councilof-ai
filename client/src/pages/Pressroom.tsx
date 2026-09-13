import { useEffect } from "react";

// Pressroom - press one-pager + boilerplate for distribution. Quotable facts, the story,
// and a single CTA. Built for journalists, partners, and demo sharing.
const FACTS = [
  { k: "What it is", v: "An independent AI-measurement body. We measure AI systems against statute, sign the result, and publish what cannot be measured." },
  { k: "The Council", v: "Designed multi-provider review. Live independence is published on the Refutation Ledger — a designed council, not a live claim." },
  { k: "Coverage", v: "Statute-anchored instruments. Slot counts, dates and sample sizes live at GET councilof.ai/api/gspc — we do not type them here." },
  { k: "The lineage", v: "Governance rediscovered from 4,000 years of human history - Athens to Bitcoin to AI." },
  { k: "The proof", v: "Ed25519-signed measurement cards. Verify is free and loginless at councilof.ai/gspc-verify." },
];
const QUOTES = [
  "We did not invent AI governance. We rediscovered it - and built it in digital form.",
  "No single agent can decide. That is the point.",
  "Measurement, not certification. Empty cells stay empty.",
];

export default function Pressroom() {
  useEffect(() => { document.title = "Pressroom — Council of AI (CSOAI)"; }, []);
  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white py-16">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(700px 380px at 80% -10%, rgba(45,212,191,.22), transparent 60%)" }} />
        <div className="relative max-w-5xl mx-auto px-6">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">CSOAI - pressroom</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">Press & media kit</h1>
          <p className="mt-4 max-w-2xl text-lg text-emerald-50/90">Everything you need to write about CSOAI - the facts, the story, and the quotes. The live site is councilof.ai.</p>
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
        <p className="mt-2 max-w-3xl text-sm text-gray-700 leading-relaxed">Council of AI (CSOAI Ltd, UK Companies House 16939677) is an independent measurement body for AI behaviour. We run systems against frozen, published tests drawn from statute, sign the result, and publish the parts we could not measure. We do not certify or remediate. A grade is never sold. Verify stays free at councilof.ai/gspc-verify. Live board counts are at GET councilof.ai/api/gspc.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="/try" className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500">See the Council live -&gt;</a>
          <a href="/lineage" className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">The story -&gt;</a>
          <a href="/sectors" className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">Sector coverage -&gt;</a>
        </div>
      </section>
    </div>
  );
}
