import { useEffect } from "react";

// HowItWorks - the how-to guide. question -> council -> consensus -> verdict -> evidence.
type Step = { n: number; title: string; body: string; href: string; label: string };
const STEPS: Step[] = [
  { n: 1, title: "Ask in plain language", body: "Type any AI-governance question - 'Can we deploy this hiring model in the EU?' No forms, no jargon required.", href: "/try", label: "Try a question now" },
  { n: 2, title: "The classifier scopes it", body: "The engine identifies your risk tier and the frameworks that apply - across 13+ regulations and 47 industries.", href: "/map", label: "See what governs what" },
  { n: 3, title: "Five agents debate", body: "Governance, Intelligence, Safety, Cybersecurity and a neutral Speaker argue it from every angle - at least three rounds.", href: "/dragonfly", label: "Meet the 4 wings" },
  { n: 4, title: "Byzantine consensus decides", body: "The verdict passes only on supermajority, so no single agent can capture the outcome - the math that secures Bitcoin.", href: "/hive", label: "How consensus works" },
  { n: 5, title: "Signed verdict + evidence", body: "You get the decision, the reasoning, the frameworks cited, and an Ed25519-signed, replayable record. Provable, never deniable.", href: "/playbooks", label: "Your sector's playbook" },
];

export default function HowItWorks() {
  useEffect(() => { document.title = "How it works - from question to signed verdict | CSOAI"; }, []);
  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white py-16">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(700px 380px at 80% -10%, rgba(45,212,191,.22), transparent 60%)" }} />
        <div className="relative max-w-5xl mx-auto px-6">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">CSOAI - how it works</p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight">From a question to a signed verdict</h1>
          <p className="mt-4 max-w-2xl text-lg text-emerald-50/90">Five steps, thirty seconds. Here is exactly what the OS does the moment you bring it a governance question.</p>
        </div>
      </section>
      <section className="max-w-4xl mx-auto px-6 py-12">
        <ol className="relative border-l-2 border-emerald-200 pl-8 space-y-8">
          {STEPS.map((s) => (
            <li key={s.n} className="relative">
              <span className="absolute -left-[42px] flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-black text-white">{s.n}</span>
              <div className="text-lg font-bold text-gray-900">{s.title}</div>
              <p className="mt-1 text-gray-600 leading-relaxed">{s.body}</p>
              <a href={s.href} className="mt-2 inline-block text-sm font-bold text-emerald-700 hover:text-emerald-600">{s.label} -&gt;</a>
            </li>
          ))}
        </ol>
        <div className="mt-10 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <div className="text-xl font-black text-emerald-900">Ready to see it?</div>
          <p className="mx-auto mt-2 max-w-xl text-sm text-emerald-900/80">The live council runs with real LLM agents once the Layer 0 backend is on. The demo shows the full flow right now.</p>
          <a href="/try" className="mt-4 inline-block rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-500">Watch the Council decide -&gt;</a>
        </div>
      </section>
    </div>
  );
}
