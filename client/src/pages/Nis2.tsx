import { useEffect } from "react";

// /nis2 — NIS2 Directive (EU 2022/2555). Network & information security for
// essential and important entities. Member-state transposition deadline Oct 2026;
// Cooperation Group adopted common incident-reporting templates (26 May 2026).
// Overlaps DORA by ~65%. Management is personally accountable.
const REQS = [
  { t: "Risk management", d: "Technical & organisational measures for network and information security — proportionate to risk (Art. 21)." },
  { t: "Incident reporting", d: "Early warning within 24h, notification within 72h, final report within 1 month — common EU templates adopted May 2026 (Art. 23)." },
  { t: "Supply-chain security", d: "Assess and manage the security of suppliers and service providers." },
  { t: "Management accountability", d: "Management bodies approve and oversee cyber-risk measures — and can be held personally liable (Art. 20)." },
];
const FAQ = [
  { q: "What is the NIS2 Directive?", a: "NIS2 (Directive (EU) 2022/2555) is the EU's cybersecurity law for 'essential' and 'important' entities across critical sectors. It mandates risk-management measures, incident reporting, supply-chain security and management accountability." },
  { q: "When does NIS2 apply?", a: "NIS2 is being transposed into national law across member states, with the transposition deadline in October 2026. The Cooperation Group adopted common incident-reporting templates in May 2026. Verify your national implementation, which varies by member state." },
  { q: "What are the NIS2 reporting timelines?", a: "For significant incidents: an early warning within 24 hours, a notification within 72 hours, and a final report within one month — following the EU common templates." },
  { q: "How do NIS2 and DORA overlap?", a: "NIS2 and DORA overlap by roughly 65% on ICT risk management, incident reporting and third-party/supply-chain risk. For financial entities in scope of both, CSOAI's DORA×NIS2 crosswalk maps the overlap once to avoid duplicated controls." },
  { q: "How does CSOAI help with NIS2?", a: "CSOAI maps NIS2 to one control set, crosswalks it to DORA and the Cyber Resilience Act, structures incident reporting to the common templates, and produces Layer-0 (Ed25519) signed evidence for supervisors." },
];

export default function Nis2() {
  useEffect(() => { document.title = "NIS2 Directive — cybersecurity compliance | CSOAI"; }, []);
  const ld = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <div className="mx-auto max-w-4xl px-6 py-12">
        <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">Cybersecurity · NIS2 Directive</p>
        <h1 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight">Network security, <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">with the board on the hook.</span></h1>
        <p className="mt-4 max-w-3xl text-lg text-emerald-100/80">NIS2 raises cybersecurity duties for essential and important entities across the EU — with 24/72-hour incident reporting and <b>personal management accountability</b>. Transposition lands October 2026.</p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {REQS.map((r) => (
            <div key={r.t} className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-4">
              <div className="text-sm font-black text-emerald-100">{r.t}</div>
              <p className="mt-1 text-xs text-emerald-100/65">{r.d}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          <a href="/assess" className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-black text-[#03110b] hover:bg-emerald-400">Get your signed assessment →</a>
          <a href="/dora" className="rounded-xl border border-emerald-500/30 px-5 py-2.5 text-sm font-semibold text-emerald-100 hover:bg-white/5">DORA × NIS2 crosswalk →</a>
          <a href="/cra" className="rounded-xl border border-emerald-500/30 px-5 py-2.5 text-sm font-semibold text-emerald-100 hover:bg-white/5">Cyber Resilience Act →</a>
          <a href="/crosswalk" className="rounded-xl border border-emerald-500/30 px-5 py-2.5 text-sm font-semibold text-emerald-100 hover:bg-white/5">Framework crosswalk →</a>
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
        <p className="mt-6 text-[11px] text-emerald-300/70">Status verified July 2026; national transposition varies. Indicative guidance, not legal advice — verify against your member state's implementation.</p>
      </div>
    </div>
  );
}
