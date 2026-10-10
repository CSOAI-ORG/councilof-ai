import { useEffect } from "react";

// /dora — financial-services vertical. DORA has applied since 17 January 2025; the
// Register of Information is the priority audit target, TLPT notifications are
// live. References to related instruments do not establish whole-instrument coverage.
const PILLARS = [
  { t: "ICT risk management", d: "Board-owned framework for ICT risk across the financial entity.", a: "Art. 5–16" },
  { t: "Incident reporting", d: "Classify + report major ICT-related incidents on strict timelines.", a: "Art. 17–23" },
  { t: "Digital operational resilience testing", d: "Regular testing, incl. threat-led penetration testing (TLPT / TIBER-EU).", a: "Art. 24–27" },
  { t: "Third-party ICT risk", d: "Manage critical ICT providers; the Register of Information is the audit priority.", a: "Art. 28–44" },
  { t: "Information sharing", d: "Share cyber-threat intelligence across financial entities.", a: "Art. 45" },
];
const FAQ = [
  { q: "What is DORA and who does it apply to?", a: "The Digital Operational Resilience Act (Regulation (EU) 2022/2554) sets binding ICT and cyber-resilience rules for banks, insurers, investment firms, crypto-asset service providers and their critical ICT third parties across the EU. It has applied since 17 January 2025." },
  { q: "What is the DORA Register of Information?", a: "The Register of Information (RoI) is a structured record of all contractual arrangements with ICT third-party providers. It is the priority audit target for supervisors in 2026 — several national deadlines have already passed and consolidation at the ESAs is under way." },
  { q: "How do DORA and NIS2 relate?", a: "Both address ICT and cyber risk. A comparison must identify the relevant provisions and the entity's scope. CSOAI publishes no measured whole-instrument overlap percentage, and a crosswalk does not establish that one instrument's obligations satisfy another's." },
  { q: "How can CSOAI evidence support a DORA review?", a: "Inspect the published methods and any relevant measurement record, including its system, sample, date and limitations. Agree a specific evidence requirement before requesting a delivery. A signed observation is not a DORA compliance determination, and acceptance rests with the recipient." },
];

export default function Dora() {
  useEffect(() => { document.title = "DORA compliance for financial services — CSOAI"; }, []);
  const ld = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <div className="mx-auto max-w-4xl px-6 py-12">
        <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">Financial services · DORA · in force since Jan 2025</p>
        <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">DORA, <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">governed and evidenced.</span></h1>
        <p className="mt-4 max-w-3xl text-lg text-emerald-100/80">The Digital Operational Resilience Act addresses ICT resilience in financial services. Start with the official instrument, identify your scope, and inspect any relevant measurement evidence. No whole-instrument compliance or overlap percentage is claimed here.</p>

        <div className="mt-8 space-y-2">
          {PILLARS.map((p) => (
            <div key={p.t} className="flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-[#05140d] p-4">
              <span className="mt-0.5 shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] text-emerald-300">{p.a}</span>
              <div><div className="text-sm font-black text-emerald-100">{p.t}</div><p className="mt-0.5 text-xs text-emerald-100/65">{p.d}</p></div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          <a href="/assess" className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-black text-[#03110b] hover:bg-emerald-400">Get your signed assessment →</a>
          <a href="/classifier" className="rounded-xl border border-emerald-500/30 px-5 py-2.5 text-sm font-semibold text-emerald-100 hover:bg-white/5">Classify your financial AI →</a>
          <a href="https://eur-lex.europa.eu/eli/reg/2022/2554/oj/eng" target="_blank" rel="noopener noreferrer" className="rounded-xl border border-emerald-500/30 px-5 py-2.5 text-sm font-semibold text-emerald-100 hover:bg-white/5">Official DORA instrument →</a>
          <a href="/tool-commons" className="rounded-xl border border-emerald-500/30 px-5 py-2.5 text-sm font-semibold text-emerald-100 hover:bg-white/5">Run the compliance tools →</a>
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-black">Frequently asked</h2>
          <div className="mt-4 space-y-3">
            {FAQ.map((f) => (
              <details key={f.q} className="rounded-xl border border-emerald-500/20 bg-[#05140d] p-4">
                <summary className="cursor-pointer font-semibold text-emerald-100">{f.q}</summary>
                <p className="mt-2 text-sm leading-relaxed text-emerald-100/75">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
