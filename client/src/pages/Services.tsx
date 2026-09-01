import { useEffect } from "react";

// Services - what CSOAI offers, as one connected OS. Funnels every visitor to the
// front door (/try) and the sector view (/playbooks).
type Svc = { name: string; glyph: string; body: string; href: string; cta: string };
const SERVICES: Svc[] = [
  { name: "Live Council of AI", glyph: "Vote", body: "Ask any AI-governance question and watch five independent agents debate and reach designed multi-agent review - with the frameworks that apply and why.", href: "/try", cta: "Try it free" },
  { name: "Industry Playbooks", glyph: "SEC", body: "Your sector's scenario, the frameworks that bind you, the bridges you need, and the exact next steps - across 47 industries.", href: "/playbooks", cta: "Find your sector" },
  { name: "MEOK Law", glyph: "LAW", body: "For any place - city, state, nation, bloc - the full stack of AI rules that apply and how each layer cross-references the others.", href: "/meok-law", cta: "What governs you" },
  { name: "Framework Temples", glyph: "GOV", body: "Published regulations and standards - EU AI Act, NIST AI RMF, ISO 42001 - each with its own temple, mapped to your systems.", href: "/temples", cta: "See the temples" },
  { name: "Council Towns", glyph: "TWN", body: "Train and multiply governance knowledge into white papers, then into more data - a compounding learning engine.", href: "/towns", cta: "See the engine" },
  { name: "Legacy Bridge", glyph: "BRG", body: "Bring COBOL and mainframe estates into the agentic economy without a rewrite - the Layer 0 control plane.", href: "/legacy", cta: "Bridge legacy" },
];

export default function Services() {
  useEffect(() => { document.title = "Services — measure, sign, check"; }, []);
  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white py-16">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(700px 380px at 80% -10%, rgba(45,212,191,.22), transparent 60%)" }} />
        <div className="relative max-w-6xl mx-auto px-6">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">CSOAI - services</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">Measure once. Check the signed card.</h1>
          <p className="mt-4 max-w-2xl text-lg text-emerald-50/90">Independent measurement, not a checklist product. We measure published behaviour against frozen rules, sign the result, and leave empty cells empty. Verify stays free.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="/try" className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-400">Start with the Council -&gt;</a>
            <a href="/os?lobby=home" className="rounded-xl border border-emerald-300/60 px-5 py-2.5 text-sm font-semibold text-emerald-50 hover:bg-white/10">Open the full OS -&gt;</a>
          </div>
        </div>
      </section>
      <section className="max-w-6xl mx-auto px-6 py-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((s) => (
          <div key={s.name} className="flex flex-col rounded-2xl border border-gray-200 p-6 hover:border-emerald-300 hover:shadow-sm transition">
            <div className="flex h-11 items-center justify-center self-start rounded-xl bg-emerald-50 px-3 text-sm font-black text-emerald-700">{s.glyph}</div>
            <div className="mt-3 text-lg font-bold text-gray-900">{s.name}</div>
            <p className="mt-1 flex-1 text-sm text-gray-600 leading-snug">{s.body}</p>
            <a href={s.href} className="mt-4 text-sm font-bold text-emerald-700 hover:text-emerald-600">{s.cta} -&gt;</a>
          </div>
        ))}
      </section>
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <div className="text-xl font-black text-emerald-900">Governance, rediscovered - not invented</div>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-emerald-900/80">The same consensus architecture that secured Athens and Bitcoin, now governing AI. See where it comes from, then watch it work.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <a href="/lineage" className="rounded-xl border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-white">The 4,000-year lineage -&gt;</a>
            <a href="/dragonfly" className="rounded-xl border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-white">The 4-Wing architecture -&gt;</a>
            <a href="/hive" className="rounded-xl border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-white">How the hive decides -&gt;</a>
          </div>
        </div>
      </section>
    </div>
  );
}
