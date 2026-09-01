import { useEffect } from "react";

// The Sovereign Ontology — the semantic layer for AI governance. What Palantir's Ontology did
// for enterprise data (Objects · Properties · Links · Actions), the Council assistant Ontology does for
// AI governance: every governed object, how they relate, and the actions you can take on them.

const OBJECTS = [
  { g: "◈", n: "AI systems & agents", d: "every model, agent and humanoid under governance" },
  { g: "▤", n: "Frameworks & law", d: "EU AI Act, NIST, ISO 42001, GDPR, cyber (CRA/NIS2/DORA)…" },
  { g: "▦", n: "Organisations", d: "Fortune 500/100, suppliers, public bodies" },
  { g: "❖", n: "Governments & regulators", d: "AI authorities and jurisdictions" },
  { g: "◎", n: "Threats & incidents", d: "rogue swarms, deepfakes, cyber events" },
  { g: "🛡", n: "People", d: "executives, officials, creators — and everyone" },
];
const LINKS = [
  { c: "#34d399", n: "governs", d: "a government / framework governs an AI system" },
  { c: "#38bdf8", n: "applies-to", d: "a framework applies to an organisation or sector" },
  { c: "#f43f5e", n: "defends", d: "a cyber control defends an asset against a threat" },
  { c: "#f59e0b", n: "monitors", d: "the Watchdog monitors objects for incidents" },
  { c: "#a78bfa", n: "crosswalks", d: "one control satisfies many frameworks at once" },
  { c: "#6ee7b7", n: "signs", d: "every decision is sealed to Layer 0 — provable" },
];
const ACTIONS = [
  { n: "Govern", d: "classify, assess and place any object under Layer 0.", href: "/os?lobby=home" },
  { n: "Simulate", d: "run the outcome across thousands of branches before acting.", href: "/gspc-arena" },
  { n: "Stop", d: "halt a rogue agent or humanoid before harm — signed.", href: "/poc" },
  { n: "Prove", d: "issue a signed, offline-verifiable record of governance.", href: "/system-card" },
  { n: "Crosswalk", d: "comply once, cover every framework it maps to.", href: "/hive" },
  { n: "Protect", d: "shield a person's identity and likeness from deepfakes.", href: "/protect" },
];

export default function Ontology() {
  useEffect(() => { document.title = "The Council Ontology — the semantic layer for AI governance | CSOAI"; }, []);
  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <section className="border-b border-emerald-500/15">
        <div className="mx-auto max-w-5xl px-6 pt-14 pb-8">
          <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">CSOAI OS · the ontology</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">The semantic layer for <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">AI governance.</span></h1>
          <p className="mt-4 max-w-3xl text-emerald-100/80 leading-relaxed">
            What Palantir's Ontology did for enterprise data — turning scattered records into <b className="text-emerald-200">objects,
            links and actions</b> you can reason over — the Council Ontology does for AI governance. Every framework, agent,
            company, government, threat and person becomes a governed object, connected by how it relates, and actionable on one
            signed Layer 0 floor. It's live on the globe — toggle the <b className="text-emerald-200">Ontology</b> layer and watch the web light up.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <a href="/world" className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-bold text-[#03110b] hover:bg-emerald-400">See it on the globe →</a>
            <a href="/hive" className="rounded-full border border-emerald-400/40 px-4 py-2 text-sm font-bold text-emerald-100 hover:bg-white/5">Browse the objects</a>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-6 py-10 space-y-9">
        <div>
          <h2 className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/60">Objects — what the world is made of</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {OBJECTS.map((o) => (<div key={o.n} className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-4"><div className="text-xl">{o.g}</div><div className="mt-1 font-bold text-emerald-50">{o.n}</div><div className="text-[12px] text-emerald-100/70">{o.d}</div></div>))}
          </div>
        </div>
        <div>
          <h2 className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/60">Links — how they relate</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {LINKS.map((l) => (<div key={l.n} className="flex items-center gap-3 rounded-xl border border-emerald-500/15 bg-black/20 p-3"><span className="h-3 w-6 rounded-full" style={{ background: l.c, boxShadow: "0 0 10px " + l.c }} /><div><div className="text-sm font-bold text-emerald-100">{l.n}</div><div className="text-[11px] text-emerald-100/60">{l.d}</div></div></div>))}
          </div>
        </div>
        <div>
          <h2 className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/60">Actions — what you can do on any object</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ACTIONS.map((a) => (<a key={a.n} href={a.href} className="group rounded-2xl border border-emerald-500/20 bg-[#05140d] p-4 transition hover:border-emerald-400/50"><div className="font-bold text-emerald-50">{a.n} <span className="opacity-0 transition group-hover:opacity-100">→</span></div><div className="text-[12px] text-emerald-100/70">{a.d}</div></a>))}
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-500/15 bg-white/[0.02] p-5 text-sm text-emerald-100/70">
          One ontology, one signed floor. Objects and links are open and crosswalked; actions are governed and sealed to Layer 0.
          <span className="text-emerald-300"> Reason over the whole world of AI governance in one place.</span>
        </div>
      </section>
    </div>
  );
}
