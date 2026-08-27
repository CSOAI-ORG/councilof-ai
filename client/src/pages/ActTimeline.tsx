import { useEffect } from "react";

// ActTimeline - vertical EU AI Act enforcement timeline with live phase status
// (done / now-next / upcoming) and FAQPage JSON-LD. Date-accurate incl. Digital Omnibus.

type Ev = { iso: string; date: string; title: string; desc: string };
const EVENTS: Ev[] = [
  { iso: "2024-08-01", date: "1 Aug 2024", title: "Entry into force", desc: "The EU AI Act becomes law; the enforcement clock starts." },
  { iso: "2025-02-02", date: "2 Feb 2025", title: "Prohibited practices banned", desc: "Unacceptable-risk AI (social scoring, manipulative systems, untargeted facial scraping) is outlawed. AI-literacy duties begin." },
  { iso: "2025-08-02", date: "2 Aug 2025", title: "GPAI rules + governance start", desc: "General-purpose AI model obligations begin for new models; the AI Office and penalty framework come online." },
  { iso: "2026-08-02", date: "2 Aug 2026", title: "Transparency + penalties enforceable", desc: "Article 50 transparency duties apply, alongside the full penalty/market-surveillance regime and AI Office GPAI enforcement powers. The headline 2026 cliff." },
  { iso: "2026-12-02", date: "2 Dec 2026", title: "Legacy marking grace ends + new Art 5 bans", desc: "Machine-readable marking (Art 50(2)) becomes mandatory for generative systems placed on the market before 2 Aug 2026; new Article 5 prohibitions on NCII/CSAM generation take effect." },
  { iso: "2027-08-02", date: "2 Aug 2027", title: "Legacy GPAI compliance + sandboxes", desc: "GPAI models placed on the market before 2 Aug 2025 must reach compliance; the national regulatory-sandbox obligation applies." },
  { iso: "2027-12-02", date: "2 Dec 2027", title: "Annex III high-risk obligations", desc: "Full obligations for stand-alone high-risk systems (Annex III) - deferred from Aug 2026 by the Digital Omnibus (Reg (EU) 2026/1744, in force 27 July 2026)." },
  { iso: "2028-08-02", date: "2 Aug 2028", title: "High-risk in regulated products", desc: "High-risk AI that are safety components of products already regulated under EU law (Annex I) must comply - deferred by the Digital Omnibus." },
];
const todayIso = "2026-08-19";

export default function ActTimeline() {
  useEffect(() => { document.title = "EU AI Act timeline - every enforcement date | CSOAI"; }, []);
  useEffect(() => {
    const sc = document.createElement("script");
    sc.type = "application/ld+json";
    sc.text = JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
      { "@type": "Question", "name": "When does the EU AI Act take effect?", "acceptedAnswer": { "@type": "Answer", "text": "The EU AI Act entered into force on 1 August 2024 and applies in phases: prohibited practices from Feb 2025, GPAI rules from Aug 2025, transparency from 2 August 2026, and high-risk obligations from 2 December 2027 (Annex III) and 2 August 2028 (Annex I), as amended by the Digital Omnibus (Reg (EU) 2026/1744)." } },
      { "@type": "Question", "name": "What is banned under the EU AI Act right now?", "acceptedAnswer": { "@type": "Answer", "text": "Since 2 February 2025, unacceptable-risk uses such as social scoring, manipulative or exploitative AI, and untargeted scraping of facial images are prohibited." } },
      { "@type": "Question", "name": "When do high-risk AI obligations apply?", "acceptedAnswer": { "@type": "Answer", "text": "Stand-alone Annex III high-risk systems must comply by 2 December 2027 and product-embedded Annex I high-risk AI by 2 August 2028, as amended by the Digital Omnibus (Reg (EU) 2026/1744)." } },
    ] });
    document.head.appendChild(sc);
    return () => { document.head.removeChild(sc); };
  }, []);
  const firstFutureIdx = EVENTS.findIndex((e) => e.iso >= todayIso);
  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white py-16">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(700px 380px at 80% -10%, rgba(45,212,191,.22), transparent 60%)" }} />
        <div className="relative max-w-3xl mx-auto px-6">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">CSOAI - enforcement timeline</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">The EU AI Act, date by date</h1>
          <p className="mt-4 max-w-2xl text-lg text-emerald-50/90">From entry into force to the last high-risk deadline - exactly what applies when, including the Digital Omnibus deferral. The next cliff is highlighted.</p>
        </div>
      </section>
      <section className="max-w-3xl mx-auto px-6 py-12">
        <ol className="relative border-l-2 border-gray-200 ml-3">
          {EVENTS.map((e, i) => {
            const done = e.iso < todayIso;
            const next = i === firstFutureIdx;
            const dot = done ? "bg-emerald-500 border-emerald-500" : next ? "bg-amber-400 border-amber-400" : "bg-white border-gray-300";
            return (
              <li key={e.iso} className="mb-8 ml-6">
                <span className={"absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full border-2 " + dot} />
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-black text-gray-900">{e.date}</span>
                  {done && <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">In effect</span>}
                  {next && <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">Next cliff</span>}
                  {!done && !next && <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">Upcoming</span>}
                </div>
                <div className="mt-1 text-lg font-bold text-gray-900">{e.title}</div>
                <p className="mt-1 text-sm text-gray-600">{e.desc}</p>
              </li>
            );
          })}
        </ol>
        <div className="mt-4 flex flex-wrap gap-3">
          <a href="/eu-ai-act-checklist" className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500">Get ready for the next cliff -&gt;</a>
          <a href="/penalties" className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">What a breach costs -&gt;</a>
          <a href="/eu-ai-act-vs-gdpr" className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">EU AI Act vs GDPR -&gt;</a>
        </div>
      </section>
    </div>
  );
}
