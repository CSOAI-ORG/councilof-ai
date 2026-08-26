import { useEffect } from "react";
import CouncilOsPageShell from "@/components/os/CouncilOsPageShell";

// Compare — honest side-by-side of what CSOAI publishes versus named GRC platforms.
// Measurement, not certification. No invented framework counts. No pricing.
const VENDORS = ["CSOAI", "Vanta", "Drata", "Credo AI", "OneTrust"];
const ROWS: { f: string; v: boolean[] }[] = [
  { f: "Independent measurement of model behaviour (not a vendor attestation PDF)", v: [true, false, false, false, false] },
  { f: "Living public board — empty cells stay empty", v: [true, false, false, false, false] },
  { f: "Ed25519-signed cards anyone can recompute without an account", v: [true, false, false, false, false] },
  { f: "Corrections ledger when our own number is wrong", v: [true, false, false, false, false] },
  { f: "Measurement, not certification — we do not remediate", v: [true, false, false, false, false] },
  { f: "Wilson 95% intervals on frozen banks (per-axis n, separation)", v: [true, false, false, false, false] },
  { f: "Labour / AI-economy indices declared UNMEASURED (scores never sold)", v: [true, false, false, false, false] },
  { f: "EU AI Act / NIST AI RMF / ISO 42001 evidence collection", v: [true, true, true, true, true] },
];
const FAQS = [
  { q: "What is CSOAI, compared with Vanta, Drata, Credo AI or OneTrust?", a: "Those platforms collect compliance evidence. CSOAI is an independent measurement body: we measure published behaviour against frozen rules, sign the result (Ed25519), and publish what we cannot measure. We do not certify and we do not remediate. A grade is never sold. Verify stays free and loginless." },
  { q: "Can I use a GRC platform and still get a CSOAI measurement?", a: "Yes. A measurement card is a signed record of a run, not a replacement for your evidence locker. Use Vanta or Drata to collect controls; check the living board at GET /api/gspc and recompute a card at /gspc-verify." },
  { q: "Is there an open, checkable AI measurement board?", a: "Yes — GET https://councilof.ai/api/gspc. Counts and stamps live there. We do not type a slot number into this page. Keys: did:web:csoai.org on https://csoai.org/.well-known/did.json." },
  { q: "Who decides if a system is lawful?", a: "Regulators and notified bodies. We measure and sign. We will not give a legal opinion or fill an empty cell." },
];
const JSONLD = {
  "@context": "https://schema.org", "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
};

const FOCUS: Record<string, string> = { vanta: "Vanta", drata: "Drata", "credo-ai": "Credo AI", credo: "Credo AI", onetrust: "OneTrust" };
export default function Compare({ focus }: { focus?: string }) {
  const fname = focus ? (FOCUS[focus.toLowerCase()] || "") : "";
  const focusFaq = fname ? { q: `CSOAI vs ${fname} — what's the difference?`, a: `${fname} is a compliance-automation platform. CSOAI is a measurement body: we publish a signed living board, leave empty cells empty, and let anyone recompute a card without an account. Use ${fname} to collect evidence; use CSOAI to check a measurement you can recompute.` } : null;
  const allFaqs = focusFaq ? [focusFaq, ...FAQS] : FAQS;
  useEffect(() => {
    document.title = fname ? `CSOAI vs ${fname} — measurement vs GRC | Council of AI` : "CSOAI vs Vanta, Drata, Credo AI, OneTrust — measurement vs GRC | Council of AI";
    let m = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    const prev = m?.content;
    if (!m) { m = document.createElement("meta"); m.name = "description"; document.head.appendChild(m); }
    m.content = "Honest comparison: CSOAI measures and signs; Vanta, Drata, Credo AI and OneTrust collect compliance evidence. Empty cells stay empty. Verify is free. Measurement, not certification.";
    const ld = focusFaq ? { ...JSONLD, mainEntity: [{ "@type": "Question", name: focusFaq.q, acceptedAnswer: { "@type": "Answer", text: focusFaq.a } }, ...JSONLD.mainEntity] } : JSONLD;
    var s = document.createElement("script"); s.type = "application/ld+json"; s.id = "cmp-ld"; s.text = JSON.stringify(ld);
    document.getElementById("cmp-ld")?.remove(); document.head.appendChild(s);
    return () => { document.getElementById("cmp-ld")?.remove(); if (prev !== undefined && m) m.content = prev; };
  }, [focus]);
  return (
    <CouncilOsPageShell title="Compare" subtitle="Honest battlecards — CSOAI measurement vs GRC platforms" className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white py-16">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(700px 380px at 80% -10%, rgba(45,212,191,.22), transparent 60%)" }} />
        <div className="relative max-w-6xl mx-auto px-6">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">CSOAI - comparison</p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight">{fname ? `CSOAI vs ${fname}` : "CSOAI vs Vanta, Drata, Credo AI, OneTrust"}</h1>
          <p className="mt-4 max-w-2xl text-lg text-emerald-50/90">{fname ? `${fname} collects compliance evidence. CSOAI measures, signs, and publishes what it cannot measure.` : "They collect evidence. We measure and sign. Empty cells stay empty. A grade is never sold."}</p>
        </div>
      </section>
      <section className="max-w-6xl mx-auto px-6 py-12 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border-b-2 border-gray-200 px-3 py-3 text-left font-bold text-gray-900">Capability</th>
              {VENDORS.map((v, i) => <th key={v} className={"border-b-2 border-gray-200 px-3 py-3 text-center font-bold " + (i === 0 ? "text-emerald-700" : "text-gray-500")}>{v}</th>)}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.f} className="hover:bg-slate-50">
                <td className="border-b border-gray-100 px-3 py-3 font-medium text-gray-800">{r.f}</td>
                {r.v.map((on, i) => (
                  <td key={i} className={"border-b border-gray-100 px-3 py-3 text-center " + (i === 0 ? "bg-emerald-50/40" : "")}>
                    <span className={on ? "font-black text-emerald-600" : "text-gray-300"}>{on ? "Yes" : "-"}</span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-4 text-xs text-gray-400">CSOAI rows are what we publish. Competitor columns are public-product categories, not a paid review. Names are trademarks of their owners.</p>
        <p className="mt-6 text-sm text-gray-600 max-w-3xl">
          Wilson moat: rivals publish opaque scores without usable n or separation disclosure. We publish Wilson intervals
          on frozen banks only — and three labour/economy indices stay{" "}
          <a href="/indices" className="font-semibold text-emerald-700 underline">UNMEASURED</a> until INDEX-METHOD freezes a
          bank (honest empty cells, never sold).
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="/gspc-scoreboard" className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500">Read the living board -&gt;</a>
          <a href="/gspc-verify" className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">Verify a card -&gt;</a>
          <a href="/indices" className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">Indices · UNMEASURED -&gt;</a>
        </div>

        <div className="mt-14 border-t border-gray-100 pt-10">
          <h2 className="text-2xl font-black tracking-tight text-gray-900">Frequently asked</h2>
          <dl className="mt-6 space-y-6 max-w-3xl">
            {allFaqs.map((f) => (
              <div key={f.q}>
                <dt className="font-bold text-gray-900">{f.q}</dt>
                <dd className="mt-1.5 text-gray-600 leading-relaxed">{f.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </CouncilOsPageShell>
  );
}
