import { useEffect } from "react";

// ActSummary - plain-English "EU AI Act explained" overview + FAQ JSON-LD. Top-of-funnel.
import SovereignSpot from "../components/SovereignSpot";
import AISystemNotice from "../components/AISystemNotice";
type Tier = { name: string; tone: string; desc: string };
const TIERS: Tier[] = [
  { name: "Unacceptable risk", tone: "bg-red-100 text-red-700", desc: "Banned outright - social scoring, manipulative AI, untargeted facial scraping. In force since Feb 2025." },
  { name: "High risk", tone: "bg-amber-100 text-amber-700", desc: "Heavily regulated - biometrics, hiring, credit, healthcare, justice. Risk management, oversight, conformity. Phasing to 2027." },
  { name: "Limited risk", tone: "bg-blue-100 text-blue-700", desc: "Transparency duties - tell people they are dealing with AI; label synthetic media. From 2 Aug 2026." },
  { name: "Minimal risk", tone: "bg-emerald-100 text-emerald-700", desc: "Most AI - spam filters, recommendation engines. No mandatory obligations; voluntary codes encouraged." },
];
export default function ActSummary() {
  useEffect(() => { document.title = "The EU AI Act, explained in 5 minutes | CSOAI"; }, []);
  useEffect(() => {
    const sc = document.createElement("script");
    sc.type = "application/ld+json";
    sc.text = JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
      { "@type": "Question", "name": "What is the EU AI Act?", "acceptedAnswer": { "@type": "Answer", "text": "The EU AI Act is the first comprehensive AI law. It regulates AI by risk level - banning unacceptable uses, heavily regulating high-risk systems, requiring transparency for limited-risk AI, and leaving minimal-risk AI largely free." } },
      { "@type": "Question", "name": "Who does the EU AI Act apply to?", "acceptedAnswer": { "@type": "Answer", "text": "It applies to providers and deployers of AI systems placed on or used in the EU market, including organisations based outside the EU." } },
      { "@type": "Question", "name": "What are the EU AI Act penalties?", "acceptedAnswer": { "@type": "Answer", "text": "Up to EUR 35 million or 7% of global annual turnover for prohibited practices, and up to EUR 15 million or 3% for other obligations." } },
    ] });
    document.head.appendChild(sc);
    return () => { document.head.removeChild(sc); };
  }, []);
  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white py-16">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(700px 380px at 80% -10%, rgba(45,212,191,.22), transparent 60%)" }} />
        <div className="relative max-w-5xl mx-auto px-6">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">CSOAI - the 5-minute version</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">The EU AI Act, explained</h1>
          <p className="mt-4 max-w-2xl text-lg text-emerald-50/90">The first comprehensive AI law, in plain English. It sorts AI into four risk tiers and regulates each differently. Here is the whole thing in five minutes.</p>
          <div className="mt-6 max-w-2xl"><AISystemNotice route="/ai-act-summary" /></div>
        </div>
      </section>
      <section className="max-w-5xl mx-auto px-6 py-12">
        <h2 className="text-xl font-bold text-gray-900">The four risk tiers</h2>
        <div className="mt-5 space-y-3">
          {TIERS.map((t) => (
            <div key={t.name} className="flex flex-col gap-1 rounded-2xl border border-gray-200 p-5 sm:flex-row sm:items-center sm:gap-4">
              <span className={"shrink-0 self-start rounded-md px-2 py-1 text-xs font-bold " + t.tone}>{t.name}</span>
              <p className="text-sm text-gray-600">{t.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 p-5"><div className="text-xs font-bold uppercase tracking-wide text-gray-400">Who</div><p className="mt-1 text-sm text-gray-700">Providers + deployers touching the EU market - including non-EU companies.</p></div>
          <div className="rounded-2xl border border-gray-200 p-5"><div className="text-xs font-bold uppercase tracking-wide text-gray-400">When</div><p className="mt-1 text-sm text-gray-700">Bans Feb 2025; GPAI Aug 2025; transparency 2 Aug 2026; high-risk Dec 2027 / Aug 2028 (Digital Omnibus).</p></div>
          <div className="rounded-2xl border border-gray-200 p-5"><div className="text-xs font-bold uppercase tracking-wide text-gray-400">Penalty</div><p className="mt-1 text-sm text-gray-700">Up to EUR 35m or 7% of global turnover.</p></div>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="/eu-ai-act-timeline" className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500">See the full timeline -&gt;</a>
          <a href="/high-risk-ai-systems" className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">What is high-risk? -&gt;</a>
          <a href="/eu-ai-act-checklist" className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">Am I ready? -&gt;</a>
        </div>
      </section>
      <section className="bg-[#03110b] py-10"><div className="mx-auto max-w-5xl px-6">
        <SovereignSpot topic="the EU AI Act in plain English" layer="frameworks" suggest="Explain the EU AI Act risk tiers and what applies to me." />
      </div></section>
    </div>
  );
}
