import { useEffect } from "react";
import SovereignSpot from "../components/SovereignSpot";

// SECDisclosure - focused page for US public companies (SEC filers) - the largest CSOAI
// audience segment. Honest framing: there is no single "SEC AI rule" yet, but AI already
// surfaces in 10-K risk factors + MD&A, and the SEC has brought AI-washing enforcement.
// CSOAI gives filers signed, board-ready governance evidence. FAQPage JSON-LD for answer engines.

const TITLE = "SEC AI disclosure: what US public companies must evidence";
const EYEBROW = "CSOAI - US public companies + SEC";
const INTRO =
  "There is no single SEC \"AI rule\" - but AI is already in your filings. Material AI risks belong in your 10-K risk factors and MD&A, the SEC has charged firms for \"AI-washing,\" and boards are expected to oversee AI. Here is what filers should evidence now - and how to make every AI-governance claim defensible and signed.";

const SCRUTINY = [
  "Material AI risk factors in your 10-K / 20-F (Reg S-K Item 105)",
  "AI-washing: the SEC settled charges vs two advisers in Mar 2024 for overstated AI use",
  "Board and audit-committee oversight of AI as a governance matter",
  "Proposed (not yet adopted): the SEC's 2023 predictive-data-analytics rule for advisers and broker-dealers",
];
const DEFENSIBLE = [
  "A signed, board-ready System Card per material AI system - offline-verifiable",
  "Honest capability claims backed by evidence, so disclosures don't become AI-washing",
  "An Ed25519-signed audit trail of every governed AI action, for the record",
  "One control set mapped across NIST AI RMF, ISO 42001, and the EU AI Act you also face",
];
const FAQS = [
  { q: "Does the SEC require AI disclosure?", a: "There is no standalone SEC AI-disclosure rule as of 2026. But existing rules already apply: material AI-related risks must be disclosed in 10-K risk factors and MD&A under Reg S-K, and misleading AI claims can trigger enforcement. Treat AI as a material-disclosure and governance matter now." },
  { q: "What is AI-washing and why does the SEC care?", a: "AI-washing is overstating or misrepresenting a company's use of AI. In March 2024 the SEC settled charges against two investment advisers for it. The safeguard is simple: only claim AI capabilities you can evidence - which is exactly what a signed System Card provides." },
  { q: "Where does AI belong in a 10-K?", a: "Material AI risks belong in Item 105 risk factors and, where AI affects results or operations, in MD&A. Governance and board oversight of AI can also be described. The bar is materiality and accuracy - not a specific AI form." },
  { q: "How does CSOAI help a public company?", a: "CSOAI produces a signed, offline-verifiable System Card and governance evidence per AI system, so your disclosures are backed by proof rather than assertion. It maps one control set across NIST AI RMF, ISO 42001, and the EU AI Act, and is honest about how it compares to Vanta, Drata, and Credo AI." },
];

export default function SECDisclosure() {
  useEffect(() => { document.title = TITLE + " | CSOAI"; }, []);
  useEffect(() => {
    const sc = document.createElement("script");
    sc.type = "application/ld+json";
    sc.text = JSON.stringify({
      "@context": "https://schema.org", "@type": "FAQPage",
      "mainEntity": FAQS.map((f) => ({ "@type": "Question", "name": f.q, "acceptedAnswer": { "@type": "Answer", "text": f.a } })),
    });
    document.head.appendChild(sc);
    return () => { document.head.removeChild(sc); };
  }, []);
  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white py-16">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(700px 380px at 80% -10%, rgba(45,212,191,.22), transparent 60%)" }} />
        <div className="relative max-w-5xl mx-auto px-6">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">{EYEBROW}</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">{TITLE}</h1>
          <p className="mt-4 max-w-2xl text-lg text-emerald-50/90">{INTRO}</p>
        </div>
      </section>
      <section className="max-w-5xl mx-auto px-6 py-12 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-xl font-bold text-gray-900">What SEC scrutiny already covers</h2>
          <ul className="mt-4 space-y-2">
            {SCRUTINY.map((x) => (
              <li key={x} className="flex items-start gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700"><span className="mt-0.5 text-amber-500 font-black">!</span>{x}</li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">What defensible AI governance looks like</h2>
          <ul className="mt-4 space-y-2">
            {DEFENSIBLE.map((x) => (
              <li key={x} className="flex items-start gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700"><span className="mt-0.5 text-emerald-600 font-black">+</span>{x}</li>
            ))}
          </ul>
        </div>
      </section>
      <section className="max-w-5xl mx-auto px-6 pb-8">
        <h2 className="text-xl font-bold text-gray-900">Questions, answered</h2>
        <div className="mt-4 space-y-3">
          {FAQS.map((f) => (
            <div key={f.q} className="rounded-2xl border border-gray-200 p-5">
              <div className="font-bold text-gray-900">{f.q}</div>
              <p className="mt-1 text-sm text-gray-600">{f.a}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="/system-card" className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500">Get a signed System Card -&gt;</a>
          <a href="/us-ai-regulation" className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">US AI regulation -&gt;</a>
          <a href="/compare" className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">Honest vs Vanta / Drata -&gt;</a>
        </div>
      </section>
      <section className="bg-[#03110b] py-10"><div className="mx-auto max-w-5xl px-6">
        <SovereignSpot topic={"SEC AI disclosure for US public companies"} layer="regulators" suggest={"What AI disclosures should a public company make in its 10-K, and how do we avoid AI-washing?"} />
      </div></section>
    </div>
  );
}
