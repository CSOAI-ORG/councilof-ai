import { useEffect } from "react";

// /cra — EU Cyber Resilience Act (Reg. 2024/2847). Verified dates (July 2026):
// in force 10 Dec 2024; conformity-assessment-body rules 11 Jun 2026; REPORTING
// obligations 11 Sep 2026 (24h early warning / 72h notification via the CRA Single
// Reporting Platform → CSIRT + ENISA); main obligations 11 Dec 2027. Fines up to
// €15M or 2.5% of worldwide turnover.
function days(to: string) { return Math.max(0, Math.ceil((new Date(to + "T00:00:00Z").getTime() - Date.now()) / 86400000)); }
const REQS = [
  { t: "Secure by design", d: "Products with digital elements must be designed, developed and produced to be secure — Annex I essential requirements." },
  { t: "Vulnerability handling", d: "Coordinated disclosure, SBOM, and security updates throughout the defined support period." },
  { t: "Incident & vuln reporting", d: "From 11 Sep 2026: report actively-exploited vulns & severe incidents — 24h early warning, 72h notification, via the Single Reporting Platform to your CSIRT and ENISA." },
  { t: "Conformity + CE marking", d: "Conformity assessment, technical documentation and CE marking before placing on the EU market (from 11 Dec 2027)." },
];
const FAQ = [
  { q: "What is the EU Cyber Resilience Act (CRA)?", a: "The CRA (Regulation (EU) 2024/2847) sets binding cybersecurity requirements for products with digital elements — hardware and software — sold in the EU: secure-by-design, vulnerability handling, SBOM, CE marking and security updates over a defined support period." },
  { q: "What are the CRA deadlines?", a: "The CRA entered into force on 10 December 2024. Conformity-assessment-body rules apply from 11 June 2026, reporting obligations for actively-exploited vulnerabilities and severe incidents from 11 September 2026, and the main obligations from 11 December 2027." },
  { q: "What must be reported under the CRA and when?", a: "Manufacturers must report actively-exploited vulnerabilities and severe incidents: an early warning within 24 hours, a full notification within 72 hours (via the CRA Single Reporting Platform to their CSIRT and ENISA), and a final report within 14 days of a fix (or one month for severe incidents)." },
  { q: "How do the CRA and NIS2 relate?", a: "They complement each other: the CRA secures digital products (hardware/software) placed on the market, while NIS2 secures the networks and systems of essential and important entities. CSOAI crosswalks both to one control set." },
  { q: "How does CSOAI treat CRA?", a: "CSOAI measures and signs evidence (SBOM workflow, incident runbook, Ed25519 receipts). It does not certify CRA conformity or issue a CE mark. A rank is never sold. Confirm scope with counsel." },
];

export default function Cra() {
  useEffect(() => { document.title = "EU Cyber Resilience Act (CRA) — deadlines & compliance | CSOAI"; }, []);
  const ld = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
  const rep = days("2026-09-11"), main = days("2027-12-11");
  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <div className="mx-auto max-w-4xl px-6 py-12">
        <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">Cybersecurity · EU Cyber Resilience Act</p>
        <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">Secure by design, <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">and evidenced.</span></h1>
        <p className="mt-4 max-w-3xl text-lg text-emerald-100/80">The CRA makes cybersecurity binding for every product with digital elements sold in the EU — secure-by-design, SBOM, vulnerability reporting and CE marking, with fines up to <b>€15M or 2.5%</b> of turnover.</p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-amber-400/40 bg-amber-500/10 p-4"><div className="text-3xl font-black text-amber-200">{rep}</div><div className="text-sm text-amber-100/80">days → vulnerability &amp; incident reporting (11 Sep 2026)</div></div>
          <div className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 p-4"><div className="text-3xl font-black text-emerald-200">{main}</div><div className="text-sm text-emerald-100/80">days → main obligations + CE marking (11 Dec 2027)</div></div>
        </div>

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
          <a href="/evidence-rail" className="rounded-xl border border-emerald-500/30 px-5 py-2.5 text-sm font-semibold text-emerald-100 hover:bg-white/5">Signed evidence & SBOM →</a>
          <a href="/nis2" className="rounded-xl border border-emerald-500/30 px-5 py-2.5 text-sm font-semibold text-emerald-100 hover:bg-white/5">NIS2 →</a>
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
        <p className="mt-6 text-[11px] text-emerald-300/70">Dates verified July 2026. Indicative guidance, not legal advice — verify against primary EU sources.</p>
      </div>
    </div>
  );
}
